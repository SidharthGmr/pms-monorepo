import { Pinecone } from '@pinecone-database/pinecone';

let pinecone: Pinecone | null = null;

export const getPineconeIndex = async () => {
  const client = await getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME!);
};

export const getPineconeClient = async (): Promise<Pinecone> => {
  if (pinecone) {
    console.log('🔄 Reusing existing Pinecone client');
    return pinecone;
  }

  console.log('🆕 Creating new Pinecone client...');

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is not set');
  }

  console.log('🔑 API Key found, initializing client...');

  pinecone = new Pinecone({
    apiKey: apiKey,
  });

  console.log('✅ Pinecone client created successfully');
  return pinecone;
};

export const initializeIndex = async (): Promise<any> => {
  try {
    console.log('🔄 Initializing Pinecone index...');

    const pinecone = await getPineconeClient();
    console.log('✅ Pinecone client initialized');

    const indexName = process.env.PINECONE_INDEX_NAME!;
    console.log('📍 Index name:', indexName);

    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME environment variable is not set');
    }

    const existingIndexes = await pinecone.listIndexes();
    console.log(
      '📋 Existing indexes:',
      existingIndexes.indexes?.map((idx) => idx.name)
    );

    if (!existingIndexes.indexes?.some((index) => index.name === indexName)) {
      console.log('🆕 Creating new index:', indexName);

      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // Match the embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      console.log('⏳ Waiting for index to be ready...');
      // Wait for index to be ready
      await new Promise((resolve) => setTimeout(resolve, 30000));
      console.log('✅ Index should be ready now');
    } else {
      console.log('📋 Using existing index:', indexName);
    }

    const index = pinecone.index(indexName);
    console.log('✅ Index connection established');
    return index;
  } catch (error) {
    console.error('❌ Error initializing index:', error);
    console.error('🔍 Environment variables:', {
      PINECONE_API_KEY: process.env.PINECONE_API_KEY ? '***SET***' : 'NOT_SET',
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'NOT_SET',
    });
    throw error;
  }
};

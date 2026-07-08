const cloudinary = require("cloudinary").v2;

// 
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary credentials in environment');
      return new Response('Cloudinary API key/secret not configured', { status: 500 });
    }

    const timestamp = paramsToSign?.timestamp ?? Math.floor(Date.now() / 1000);
    const paramsForSign = { ...(paramsToSign || {}), timestamp };

    const signature = cloudinary.utils.api_sign_request(
      paramsForSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return Response.json({
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      timestamp,
    });
  } catch (error) {
    console.error('Signature generation failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
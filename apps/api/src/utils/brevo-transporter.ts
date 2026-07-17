// src/utils/brevo-transporter.ts
import { BrevoClient, Brevo } from '@getbrevo/brevo';

// 1. Define the parameters our transporter expects (matching Brevo's types)
export interface EmailOptions {
    to: { email: string; name?: string }[];
    sender: { email: string; name?: string };
    subject: string;
    htmlContent: string;
    textContent?: string; // Optional plain text version
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    replyTo?: { email: string; name?: string };
    params?: Record<string, any>; // For dynamic {{params.xxx}} variables
    headers?: Record<string, string>;
}

// 2. Create the Transporter class (Singleton)
export class BrevoTransporter {
    private static instance: BrevoTransporter;
    private readonly client: BrevoClient;

    // Private constructor to enforce Singleton pattern
    private constructor() {
        // Read API Key from environment variables
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            throw new Error('Missing BREVO_API_KEY in environment variables');
        }

        // The REST client needs an API v3 key ("xkeysib-..."). An SMTP key
        // ("xsmtpsib-...") only works with the SMTP relay and will be rejected
        // by the API with "Key not found / unauthorized".
        if (!apiKey.startsWith('xkeysib-')) {
            console.warn(
                "⚠️  BREVO_API_KEY does not look like a Brevo API v3 key (expected 'xkeysib-...'). " +
                "If it starts with 'xsmtpsib-', that is an SMTP key and will not work with the API. " +
                'Generate an API key at Brevo → SMTP & API → API Keys.'
            );
        }

        // @getbrevo/brevo v6 uses a single client authenticated with the API key.
        this.client = new BrevoClient({ apiKey });
    }

    // Static method to get the single instance
    public static getInstance(): BrevoTransporter {
        if (!BrevoTransporter.instance) {
            BrevoTransporter.instance = new BrevoTransporter();
        }
        return BrevoTransporter.instance;
    }

    // 3. The main send method you will call everywhere
    public async sendEmail(options: EmailOptions): Promise<Brevo.SendTransacEmailResponse> {
        // Only include optional fields when set (exactOptionalPropertyTypes is on).
        const request: Brevo.SendTransacEmailRequest = {
            to: options.to,
            sender: options.sender,
            subject: options.subject,
            htmlContent: options.htmlContent,
            ...(options.textContent !== undefined && { textContent: options.textContent }),
            ...(options.cc && { cc: options.cc }),
            ...(options.bcc && { bcc: options.bcc }),
            ...(options.replyTo && { replyTo: options.replyTo }),
            ...(options.params && { params: options.params }),
            ...(options.headers && { headers: options.headers }),
        };

        try {
            const response = await this.client.transactionalEmails.sendTransacEmail(request);
            console.log(`✅ Email sent to ${options.to[0]?.email}. MessageId: ${response.messageId}`);
            return response;
        } catch (error: any) {
            console.error('❌ Brevo API Error:', error?.body || error?.message || error);
            throw new Error('Failed to send email via Brevo');
        }
    }
}

// 4. Export a pre-configured instance for easy importing
export const emailTransporter = BrevoTransporter.getInstance();

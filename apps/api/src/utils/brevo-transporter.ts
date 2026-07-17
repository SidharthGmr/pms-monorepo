// src/lib/brevo-transporter.ts
import * as Brevo from '@getbrevo/brevo';

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
    private apiInstance: Brevo.TransactionalEmailsApi;

    // Private constructor to enforce Singleton pattern
    private constructor() {
        this.apiInstance = new Brevo.TransactionalEmailsApi();

        // Read API Key from environment variables
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            throw new Error('Missing BREVO_API_KEY in environment variables');
        }

        this.apiInstance.setApiKey(
            Brevo.TransactionalEmailsApiApiKeys.apiKey,
            apiKey
        );
    }

    // Static method to get the single instance
    public static getInstance(): BrevoTransporter {
        if (!BrevoTransporter.instance) {
            BrevoTransporter.instance = new BrevoTransporter();
        }
        return BrevoTransporter.instance;
    }

    // 3. The main send method you will call everywhere
    public async sendEmail(options: EmailOptions): Promise<Brevo.SendSmtpEmailResponse> {
        const email = new Brevo.SendSmtpEmail();

        email.to = options.to;
        email.sender = options.sender;
        email.subject = options.subject;
        email.htmlContent = options.htmlContent;
        email.textContent = options.textContent;
        email.cc = options.cc;
        email.bcc = options.bcc;
        email.replyTo = options.replyTo;
        email.params = options.params;
        email.headers = options.headers;

        try {
            const response = await this.apiInstance.sendTransacEmail(email);
            console.log(`✅ Email sent to ${options.to[0]?.email}. MessageId: ${response.messageId}`);
            return response;
        } catch (error: any) {
            console.error('❌ Brevo API Error:', error.response?.body || error.message);
            throw new Error('Failed to send email via Brevo');
        }
    }
}

// 4. Export a pre-configured instance for easy importing
export const emailTransporter = BrevoTransporter.getInstance();
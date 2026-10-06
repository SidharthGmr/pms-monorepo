import nodemailer from 'nodemailer';

/**
 * Outbound mail through Brevo. Two transports, picked from the kind of key configured:
 *
 * - An API v3 key ("xkeysib-...") sends through the HTTPS API (api.brevo.com/v3/smtp/email).
 * - An SMTP key ("xsmtpsib-...") sends through the SMTP relay with nodemailer.
 *
 * Both key kinds are issued from Brevo -> SMTP & API, on different tabs, and each only works
 * with its own transport: the relay answers "535 Authentication failed" to an API key and the
 * API answers "unauthorized" to an SMTP key. Picking by prefix means whichever one is pasted
 * into .env just works. When both are configured SMTP wins: the relay is not subject to the
 * account's "Authorised IPs" list, which blocks the API from any address not on it (and Vercel
 * has no fixed outbound IP). Each variable is read for either kind so an older .env keeps working.
 *
 * The "from" address MUST be a sender verified in Brevo. Brevo accepts mail from an unverified
 * sender into its logs but never delivers it, so the sender is checked up front and the send is
 * refused with a clear error instead.
 */
const API_URL = 'https://api.brevo.com/v3';

const host = (process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com').trim();
const port = Number((process.env.BREVO_SMTP_PORT || '587').trim());
const smtpUser = process.env.BREVO_SMTP_USER?.trim();
const apiKey = [process.env.BREVO_API_KEY, process.env.BREVO_SMTP_KEY].map((v) => v?.trim()).find((v) => v?.startsWith('xkeysib-'));
const smtpKey = [process.env.BREVO_SMTP_KEY, process.env.BREVO_API_KEY].map((v) => v?.trim()).find((v) => v?.startsWith('xsmtpsib-'));
const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
const senderName = (process.env.BREVO_SENDER_NAME || 'PMS').trim();

type Transport = 'api' | 'smtp' | 'none';
const transport: Transport = smtpKey && smtpUser ? 'smtp' : apiKey ? 'api' : 'none';

const senderConfigured = !!senderEmail && senderEmail !== 'you@yourdomain.com' && senderEmail !== 'domain.comyou@your';

if (transport === 'none') {
  console.warn('⚠️  No usable Brevo key found. Set BREVO_API_KEY (xkeysib-...) or BREVO_SMTP_USER + BREVO_SMTP_KEY (xsmtpsib-...) in .env; emails will fail.');
}
if (!senderConfigured) {
  console.error(
    '❌ BREVO_SENDER_EMAIL is not set to a Brevo-verified sender. ' +
      'Emails would be accepted by Brevo (visible in its logs) but NOT delivered. ' +
      'Add a verified sender (Brevo -> Senders, Domains & Dedicated IPs) and set BREVO_SENDER_EMAIL to it.'
  );
}

const smtpTransporter =
  transport === 'smtp'
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpKey },
      })
    : null;

// Brevo's "unrecognised IP address" refusal is an account setting, not a bad key; say so.
const explain = (message: string): string =>
  /unrecognised IP|authorised_ips/i.test(message)
    ? `${message} -> This Brevo account restricts API access by IP. Add this server's IP, or turn the restriction off, at Brevo -> Security -> Authorised IPs.`
    : message;

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'api-key': apiKey as string, accept: 'application/json', 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
  if (!response.ok) {
    throw new Error(explain(`Brevo API ${response.status}${body.code ? ` ${body.code}` : ''}: ${body.message ?? 'request failed'}`));
  }
  return body as T;
}

// Test the configured transport on startup so a bad key shows up in the boot log, not on
// the first password reset.
(async () => {
  try {
    if (transport === 'api') {
      const account = await apiRequest<{ email?: string }>('/account');
      console.log(`✅ Brevo API transport ready — account ${account.email ?? '(unknown)'}`);
    } else if (smtpTransporter) {
      await smtpTransporter.verify();
      console.log(`✅ Brevo SMTP transport ready — connected to ${host}:${port}`);
    }
  } catch (error) {
    console.error(`❌ Brevo ${transport.toUpperCase()} transport error:`, (error as Error).message);
  }
})();

export const sendEmail = async (recipient: string, subject: string, htmlContent: string): Promise<{ messageId: string | undefined; transport: Transport }> => {
  try {
    if (!senderConfigured) {
      throw new Error('BREVO_SENDER_EMAIL is not configured with a Brevo-verified sender — refusing to send (the message would appear in Brevo logs but would not be delivered).');
    }
    if (transport === 'none') {
      throw new Error('No Brevo key configured — set BREVO_API_KEY or BREVO_SMTP_USER + BREVO_SMTP_KEY.');
    }

    console.log(`📧 Sending email via Brevo ${transport.toUpperCase()} to:`, recipient);

    if (transport === 'api') {
      const result = await apiRequest<{ messageId?: string }>('/smtp/email', {
        method: 'POST',
        body: JSON.stringify({
          sender: { email: senderEmail, name: senderName },
          to: [{ email: recipient }],
          subject,
          htmlContent,
        }),
      });
      console.log('✅ Email sent successfully. Message ID:', result.messageId);
      return { messageId: result.messageId, transport };
    }

    const info = await smtpTransporter!.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });
    console.log('✅ Email sent successfully. Message ID:', info.messageId);
    return { messageId: info.messageId, transport };
  } catch (error) {
    console.error('❌ Error sending email:', (error as Error).message);
    throw error;
  }
};

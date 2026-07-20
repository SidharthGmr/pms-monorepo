import nodemailer from "nodemailer";

// Brevo SMTP relay configuration.
// Docs: Brevo → SMTP & API → SMTP.  Host: smtp-relay.brevo.com, port 587 (STARTTLS).
// The SMTP password is your Brevo SMTP key ("xsmtpsib-..."). We fall back to the
// legacy BREVO_API_KEY value so an existing SMTP key already stored there keeps working.
// .trim() guards against trailing spaces in .env values (which break SMTP auth / sender matching).
const host = (process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com").trim();
const port = Number((process.env.BREVO_SMTP_PORT || "587").trim());
const user = process.env.BREVO_SMTP_USER?.trim();
const pass = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY)?.trim();

// The "from" address MUST be a sender/domain verified in Brevo. If it is not, Brevo still
// ACCEPTS the message into the relay (so it appears in Brevo's Email activity log) but SILENTLY
// DOES NOT DELIVER it to the recipient. The Brevo SMTP login (BREVO_SMTP_USER, e.g.
// "xxxx@smtp-brevo.com") is NOT a verified sender, so we must never fall back to it as the "from".
const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
const senderName = (process.env.BREVO_SENDER_NAME || "PMS").trim();

if (!user || !pass) {
  console.warn("⚠️  BREVO_SMTP_USER or BREVO_SMTP_KEY (SMTP key) not configured in .env — emails will fail.");
}
if (!senderEmail || senderEmail === "domain.comyou@your") {
  console.error(
    "❌ BREVO_SENDER_EMAIL is not set to a Brevo-verified sender. " +
    "Emails will be accepted by Brevo (visible in its logs) but NOT delivered to recipients. " +
    "Add a verified sender (Brevo → Settings → Senders, Domains & Dedicated IPs) and set BREVO_SENDER_EMAIL to it.",
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
  auth: { user, pass },
});

// Test connection on startup.
transporter.verify((error) => {
  if (error) {
    console.error("❌ Brevo SMTP transporter error:", error.message);
  } else {
    console.log(`✅ Brevo SMTP transporter ready — connected to ${host}:${port}`);
  }
});

export const sendEmail = async (recipient: string, subject: string, htmlContent: string) => {
  try {
    // Fail loudly instead of silently sending from the un-verified SMTP login (which Brevo
    // accepts into its logs but never delivers). This surfaces the real misconfiguration.
    if (!senderEmail || senderEmail === "you@yourdomain.com") {
      throw new Error(
        "BREVO_SENDER_EMAIL is not configured with a Brevo-verified sender — refusing to send " +
        "(the message would appear in Brevo's logs but would not be delivered).",
      );
    }
    console.log("📧 Attempting to send email to:", recipient);
    const from = `"${senderName}" <${senderEmail}>`;
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html: htmlContent,
    });
    console.log("✅ Email sent successfully. Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

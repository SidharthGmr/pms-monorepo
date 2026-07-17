import nodemailer from "nodemailer";

// Check if email credentials are set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn("⚠️  EMAIL_USER or EMAIL_PASSWORD not configured in .env file");
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email transporter ready - Connected to", process.env.EMAIL_SERVICE || "gmail");
  }
});

export const sendEmail = async ( recipient: string, subject: string, htmlContent: string) => {
  try {
    console.log("📧 Attempting to send email to:", recipient);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER!,
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

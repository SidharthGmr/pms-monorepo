import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "",
    audience: process.env.JWT_AUDIENCE || "",
    issuer: process.env.JWT_ISSUER || "",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "5m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "30m",
    // Email verification links must stay valid long after signup, so they get
    // their own expiry rather than reusing the short-lived access-token expiry.
    emailVerifyExpires: process.env.JWT_EMAIL_VERIFY_EXPIRES || "1d",
    // Password reset links are security-sensitive, so they expire sooner than
    // the signup verification link.
    passwordResetExpires: process.env.JWT_PASSWORD_RESET_EXPIRES || "1h",
  },
};

export default config;

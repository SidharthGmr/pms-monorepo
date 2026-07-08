import crypto from "crypto";

export const generateOtp = () => {
  const buffer = crypto.randomBytes(2);
  const otp = ((buffer.readUInt16BE(0) % 9000) + 1000).toString(); // 4-digit

  return { otp };
};

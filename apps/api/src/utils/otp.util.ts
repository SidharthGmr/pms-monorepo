import crypto from "crypto";

/** 6 digits from crypto.randomInt - uniform, unlike the old 4-digit modulo draw. */
export const generateOtp = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();

  return { otp };
};

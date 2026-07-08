/**
 * Checks if a given time has expired based on expiry minutes
 * @param createdAt Date when OTP/token was created
 * @param expiryMinutes Number of minutes the OTP is valid
 * @returns true if expired, false otherwise
 */
export const isExpired = (createdAt: Date, expiryMinutes: number): boolean => {
  const expiresAt = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
  return Date.now() > expiresAt.getTime();
};


export const getOtpExpiryDate = (minutes: number = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
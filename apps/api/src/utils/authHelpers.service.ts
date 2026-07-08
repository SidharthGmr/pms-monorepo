
import crypto from "crypto";
import uuid from 'uuid-random';

export const generateUserGUID = (): string => {
  return uuid(); // Generates unique UUID v4
};

// Optional: Generate GUID with prefix
export const generateUserGUIDWithPrefix = (): string => {
  return `${uuid()}`;
};

export const generateCustomId = (): number => {
  // Use crypto for a secure random 4-digit number
  const buf = crypto.randomBytes(2);
  return 1000 + (buf.readUInt16BE(0) % 9000);
};

export const userAge = (dateOfBirth: string | Date): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

export const getCustomId = (): number => {
  return parseInt(
    new Date().getFullYear().toString() + generateCustomId().toString()
  );
};

export const getAdmissionId = (lastUser: string) => {
  return (
    "User" + new Date().getFullYear() + (parseInt(lastUser) + 1).toString()
  );
};

export const buildUserName = (firstName: string, lastName: string): string => {
  return `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, "");
};

export const createUserName = (firstName: string, lastName: string): string => {
  const buf = crypto.randomBytes(2);
  const random = 1000 + (buf.readUInt16BE(0) % 9000);
  return `${firstName}${lastName}${random}`.toLowerCase().replace(/\s+/g, "");
};

export const nowISO = (): string => {
  return new Date().toISOString();
};

/**
 * Generates a cryptographically secure 4-digit OTP string.
 * Uses crypto.randomBytes instead of Math.random() to prevent predictability.
 */
export const generate4DigitOtp = (): string => {
  const buf = crypto.randomBytes(2);
  return (1000 + (buf.readUInt16BE(0) % 9000)).toString();
};

/**
 * Generates a unique store code from firstName and current timestamp with random suffix.
 * Format: firstname + YYYY + MM + DD + HHMM + SS + RRR (RRR = 3 random digits)
 *
 * @param firstName - The first name to use in the store code
 * @returns Store code string (e.g., "saket20260526143745678")
 *
 * @example
 * generateStoreCode("Saket") // returns "saket20260526143745678"
 * generateStoreCode("John Doe") // returns "johndoe20260526143745678" (spaces removed)
 *
 * @note Includes seconds and cryptographically secure random digits to prevent collisions
 * when multiple users with the same first name register simultaneously.
 */
export const generateStoreCode = (firstName: string): string => {
  const now = new Date();

  // Format components with leading zeros
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');

  // Generate 3 cryptographically secure random digits (000-999)
  const buf = crypto.randomBytes(2);
  const randomDigits = (buf.readUInt16BE(0) % 1000).toString().padStart(5, '0');

  // Clean firstName: lowercase and remove spaces/special characters
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);

  // Combine all parts: firstname + timestamp + random suffix
  return `${cleanFirstName}-${year}${month}${date}${hours}${randomDigits}`;
};


export const generateOrderNumber = () => {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${yyyy}${mm}${dd}-${random}`;
}

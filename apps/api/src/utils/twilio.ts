import twilio from 'twilio';
import env from '../config/env';

/**
 * SMS goes out only when all three Twilio variables are configured; otherwise every send is a
 * silent no-op, so environments without credentials never crash at import or block a sale.
 * The client is built lazily for the same reason.
 */
let client: twilio.Twilio | null = null;

export const isSmsEnabled = (): boolean => !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);

/** Bare local numbers ("7070702021") become E.164 with the default country code; "+..." passes through. */
export const toE164 = (phone: string): string => {
  const trimmed = phone.replace(/[\s()-]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) return `${env.SMS_DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  return `${env.SMS_DEFAULT_COUNTRY_CODE}${digits}`;
};

export const sendSMS = async (to: string, body: string) => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) return null;
  if (!client) client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return client.messages.create({ body, from: env.TWILIO_PHONE_NUMBER, to: toE164(to) });
};

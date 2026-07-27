import Razorpay from "razorpay";
import CustomError from "../exceptions/custom-error";

/**
 * Credentials are resolved lazily rather than at import time. Reading them at
 * module scope meant a deployment without gateway keys could not boot the API at
 * all; now only the checkout endpoints fail, with a reason the client can show.
 */
export function getRazorpayCredentials(): { keyId: string; keySecret: string } {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new CustomError("Online payments are not configured on this server.", 503);
    }

    return { keyId, keySecret };
}

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
    if (!client) {
        const { keyId, keySecret } = getRazorpayCredentials();
        client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return client;
}

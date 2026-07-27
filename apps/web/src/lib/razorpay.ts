const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** The subset of the widget's response we rely on. */
export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error?: {
    description?: string;
    reason?: string;
    code?: string;
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  handler?: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loader: Promise<RazorpayConstructor> | null = null;

/**
 * Injects Razorpay's checkout script on demand and resolves once it is usable.
 * The promise is cached, so navigating between pages does not re-add the tag, and
 * a failed load is not cached - a retry gets a fresh attempt.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only be loaded in the browser.'));
  }

  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);

    const onLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error('The payment script loaded but did not initialise.'));
    };

    const onError = () => reject(new Error('Could not load the payment script. Check your connection and try again.'));

    if (existing) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    document.body.appendChild(script);
  }).catch((error) => {
    // Do not cache a failure, otherwise every later retry fails instantly.
    loader = null;
    throw error;
  });

  return loader;
}

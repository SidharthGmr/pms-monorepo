import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 requests per IP in 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again later.",
    },
});

// Refresh is a routine background call, not a credential guess: with a 5-minute
// access token every open tab refreshes ~3x per window, and offices share one IP.
// It still needs a ceiling, just a far higher one than the login limiter.
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many token refresh attempts. Please try again later.",
    },
});


/**
 * Baseline ceiling for every route. Auth routes stack the far stricter
 * `authLimiter` on top of this; this one only exists so a single client cannot
 * saturate the database with an unbounded read loop.
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    // Uptime probes should never be throttled or they will report a false outage.
    skip: (req) => req.path.startsWith('/health'),
    message: {
        success: false,
        message: "Too many requests. Please slow down and try again shortly.",
    },
});


// export const otpLimiter = rateLimit({
//     windowMs: 10 * 60 * 1000, // 10 minutes
//     max: 5,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//         success: false,
//         message: "Too many OTP requests. Please try again later.",
//     },
// });

// export const passwordResetLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//         success: false,
//         message: "Too many password reset attempts. Please try again later.",
//     },
// });

// export const signupLimiter = rateLimit({
//     windowMs: 60 * 60 * 1000, // 1 hour
//     max: 5,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//         success: false,
//         message: "Too many signup attempts. Please try again later.",
//     },
// });
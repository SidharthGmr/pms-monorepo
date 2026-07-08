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
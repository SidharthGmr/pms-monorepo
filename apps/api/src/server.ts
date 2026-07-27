import "dotenv/config";

import crypto from "crypto";
import cors from "cors";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";

import { getRazorpayClient } from "./config/razorpay";

const app = express();
const port = Number(process.env.PORT ?? 5000);

/*
 * In production, store orders and payments in your database.
 * This Map is only for demonstrating the complete flow locally.
 */
interface LocalOrder {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    status: "created" | "paid" | "failed";
    razorpayPaymentId?: string;
}

const orders = new Map<string, LocalOrder>();

app.use(cors());

/*
 * IMPORTANT:
 * This webhook route must receive the raw request body.
 * It must be defined before express.json().
 */
app.post(
    "/api/razorpay/webhook",
    express.raw({ type: "application/json" }),
    (request: Request, response: Response) => {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const receivedSignature = request.header("x-razorpay-signature");

        if (!webhookSecret || !receivedSignature) {
            response.status(400).json({
                success: false,
                message: "Webhook configuration is missing",
            });
            return;
        }

        const rawBody = request.body as Buffer;

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        const isValid = safeCompare(
            expectedSignature,
            receivedSignature,
        );

        if (!isValid) {
            response.status(401).json({
                success: false,
                message: "Invalid webhook signature",
            });
            return;
        }

        const event = JSON.parse(rawBody.toString("utf8")) as {
            event?: string;
            payload?: {
                payment?: {
                    entity?: {
                        id?: string;
                        order_id?: string;
                        status?: string;
                    };
                };
            };
        };

        const payment = event.payload?.payment?.entity;
        const orderId = payment?.order_id;

        switch (event.event) {
            case "payment.captured":
            case "order.paid": {
                if (orderId) {
                    const order = orders.get(orderId);

                    if (order) {
                        order.status = "paid";
                        // `exactOptionalPropertyTypes` is on, so only assign when the
                        // webhook actually carried a payment id.
                        if (payment?.id) {
                            order.razorpayPaymentId = payment.id;
                        }
                        orders.set(orderId, order);
                    }
                }

                console.log("Payment completed:", payment);
                break;
            }

            case "payment.failed": {
                if (orderId) {
                    const order = orders.get(orderId);

                    if (order) {
                        order.status = "failed";
                        orders.set(orderId, order);
                    }
                }

                console.log("Payment failed:", payment);
                break;
            }

            default:
                console.log("Unhandled Razorpay event:", event.event);
        }

        response.status(200).json({
            success: true,
        });
    },
);

app.use(express.json());

interface CreateOrderBody {
    amount?: number;
}

app.post(
    "/api/razorpay/orders",
    async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const { amount } = request.body as CreateOrderBody;

            if (
                typeof amount !== "number" ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                response.status(400).json({
                    success: false,
                    message: "A valid amount is required",
                });
                return;
            }

            /*
             * Razorpay expects the amount in the smallest currency unit.
             * ₹500 becomes 50000 paise.
             *
             * In production, calculate this amount from products stored
             * in your database. Do not trust a frontend-provided price.
             */
            const amountInPaise = Math.round(amount * 100);

            const order = await getRazorpayClient().orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                notes: {
                    source: "website",
                },
            });

            orders.set(order.id, {
                razorpayOrderId: order.id,
                amount: Number(order.amount),
                currency: order.currency,
                status: "created",
            });

            response.status(201).json({
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

interface VerifyPaymentBody {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
}

app.post(
    "/api/razorpay/payments/verify",
    async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const {
                razorpay_order_id: returnedOrderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: receivedSignature,
            } = request.body as VerifyPaymentBody;

            if (!returnedOrderId || !paymentId || !receivedSignature) {
                response.status(400).json({
                    success: false,
                    message: "Payment verification fields are required",
                });
                return;
            }

            /*
             * Retrieve the original order from your database.
             * Do not verify an unknown order supplied by the frontend.
             */
            const storedOrder = orders.get(returnedOrderId);

            if (!storedOrder) {
                response.status(404).json({
                    success: false,
                    message: "Order not found",
                });
                return;
            }

            const keySecret = process.env.RAZORPAY_KEY_SECRET;

            if (!keySecret) {
                throw new Error("RAZORPAY_KEY_SECRET is missing");
            }

            const payload =
                `${storedOrder.razorpayOrderId}|${paymentId}`;

            const expectedSignature = crypto
                .createHmac("sha256", keySecret)
                .update(payload)
                .digest("hex");

            const isValid = safeCompare(
                expectedSignature,
                receivedSignature,
            );

            if (!isValid) {
                storedOrder.status = "failed";
                orders.set(storedOrder.razorpayOrderId, storedOrder);

                response.status(400).json({
                    success: false,
                    message: "Payment signature verification failed",
                });
                return;
            }

            /*
             * Optionally fetch the payment from Razorpay to check its
             * current captured/authorized status.
             */
            const payment = await getRazorpayClient().payments.fetch(paymentId);

            storedOrder.razorpayPaymentId = paymentId;

            if (payment.status === "captured") {
                storedOrder.status = "paid";
            }

            orders.set(storedOrder.razorpayOrderId, storedOrder);

            response.json({
                success: true,
                message: "Payment verified successfully",
                data: {
                    orderId: storedOrder.razorpayOrderId,
                    paymentId,
                    paymentStatus: payment.status,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/razorpay/orders/:orderId",
    (request: Request, response: Response) => {
        // Express 5 types route params as string | string[].
        const order = orders.get(String(request.params.orderId ?? ""));

        if (!order) {
            response.status(404).json({
                success: false,
                message: "Order not found",
            });
            return;
        }

        response.json({
            success: true,
            data: order,
        });
    },
);

app.use(
    (
        error: unknown,
        _request: Request,
        response: Response,
        _next: NextFunction,
    ) => {
        console.error(error);

        const message =
            error instanceof Error
                ? error.message
                : "Internal server error";

        response.status(500).json({
            success: false,
            message,
        });
    },
);

function safeCompare(
    expectedValue: string,
    receivedValue: string,
): boolean {
    const expectedBuffer = Buffer.from(expectedValue);
    const receivedBuffer = Buffer.from(receivedValue);

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer,
    );
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
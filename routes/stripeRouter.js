import express from "express";
const router = express.Router();
import {
  handleCheckout,
  handleWebhook,
} from "../controllers/stripeController.js";

/**
 * @openapi
 * '/api/stripe/create-checkout-session':
 *  post:
 *      tags:
 *      - Stripe Checkout
 *      summary: Create Stripe Checkout Session
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                    type: object
 *                    required:
 *                      - cartItems
 *                    properties:
 *                      cartItems:
 *                          type: array
 *      responses:
 *          200:
 *            description: Success
 *          400:
 *            description: Bad Request
 *
 */
router.post("/create-checkout-session", handleCheckout);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default router;

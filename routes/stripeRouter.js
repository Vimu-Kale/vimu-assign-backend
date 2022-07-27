import express from "express";
const router = express.Router();
import {
  handleCheckout,
  handleWebhook,
} from "../controllers/stripeController.js";

router.post("/create-checkout-session", handleCheckout);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export default router;

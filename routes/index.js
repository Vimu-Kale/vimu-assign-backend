import express from "express";
const router = express.Router();
import stripeRouter from "./stripeRouter.js";

//ROOT ROUTE
router.get("/", (req, res) => {
  console.log("On To The Root Rout!");
  res.status(200).json({ message: "Success" });
});

//STRIPE CHECKOUT ROUTE
router.use("/api/stripe", stripeRouter);

export default router;

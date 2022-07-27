import express from "express";
const router = express.Router();
import stripeRouter from "./stripeRouter.js";

router.get("/", (req, res) => {
  console.log("On To The Root Rout!");
  res.status(200).json({ message: "Success" });
});

router.use("/api/stripe", stripeRouter);

export default router;

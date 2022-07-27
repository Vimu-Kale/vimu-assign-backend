import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
    },
    paymentIntentId: { type: String },
    products: [
      {
        id: String,
        name: String,
        price: String,
        qty: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    shipping: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

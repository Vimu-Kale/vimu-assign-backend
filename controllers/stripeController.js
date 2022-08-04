import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
import Order from "../models/order.js";
import logger from "../utils/logger.js";

const stripe = Stripe(process.env.STRIPE_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// CONTROLLER TO GENERATE CHECKOUT SESSION URL

/**
 * @openapi
 * '/api/stripe/create-checkout-session':
 *  post:
 *      tags:
 *      - Payment
 *      summary: Create Stripe Checkout Session With Product Details and User ID
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - cartItems
 *                properties:
 *                  cartItems:
 *                      type: array
 *                      cartItems:
 *                            type: object
 *        responses:
 *          200:
 *            description: Success
 *          400:
 *            description: Bad request
 */
export const handleCheckout = async (req, res) => {
  //IF REQ BODY EMPTY THEN REJECT
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      message: "No Fields Passed In Request Body",
    });
    console.log("hoii");
    return;
  }

  // IF NO CART ITEMS/NO LENGTH THEN REJECT
  if (!req.body.cartItems || req.body.cartItems.length === 0) {
    res
      .status(400)
      .json({ success: false, message: "CartItems cannot stay empty!" });
    return;
  }

  //CREATING CUSTOMER ENTITY IN STRIPE(FURTHER CAN BE USED TO STORE ORDER DATA AFTER SUCCESS OR FOR SUBSCRIPTIONS)
  const customer = await stripe.customers.create({
    metadata: {
      userId: "1a2b3c",
      cart: JSON.stringify(req.body.cartItems),
    },
  });

  //LINE ITEMS REFERS TO ITEM ENTRIES ON INVOICE WITH QTY. AMT. ETC
  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.Image],
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.qty,
    };
  });

  //CREATING A STRIPE CHECKOUT SESSION TO ACCEPT CARD AND SHIPING INFORMATION ALSO INCLUDING LINE ITEMS
  const session = await stripe.checkout.sessions.create({
    shipping_address_collection: {
      allowed_countries: ["US", "CA"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name: "Free shipping",
          // DELIVERS BETWEEN 5-7 BUSINESS DAYS
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "usd",
          },
          display_name: "Next day air",
          // DELIVERS IN EXACTLY 1 BUSINESS DAY
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    customer: customer.id, //REFERS TO CUSTOMER ID THAT WE CREATED
    line_items,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/?cancelled=true`,
  });

  res.send({ url: session.url });
};

//SAVING ORDER DETAAILS IN DB BASED ON EVENTS GENERATED ON STRIPE ACCOUNT
const createOrder = async (customer, data) => {
  console.log("create order function");
  const Items = JSON.parse(customer.metadata.cart);
  console.log(Items);
  console.log(data);
  const newOrder = new Order({
    userId: customer.metadata.userId,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products: Items,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: data.customer_details,
  });

  try {
    const savedOrder = await newOrder.save();
    console.log("Order Saved:", savedOrder);
  } catch (e) {
    // console.log(e);
    logger.error(e);
  }
};

//LISTENING TO EVENTS ON STRIPE ACCOUNT TRIGGERS THIS /webhook ENDPOINT
export const handleWebhook = async (req, res) => {
  const payload = req.body;
  const payloadString = JSON.stringify(payload, null, 2);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: webhookSecret,
  });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payloadString,
      header,
      webhookSecret
    );
    console.log("Webhook verified");
  } catch (err) {
    // console.log(`⚠️  Webhook signature verification failed.`, err.message);
    logger.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  let data = event.data.object;
  // console.log(data);

  //CHECK FOR SUCCESSFUL CHECKOUT SESSION AND EXTRACT THE DATA FROM EVENT AND STORE IN DB
  if (event.type === "checkout.session.completed") {
    try {
      const customer = await stripe.customers.retrieve(data.customer);
      createOrder(customer, data);
    } catch (error) {
      logger.error(error.message);
      // console.log(error.message);
    }
  }

  // RETURN A 200 RESP. TO ACKNOWLEDGE RECEIPT OF THE EVENT
  res.sendStatus(200);
};

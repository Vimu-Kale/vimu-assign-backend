import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("Connected...");
  })
  .catch((e) => {
    console.log("Error Connecting...", e);
  });

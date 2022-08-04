import express from "express";
import dotenv from "dotenv";
dotenv.config();
import "./db/connection.js";
import cors from "cors";
import logger from "./utils/logger.js";
import morganMiddleware from "./middlewares/morgan.middleware.js";
import router from "./routes/index.js";
import swaggerDocs from "./swagger.js";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(morganMiddleware);

app.use(router);

app.listen(PORT, () => {
  logger.info(`server listening on port .: ${PORT}`);
  swaggerDocs(app, PORT);
});

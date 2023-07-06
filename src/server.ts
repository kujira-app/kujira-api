import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import * as Routes from "@/routes";
import { generateErrorResponse } from "./helpers";

dotenv.config();
const app = express();

app.use(cors()); //Sets CORS for all routes.
app.use(helmet()); //Sets HTTP Headers to protect app from well-known web vulnerabilities.
app.use(compression()); // Compresses all routes.

// ↓↓↓ Rate limits to a max of 20 requests per minute. ↓↓↓ //
if (process.env.NODE_ENV === "production") {
  app.use(
    rateLimit({
      windowMs: 1 * 60 * 1000, // one minute
      max: 20,
    })
  );
}

app.use(express.json()); // Allows API to parse client payload.

// ↓↓↓ Routes ↓↓↓
enum RouteBases {
  AUTH = "/api/v1/auth",
  USERS = "/api/v1/users",
  OVERVIEWS = "/api/v1/overviews",
  LOGBOOKS = "/api/v1/logbooks",
  ENTRIES = "/api/v1/entries",
  PURCHASES = "/api/v1/purchases",
  BUG_REPORTS = "/api/v1/bug-reports",
}
app.use(RouteBases.AUTH, Routes.authRouter);
app.use(RouteBases.USERS, Routes.usersRouter);

// ↓↓↓ Fallback in case I forgot to catch an error somewhere. ↓↓↓ //
const errorFallbackMiddleware: ErrorRequestHandler = (
  error: Error,
  _: Request,
  response: Response,
  next: NextFunction
) => {
  if (error) response.json(generateErrorResponse(error, error.message));
};
app.use(errorFallbackMiddleware);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(
    `🚀 Success! CORS-enabled web server is running at https://localhost:${port}`
  );
});

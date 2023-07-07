import express from "express";

import * as Controllers from "@/controllers";
import * as Middleware from "@/middleware";
import * as Validators from "@/validators";

export const authRouter = express.Router();

const RequiredRegistrationData: Validators.RequiredRegistrationData = [
  "email",
  "username",
  "password",
];
authRouter.post(
  "/register",
  Middleware.verifyClientPayload({ requiredData: RequiredRegistrationData }),
  Middleware.validateAccountExistsForRegistration,
  Controllers.register
);

const requiredLoginData: Validators.RequiredLoginData = ["email", "password"];
authRouter.post(
  "/login",
  Middleware.verifyClientPayload({ requiredData: requiredLoginData }),
  Middleware.validateAccountExistsForLogin,
  Middleware.validateUserEnteredCorrectPassword,
  Controllers.login
);

const requiredVerificationCodeData: Validators.RequiredVerificationCodeData = [
  "email",
  "verificationCode",
];

authRouter.post(
  "/verify-registration",
  Middleware.verifyClientPayload({
    requiredData: requiredVerificationCodeData,
  }),
  Middleware.validateEmailVerified,
  Middleware.validateVerificationCode,
  Controllers.verifyRegistration
);

authRouter.post(
  "/verify-login",
  Middleware.verifyClientPayload({
    requiredData: requiredVerificationCodeData,
    optionalData: ["thirtyDays"],
  }),
  Middleware.validateVerificationCode,
  Controllers.verifyLogin
);

authRouter.post(
  "/send-new-verification-code",
  Middleware.verifyClientPayload({ requiredData: ["email"] }),
  Controllers.sendNewVerificationCode
);

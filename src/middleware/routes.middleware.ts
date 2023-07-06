import { NextFunction, Request, Response } from "express";

import * as Constants from "@/constants";
import * as Helpers from "@/helpers";

function generateMissingClientData(
  clientData: string[],
  expectedData: string[]
) {
  const missingClientData = expectedData.filter(
    (data: string) => !clientData.includes(data)
  );

  return missingClientData;
}

type ExpectedClientData = {
  requiredData?: string[];
  optionalData?: string[];
};

export function validateClientData(expectedClientData: ExpectedClientData) {
  return (request: Request, response: Response, next: NextFunction) => {
    const clientData = Object.keys(request.body); // Data sent from the client.
    const { requiredData, optionalData } = expectedClientData;

    const missingRequiredData = requiredData
      ? generateMissingClientData(clientData, requiredData)
      : [];

    const missingOptionalData = optionalData
      ? generateMissingClientData(clientData, optionalData)
      : [];

    if (missingRequiredData.length > 0) {
      return response.status(Constants.HttpStatusCodes.BAD_REQUEST).json(
        Helpers.generateTextResponse({
          body: `Missing Data: ${missingRequiredData.join(", ")}.`,
        })
      );
    } else if (missingOptionalData.length > 0) {
      return response.status(Constants.HttpStatusCodes.BAD_REQUEST).json(
        Helpers.generateTextResponse({
          body: `Missing Data: ${missingOptionalData.join(", ")}.`,
        })
      );
    } else {
      return next();
    }
  };
}

// ========================================================================================= //
// [ VERIFIES JWT ACCESS TOKEN ] =========================================================== //
// ========================================================================================= //

// ↓↓↓ Middleware that authenticates user actions via a JWT access token. ↓↓↓ //
// ↓↓↓ Checks if there is a valid access token (e.g. it exists or supplies the correct secret key). ↓↓↓ //
// ↓↓↓ If not, user is not authorized to make an action. ↓↓↓ //
//
// ↓↓↓ This middleware is performed before hitting any endpoint that requires validation credentials. ↓↓↓ //
// type RequestWithAccessToken = { accessToken: string | JwtPayload } & Request;

// export async function verifyAccessToken(
//   request: Request,
//   response: Response,
//   next: NextFunction
// ) {
//   try {
//     return Helpers.handleSecretKeysExist(
//       response,
//       function (_: string, authSecretKey: string) {
//         const accessToken = request.header("authorization");

//         if (!accessToken) {
//           return HttpHelpers.respondWithClientError(response, "unauthorized", {
//             body: "Unauthorized access.",
//           });
//         } else {
//           const decodedAccessToken = jwt.verify(accessToken, authSecretKey);
//           // ↓↓↓ Appending our decoded access token to Express's `request` object for use. ↓↓↓ //
//           // ↓↓↓ in the action the user wanted to perform. ↓↓↓ //
//           (request as RequestWithAccessToken).accessToken = decodedAccessToken;
//           return next();
//         }
//       }
//     );
//   } catch (error) {
//     return HttpHelpers.respondWithClientError(response, "unauthorized", {
//       body: "Unauthorized access.",
//     });
//   }
// }
import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError";
import jwt from "jsonwebtoken";
import { IAuthPayload } from "../interfaces/interfaces";

export const authMiddleware: RequestHandler = (req, _, next) => {
    try {
        const [scheme, bearerToken] = req?.headers?.authorization?.split(" ") ?? [];
        const accessToken = req.cookies?.accessToken
            || (scheme?.toLowerCase() === "bearer" ? bearerToken : undefined);

        if (!accessToken) {
            throw new ApiError(401, "User validation failed.");
        }

        const userInfo = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY || "") as IAuthPayload;
        if (typeof userInfo === "string") {
            throw new ApiError(401, "Invalid or expired token");
        }

        req.user = userInfo
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }
        next(new ApiError(429, "Invalid or expired access token."));
    }
};

export const optionalAuthMiddleware: RequestHandler = (req, _, next) => {
    try {
        const [scheme, bearerToken] = req?.headers?.authorization?.split(" ") ?? [];
        const accessToken = req.cookies?.accessToken || (scheme?.toLowerCase() === "bearer" ? bearerToken : undefined);

        if (accessToken) {
            const userInfo = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY || "") as IAuthPayload;
            if (typeof userInfo === "string") {
                throw new ApiError(401, "Invalid or expired token");
            }
            req.user = userInfo
        }


        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }
        next(new ApiError(429, "Invalid or expired access token."));
    }
};


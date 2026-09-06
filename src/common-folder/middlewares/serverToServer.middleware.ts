import { RequestHandler } from "express";
import { ApiError } from "../utils/apiError";

export const serverToServerAuthMiddleware: RequestHandler = (req, res, next) => {
    try {
        if (!process.env.INTERNAL_SERVICE_TOKEN) {
            throw new ApiError(401, "No valid token added");
        }

        const authorization = req.headers.authorization;
        const token = authorization?.replace("Bearer ", "");

        if (!authorization || token !== process.env.INTERNAL_SERVICE_TOKEN) {
            throw new ApiError(401, "User validation failed.");
        }
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }
        next(new ApiError(401, "Unauthorized."));
    }
};
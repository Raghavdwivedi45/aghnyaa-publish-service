// middleware/rateLimiter.ts

import { Request, Response, NextFunction } from "express";
import client from "../utils/redis.client";
import { getRedisEncodedKey } from "../utils/helperFunctions";
import { redisRateLimit, windowInSeconds } from "../constants/constants";
import { ApiError } from "../utils/apiError";

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Authenticated user → user ID Otherwise → IP address
        const identifier = req?.user?._id?.toString() || req.ip;
        
        if (!identifier) {
            throw new ApiError(429, "Too many requests. Please try again later");
        }

        const key = getRedisEncodedKey("RATE", identifier);
        const currentCount = await client.incr(key);

        if (currentCount === 1) { // Set expiry only for the first request
            await client.expire(key, windowInSeconds);
        }

        if (currentCount > redisRateLimit) {
            throw new ApiError(429, "Too many requests. Please try again later");
        }

        next();
    } catch (error) {
        next(error);
    }
};
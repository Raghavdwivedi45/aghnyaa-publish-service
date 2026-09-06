import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";
import jwt from "jsonwebtoken";

export const errorMiddleware: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    // Custom ApiError
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors ?? [],
            data: null
        });
    }

    // Mongoose Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: Object.values(error.errors).map(e => e.message),
            data: null
        });
    }

    // Invalid ObjectId
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: `Invalid ${error.path}.`,
            data: null
        });
    }

    // Duplicate Key (E11000)
    if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
    ) {
        const duplicateField = Object.keys(
            (error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {}
        )[0];

        return res.status(409).json({
            success: false,
            message: `${duplicateField} already exists.`,
            data: null
        });
    }

    // Invalid JWT
    if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
            success: false,
            message: "Invalid token.",
            data: null
        });
    }

    // Expired JWT
    if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
            success: false,
            message: "Token has expired.",
            data: null
        });
    }

    // Unknown Error
    console.error(error);

    return res.status(500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error."
                : error instanceof Error
                    ? error.message
                    : "Internal Server Error.",
        stack:
            process.env.NODE_ENV === "production"
                ? undefined
                : error instanceof Error
                    ? error.stack
                    : undefined,
        data: null
    });
};
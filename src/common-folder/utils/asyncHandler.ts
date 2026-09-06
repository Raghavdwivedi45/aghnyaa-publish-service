import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps an async Express RequestHandler and forwards any rejected promise to next()
export const asyncHandler = (requestHandler: RequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => next(error));
    };
};

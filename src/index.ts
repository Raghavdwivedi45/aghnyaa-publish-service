import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDB } from "./common-folder/db";
import { errorMiddleware } from "./common-folder/middlewares/error.middleware";
import { authMiddleware } from "./common-folder/middlewares/auth.middleware";
import healthcheckRouter from "./routes/healthcheck.routes";
import articlesProtectedController from "./routes/protectedRoutes/article.protectedRoute";
import articleRouter from "./routes/articles.routes";
import { connectRedis } from "./common-folder/utils/redis.client";

const port = process.env.PORT || 3501;
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(",") || [],
    credentials: true,
    exposedHeaders: ["Content-Disposition"] // If your frontend and backend are on different origins, the browser may not expose Content-Disposition to JavaScript unless your backend exposes that header through CORS.
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log("Server is running at port ", port);
        })
    })
    .catch((err) => {
        console.log("MongoDB Connection error: ", err);
    })

connectRedis()
    .then(() => {
        console.log("Redis Server Connected")
    })
    .catch((err) => {
        console.error("Redis Connection Error", err)
    })

// public routes
app.use("/v1/healthcheck", healthcheckRouter);
app.use("/v1/articles", articleRouter);

// below this line, authMiddleware will insert basic user info from access token into req.user
// thus the protected endpoints (endpoints that require user info and start with "/protect" prefix) should be placed after this
app.use(authMiddleware);

app.use("/protected/v1/articles", articlesProtectedController)


app.use(errorMiddleware);
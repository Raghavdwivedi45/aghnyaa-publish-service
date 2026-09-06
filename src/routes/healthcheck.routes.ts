import { Router } from "express";
import { healthCheckController } from "../controllers/healthcheck.controllers";

const healthcheckRouter = Router();

healthcheckRouter.route("/").get(healthCheckController);

export default healthcheckRouter;
import { Router } from "express";
import { getAllArticlesController, getTopArticlesController, getAuthorListController } from "../controllers/articles.controllers";
import { optionalAuthMiddleware } from "../common-folder/middlewares/auth.middleware";

const articleRouter = Router();

articleRouter.route("/").get(optionalAuthMiddleware, getAllArticlesController);
articleRouter.route("/top-performers").get(getTopArticlesController);
articleRouter.route("/user-list").get(getAuthorListController);

export default articleRouter;
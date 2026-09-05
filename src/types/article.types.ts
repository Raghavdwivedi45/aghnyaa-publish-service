import { Model } from "mongoose";
import { IArticle, IArticleMethods } from "../interfaces/article.interfaces";
import { ARTICLE_CATEGORIES, ARTICLE_STATUS, ARTICLE_TAGS } from "../constants/article.constants";

export type ArticleModel = Model<IArticle, {}, IArticleMethods>;

export type ArticleStatus = typeof ARTICLE_STATUS[number];
export type ArticleCategories = typeof ARTICLE_CATEGORIES[number];
export type ArticleTags = typeof ARTICLE_TAGS[number];
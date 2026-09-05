import { Request, Response } from "express";
import { asyncHandler } from "../common-folder/utils/asyncHandler";
import { ApiResponse } from "../common-folder/utils/apiResponse";
import { Article } from "../models/article.model";
import { getObjectPublicUrl } from "../publish-utils/awsS3.service";
import { fetchAuthorInfo } from "../publish-utils/serverToserver";
import { ApiError } from "../common-folder/utils/apiError";
import { Types } from "mongoose";

export const getAllArticlesController = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, authors, createdAfter, createdBefore, articleSlug, category, tags } = req.query;
    const {_id} = req?.user;
    
    const articleSlugsArr = articleSlug?.toString()?.split(",")?.filter(Boolean);

    if (Number(limit) > 10 || (articleSlugsArr && articleSlugsArr?.length > 10)) {
        throw new ApiError(400, "More than 10 articles not allowed at once")
    }

    const match: Record<string, any> = {};
    match.status = { $ne: "DRAFT" };

    if (authors) {
        const authorArray = authors?.toString()?.split(",").filter(Boolean);
        match.author = { $in: authorArray };
    }
    if (tags) {
        const tagsArray = tags?.toString()?.split(",").filter(Boolean);
        match.tags = { $in: tagsArray };
    }
    if (category) {
        match.category = category;
    }
    if (articleSlugsArr && articleSlugsArr?.length > 0) {
        match.slug = { $in: articleSlugsArr };
    }
    if (createdAfter || createdBefore) {
        match.createdAt = {};

        if (createdAfter) {
            match.createdAt.$gte = new Date(createdAfter as string);
        }

        if (createdBefore) {
            match.createdAt.$lte = new Date(createdBefore as string);
        }
    }

    const totalArticles = await Article.countDocuments(match);
    const totalPages = Number(limit) ? Math.ceil(totalArticles / Number(limit)) : 0;
    const articles = await Article.aggregate([
        { $match: match },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },


        ...(req?.user?._id
            ?
            [
                {
                    $lookup: {
                        from: "articlelikes",
                        let: { articleId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$articleId", "$$articleId"] },
                                            { $eq: ["$likedBy", new Types.ObjectId(req?.user?._id)] }
                                        ]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: "userLike"
                    }
                },
                {
                    $lookup: {
                        from: "articlebookmarks",
                        let: { articleId: "$_id" },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$articleId", "$$articleId"] },
                                        { $eq: ["$bookmarkedBy", new Types.ObjectId(req?.user?._id)] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                        ],
                        as: "userBookmark"
                    }
                },
                {
                    $addFields: {
                        isLikedByUser: {
                            $gt: [{ $size: "$userLike" }, 0]
                        },
                        isBookmarkedByUser: {
                            $gt: [{ $size: "$userBookmark" }, 0]
                        }
                    }
                },
                {
                    $project: { userLike: 0, userBookmark: 0 }
                }
            ]
            : [
                {
                    $addFields: {
                        isLikedByUser: false,
                        isBookmarkedByUser: false
                    }
                }
            ])
    ]);

    const userIdArr = [...new Set(articles.map(article => article.author?.toString()).filter(Boolean))]; // .filter(Boolean) -> it's mainly removing undefined from articles that don't have an author.

    const authorInfo = await fetchAuthorInfo(userIdArr);
    const authorMap = new Map(authorInfo.map((author) => [author._id.toString(), author]));

    const articlesWithAuthors = articles.map(article => ({
        ...article,
        author: article?.author ? (authorMap.get(article.author.toString()) ?? null) : null,
        coverImage: getObjectPublicUrl(article?.coverImage)
    }));

    const response = { articlesWithAuthors, totalPages }
    return res.status(200).json(new ApiResponse(200, response, "Articles retrieved successfully!"))
})

export const getTopArticlesController = asyncHandler(async (req: Request, res: Response) => {
    const top3Categories = await Article.aggregate([
        { $match: { status: { $ne: "DRAFT" } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
        { $project: { category: "$_id", count: 1 } }
    ]);

    const top3LikedArticles = await Article.aggregate([
        { $match: { status: { $ne: "DRAFT" } } },
        { $sort: { likes: -1 } },
        { $limit: 3 },
        { $project: { title: 1, slug: 1, coverImage: 1 } }
    ]);
    return res.status(200).json(new ApiResponse(200, { top3Categories, top3LikedArticles }, "Article retrieved successfully!"))
})

export const getAuthorListController = asyncHandler(async (req: Request, res: Response) => {
    const users = await Article.aggregate([{ $match: { status: { $ne: "DRAFT" } } }, { $project: { author: 1 } }])

    const userIds = [...new Set(users.map(user => user?.author?.toString()).filter(Boolean))];
    const response = await fetchAuthorInfo(userIds, true)

    return res.status(200).json(new ApiResponse(200, response, "Authors with atleast 1 published article retrieved successfully!"))
})
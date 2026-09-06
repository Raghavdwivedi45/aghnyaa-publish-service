import { Request, Response } from "express";
import { asyncHandler } from "../../common-folder/utils/asyncHandler";
import { ApiResponse } from "../../common-folder/utils/apiResponse";
import { ApiError } from "../../common-folder/utils/apiError";
import { Article } from "../../models/article.model";
import { calculateReadTime, generateSlug } from "../../common-folder/utils/helperFunctions";
import { Types } from "mongoose";
import { deleteObjectFromBucket, generatePresignedPost, getObjectPublicUrl } from "../../publish-utils/awsS3.service";
import { UserRole } from "../../common-folder/constants/enums";
import { ArticleStatus } from "../../types/article.types";
import { allowedAttributes, allowedHTMLTags, BAD_WORDS } from "../../constants/article.constants";
import sanitizeHtml from 'sanitize-html';
import { fetchAuthorInfo, isUserVerified, updateUserHistory } from "../../publish-utils/serverToserver";
import { languageArray } from "../../common-folder/constants/constants";
import { articleLike } from "../../models/articleLike.model";
import { articleBookmark } from "../../models/articleBookmark";
import { generateArticlePdfHtml, PDFGenerator } from "../../publish-utils/helperFunctions";
import { articleComment } from "../../models/articleComment.model";


export const createDraftArticle = asyncHandler(async (req: Request, res: Response) => {
    const { title, excerpt, content, coverImage, tags, isFeatured, category, readTime, status, language } = req.body;
    const { _id, role } = req.user;

    if (role !== UserRole.AUTHOR) {
        throw new ApiError(400, "User is not an author");
    }
    if (!Number(readTime)) {
        throw new ApiError(400, "Invalid Read time");
    }
    if (typeof isFeatured !== "boolean") {
        throw new ApiError(400, "Invalid isFeatured");
    }
    if (language && !languageArray.includes(language)) {
        throw new ApiError(400, "Invalid language");
    }

    if (status === "PUBLISHED") {
        if (!title || !excerpt || !content || !category || !tags || !coverImage) {
            throw new ApiError(400, "All fields are required to publish an article");
        }

        const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (plainText.length < 1500) {
            throw new ApiError(400, "Article is too short.");
        }

        const wordCount = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
        if (wordCount < 300) {
            throw new ApiError(400, "Article must contain at least 300 words.");
        }

        const headings = content.match(/<h[1-6]\b[^>]*>/gi);
        const headingCount = headings?.length ?? 0;
        if (headingCount < 1) {
            throw new ApiError(400, "At least one heading is required.");
        }

        const images = content.match(/<img\b[^>]*>/gi);
        const imageCount = images?.length ?? 0;
        if (imageCount > 20) {
            throw new ApiError(400, "Maximum 20 images allowed.");
        }

        const embeds = content.match(/<iframe\b[^>]*>/gi);
        const embedCount = embeds?.length ?? 0;
        if (embedCount > 5) {
            throw new ApiError(400, "Too many embeds.");
        }

        const links = content.match(/<a\b[^>]*href=/gi);
        const linkCount = links?.length ?? 0;
        if (linkCount > 5) {
            throw new ApiError(400, "Too many links.");
        }

        const lower = plainText.toLowerCase().split(/\W+/);
        for (const word of lower) {
            if (BAD_WORDS.has(word)) {
                throw new ApiError(400, "Article contains prohibited words.");
            }
        }

        if (/(.)\1{15,}/.test(plainText) || /\b(\w+)\b(?:\s+\1\b){10,}/i.test(plainText)) {
            throw new ApiError(400, "Spam detected."); // things like same character repeated -> asdfasdfasdf, aaaaaaaaaaaaaaaa, !!!!!!!!!!!!!!!, $$$$$$$$$$$$$
            // things like Repeated words -> React React React React React React
        }

        if (tags.length < 1 || tags.length > 5) {
            throw new ApiError(400, "Article must have at least 1 tag and at most 5 tags.");
        }
    }

    const isUserEligible = await isUserVerified(_id);
    if (!isUserEligible) {
        throw new ApiError(400, "User is not eligible for this action");
    }

    const randomTitle = `Untitled Draft ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const randomExcerpt = "A concise article summary that introduces the main topic, highlights key insights, and encourages readers to continue. Ideal for homepages, search results, and social media previews. "
    const placeholderCoverImage = "/anonymous.svg"
    const defaultIsFeatured = false;
    const defaultStatus: ArticleStatus = "DRAFT";

    const sanitizedContent = sanitizeHtml(content, {
        allowedTags: allowedHTMLTags,
        allowedAttributes: allowedAttributes,
        allowedIframeHostnames: ['www.youtube.com'],
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        allowedSchemes: ['http', 'https'], // URL schemes we permit -> other options: 'mailto', 'tel'
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                rel: "noopener noreferrer nofollow",
            }), // This prevents reverse tabnabbing when users use <a target="_blank">
        },
    });

    const newArticle = new Article({
        title: title || randomTitle,
        slug: generateSlug(title || randomTitle),
        excerpt: excerpt || randomExcerpt,
        content: sanitizedContent,
        author: new Types.ObjectId(_id),
        coverImage: coverImage || placeholderCoverImage,
        category,
        tags,
        language: language || "English",
        isFeatured: isFeatured || defaultIsFeatured, // if user doesn't set it explicitly true, article is not featured
        status: status ?? defaultStatus,
        readTime: Number(readTime) || calculateReadTime(content)
    })

    const savedArticle = await newArticle.save();
    const message = await updateUserHistory(_id, "", "draft-article-created");
    if (!message) {
        throw new ApiError(500, "User history could not be updated!");
    }
    return res.status(201).json(new ApiResponse(201, savedArticle, "Draft has been created!"));
})

export const getArticleInformationForEdit = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req.params;
    const { _id, role } = req.user;

    if (role !== UserRole.AUTHOR) {
        throw new ApiError(400, "User is not authorised to access this resource");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(400, "No article with this article id was found from this user");
    }
    if (_id !== article.author?.toString()) {
        throw new ApiError(400, "Information is only revealed to the author for editing");
    }
    const articleObj = article.toObject();

    if (articleObj.coverImage) {
        articleObj.coverImage = getObjectPublicUrl(articleObj.coverImage);
    }

    return res.status(200).json(new ApiResponse(201, articleObj, "Draft has been retrieved successfully!"));
})

export const getMyDrafts = asyncHandler(async (req: Request, res: Response) => {
    const { _id, role } = req.user;
    if (role !== UserRole.AUTHOR) {
        throw new ApiError(400, "User is not authorised to access this resource");
    }
    const articles = await Article.find({ author: _id, status: "DRAFT" });

    const updatedArticles = articles.map((article) => ({
        ...article.toObject(),
        coverImage: getObjectPublicUrl(article.coverImage ?? "")
    }));

    return res.status(200).json(new ApiResponse(201, updatedArticles, "Drafts have been retrieved successfully!"));
})

export const updateArticleInformation = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req.params;
    const { _id, role } = req.user;
    const { title, excerpt, content, coverImage, tags, isFeatured, category, readTime, language, status } = req.body;
    if (role !== UserRole.AUTHOR) {
        throw new ApiError(400, "User is not authorised to access this resource");
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
        updateData.title = title;
        updateData.slug = generateSlug(title);
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (tags !== undefined) updateData.tags = tags;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (language !== undefined) updateData.language = language;
    if (category !== undefined) updateData.category = category;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (status !== undefined) updateData.status = status;

    const article = await Article.findOne({ slug: articleSlug, author: _id });
    if (!article) {
        throw new ApiError(404, "Article not found");
    }

    const statusForHistory = article.status;

    if (article.status === "EDITED") {
        throw new ApiError(404, "It is already an edited article. You cannot edit an article more than once");
    }
    if (article.status === "PUBLISHED" && status === "DRAFT") {
        throw new ApiError(404, "A published article cannot be reverted to draft version");
    }
    if (article.status === "DRAFT" && status === "EDITED") {
        throw new ApiError(404, "A draft article must be published before editing");
    }
    if (article.status === "PUBLISHED") {
        updateData.status = "EDITED"
    }

    const isUserEligible = await isUserVerified(_id);
    if (!isUserEligible) {
        throw new ApiError(400, "User is not eligible for this action");
    }

    const oldCoverImage = article.coverImage;
    Object.assign(article, updateData); // It copies every enumerable property from source into target
    await article.save();

    if (coverImage && oldCoverImage && oldCoverImage !== coverImage) {
        await deleteObjectFromBucket(oldCoverImage);
    }

    const message = await updateUserHistory(_id, "", (statusForHistory === "DRAFT" && (!updateData?.status || updateData?.status === "DRAFT")) ? "draft-article-edited" : (statusForHistory === "DRAFT" && status === "PUBLISHED") ? "article-published" : "published-article-edited");
    if (!message) {
        throw new ApiError(500, "User history could not be updated!");
    }
    return res.status(200).json(new ApiResponse(200, article, "Draft updated successfully!"));
})

export const getAwsS3PostObjectUrl = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;
    const { role } = req.user;

    if (!filename || typeof filename !== "string") {
        throw new ApiError(400, "Filename is required.");
    }
    if (role !== UserRole.AUTHOR) {
        throw new ApiError(400, "User is not authorised to access this resource");
    }

    const result = await generatePresignedPost(filename);
    // there are putobjecturl and getobjecturl functions as well, but we are using presigned post url because it allows us to upload files directly to S3 from the client side, without exposing our AWS credentials.
    // Mainly, It allows us to set conditions on the upload, such as file size and content type.

    if (!result.key || !result.url || !result.fields) {
        throw new ApiError(500, "Failed to generate presigned post URL.");
    }

    return res.status(200).json(new ApiResponse(200, result, "Image upload path generated successfully!"));
})

export const likeArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to like in absence of proper information.");
    }

    // update likeCount inside article document
    const article = await Article.findOneAndUpdate({ slug: articleSlug }, { $inc: { likes: 1 } }, { timestamps: false });
    // timestamp (updatedAt) should not change because it was liked
    if (!article) {
        throw new ApiError(404, "No such article found to be liked.");
    }
    // save new like's info
    const newLike = new articleLike({ articleId: article._id, likedBy: _id })
    await newLike.save();

    return res.status(200).json(new ApiResponse(200, {
        likes: (article?.likes ?? 0) + 1,
        isLikedByUser: true
    }, "Article was liked successfully!"));
})

export const unlikeArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to like without proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(404, "No such article found to be liked.");
    }

    const doesLikeExist = await articleLike.findOneAndDelete({ articleId: article._id, likedBy: _id })
    if (!doesLikeExist) {
        throw new ApiError(404, "The user never liked the article.");
    }
    await Article.updateOne({ slug: articleSlug, likes: { $gt: 0 } }, { $inc: { likes: -1 } }, { timestamps: false });

    return res.status(200).json(new ApiResponse(200, {
        likes: (article?.likes ?? 0) - 1,
        isLikedByUser: false
    }, "Article unliked successfully!"));
})

export const bookmarkArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to bookmark in absence of proper information.");
    }

    const article = await Article.findOneAndUpdate({ slug: articleSlug }, { $inc: { bookmarks: 1 } }, { timestamps: false });
    if (!article) {
        throw new ApiError(404, "No such article found to be bookmarked");
    }
    const newBookmark = new articleBookmark({ articleId: article._id, bookmarkedBy: _id })
    await newBookmark.save();

    return res.status(200).json(new ApiResponse(200, {
        bookmarks: (article?.bookmarks ?? 0) + 1,
        isBookmarkedByUser: true
    }, "Article was bookmarked successfully!"));
})

export const unbookmarkArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to bookmark without proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(404, "No such article found to be bookmarked.");
    }

    const doesBookmarkExist = await articleBookmark.findOneAndDelete({ articleId: article._id, bookmarkedBy: _id })
    if (!doesBookmarkExist) {
        throw new ApiError(404, "The user never bookmarked the article.");
    }
    await Article.updateOne({ slug: articleSlug, bookmarks: { $gt: 0 } }, { $inc: { bookmarks: -1 } }, { timestamps: false });

    return res.status(200).json(new ApiResponse(200, {
        bookmarks: (article?.bookmarks ?? 0) - 1,
        isBookmarkdByUser: false
    }, "Article unbookmarked successfully!"));
})

export const addArticleToUserHistory = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id || typeof articleSlug !== "string") {
        throw new ApiError(400, "Failed to update history without proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(404, "No such article found to be added to history.");
    }

    const message = await updateUserHistory(_id, articleSlug, "article-read");
    if (!message) {
        throw new ApiError(500, "User history could not be updated!");
    }
    return res.status(200).json(new ApiResponse(200, {}, message ?? "User history could not be updated!"));
})

export const generateArticlePdf = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id || typeof articleSlug !== "string") {
        throw new ApiError(400, "Failed to generate pdf without proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(404, "No article found to generate pdf");
    }

    const date = new Date();
    const pdf = await PDFGenerator(generateArticlePdfHtml(article?.title, article?.excerpt, article?.content), `${article?.title}-${date}`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${article?.title}-${date}.pdf"`
    );

    return res.status(200).send(pdf);
})


export const commentArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { comment } = req?.body;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to comment in absence of proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug });
    if (!article) {
        throw new ApiError(404, "No such article found to comment on");
    }

    const newComment = new articleComment({ articleId: article._id, commentBy: _id, comment: comment })
    await newComment.save();

    return res.status(200).json(new ApiResponse(200, { comment }, "Comment saved successfully!"));
})

export const getCommentsArticle = asyncHandler(async (req: Request, res: Response) => {
    const { articleSlug } = req?.params;
    const { _id } = req?.user;

    if (!articleSlug || !_id) {
        throw new ApiError(400, "Failed to comment in absence of proper information.");
    }

    const article = await Article.findOne({ slug: articleSlug }).select("_id");
    if (!article) {
        throw new ApiError(404, "No such article found to comment on");
    }

    const comments = await articleComment.find({ articleId: article?._id }).limit(10).lean();
    if (comments.length === 0) {
        throw new ApiError(404, "No such article found to comment on");
    }

    const userIds = comments?.map(comment => comment?.commentBy?.toString()).filter(Boolean);
    if (!userIds) {
        throw new ApiError(404, "No authors found for comments");
    }
    const authors = await fetchAuthorInfo(userIds, true);
    const authorMap = new Map(authors?.map((author) => [author?._id?.toString(), author]));

    const commentWithAuthors = comments.map(comment => (
        {
            ...comment,
            commentBy: comment?.commentBy ? (authorMap.get(comment.commentBy.toString()) ?? null) : null,
        }
    ));

    return res.status(200).json(new ApiResponse(200, commentWithAuthors, "Comment saved successfully!"));
})
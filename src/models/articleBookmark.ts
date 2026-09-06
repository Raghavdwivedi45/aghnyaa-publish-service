import { model, Schema } from "mongoose";

const articleBookmarkSchema = new Schema({
    bookmarkedBy: {
        type: Schema.Types.ObjectId,
        required: true
    },
    articleId: {
        type: Schema.Types.ObjectId,
        required: true
    },
}, { timestamps: true });

// Unique compound index - Prevent duplicate Bookmarks
// index = bookmarkedBy + articleId -> this group will be unique
articleBookmarkSchema.index(
    {
        bookmarkedBy: 1,
        articleId: 1,
    },
    { unique: true }
)

export const articleBookmark = model("articleBookmark", articleBookmarkSchema);
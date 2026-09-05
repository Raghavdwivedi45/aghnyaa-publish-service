import { model, Schema } from "mongoose";

const articleLikeSchema = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        required: true
    },
    articleId: {
        type: Schema.Types.ObjectId,
        required: true
    },
}, { timestamps: true });

// Unique compound index - Prevent duplicate likes
// index = likedBy+articleId -> this group will be unique
articleLikeSchema.index(
    {
        likedBy: 1,
        articleId: 1,
    },
    { unique: true }
)

export const articleLike = model("articleLike", articleLikeSchema);
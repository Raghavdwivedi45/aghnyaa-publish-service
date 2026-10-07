import { model, Schema } from 'mongoose';

const articleCommentSchema = new Schema(
  {
    commentBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    articleId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

articleCommentSchema.index(
  {
    commentBy: 1,
    articleId: 1,
  },
  { unique: true },
);

export const articleComment = model('articleComment', articleCommentSchema);

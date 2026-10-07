import { model, Schema } from 'mongoose';
import { IArticle, IArticleMethods } from '../interfaces/article.interfaces';
import { ArticleModel } from '../types/article.types';
import { ARTICLE_STATUS, ARTICLE_TAGS } from '../constants/article.constants'; // ARTICLE_CATEGORIES
import { languageArray } from '../common-folder/constants/constants';

// IArticle (Document Shape) -> what fields exist in your MongoDB document

// IArticleMethods (Instance Methods) -> These are methods available on individual documents. -> articleSchema.methods.incrementViews = async function () { this.views++; await this.save(); };
// const article = await Article.findById(id); await article.incrementViews();

// ArticleModel (Static Methods) -> Methods on the model (static methods) -> (Instance Methods / Document methods)
// -> like Article.findBySlug("nodejs") -> interface ArticleModel extends Model<IArticle> { findPublishedArticles(): Promise<IArticle[]>; findBySlug(slug: string): Promise<IArticle | null>; }
// articleSchema.statics.findPublishedArticles = function () { return this.find({ published: true }); }
// const articles = await Article.findPublished();
const articleSchema = new Schema<IArticle, ArticleModel, IArticleMethods>(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      unique: true,
      trim: true,
      minLength: [5, 'Title must have atleast 5 characters'],
      maxLength: [150, 'Title must be within 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug can only contain lowercase letters, numbers, and single hyphens.',
      ],
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required.'],
      minlength: [100, 'Excerpt should be at least 100 characters long.'],
      maxlength: [250, 'Excerpt cannot exceed 250 characters.'],
    },
    content: {
      type: String,
      required: [true, 'Content is required.'],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: [true, 'Author is required.'],
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image is required.'],
      default: '', // a draft article may have an empty cover image, but once an article is published, or edited - it must have a cover image
    },
    // category: {
    //     type: String,
    //     enum: ARTICLE_CATEGORIES,
    //     required: true
    // },
    tags: {
      type: [String],
      enum: {
        values: ARTICLE_TAGS,
        message: '{VALUE} is not a valid tag.',
      },
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ARTICLE_STATUS,
        message: '{VALUE} is not a valid status.',
      },
      required: [true, 'Status is required.'],
      default: 'DRAFT',
    },
    isFeatured: {
      type: Boolean,
      default: false,
      required: [true, 'Featured status is required.'],
    },
    readTime: {
      type: Number,
    },
    likes: {
      type: Number,
      required: true,
      default: 0,
    },
    bookmarks: {
      type: Number,
      required: true,
      default: 0,
    },
    language: {
      type: String,
      enum: {
        values: languageArray,
        message: '{VALUE} is not a valid language.',
      },
      default: 'English',
      required: true,
    },
  },
  { timestamps: true },
);

export const Article = model<IArticle, ArticleModel>('Article', articleSchema);

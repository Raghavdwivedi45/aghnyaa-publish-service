import { Schema } from 'mongoose';
import { ArticleStatus, ArticleTags } from '../types/article.types'; // ArticleCategories,
import { languageType } from '../common-folder/types/types';

export interface IArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: Schema.Types.ObjectId;
  coverImage?: string;
  // category: ArticleCategories;
  tags: ArticleTags[];
  status: ArticleStatus;
  isFeatured: boolean;
  readTime: number;
  clicks: number;
  likes: number;
  bookmarks: number;
  publishedAt?: Date;
  language: languageType;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IArticleMethods {}

export interface IAuthorInfo {
  _id: string;
  username: string;
  avatar?: string;
}

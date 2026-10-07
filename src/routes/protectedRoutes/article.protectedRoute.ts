import { Router } from 'express';
import {
  createDraftArticle,
  getArticleInformationForEdit,
  getAwsS3PostObjectUrl,
  updateArticleInformation,
  getMyDrafts,
  likeArticle,
  unlikeArticle,
  unbookmarkArticle,
  bookmarkArticle,
  addArticleToUserHistory,
  generateArticlePdf,
  commentArticle,
  getCommentsArticle,
} from '../../controllers/protectedController/articles.protectedController';
import { rateLimiter } from '../../common-folder/middlewares/rateLimit.middleware';

const articlesProtectedController = Router();

articlesProtectedController.route('/create-draft').post(rateLimiter, createDraftArticle);

articlesProtectedController
  .route('/create-draft/:articleSlug')
  .patch(rateLimiter, updateArticleInformation);

articlesProtectedController
  .route('/generate-presignedpost-s3-url/:filename')
  .get(rateLimiter, getAwsS3PostObjectUrl);

articlesProtectedController.route('/all-my-drafts').get(getMyDrafts);

articlesProtectedController.route('/:articleSlug').get(getArticleInformationForEdit);

articlesProtectedController
  .route('/:articleSlug/like')
  .post(rateLimiter, likeArticle)
  .delete(rateLimiter, unlikeArticle);

articlesProtectedController
  .route('/:articleSlug/bookmark')
  .post(rateLimiter, bookmarkArticle)
  .delete(rateLimiter, unbookmarkArticle);

articlesProtectedController.route('/:articleSlug/performance').patch(addArticleToUserHistory);

articlesProtectedController.route('/:articleSlug/pdf').get(rateLimiter, generateArticlePdf);

articlesProtectedController
  .route('/:articleSlug/comment')
  .post(rateLimiter, commentArticle)
  .get(getCommentsArticle);

export default articlesProtectedController;

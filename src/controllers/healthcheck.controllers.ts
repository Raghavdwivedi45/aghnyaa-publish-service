import { Response } from 'express';
import { asyncHandler } from '../common-folder/utils/asyncHandler';
import { ApiResponse } from '../common-folder/utils/apiResponse';

export const healthCheckController = asyncHandler(async (_, res: Response) => {
  return res.status(200).json(new ApiResponse(200, null, 'Health check successful!'));
});

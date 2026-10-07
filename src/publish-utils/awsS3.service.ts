import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { allowedImageTypes } from '../constants/article.constants';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const getObjectURL = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || '',
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expires in 5 minutes
  return url;
};

export const getObjectPublicUrl = (key: string) => {
  const url =
    key ||
    key === '/anonymous' ||
    key === '/anonymous.svg' ||
    key === 'anonymous.svg' ||
    key === 'anonymous'
      ? '/anonymous.svg'
      : `${process.env.AWS_PUBLIC_URL_PREFIX}/${key}`;
  return url;
};

export const putObjectURL = async (filename: string, contentType: string) => {
  if (!allowedImageTypes.includes(contentType)) {
    throw new Error('Invalid image type');
  }
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME || '',
    Key: `uploads/${randomUUID()}-${filename}`,
    // Stored under the "uploads" prefix with a unique object key.
    // new Date() produces strings with spaces and colons (e.g. Sat Aug 02 2026 15:20:10 GMT+0530), which make object keys awkward to work with.
    // Date.now() works perfectly and is much better than new Date() for an S3 object key. -> 1785665347123
    // A UUID is already designed to be globally unique.
    ContentType: contentType, // You can customize the content type as needed
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // URL expires in 1 minute
  return url;
};

export const generatePresignedPost = async (filename: string) => {
  // https://medium.com/@Games24x7Tech/a-complete-guide-to-s3-file-upload-using-pre-signed-post-urls-9cb2d6cfc0ab
  const key = `uploads/${randomUUID()}-${filename}`;
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Conditions: [
      ['content-length-range', 1024, 5 * 1024 * 1024] as ['content-length-range', number, number],
      ['starts-with', '$Content-Type', 'image/'] as ['starts-with', string, string],
    ],
    Expires: 60, // 1 minute
  });

  const response: {
    url: string;
    fields: Record<string, string>;
    key: string;
  } = {
    url,
    fields,
    key, // Important: save this later in MongoDB
  };

  return response;
};

export const deleteObjectFromBucket = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  await s3Client.send(command);
};

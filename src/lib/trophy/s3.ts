import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '91032568cebd0606c152575020c2a010';
const R2_ACCESS_KEY_ID =
  process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '43ba5ffa4a0784c4dc6547de167dc4b7';
const R2_SECRET_ACCESS_KEY =
  process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '02c60e117f7aaf7cbf5e7419238fcb19890442f63cdc78c6fd7e6fd0eceb34f5';
const R2_BUCKET_NAME =
  process.env.NEXT_PUBLIC_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'trophy-room';
const R2_ENDPOINT =
  process.env.NEXT_PUBLIC_R2_ENDPOINT ||
  process.env.R2_ENDPOINT ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export function getR2Client(): S3Client {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    throw new Error('Cloudflare R2 credentials are not configured in environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Generate a presigned PUT URL for direct client-to-R2 upload
 */
export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<string> {
  const s3 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a presigned GET URL for streaming/reading a book from R2
 */
export async function getPresignedDownloadUrl(
  fileKey: string,
  expiresInSeconds = 86400 // 24 hours
): Promise<string> {
  const s3 = getR2Client();
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteR2Object(fileKey: string): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    })
  );
}

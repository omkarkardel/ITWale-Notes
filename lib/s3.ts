import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export function s3Enabled() {
  // Only enable S3 when explicitly turned on to avoid placeholder creds causing failures
  if (String(process.env.S3_ENABLED).toLowerCase() !== 'true') return false
  return Boolean(process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

export function getS3Client(): S3Client | null {
  if (!s3Enabled()) return null
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export async function putToS3(key: string, body: Uint8Array | Buffer, contentType?: string) {
  const bucket = process.env.S3_BUCKET!
  const s3 = getS3Client()!
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
  return { bucket, key, url: `s3://${bucket}/${key}` }
}

export async function getSignedGetUrl(key: string, expiresIn = 60, downloadFileName?: string) {
  const bucket = process.env.S3_BUCKET!
  const s3 = getS3Client()!
  const params: any = { Bucket: bucket, Key: key }
  if (downloadFileName) {
    params.ResponseContentDisposition = `attachment; filename="${downloadFileName}"`
  }
  const cmd = new GetObjectCommand(params)
  return getSignedUrl(s3, cmd, { expiresIn })
}

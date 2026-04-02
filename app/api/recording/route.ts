import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * GET /api/recording?key=<s3-key>
 *
 * Generates a presigned S3 URL and redirects the browser to it.
 * The presigned URL lets the browser download directly from S3,
 * bypassing Amplify's 6MB response size limit.
 *
 * The signing credentials must have s3:GetObject + kms:Decrypt
 * permissions for the KMS-encrypted recordings.
 *
 * Credentials resolution:
 *   1. S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY env vars
 *   2. AWS default credential chain (IAM role)
 */

const RECORDING_BUCKET = "ticketclinic-prod"

const hasExplicitCreds = process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region: process.env.S3_REGION || process.env.AWS_REGION || "us-east-1",
  ...(hasExplicitCreds && {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  }),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (!key) {
    return NextResponse.json(
      { error: "Missing required parameter: key" },
      { status: 400 }
    )
  }

  if (!key.startsWith("connect/")) {
    return NextResponse.json(
      { error: "Invalid recording key" },
      { status: 403 }
    )
  }

  try {
    const command = new GetObjectCommand({
      Bucket: RECORDING_BUCKET,
      Key: key,
      ResponseContentType: "audio/wav",
      ResponseContentDisposition: "inline",
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    })

    // Redirect the browser directly to S3
    return NextResponse.redirect(presignedUrl)
  } catch (error: any) {
    console.error("Failed to generate presigned URL:", error)
    return NextResponse.json(
      { error: "Failed to load recording", details: error.message },
      { status: 500 }
    )
  }
}

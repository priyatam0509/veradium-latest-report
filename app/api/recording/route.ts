import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

/**
 * GET /api/recording?key=<s3-key>
 *
 * Streams the call recording audio directly from S3 to the browser.
 * This approach works with KMS-encrypted objects (presigned URLs don't).
 *
 * Credentials resolution:
 *   1. S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY env vars (local dev)
 *   2. AWS default credential chain - IAM role (Amplify SSR)
 */

const RECORDING_BUCKET = "ticketclinic-prod"

// Build S3 client: use explicit credentials if provided, otherwise fall back to default chain (IAM role)
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

  // Security: only allow keys under the Connect recordings path
  if (!key.startsWith("connect/")) {
    return NextResponse.json(
      { error: "Invalid recording key" },
      { status: 403 }
    )
  }

  try {
    const command = new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: key })
    const response = await s3Client.send(command)

    if (!response.Body) {
      return NextResponse.json(
        { error: "Empty response from S3" },
        { status: 500 }
      )
    }

    // Stream the S3 body directly to the browser
    const stream = response.Body.transformToWebStream()

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "audio/wav",
        "Content-Length": response.ContentLength?.toString() || "",
        "Content-Disposition": response.ContentDisposition || "inline",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Failed to stream recording:", error)
    return NextResponse.json(
      { error: "Failed to load recording", details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"

/**
 * GET /api/recording?key=<s3-key>
 *
 * Streams the call recording audio directly from S3 to the browser.
 * Supports HTTP Range requests for large files and seeking.
 * This approach works with KMS-encrypted objects (presigned URLs don't).
 *
 * Credentials resolution:
 *   1. S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY env vars (local dev)
 *   2. AWS default credential chain - IAM role (Amplify SSR)
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
    // Get file size first
    const headResp = await s3Client.send(
      new HeadObjectCommand({ Bucket: RECORDING_BUCKET, Key: key })
    )
    const totalSize = headResp.ContentLength || 0
    const contentType = headResp.ContentType || "audio/wav"

    // Check for Range header
    const rangeHeader = request.headers.get("range")

    if (rangeHeader) {
      // Parse range: "bytes=start-end"
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
      if (!match) {
        return new NextResponse("Invalid range", { status: 416 })
      }

      const start = parseInt(match[1], 10)
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1
      const chunkSize = end - start + 1

      const command = new GetObjectCommand({
        Bucket: RECORDING_BUCKET,
        Key: key,
        Range: `bytes=${start}-${end}`,
      })
      const response = await s3Client.send(command)

      if (!response.Body) {
        return NextResponse.json({ error: "Empty response from S3" }, { status: 500 })
      }

      const stream = response.Body.transformToWebStream()

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": chunkSize.toString(),
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=3600",
        },
      })
    }

    // No Range header — stream the full file
    const command = new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: key })
    const response = await s3Client.send(command)

    if (!response.Body) {
      return NextResponse.json({ error: "Empty response from S3" }, { status: 500 })
    }

    const stream = response.Body.transformToWebStream()

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": totalSize.toString(),
        "Accept-Ranges": "bytes",
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

import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import fs from "fs/promises";
import { Readable } from "stream";
import { checkRateLimit, getClientKey } from "@/lib/rate-limiter";
import { downloadVideo } from "@/lib/media-processor";
import { getJob, removeJob } from "@/lib/file-manager";
import { isValidUrl } from "@/lib/validators";
import type { ApiResponse } from "@/lib/types";

export const maxDuration = 300; // 5 minutes for large downloads

/**
 * GET /api/download
 *
 * Two modes:
 *   1. ?url=<encoded>&height=1080&type=video
 *      → downloads the video via yt-dlp, then streams the file
 *
 *   2. ?jobId=<id>&type=converted
 *      → streams a previously-converted file from disk
 */
export async function GET(request: NextRequest) {
    try {
        // ── Rate Limiting ────────────────────────────────────────
        const clientKey = getClientKey(request.headers);
        const rateLimit = checkRateLimit(clientKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { success: false, error: "Rate limit exceeded." } as ApiResponse<null>,
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") ?? "video";
        const jobId = searchParams.get("jobId");

        // ─────────────────────────────────────────────────────────
        // MODE 2: Serve an already-processed file by jobId
        // ─────────────────────────────────────────────────────────
        if (jobId) {
            const job = await getJob(jobId);

            if (!job) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "File not found or expired. Please convert again.",
                    } as ApiResponse<null>,
                    { status: 404 }
                );
            }

            if (!existsSync(job.filePath)) {
                removeJob(jobId);
                return NextResponse.json(
                    { success: false, error: "File no longer available." } as ApiResponse<null>,
                    { status: 404 }
                );
            }

            const stat = await fs.stat(job.filePath);
            const stream = createReadStream(job.filePath);
            const webStream = Readable.toWeb(stream) as ReadableStream;

            return new NextResponse(webStream, {
                status: 200,
                headers: {
                    "Content-Type": job.contentType,
                    "Content-Disposition": `attachment; filename="${job.fileName}"`,
                    "Content-Length": stat.size.toString(),
                    "Cache-Control": "no-store",
                },
            });
        }

        // ─────────────────────────────────────────────────────────
        // MODE 1: Download a video via yt-dlp then stream it
        // ─────────────────────────────────────────────────────────
        const rawUrl = searchParams.get("url");
        const heightStr = searchParams.get("height");

        if (!rawUrl) {
            return NextResponse.json(
                { success: false, error: "Missing 'url' or 'jobId' parameter." } as ApiResponse<null>,
                { status: 400 }
            );
        }

        const url = decodeURIComponent(rawUrl);
        if (!isValidUrl(url)) {
            return NextResponse.json(
                { success: false, error: "Invalid URL." } as ApiResponse<null>,
                { status: 400 }
            );
        }

        const maxHeight = parseInt(heightStr ?? "720", 10);
        if (isNaN(maxHeight) || maxHeight < 144 || maxHeight > 4320) {
            return NextResponse.json(
                { success: false, error: "Invalid height parameter." } as ApiResponse<null>,
                { status: 400 }
            );
        }

        // Run yt-dlp download (this can take a while)
        const downloadJobId = await downloadVideo(url, maxHeight);
        const job = await getJob(downloadJobId);

        if (!job || !existsSync(job.filePath)) {
            return NextResponse.json(
                { success: false, error: "Download failed — file not created." } as ApiResponse<null>,
                { status: 500 }
            );
        }

        const stat = await fs.stat(job.filePath);
        const stream = createReadStream(job.filePath);
        const webStream = Readable.toWeb(stream) as ReadableStream;

        // Schedule cleanup after streaming (10 seconds grace period)
        setTimeout(() => removeJob(downloadJobId), 10_000);

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                "Content-Type": job.contentType,
                "Content-Disposition": `attachment; filename="${job.fileName}"`,
                "Content-Length": stat.size.toString(),
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error("[download] Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "Download failed.",
            } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
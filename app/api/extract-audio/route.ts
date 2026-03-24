import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync } from "fs";
import fs from "fs/promises";
import { Readable } from "stream";
import { checkRateLimit, getClientKey } from "@/lib/rate-limiter";
import { extractAudio } from "@/lib/media-processor";
import { getJob, removeJob } from "@/lib/file-manager";
import { isValidUrl } from "@/lib/validators";
import type { ApiResponse } from "@/lib/types";

export const maxDuration = 300; // 5 minutes

/**
 * GET /api/extract-audio?url=<encoded>&bitrate=192
 *
 * Uses yt-dlp to extract audio as MP3, then streams the
 * resulting file to the client as a download.
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
        const rawUrl = searchParams.get("url");
        const bitrateStr = searchParams.get("bitrate");

        if (!rawUrl) {
            return NextResponse.json(
                { success: false, error: "Missing 'url' parameter." } as ApiResponse<null>,
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

        const bitrate = parseInt(bitrateStr ?? "192", 10);
        const allowedBitrates = [64, 96, 128, 192, 256, 320];
        const safeBitrate = allowedBitrates.includes(bitrate) ? bitrate : 192;

        // Run yt-dlp audio extraction
        const jobId = await extractAudio(url, safeBitrate);
        const job = await getJob(jobId);

        if (!job || !existsSync(job.filePath)) {
            return NextResponse.json(
                { success: false, error: "Audio extraction failed — file not created." } as ApiResponse<null>,
                { status: 500 }
            );
        }

        const stat = await fs.stat(job.filePath);
        const stream = createReadStream(job.filePath);
        const webStream = Readable.toWeb(stream) as ReadableStream;

        // Schedule cleanup after streaming
        setTimeout(() => removeJob(jobId), 10_000);

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${job.fileName}"`,
                "Content-Length": stat.size.toString(),
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error("[extract-audio] Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "Failed to extract audio.",
            } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from "next/server";
import { processUrl } from "@/lib/media-processor";
import { isValidUrl, isSupportedPlatform } from "@/lib/validators";
import { checkRateLimit, getClientKey } from "@/lib/rate-limiter";
import type { ApiResponse, MediaInfo } from "@/lib/types";

export const maxDuration = 60; // allow up to 60s for yt-dlp

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limiting ──────────────────────────────────────────
        const clientKey = getClientKey(request.headers);
        const rateLimit = checkRateLimit(clientKey);

        if (!rateLimit.allowed) {
            const res: ApiResponse<null> = {
                success: false,
                error: "Too many requests. Please wait a moment and try again.",
            };
            return NextResponse.json(res, {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": rateLimit.limit.toString(),
                    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
                    "X-RateLimit-Reset": rateLimit.resetAt.toString(),
                },
            });
        }

        // ── Parse body ─────────────────────────────────────────────
        const body = await request.json().catch(() => null);

        if (!body || typeof body.url !== "string") {
            return NextResponse.json(
                { success: false, error: "Missing or invalid 'url' in request body." } as ApiResponse<null>,
                { status: 400 }
            );
        }

        const url = body.url.trim();

        // ── Validate URL ───────────────────────────────────────────
        if (!isValidUrl(url)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Please provide a valid URL starting with http:// or https://.",
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        if (!isSupportedPlatform(url)) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Unsupported platform. We currently support YouTube, Instagram, and Facebook.",
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        // ── Process URL via yt-dlp ─────────────────────────────────
        const mediaInfo: MediaInfo = await processUrl(url);

        return NextResponse.json(
            {
                success: true,
                data: mediaInfo,
                message: "Media information retrieved successfully.",
            } as ApiResponse<MediaInfo>,
            {
                status: 200,
                headers: {
                    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
                },
            }
        );
    } catch (err: any) {
        console.error("[process-url] Error:", err.message);

        return NextResponse.json(
            {
                success: false,
                error: err.message || "An internal error occurred while processing the URL.",
            } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
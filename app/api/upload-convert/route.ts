import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { checkRateLimit, getClientKey } from "@/lib/rate-limiter";
import { convertFileToMp3 } from "@/lib/media-processor";
import { ensureTempDir, getTempPath } from "@/lib/file-manager";
import { ALLOWED_VIDEO_TYPES, MAX_UPLOAD_SIZE } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, ConversionJob } from "@/lib/types";

export const maxDuration = 300; // 5 minutes for conversion

/**
 * POST /api/upload-convert
 *
 * Accepts multipart/form-data with a "file" field.
 * Saves the file to a temp directory, converts it to MP3
 * using ffmpeg, and returns a ConversionJob with a download URL.
 */
export async function POST(request: NextRequest) {
    let savedFilePath: string | null = null;

    try {
        // ── Rate Limiting ──────────────────────────────────────────
        const clientKey = getClientKey(request.headers);
        const rateLimit = checkRateLimit(clientKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many requests. Please wait and try again.",
                } as ApiResponse<null>,
                { status: 429 }
            );
        }

        // ── Parse FormData ─────────────────────────────────────────
        const formData = await request.formData().catch(() => null);

        if (!formData) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid form data. Please upload a file.",
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        const file = formData.get("file");

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No file found in the upload. Please attach a video file.",
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        const uploadedFile = file as File;

        // ── Validate file type ─────────────────────────────────────
        if (!ALLOWED_VIDEO_TYPES.includes(uploadedFile.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unsupported file type "${uploadedFile.type}". Accepted: MP4, MOV, AVI, WebM, MKV.`,
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        // ── Validate file size ─────────────────────────────────────
        if (uploadedFile.size > MAX_UPLOAD_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File size (${formatBytes(uploadedFile.size)}) exceeds the ${formatBytes(MAX_UPLOAD_SIZE)} limit.`,
                } as ApiResponse<null>,
                { status: 400 }
            );
        }

        // ── Save uploaded file to temp directory ────────────────────
        await ensureTempDir();

        const ext = uploadedFile.name.split(".").pop() ?? "mp4";
        const tempName = `upload_${uuidv4()}.${ext}`;
        savedFilePath = getTempPath(tempName);

        const arrayBuffer = await uploadedFile.arrayBuffer();
        await fs.writeFile(savedFilePath, Buffer.from(arrayBuffer));

        // ── Convert to MP3 using ffmpeg ────────────────────────────
        const job: ConversionJob = await convertFileToMp3(
            savedFilePath,
            uploadedFile.name,
            uploadedFile.size
        );

        // savedFilePath is deleted inside convertFileToMp3 after success
        savedFilePath = null;

        return NextResponse.json(
            {
                success: true,
                data: job,
                message: "File converted successfully.",
            } as ApiResponse<ConversionJob>,
            { status: 200 }
        );
    } catch (err: any) {
        console.error("[upload-convert] Error:", err.message);

        // Clean up saved file on error
        if (savedFilePath) {
            try { await fs.unlink(savedFilePath); } catch { /* ignore */ }
        }

        return NextResponse.json(
            {
                success: false,
                error: err.message || "An internal error occurred during conversion.",
            } as ApiResponse<null>,
            { status: 500 }
        );
    }
}
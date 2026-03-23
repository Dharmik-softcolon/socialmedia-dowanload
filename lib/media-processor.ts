/**
 * Media Processor — REAL implementation.
 *
 * Uses:
 *   - yt-dlp   → fetch metadata & download video/audio from
 *                 YouTube, Instagram, Facebook
 *   - ffmpeg / fluent-ffmpeg → convert uploaded video files to MP3
 *
 * If yt-dlp is not installed the functions throw clear errors
 * so the API routes can return helpful messages.
 */

import { execFile as execFileCb } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";

import {
    MediaInfo,
    VideoFormat,
    AudioFormat,
    Platform,
    ConversionJob,
} from "./types";
import { formatDuration, formatBytes, generateId } from "./utils";
import { detectPlatform } from "./platform-detector";
import {
    ensureTempDir,
    getTempPath,
    storeJob,
    getFileSize,
    cleanupExpiredFiles,
} from "./file-manager";

const execFile = promisify(execFileCb);

// ─── Paths (configurable via .env) ──────────────────────────────
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG_BIN = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE_BIN = process.env.FFPROBE_PATH || "ffprobe";

// Point fluent-ffmpeg at the configured binaries
ffmpeg.setFfmpegPath(FFMPEG_BIN);
ffmpeg.setFfprobePath(FFPROBE_BIN);

// Max stdout buffer for yt-dlp --dump-json (50 MB)
const MAX_BUFFER = 50 * 1024 * 1024;

// ─── Dependency checks ──────────────────────────────────────────

/** Returns true if yt-dlp is installed and callable */
export async function isYtdlpAvailable(): Promise<boolean> {
    try {
        await execFile(YTDLP, ["--version"], { timeout: 10_000 });
        return true;
    } catch {
        return false;
    }
}

/** Returns true if ffmpeg is installed and callable */
export async function isFfmpegAvailable(): Promise<boolean> {
    try {
        await execFile(FFMPEG_BIN, ["-version"], { timeout: 10_000 });
        return true;
    } catch {
        return false;
    }
}

// ─── yt-dlp JSON typings (subset we use) ────────────────────────

interface YtdlpFormat {
    format_id: string;
    ext: string;
    width?: number | null;
    height?: number | null;
    fps?: number | null;
    vcodec?: string | null;
    acodec?: string | null;
    filesize?: number | null;
    filesize_approx?: number | null;
    tbr?: number | null;
    abr?: number | null;
    format_note?: string;
}

interface YtdlpMeta {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    thumbnails?: { url: string; width?: number; height?: number }[];
    duration?: number;
    uploader?: string;
    channel?: string;
    upload_date?: string; // "YYYYMMDD"
    view_count?: number;
    like_count?: number;
    formats?: YtdlpFormat[];
}

// ─── Helper: pick the best thumbnail ────────────────────────────

function pickThumbnail(meta: YtdlpMeta): string {
    // If a single thumbnail string exists, use it
    if (meta.thumbnail) return meta.thumbnail;
    // Otherwise pick the largest from the thumbnails array
    if (meta.thumbnails && meta.thumbnails.length > 0) {
        const sorted = [...meta.thumbnails].sort(
            (a, b) => (b.width ?? 0) - (a.width ?? 0)
        );
        return sorted[0].url;
    }
    // Fallback placeholder
    return `https://picsum.photos/seed/${meta.id}/640/360`;
}

// ─── Helper: format upload_date "YYYYMMDD" → readable ───────────

function formatUploadDate(raw?: string): string {
    if (!raw || raw.length !== 8) return "Unknown";
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    const date = new Date(`${y}-${m}-${d}`);
    if (isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// ─── Helper: format large view counts ───────────────────────────

function formatViews(count?: number): string {
    if (!count) return "N/A";
    if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B views`;
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
    return `${count} views`;
}

// ─── Helper: group yt-dlp formats into our VideoFormat[] ────────

function buildVideoFormats(
    formats: YtdlpFormat[],
    sourceUrl: string
): VideoFormat[] {
    // Keep only formats that have a video stream
    const videoFmts = formats.filter(
        (f) => f.vcodec && f.vcodec !== "none" && f.height && f.height > 0
    );

    // Group by height, keep the best (largest filesize / highest tbr) per height
    const byHeight = new Map<number, YtdlpFormat>();

    for (const f of videoFmts) {
        const h = f.height!;
        const existing = byHeight.get(h);
        const size =
            f.filesize ?? f.filesize_approx ?? (f.tbr ? f.tbr * 1000 : 0);
        const existingSize =
            existing?.filesize ??
            existing?.filesize_approx ??
            (existing?.tbr ? existing.tbr * 1000 : 0);

        if (!existing || size > existingSize) {
            byHeight.set(h, f);
        }
    }

    // Sort by height descending
    const sorted = [...byHeight.entries()].sort((a, b) => b[0] - a[0]);

    // Encode the original URL so the download endpoint can re-fetch
    const encodedUrl = encodeURIComponent(sourceUrl);

    return sorted.map(([height, f]) => {
        const bytes = f.filesize ?? f.filesize_approx ?? 0;
        const qualityLabel = `${height}p`;

        return {
            id: f.format_id,
            quality: qualityLabel,
            resolution: `${f.width ?? "?"}x${height}`,
            format: f.ext === "webm" ? "webm" : "mp4",
            fileSize: bytes > 0 ? formatBytes(bytes) : "Unknown",
            fileSizeBytes: bytes,
            fps: f.fps ?? 30,
            codec: f.vcodec ?? "Unknown",
            // Download URL goes through our API so we control the flow
            url: `/api/download?url=${encodedUrl}&height=${height}&type=video`,
        };
    });
}

// ─── Helper: build AudioFormat[] from metadata duration ─────────

function buildAudioFormats(
    durationSec: number,
    sourceUrl: string
): AudioFormat[] {
    const bitrates = [320, 192, 128];
    const encodedUrl = encodeURIComponent(sourceUrl);

    return bitrates.map((br) => {
        // Estimate file size: (bitrate_bps × duration) / 8
        const estimatedBytes = Math.floor((br * 1000 * durationSec) / 8);

        return {
            id: generateId(),
            quality: `${br}kbps`,
            format: "mp3",
            fileSize: formatBytes(estimatedBytes),
            fileSizeBytes: estimatedBytes,
            duration: formatDuration(durationSec),
            durationSeconds: durationSec,
            bitrate: br,
            url: `/api/extract-audio?url=${encodedUrl}&bitrate=${br}`,
        };
    });
}

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch metadata for a URL using yt-dlp --dump-json.
 *
 * Works for YouTube, Instagram, and Facebook URLs.
 */
export async function processUrl(url: string): Promise<MediaInfo> {
    // Trigger background cleanup of old temp files
    cleanupExpiredFiles().catch(() => {});

    // Verify yt-dlp is available
    const available = await isYtdlpAvailable();
    if (!available) {
        throw new Error(
            "yt-dlp is not installed or not found in PATH. " +
            "Install it with: pip install yt-dlp  (or set YTDLP_PATH in .env)"
        );
    }

    // Run yt-dlp to get JSON metadata (no actual download)
    let stdout: string;
    try {
        const result = await execFile(
            YTDLP,
            [
                "--dump-json",
                "--no-download",
                "--no-warnings",
                "--no-playlist",        // single video only
                "--skip-download",
                url,
            ],
            { maxBuffer: MAX_BUFFER, timeout: 30_000 }
        );
        stdout = result.stdout;
    } catch (err: any) {
        // Parse yt-dlp stderr for a user-friendly message
        const stderr: string = err.stderr ?? "";

        if (stderr.includes("Unsupported URL")) {
            throw new Error("This URL is not supported by yt-dlp. Please check the link.");
        }
        if (stderr.includes("Video unavailable") || stderr.includes("Private video")) {
            throw new Error("This video is unavailable or private.");
        }
        if (stderr.includes("Sign in") || stderr.includes("login")) {
            throw new Error(
                "This content requires authentication. Public content only."
            );
        }
        if (stderr.includes("HTTP Error 404")) {
            throw new Error("Video not found (404). The link may be broken.");
        }

        throw new Error(
            `yt-dlp failed: ${stderr.slice(0, 300) || err.message}`
        );
    }

    // Parse the JSON output
    let meta: YtdlpMeta;
    try {
        meta = JSON.parse(stdout);
    } catch {
        throw new Error("Failed to parse video metadata from yt-dlp.");
    }

    const platform: Platform = detectPlatform(url);
    const durationSec = meta.duration ?? 0;
    const formats = meta.formats ?? [];

    // Build our structured response
    const info: MediaInfo = {
        id: meta.id ?? uuidv4(),
        platform,
        title: meta.title ?? "Untitled",
        description: (meta.description ?? "").slice(0, 500),
        thumbnail: pickThumbnail(meta),
        duration: formatDuration(durationSec),
        durationSeconds: durationSec,
        author: meta.uploader ?? meta.channel ?? "Unknown",
        uploadDate: formatUploadDate(meta.upload_date),
        viewCount: formatViews(meta.view_count),
        videoFormats: buildVideoFormats(formats, url),
        audioFormats: buildAudioFormats(durationSec, url),
    };

    return info;
}

/**
 * Download a video at a given max height using yt-dlp.
 *
 * Saves to a temp file and stores a job reference so the
 * download API route can stream it to the client.
 *
 * Returns the job ID.
 */
export async function downloadVideo(
    url: string,
    maxHeight: number
): Promise<string> {
    await ensureTempDir();

    const jobId = uuidv4();
    const outFile = getTempPath(`${jobId}.mp4`);

    // Format selector:
    //   "best video ≤ maxHeight + best audio, merged into mp4"
    //   Falls back to "best single stream ≤ maxHeight"
    const formatSelector =
        `bestvideo[height<=${maxHeight}]+bestaudio/best[height<=${maxHeight}]/best`;

    try {
        await execFile(
            YTDLP,
            [
                "-f",
                formatSelector,
                "--merge-output-format",
                "mp4",
                "--no-playlist",
                "--no-warnings",
                "-o",
                outFile,
                url,
            ],
            { maxBuffer: MAX_BUFFER, timeout: 5 * 60 * 1000 } // 5 min timeout
        );
    } catch (err: any) {
        // Cleanup partial file
        try { await fs.unlink(outFile); } catch { /* ignore */ }
        throw new Error(`Download failed: ${(err.stderr ?? err.message).slice(0, 300)}`);
    }

    // Verify the file exists
    const fileSize = await getFileSize(outFile);
    if (fileSize === 0) {
        try { await fs.unlink(outFile); } catch { /* ignore */ }
        throw new Error("Download produced an empty file.");
    }

    // Store reference
    storeJob({
        id: jobId,
        filePath: outFile,
        fileName: `video_${maxHeight}p_${jobId.slice(0, 8)}.mp4`,
        contentType: "video/mp4",
        createdAt: Date.now(),
    });

    return jobId;
}

/**
 * Extract audio from a URL as MP3 using yt-dlp.
 *
 * Returns the job ID so the download endpoint can serve the file.
 */
export async function extractAudio(
    url: string,
    bitrate: number = 192
): Promise<string> {
    await ensureTempDir();

    const jobId = uuidv4();
    // yt-dlp appends the real extension, so use a template
    const outTemplate = getTempPath(`${jobId}.%(ext)s`);
    const expectedMp3 = getTempPath(`${jobId}.mp3`);

    try {
        await execFile(
            YTDLP,
            [
                "-x",                          // extract audio
                "--audio-format", "mp3",       // convert to mp3
                "--audio-quality", `${bitrate}K`, // set bitrate
                "--no-playlist",
                "--no-warnings",
                "-o",
                outTemplate,
                url,
            ],
            { maxBuffer: MAX_BUFFER, timeout: 5 * 60 * 1000 }
        );
    } catch (err: any) {
        try { await fs.unlink(expectedMp3); } catch { /* ignore */ }
        throw new Error(`Audio extraction failed: ${(err.stderr ?? err.message).slice(0, 300)}`);
    }

    // yt-dlp should have created the .mp3 file
    const fileSize = await getFileSize(expectedMp3);
    if (fileSize === 0) {
        try { await fs.unlink(expectedMp3); } catch { /* ignore */ }
        throw new Error("Audio extraction produced an empty file.");
    }

    storeJob({
        id: jobId,
        filePath: expectedMp3,
        fileName: `audio_${bitrate}kbps_${jobId.slice(0, 8)}.mp3`,
        contentType: "audio/mpeg",
        createdAt: Date.now(),
    });

    return jobId;
}

/**
 * Convert an uploaded video file to MP3 using fluent-ffmpeg.
 *
 * @param inputPath  absolute path to the uploaded video on disk
 * @param originalName  the user's original filename
 * @param originalSize  the size of the uploaded file in bytes
 *
 * Returns a complete ConversionJob.
 */
export async function convertFileToMp3(
    inputPath: string,
    originalName: string,
    originalSize: number
): Promise<ConversionJob> {
    await ensureTempDir();

    const jobId = uuidv4();
    const outputPath = getTempPath(`${jobId}.mp3`);

    // ── Step 1: probe input file for duration ────────────────────
    const durationSec = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) {
                reject(new Error(`Cannot read file: ${err.message}`));
                return;
            }
            resolve(metadata.format?.duration ?? 0);
        });
    });

    // ── Step 2: convert to MP3 ───────────────────────────────────
    await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat("mp3")
            .audioBitrate(192)
            .audioChannels(2)
            .audioFrequency(44100)
            .on("error", (err: Error) => {
                reject(new Error(`Conversion error: ${err.message}`));
            })
            .on("end", () => {
                resolve();
            })
            .save(outputPath);
    });

    // ── Step 3: get output file size ─────────────────────────────
    const outputSize = await getFileSize(outputPath);
    if (outputSize === 0) {
        try { await fs.unlink(outputPath); } catch { /* ignore */ }
        throw new Error("Conversion produced an empty file.");
    }

    // ── Step 4: store job for download ───────────────────────────
    storeJob({
        id: jobId,
        filePath: outputPath,
        fileName: `${path.basename(originalName, path.extname(originalName))}.mp3`,
        contentType: "audio/mpeg",
        createdAt: Date.now(),
    });

    // ── Step 5: clean up the uploaded input file ─────────────────
    try { await fs.unlink(inputPath); } catch { /* ignore */ }

    // ── Step 6: return the ConversionJob ─────────────────────────
    const job: ConversionJob = {
        id: jobId,
        fileName: originalName,
        originalSize: formatBytes(originalSize),
        status: "completed",
        progress: 100,
        result: {
            url: `/api/download?jobId=${jobId}&type=converted`,
            fileSize: formatBytes(outputSize),
            duration: formatDuration(durationSec),
            bitrate: "192 kbps",
        },
    };

    return job;
}
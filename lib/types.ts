/** Supported platform types */
export type Platform = "youtube" | "instagram" | "facebook" | "unknown";

/** A single downloadable video format */
export interface VideoFormat {
    id: string;
    quality: string;
    resolution: string;
    format: string;
    fileSize: string;
    fileSizeBytes: number;
    url: string;
    fps?: number;
    codec?: string;
}

/** Audio extraction result */
export interface AudioFormat {
    id: string;
    quality: string;
    format: string;
    fileSize: string;
    fileSizeBytes: number;
    duration: string;
    durationSeconds: number;
    url: string;
    bitrate: number;
}

/** Full media info returned by the process-url API */
export interface MediaInfo {
    id: string;
    platform: Platform;
    title: string;
    description: string;
    thumbnail: string;
    duration: string;
    durationSeconds: number;
    author: string;
    uploadDate: string;
    viewCount: string;
    videoFormats: VideoFormat[];
    audioFormats: AudioFormat[];
}

/** Upload conversion job */
export interface ConversionJob {
    id: string;
    fileName: string;
    originalSize: string;
    status: "uploading" | "processing" | "completed" | "error";
    progress: number;
    result?: {
        url: string;
        fileSize: string;
        duration: string;
        bitrate: string;
    };
    error?: string;
}

/** API response wrapper */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/** Rate limit info */
export interface RateLimitInfo {
    remaining: number;
    limit: number;
    resetAt: number;
}
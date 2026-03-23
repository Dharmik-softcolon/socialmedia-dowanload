import { ALLOWED_VIDEO_TYPES, MAX_UPLOAD_SIZE } from "./constants";

export function isValidUrl(input: string): boolean {
    try {
        const url = new URL(input.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export function isSupportedPlatform(url: string): boolean {
    const supportedDomains = [
        "youtube.com",
        "youtu.be",
        "youtube-nocookie.com",
        "instagram.com",
        "instagr.am",
        "facebook.com",
        "fb.watch",
        "fb.com",
    ];
    try {
        const parsed = new URL(url.trim());
        return supportedDomains.some(
            (domain) =>
                parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
}

export function validateUploadedFile(file: File): {
    valid: boolean;
    error?: string;
} {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Unsupported file type "${file.type}". Accepted: MP4, MOV, AVI, WebM, MKV.`,
        };
    }
    if (file.size > MAX_UPLOAD_SIZE) {
        const maxMB = MAX_UPLOAD_SIZE / (1024 * 1024);
        return {
            valid: false,
            error: `File size exceeds the ${maxMB} MB limit.`,
        };
    }
    return { valid: true };
}

export function getUrlError(url: string): string | null {
    if (!url.trim()) return "Please enter a URL.";
    if (!isValidUrl(url))
        return "Please enter a valid URL starting with http:// or https://.";
    if (!isSupportedPlatform(url))
        return "Unsupported platform. We currently support YouTube, Instagram, and Facebook.";
    return null;
}
export const APP_NAME = "MediaGrab";
export const APP_DESCRIPTION =
    "Download videos and extract audio from YouTube, Instagram, and Facebook. Fast, free, and no watermarks.";

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
];
export const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv"];

export const SUPPORTED_PLATFORMS = [
    {
        name: "YouTube",
        icon: "youtube",
        color: "#FF0000",
        domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    },
    {
        name: "Instagram",
        icon: "instagram",
        color: "#E4405F",
        domains: ["instagram.com", "instagr.am"],
    },
    {
        name: "Facebook",
        icon: "facebook",
        color: "#1877F2",
        domains: ["facebook.com", "fb.watch", "fb.com"],
    },
] as const;

export const QUALITY_OPTIONS = ["2160p", "1080p", "720p", "480p", "360p"];

export const AUDIO_BITRATES = [
    { label: "High Quality", value: 320, suffix: "kbps" },
    { label: "Standard", value: 192, suffix: "kbps" },
    { label: "Low", value: 128, suffix: "kbps" },
];
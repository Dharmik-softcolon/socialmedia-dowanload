import { Platform } from "./types";

export function detectPlatform(url: string): Platform {
    try {
        const parsed = new URL(url.trim());
        const host = parsed.hostname.toLowerCase();

        if (
            host.includes("youtube.com") ||
            host.includes("youtu.be") ||
            host.includes("youtube-nocookie.com")
        ) {
            return "youtube";
        }

        if (host.includes("instagram.com") || host.includes("instagr.am")) {
            return "instagram";
        }

        if (
            host.includes("facebook.com") ||
            host.includes("fb.watch") ||
            host.includes("fb.com")
        ) {
            return "facebook";
        }

        return "unknown";
    } catch {
        return "unknown";
    }
}

export function getPlatformMeta(platform: Platform) {
    const map: Record<
        Platform,
        { name: string; color: string; bgClass: string; iconColor: string }
    > = {
        youtube: {
            name: "YouTube",
            color: "#FF0000",
            bgClass: "bg-red-500/10 dark:bg-red-500/20",
            iconColor: "text-red-500",
        },
        instagram: {
            name: "Instagram",
            color: "#E4405F",
            bgClass: "bg-pink-500/10 dark:bg-pink-500/20",
            iconColor: "text-pink-500",
        },
        facebook: {
            name: "Facebook",
            color: "#1877F2",
            bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
            iconColor: "text-blue-500",
        },
        unknown: {
            name: "Unknown",
            color: "#6B7280",
            bgClass: "bg-gray-500/10",
            iconColor: "text-gray-500",
        },
    };
    return map[platform];
}
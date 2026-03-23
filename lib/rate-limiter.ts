interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "15", 10);

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        const resetAt = now + WINDOW_MS;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: MAX_REQUESTS - 1, limit: MAX_REQUESTS, resetAt };
    }

    if (entry.count < MAX_REQUESTS) {
        entry.count += 1;
        return {
            allowed: true,
            remaining: MAX_REQUESTS - entry.count,
            limit: MAX_REQUESTS,
            resetAt: entry.resetAt,
        };
    }

    return {
        allowed: false,
        remaining: 0,
        limit: MAX_REQUESTS,
        resetAt: entry.resetAt,
    };
}

export function getClientKey(headers: Headers): string {
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headers.get("x-real-ip") ??
        "anonymous"
    );
}
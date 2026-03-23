/**
 * Temp file & job store manager.
 *
 * Handles creation of temp directories, tracking of
 * download/conversion jobs, and automatic cleanup of
 * expired temp files.
 */

import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

// ─── Configuration ───────────────────────────────────────────────
const TEMP_ROOT = path.join(process.cwd(), "tmp", "mediagrab");
const FILE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── In-memory job store ─────────────────────────────────────────
export interface StoredJob {
    id: string;
    filePath: string;
    fileName: string;
    contentType: string;
    createdAt: number;
}

const jobStore = new Map<string, StoredJob>();

// ─── Public helpers ──────────────────────────────────────────────

/** Make sure the temp directory tree exists */
export async function ensureTempDir(): Promise<string> {
    await fs.mkdir(TEMP_ROOT, { recursive: true });
    return TEMP_ROOT;
}

/** Return an absolute path inside the temp dir */
export function getTempPath(filename: string): string {
    return path.join(TEMP_ROOT, filename);
}

/** Save a job reference so the download endpoint can find it later */
export function storeJob(job: StoredJob): void {
    jobStore.set(job.id, job);
}

/** Retrieve a stored job by ID */
export function getJob(id: string): StoredJob | undefined {
    return jobStore.get(id);
}

/** Delete a stored job and its file */
export async function removeJob(id: string): Promise<void> {
    const job = jobStore.get(id);
    if (job) {
        try {
            await fs.unlink(job.filePath);
        } catch {
            // file may already be gone — ignore
        }
        jobStore.delete(id);
    }
}

/**
 * Delete temp files older than FILE_TTL_MS.
 * Called automatically from API routes to keep disk usage low.
 */
export async function cleanupExpiredFiles(): Promise<void> {
    const now = Date.now();

    // Clean job store entries
    for (const [id, job] of jobStore.entries()) {
        if (now - job.createdAt > FILE_TTL_MS) {
            try {
                await fs.unlink(job.filePath);
            } catch {
                /* ignore */
            }
            jobStore.delete(id);
        }
    }

    // Also sweep any orphan files in the temp dir
    if (!existsSync(TEMP_ROOT)) return;

    try {
        const files = await fs.readdir(TEMP_ROOT);
        for (const file of files) {
            const fullPath = path.join(TEMP_ROOT, file);
            try {
                const stat = await fs.stat(fullPath);
                if (now - stat.mtimeMs > FILE_TTL_MS) {
                    await fs.unlink(fullPath);
                }
            } catch {
                /* ignore */
            }
        }
    } catch {
        /* ignore */
    }
}

/** Get file size in bytes (returns 0 if file doesn't exist) */
export async function getFileSize(filePath: string): Promise<number> {
    try {
        const stat = await fs.stat(filePath);
        return stat.size;
    } catch {
        return 0;
    }
}
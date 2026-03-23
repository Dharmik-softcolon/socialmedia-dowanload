"use client";

import { useState, useCallback } from "react";
import type { MediaInfo, ConversionJob, ApiResponse } from "@/lib/types";

export function useMediaProcessor() {
    const [loading, setLoading] = useState(false);
    const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
    const [conversionJob, setConversionJob] = useState<ConversionJob | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    const processUrl = useCallback(async (url: string) => {
        setLoading(true);
        setError(null);
        setMediaInfo(null);

        try {
            const res = await fetch("/api/process-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const json: ApiResponse<MediaInfo> = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error ?? "Failed to process URL.");
            }

            setMediaInfo(json.data!);
            return json.data!;
        } catch (err: any) {
            const msg = err.message ?? "Something went wrong.";
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadAndConvert = useCallback(
        async (file: File, onProgress?: (pct: number) => void) => {
            setLoading(true);
            setError(null);
            setConversionJob(null);

            try {
                const formData = new FormData();
                formData.append("file", file);

                const result = await new Promise<ConversionJob>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            const pct = Math.round((e.loaded / e.total) * 100);
                            onProgress?.(pct);

                            setConversionJob((prev) => ({
                                ...(prev ?? {
                                    id: "",
                                    fileName: file.name,
                                    originalSize: "",
                                    status: "uploading" as const,
                                    progress: 0,
                                }),
                                status: "uploading",
                                progress: pct,
                            }));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const json: ApiResponse<ConversionJob> = JSON.parse(
                                xhr.responseText
                            );
                            if (json.success && json.data) {
                                resolve(json.data);
                            } else {
                                reject(new Error(json.error ?? "Conversion failed."));
                            }
                        } else {
                            try {
                                const json = JSON.parse(xhr.responseText);
                                reject(new Error(json.error ?? `Server error: ${xhr.status}`));
                            } catch {
                                reject(new Error(`Server error: ${xhr.status}`));
                            }
                        }
                    });

                    xhr.addEventListener("error", () =>
                        reject(new Error("Network error during upload."))
                    );

                    xhr.open("POST", "/api/upload-convert");
                    xhr.send(formData);
                });

                setConversionJob(result);
                return result;
            } catch (err: any) {
                const msg = err.message ?? "Conversion failed.";
                setError(msg);
                setConversionJob((prev) =>
                    prev
                        ? { ...prev, status: "error", error: msg }
                        : {
                            id: "",
                            fileName: file.name,
                            originalSize: "",
                            status: "error",
                            progress: 0,
                            error: msg,
                        }
                );
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setLoading(false);
        setMediaInfo(null);
        setConversionJob(null);
        setError(null);
    }, []);

    return {
        loading,
        mediaInfo,
        conversionJob,
        error,
        processUrl,
        uploadAndConvert,
        reset,
    };
}
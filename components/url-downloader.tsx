"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaResult } from "@/components/result-display";
import { Loader, Skeleton } from "@/components/ui/loader";
import { useMediaProcessor } from "@/hooks/use-media-processor";
import { useToast } from "@/hooks/use-toast";
import { getUrlError } from "@/lib/validators";
import { detectPlatform, getPlatformMeta } from "@/lib/platform-detector";
import { Link2, Search, X, Youtube, Instagram, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

const platformIcons: Record<string, React.ReactNode> = {
    youtube: <Youtube className="h-4 w-4 text-red-500" />,
    instagram: <Instagram className="h-4 w-4 text-pink-500" />,
    facebook: <Facebook className="h-4 w-4 text-blue-500" />,
};

export function UrlDownloader() {
    const [url, setUrl] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);
    const { loading, mediaInfo, error, processUrl, reset } = useMediaProcessor();
    const toast = useToast();

    const detectedPlatform = url.trim() ? detectPlatform(url) : null;
    const platformMeta =
        detectedPlatform && detectedPlatform !== "unknown"
            ? getPlatformMeta(detectedPlatform)
            : null;

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setInputError(null);

            const validationError = getUrlError(url);
            if (validationError) {
                setInputError(validationError);
                return;
            }

            try {
                await processUrl(url);
                toast.success("Media info loaded successfully!");
            } catch (err: any) {
                toast.error(err.message ?? "Failed to process URL.");
            }
        },
        [url, processUrl, toast]
    );

    const handleClear = () => {
        setUrl("");
        setInputError(null);
        reset();
    };

    return (
        <div className="w-full space-y-6">
            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Input
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            if (inputError) setInputError(null);
                        }}
                        placeholder="Paste a YouTube, Instagram, or Facebook URL…"
                        icon={<Link2 className="h-4.5 w-4.5" />}
                        error={inputError ?? undefined}
                        disabled={loading}
                        className="pr-24"
                    />

                    {/* Platform indicator */}
                    {platformMeta && !loading && (
                        <div
                            className={cn(
                                "absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all",
                                platformMeta.bgClass,
                                platformMeta.iconColor
                            )}
                        >
                            {detectedPlatform && platformIcons[detectedPlatform]}
                            {platformMeta.name}
                        </div>
                    )}

                    {/* Clear button */}
                    {url && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    loading={loading}
                    icon={<Search className="h-4.5 w-4.5" />}
                >
                    {loading ? "Processing…" : "Fetch Media"}
                </Button>
            </form>

            {/* Supported platforms hint */}
            {!mediaInfo && !loading && (
                <div className="flex items-center justify-center gap-4 py-2">
                    {[
                        { icon: <Youtube className="h-5 w-5" />, color: "text-red-500/60 hover:text-red-500" },
                        {
                            icon: <Instagram className="h-5 w-5" />,
                            color: "text-pink-500/60 hover:text-pink-500",
                        },
                        {
                            icon: <Facebook className="h-5 w-5" />,
                            color: "text-blue-500/60 hover:text-blue-500",
                        },
                    ].map((p, i) => (
                        <div
                            key={i}
                            className={cn("transition-colors cursor-default", p.color)}
                        >
                            {p.icon}
                        </div>
                    ))}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-4 rounded-2xl border border-border p-6">
                        <Skeleton className="w-full md:w-72 aspect-video rounded-xl" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-3 pt-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>
                    <Loader text="Fetching media information…" className="py-4" />
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 text-center animate-fade-in">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleClear}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Result */}
            {mediaInfo && !loading && <MediaResult mediaInfo={mediaInfo} />}
        </div>
    );
}
"use client";

import React from "react";
import Image from "next/image";
import { MediaInfo, ConversionJob } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Loader } from "@/components/ui/loader";
import { getPlatformMeta } from "@/lib/platform-detector";
import { useToast } from "@/hooks/use-toast";
import {
    Download,
    Music,
    Video,
    Clock,
    Eye,
    User,
    Calendar,
    CheckCircle2,
    AlertCircle,
    FileAudio,
    HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ----- URL Result Display ----- */

interface MediaResultProps {
    mediaInfo: MediaInfo;
}

export function MediaResult({ mediaInfo }: MediaResultProps) {
    const toast = useToast();
    const platform = getPlatformMeta(mediaInfo.platform);

    const handleDownload = (url: string, label: string) => {
        toast.success(`Starting download: ${label}`);
        // In production, open a real download link
        window.open(url, "_blank");
    };

    return (
        <div className="w-full space-y-6 animate-slide-up">
            {/* Video Info Card */}
            <Card className="overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Thumbnail */}
                    <div className="relative w-full md:w-72 aspect-video md:aspect-auto md:h-44 rounded-xl overflow-hidden shrink-0 bg-muted">
                        <Image
                            src={mediaInfo.thumbnail}
                            alt={mediaInfo.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 288px"
                        />
                        {/* Duration overlay */}
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md font-medium">
                            {mediaInfo.duration}
                        </div>
                        {/* Platform badge */}
                        <div className="absolute top-2 left-2">
                            <Badge className={cn(platform.bgClass, platform.iconColor, "text-xs font-semibold")}>
                                {platform.name}
                            </Badge>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold leading-snug mb-2 line-clamp-2">
                            {mediaInfo.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {mediaInfo.description}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                  {mediaInfo.author}
              </span>
                            <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                                {mediaInfo.viewCount}
              </span>
                            <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                                {mediaInfo.uploadDate}
              </span>
                            <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                                {mediaInfo.duration}
              </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Video Formats */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Video className="h-4.5 w-4.5 text-primary" />
                    <h4 className="font-semibold text-sm">Video Formats</h4>
                </div>
                <div className="grid gap-2">
                    {mediaInfo.videoFormats.map((fmt) => (
                        <Card
                            key={fmt.id}
                            className="flex items-center justify-between p-4 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {fmt.quality}
                                </Badge>
                                <div className="hidden sm:block">
                  <span className="text-xs text-muted-foreground">
                    {fmt.resolution} • {fmt.format.toUpperCase()} • {fmt.fps}fps
                  </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {fmt.fileSize}
                </span>
                                <Button
                                    size="sm"
                                    variant="gradient"
                                    icon={<Download className="h-3.5 w-3.5" />}
                                    onClick={() =>
                                        handleDownload(fmt.url, `${fmt.quality} ${fmt.format}`)
                                    }
                                >
                                    Download
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Audio Formats */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Music className="h-4.5 w-4.5 text-primary" />
                    <h4 className="font-semibold text-sm">Audio (MP3)</h4>
                </div>
                <div className="grid gap-2">
                    {mediaInfo.audioFormats.map((fmt) => (
                        <Card
                            key={fmt.id}
                            className="flex items-center justify-between p-4 hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <Badge variant="default" className="font-mono text-xs">
                                    {fmt.quality}
                                </Badge>
                                <div className="hidden sm:block">
                  <span className="text-xs text-muted-foreground">
                    MP3 • {fmt.duration}
                  </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {fmt.fileSize}
                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<Download className="h-3.5 w-3.5" />}
                                    onClick={() => handleDownload(fmt.url, `MP3 ${fmt.quality}`)}
                                >
                                    Download
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ----- Conversion Job Result Display ----- */

interface ConversionResultProps {
    job: ConversionJob;
}

export function ConversionResult({ job }: ConversionResultProps) {
    const toast = useToast();

    const handleDownload = () => {
        if (job.result?.url) {
            toast.success("Starting download…");
            window.open(job.result.url, "_blank");
        }
    };

    return (
        <div className="w-full animate-slide-up">
            <Card className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                    <div
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                            job.status === "completed"
                                ? "bg-emerald-500/10"
                                : job.status === "error"
                                    ? "bg-destructive/10"
                                    : "bg-primary/10"
                        )}
                    >
                        {job.status === "completed" ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : job.status === "error" ? (
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        ) : (
                            <Loader size="sm" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{job.fileName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Original: {job.originalSize}
                        </p>
                    </div>
                    <Badge
                        variant={
                            job.status === "completed"
                                ? "success"
                                : job.status === "error"
                                    ? "destructive"
                                    : "default"
                        }
                    >
                        {job.status === "uploading"
                            ? "Uploading…"
                            : job.status === "processing"
                                ? "Converting…"
                                : job.status === "completed"
                                    ? "Complete"
                                    : "Error"}
                    </Badge>
                </div>

                {/* Progress bar for active jobs */}
                {(job.status === "uploading" || job.status === "processing") && (
                    <ProgressBar value={job.progress} className="mb-4" />
                )}

                {/* Error message */}
                {job.status === "error" && job.error && (
                    <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 mb-4">
                        <p className="text-sm text-destructive">{job.error}</p>
                    </div>
                )}

                {/* Completed result */}
                {job.status === "completed" && job.result && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    icon: <FileAudio className="h-4 w-4" />,
                                    label: "Format",
                                    value: "MP3",
                                },
                                {
                                    icon: <HardDrive className="h-4 w-4" />,
                                    label: "Size",
                                    value: job.result.fileSize,
                                },
                                {
                                    icon: <Clock className="h-4 w-4" />,
                                    label: "Duration",
                                    value: job.result.duration,
                                },
                                {
                                    icon: <Music className="h-4 w-4" />,
                                    label: "Bitrate",
                                    value: job.result.bitrate,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl bg-muted p-3 text-center"
                                >
                                    <div className="flex justify-center mb-1 text-muted-foreground">
                                        {item.icon}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        {item.label}
                                    </p>
                                    <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="gradient"
                            size="lg"
                            className="w-full"
                            icon={<Download className="h-4.5 w-4.5" />}
                            onClick={handleDownload}
                        >
                            Download MP3
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
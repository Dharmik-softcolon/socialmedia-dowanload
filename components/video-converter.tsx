"use client";

import React, { useState, useCallback } from "react";
import { FileUploader } from "@/components/ui/file-uploader";
import { Button } from "@/components/ui/button";
import { ConversionResult } from "@/components/result-display";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Loader } from "@/components/ui/loader";
import { useMediaProcessor } from "@/hooks/use-media-processor";
import { useToast } from "@/hooks/use-toast";
import { Wand2, RotateCcw } from "lucide-react";

export function VideoConverter() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { loading, conversionJob, error, uploadAndConvert, reset } =
        useMediaProcessor();
    const toast = useToast();

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        setUploadProgress(0);
    }, []);

    const handleConvert = useCallback(async () => {
        if (!selectedFile) {
            toast.error("Please select a video file first.");
            return;
        }

        try {
            await uploadAndConvert(selectedFile, (pct) => setUploadProgress(pct));
            toast.success("Conversion completed successfully!");
        } catch (err: any) {
            toast.error(err.message ?? "Conversion failed.");
        }
    }, [selectedFile, uploadAndConvert, toast]);

    const handleReset = () => {
        setSelectedFile(null);
        setUploadProgress(0);
        reset();
    };

    return (
        <div className="w-full space-y-6">
            {/* File Uploader */}
            <FileUploader
                onFileSelect={handleFileSelect}
                disabled={loading}
            />

            {/* Convert button */}
            {selectedFile && !conversionJob && (
                <Button
                    variant="gradient"
                    size="lg"
                    className="w-full animate-fade-in"
                    loading={loading}
                    icon={<Wand2 className="h-4.5 w-4.5" />}
                    onClick={handleConvert}
                >
                    {loading ? "Converting…" : "Convert to MP3"}
                </Button>
            )}

            {/* Upload progress (shown while uploading) */}
            {loading && conversionJob?.status === "uploading" && (
                <div className="space-y-3 animate-fade-in">
                    <ProgressBar value={uploadProgress} />
                    <Loader size="sm" text="Uploading file…" />
                </div>
            )}

            {/* Processing state */}
            {loading && conversionJob?.status === "processing" && (
                <div className="space-y-3 animate-fade-in">
                    <ProgressBar value={conversionJob.progress} />
                    <Loader size="sm" text="Converting to MP3…" />
                </div>
            )}

            {/* Conversion Result */}
            {conversionJob &&
                (conversionJob.status === "completed" ||
                    conversionJob.status === "error") && (
                    <div className="space-y-4">
                        <ConversionResult job={conversionJob} />
                        <Button
                            variant="outline"
                            size="md"
                            className="w-full"
                            icon={<RotateCcw className="h-4 w-4" />}
                            onClick={handleReset}
                        >
                            Convert Another File
                        </Button>
                    </div>
                )}

            {/* Error (standalone) */}
            {error && !conversionJob && !loading && (
                <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 text-center animate-fade-in">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleReset}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Hints */}
            {!selectedFile && !loading && !conversionJob && (
                <div className="text-center py-4 animate-fade-in">
                    <p className="text-sm text-muted-foreground">
                        Upload a video file and we&apos;ll extract the audio as a high-quality MP3.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supported: MP4, MOV, AVI, WebM, MKV • Max 50 MB
                    </p>
                </div>
            )}
        </div>
    );
}
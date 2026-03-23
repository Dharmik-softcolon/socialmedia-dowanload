"use client";

import React, { useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, File, X } from "lucide-react";
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_SIZE } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { validateUploadedFile } from "@/lib/validators";

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
    className?: string;
}

export function FileUploader({ onFileSelect, disabled, className }: FileUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            setError(null);
            const validation = validateUploadedFile(file);
            if (!validation.valid) {
                setError(validation.error!);
                return;
            }
            setSelectedFile(file);
            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);
            if (disabled) return;
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [disabled, handleFile]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const clearFile = () => {
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer",
                    dragActive
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    selectedFile && "border-primary/50 bg-primary/5"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_EXTENSIONS.join(",")}
                    onChange={handleChange}
                    disabled={disabled}
                    className="hidden"
                />

                {selectedFile ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <File className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatBytes(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearFile();
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className={cn(
                                "flex h-16 w-16 items-center justify-center rounded-2xl mb-4 transition-colors",
                                dragActive ? "bg-primary/20" : "bg-muted"
                            )}
                        >
                            <UploadCloud
                                className={cn(
                                    "h-8 w-8 transition-colors",
                                    dragActive ? "text-primary" : "text-muted-foreground"
                                )}
                            />
                        </div>
                        <p className="text-sm font-medium mb-1">
                            {dragActive ? "Drop your file here" : "Drag & drop a video file here"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            or <span className="text-primary underline">browse files</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            MP4, MOV, AVI, WebM, MKV — Max {formatBytes(MAX_UPLOAD_SIZE)}
                        </p>
                    </>
                )}
            </div>

            {error && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{error}</p>
            )}
        </div>
    );
}
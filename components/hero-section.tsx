"use client";

import { Download, Zap, Shield, Smartphone } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16 overflow-hidden">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-4xl text-center px-4 sm:px-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
                    <Zap className="h-3.5 w-3.5" />
                    Fast, Free & No Watermarks
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
                    Download & Convert{" "}
                    <span className="gradient-text">Media</span>{" "}
                    From Anywhere
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
                    Grab videos from YouTube, Instagram & Facebook. Extract audio to MP3.
                    Convert uploaded videos — all in one place.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
                    {[
                        { icon: <Download className="h-3.5 w-3.5" />, label: "Multiple Formats" },
                        { icon: <Shield className="h-3.5 w-3.5" />, label: "Secure & Private" },
                        { icon: <Smartphone className="h-3.5 w-3.5" />, label: "Works on Mobile" },
                        { icon: <Zap className="h-3.5 w-3.5" />, label: "Lightning Fast" },
                    ].map((pill) => (
                        <div
                            key={pill.label}
                            className="flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
                        >
                            {pill.icon}
                            {pill.label}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
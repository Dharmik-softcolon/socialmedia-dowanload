import {
    Video,
    Music,
    FileAudio,
    Globe,
    Gauge,
    ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
    {
        icon: <Video className="h-6 w-6" />,
        title: "Video Downloads",
        description: "Download videos in multiple resolutions from 360p up to 4K with original quality.",
    },
    {
        icon: <Music className="h-6 w-6" />,
        title: "Audio Extraction",
        description: "Extract MP3 audio from any video URL with selectable bitrate quality.",
    },
    {
        icon: <FileAudio className="h-6 w-6" />,
        title: "File Conversion",
        description: "Upload your own video files and convert them to MP3 format instantly.",
    },
    {
        icon: <Globe className="h-6 w-6" />,
        title: "Multi-Platform",
        description: "Supports YouTube, Instagram, and Facebook with automatic platform detection.",
    },
    {
        icon: <Gauge className="h-6 w-6" />,
        title: "Blazing Fast",
        description: "Optimized processing pipeline delivers results in seconds, not minutes.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6" />,
        title: "Safe & Secure",
        description: "No data stored on our servers. Your files are processed and delivered instantly.",
    },
];

export function FeaturesSection() {
    return (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                    Everything You Need
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    A complete toolkit for downloading and converting media from your favorite platforms.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map((feature, i) => (
                    <Card
                        key={feature.title}
                        className="group hover:-translate-y-1 cursor-default animate-slide-up"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </Card>
                ))}
            </div>
        </section>
    );
}
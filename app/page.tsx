"use client";

import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { UrlDownloader } from "@/components/url-downloader";
import { VideoConverter } from "@/components/video-converter";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Link2, FileVideo } from "lucide-react";

const toolTabs = [
    {
        id: "download",
        label: "Download from URL",
        icon: <Link2 className="h-4 w-4" />,
    },
    {
        id: "convert",
        label: "Convert Video to MP3",
        icon: <FileVideo className="h-4 w-4" />,
    },
];

export default function HomePage() {
    return (
        <>
            <HeroSection />

            {/* Main Tool Section */}
            <section className="mx-auto max-w-2xl px-4 sm:px-6 -mt-2 relative z-10">
                <Card glass className="p-6 sm:p-8">
                    <Tabs tabs={toolTabs} defaultTab="download">
                        {(activeTab) => (
                            <>
                                {activeTab === "download" && <UrlDownloader />}
                                {activeTab === "convert" && <VideoConverter />}
                            </>
                        )}
                    </Tabs>
                </Card>
            </section>

            <FeaturesSection />
        </>
    );
}
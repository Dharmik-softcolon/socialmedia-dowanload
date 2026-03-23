import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
    title: `${APP_NAME} — Download & Convert Media`,
    description: APP_DESCRIPTION,
    keywords: [
        "video downloader",
        "youtube downloader",
        "instagram downloader",
        "facebook downloader",
        "mp3 converter",
        "video to mp3",
    ],
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
        </ThemeProvider>
        </body>
        </html>
    );
}
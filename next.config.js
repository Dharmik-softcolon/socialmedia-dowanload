/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "i.ytimg.com" },
            { protocol: "https", hostname: "i9.ytimg.com" },
            { protocol: "https", hostname: "*.ytimg.com" },
            { protocol: "https", hostname: "scontent.cdninstagram.com" },
            { protocol: "https", hostname: "*.fbcdn.net" },
            { protocol: "https", hostname: "*.cdninstagram.com" },
            { protocol: "https", hostname: "picsum.photos" },
            { protocol: "https", hostname: "*.googleusercontent.com" },
            { protocol: "https", hostname: "*.ggpht.com" },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb",
        },
    },
};

export default nextConfig;
import { cn } from "@/lib/utils";

interface LoaderProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}

const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
};

export function Loader({ size = "md", className, text }: LoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className="relative">
                <div
                    className={cn(
                        "rounded-full border-2 border-muted animate-spin",
                        sizeMap[size]
                    )}
                    style={{ borderTopColor: "hsl(var(--primary))" }}
                />
                {/* Pulse ring */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse_ring",
                        sizeMap[size]
                    )}
                />
            </div>
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
            )}
        </div>
    );
}

/** Skeleton block for loading states */
export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-lg bg-muted animate-pulse",
                className
            )}
        />
    );
}
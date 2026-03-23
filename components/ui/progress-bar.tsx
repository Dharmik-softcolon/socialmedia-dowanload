import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number; // 0-100
    className?: string;
    showLabel?: boolean;
    size?: "sm" | "md";
}

export function ProgressBar({
                                value,
                                className,
                                showLabel = true,
                                size = "md",
                            }: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-medium">{clamped}%</span>
                </div>
            )}
            <div
                className={cn(
                    "w-full rounded-full bg-muted overflow-hidden",
                    size === "sm" ? "h-1.5" : "h-2.5"
                )}
            >
                <div
                    className="h-full rounded-full gradient-bg transition-all duration-500 ease-out"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}
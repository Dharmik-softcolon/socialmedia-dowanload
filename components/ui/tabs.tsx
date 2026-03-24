"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    children: (activeTab: string) => React.ReactNode;
    className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, children, className }: TabsProps) {
    const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

    function handleChange(id: string) {
        setActive(id);
        onChange?.(id);
    }

    return (
        <div className={cn("w-full", className)}>
            {/* Tab bar */}
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleChange(tab.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 py-2 sm:px-4 sm:py-2.5 text-[13px] sm:text-sm font-medium transition-all duration-200",
                            active === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.icon}
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-fade-in" key={active}>
                {children(active)}
            </div>
        </div>
    );
}
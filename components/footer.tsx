import { APP_NAME } from "@/lib/constants";
import { Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border mt-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        Made with{" "}
                        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 mx-0.5" />{" "}
                        for creators everywhere
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="#"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Privacy
                        </a>
                        <a
                            href="#"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Terms
                        </a>
                        <a
                            href="#"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
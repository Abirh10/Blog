import React from "react";

function Logo({ variant = "full", className = "" }) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-ink"
            >
                AH
            </span>
            {variant === "full" && (
                <span className="font-display text-[1.05rem] font-semibold leading-none text-ink whitespace-nowrap">
                    About Abir Hirani
                </span>
            )}
        </span>
    );
}

export default Logo;

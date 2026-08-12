// Pure-CSS infinite marquee (content is duplicated once, track scrolls -50%
// then loops). No animation library needed. `pauseOnHover` only matters on
// devices with a real pointer — touch users can't "hover" so it never gets
// stuck for them.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
    children: ReactNode;
    className?: string;
    pauseOnHover?: boolean;
    durationSeconds?: number;
}

export function Marquee({ children, className, pauseOnHover = false, durationSeconds = 20 }: MarqueeProps) {
    return (
        <div
            className={cn("overflow-hidden", pauseOnHover && "marquee-pause-on-hover", className)}
            style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
        >
            <div className="marquee-track flex w-max items-center gap-6">
                <div className="flex shrink-0 items-center gap-6">{children}</div>
                <div className="flex shrink-0 items-center gap-6" aria-hidden="true">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Marquee;

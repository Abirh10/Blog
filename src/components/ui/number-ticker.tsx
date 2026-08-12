// Lightweight count-up on mount/visibility. Inspired by the same effect in
// shivy02/portfolio-website, reimplemented with a plain requestAnimationFrame
// easing instead of framer-motion, since that's the only place this repo
// would otherwise need the dependency.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const easeOutQuad = (t: number) => t * (2 - t);

interface NumberTickerProps {
    value: number;
    duration?: number;
    className?: string;
}

export function NumberTicker({ value, duration = 1200, className }: NumberTickerProps) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const animate = () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;
            const start = performance.now();
            const tick = (now: number) => {
                const progress = Math.min(1, (now - start) / duration);
                setDisplay(Math.round(value * easeOutQuad(progress)));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) animate();
            },
            { threshold: 0.4 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [value, duration]);

    return (
        <span ref={ref} className={cn("tabular-nums", className)}>
            {display.toLocaleString()}
        </span>
    );
}

export default NumberTicker;

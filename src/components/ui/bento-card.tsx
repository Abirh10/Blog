// The reusable "GridItem" card from the reference bento dashboard — icon +
// title header, a cursor-following glow (see .bento-glow in index.css; pure
// CSS + one mousemove handler instead of the reference's Radix/motion-based
// GlowingEffect, since this doesn't need that much machinery), and a slot
// for whatever content each card needs.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    area?: string;
    className?: string;
    tooltip?: string;
}

export function BentoCard({ icon, title, children, area, className, tooltip }: BentoCardProps) {
    const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    return (
        <div
            style={area ? { gridArea: area } : undefined}
            title={tooltip}
            onMouseMove={handleMouseMove}
            className={cn(
                "bento-glow flex h-full min-h-[9rem] flex-col gap-3 overflow-hidden rounded-2xl border border-border-soft bg-paper-elevated p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 sm:p-5",
                className,
            )}
        >
            <div className="flex items-center gap-2.5 text-ink-muted">
                <span className="text-accent">{icon}</span>
                <h3 className="text-sm font-semibold text-ink sm:text-base">{title}</h3>
            </div>
            <div className="flex flex-1 flex-col">{children}</div>
        </div>
    );
}

export default BentoCard;

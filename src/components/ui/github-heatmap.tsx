// Adapted from shivy02/portfolio-website's github-heatmap.tsx (Apache-2.0
// licensed source): same staggered-reveal-on-load effect and 5-level green
// scale, reimplemented without the Radix tooltip dependency (native `title`
// attribute instead — one less package for a single small feature) and
// pulling data from useDashboardData/useGithubActivity instead of a
// Next.js API route.
import { useEffect, useMemo, useState } from "react";

export type Contribution = { date: string; level: number };

const LEVEL_CLASSES = [
    "bg-surface",
    "bg-green-900/70 dark:bg-green-900/70",
    "bg-green-700/80",
    "bg-green-500/90",
    "bg-green-400",
];

function formatDate(dateString: string) {
    const date = new Date(`${dateString}T12:00:00Z`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

interface GitHubHeatmapProps {
    contributions: Contribution[];
}

export function GitHubHeatmap({ contributions }: GitHubHeatmapProps) {
    const [revealed, setRevealed] = useState<Set<number>>(new Set());

    const weeks = useMemo(() => {
        const chunks: Contribution[][] = [];
        for (let i = 0; i < contributions.length; i += 7) {
            chunks.push(contributions.slice(i, i + 7));
        }
        return chunks;
    }, [contributions]);

    useEffect(() => {
        setRevealed(new Set());
        if (contributions.length === 0) return;

        const indices = Array.from({ length: contributions.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const timers = indices.map((index, sequence) =>
            setTimeout(() => setRevealed((prev) => new Set(prev).add(index)), sequence * 12),
        );
        return () => timers.forEach(clearTimeout);
    }, [contributions]);

    if (contributions.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center text-xs text-ink-muted">
                No activity data yet
            </div>
        );
    }

    let flatIndex = 0;

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day) => {
                            const index = flatIndex++;
                            const isRevealed = revealed.has(index);
                            const level = isRevealed ? day.level : 0;
                            return (
                                <div
                                    key={day.date}
                                    title={`${formatDate(day.date)}`}
                                    className={`h-3 w-3 rounded-[2px] transition-all duration-300 ${LEVEL_CLASSES[level]}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GitHubHeatmap;

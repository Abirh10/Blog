// ARCHIVED, not currently used — kept as a rollback option. The active
// globe at ./globe.tsx is now a simpler CSS rotating-earth version. This
// file is the earlier cobe-based (real WebGL sphere with a genuine lat/lng
// arc between two points) implementation; it worked and was reasonably
// well debugged, so it's kept here rather than deleted in case a real
// geographic arc is wanted again later. Not imported anywhere right now.
//
// Dot-matrix globe with a flight arc between two points, built on cobe.
// The reference (shivy02/portfolio-website) pins an older cobe (0.6.x) that
// has no native arc support, so it hand-rolls a second overlay canvas with
// its own great-circle projection math to draw the flight path. The version
// installed here is cobe 2.x, which added `arcs` as a first-class option —
// so that whole overlay is unnecessary; this just uses the real API.
import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// cobe's shipped .d.ts omits `onRender` even though it's a real, documented
// runtime option (see node_modules/cobe/README.md) — this fills the gap
// rather than reaching for `as any` everywhere it's used.
type CobeOptions = COBEOptions & { onRender: (state: Record<string, unknown>) => void };

const AUTO_ROTATE_SPEED = 0.0035;
const DRAG_DAMPING = 1400;

export type GlobeMarker = { lat: number; lng: number; color: string; label?: string };

function hexToRgb01(hex: string): [number, number, number] {
    const n = parseInt(hex.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

interface GlobeProps {
    className?: string;
    from: GlobeMarker;
    to: GlobeMarker;
}

export function Globe({ className, from, to }: GlobeProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerDown = useRef<number | null>(null);
    const rotation = useRef(0);
    const dragVelocity = useRef(0);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;

        let phi = 0;
        // Real (non-zero) width, filled in by the ResizeObserver below before
        // the globe is ever created. A single width===0 measurement at mount
        // (which the previous window-`resize`-only approach was prone to,
        // since layout can still be settling right after mount — fonts
        // loading, the CSS grid not yet resolved) used to produce a
        // degenerate, invisible globe that never recovered because nothing
        // but a browser resize would re-measure it.
        let width = 0;
        let globe: ReturnType<typeof createGlobe> | null = null;
        let destroyed = false;

        const createOrResize = () => {
            if (destroyed || width === 0) return;

            if (!globe) {
                try {
                    globe = createGlobe(canvas, {
                        width: width * 2,
                        height: width * 2,
                        phi: 0,
                        theta: 0.4,
                        // Low dark/high diffuse keeps the sphere lit all the
                        // way around instead of half-lost in a near-black
                        // night side against the card's already-dark
                        // background — not going for a realistic day/night
                        // terminator, just a globe you can actually see.
                        //
                        // Note: cobe's world-map texture loads asynchronously
                        // from an embedded data URI (see node_modules/cobe's
                        // bundle) and is only *sampled*, not guaranteed —
                        // arcs/markers/the sphere silhouette use a separate
                        // pipeline and always render regardless. If the dot
                        // continents don't show on a given device/GPU, the
                        // sphere + arc + markers still do; these settings are
                        // tuned to look intentional either way.
                        dark: 0.4,
                        diffuse: 1.2,
                        devicePixelRatio: 2,
                        mapSamples: 4000,
                        mapBrightness: 6,
                        baseColor: [0.55, 0.5, 0.75],
                        markerColor: [1, 0.6, 0.2],
                        glowColor: [0.55, 0.45, 0.85],
                        markers: [
                            { location: [from.lat, from.lng], size: 0.05, color: hexToRgb01(from.color) },
                            { location: [to.lat, to.lng], size: 0.05, color: hexToRgb01(to.color) },
                        ],
                        arcs: [{ from: [from.lat, from.lng], to: [to.lat, to.lng], color: [1, 1, 1] }],
                        arcColor: [1, 1, 1],
                        arcWidth: 1,
                        arcHeight: 0.35,
                        markerElevation: 0.02,
                        onRender: (state) => {
                            if (pointerDown.current === null) {
                                phi += AUTO_ROTATE_SPEED;
                            } else {
                                phi += dragVelocity.current;
                                dragVelocity.current *= 0.9;
                            }
                            state.phi = phi + rotation.current;
                            state.width = width * 2;
                            state.height = width * 2;
                        },
                    } as CobeOptions);
                    requestAnimationFrame(() => {
                        canvas.style.opacity = "1";
                    });
                } catch (err) {
                    // WebGL unavailable/blocked, or cobe failed to init —
                    // fail visibly instead of leaving a dead blank canvas.
                    console.error("Globe: failed to initialize WebGL context", err);
                    setFailed(true);
                }
            } else {
                globe.update({ width: width * 2, height: width * 2 });
            }
        };

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const newWidth = entry.contentRect.width;
            if (newWidth > 0 && Math.round(newWidth) !== Math.round(width)) {
                width = newWidth;
                createOrResize();
            }
        });
        observer.observe(wrap);

        // Also measure synchronously in case ResizeObserver's first
        // callback is delayed a frame — no harm calling createOrResize()
        // twice, the `width === 0` guard makes the first call a no-op if
        // layout genuinely hasn't happened yet.
        width = wrap.offsetWidth;
        createOrResize();

        return () => {
            destroyed = true;
            observer.disconnect();
            globe?.destroy();
        };
        // from/to are treated as stable identity for the component's lifetime
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startDrag = (clientX: number) => {
        pointerDown.current = clientX;
    };
    const dragTo = (clientX: number) => {
        if (pointerDown.current === null) return;
        const delta = clientX - pointerDown.current;
        pointerDown.current = clientX;
        dragVelocity.current = delta / DRAG_DAMPING;
        rotation.current += delta / DRAG_DAMPING;
    };
    const endDrag = () => {
        pointerDown.current = null;
    };

    if (failed) {
        return (
            <div className={cn("flex aspect-square w-full max-w-[420px] items-center justify-center text-center text-sm text-ink-muted", className)}>
                Your browser blocked WebGL, so the globe can't render here.
            </div>
        );
    }

    return (
        <div ref={wrapRef} className={cn("relative mx-auto aspect-square w-full max-w-[420px]", className)}>
            <canvas
                ref={canvasRef}
                className="size-full cursor-grab opacity-0 transition-opacity duration-500 active:cursor-grabbing"
                onPointerDown={(e) => startDrag(e.clientX)}
                onPointerUp={endDrag}
                onPointerOut={endDrag}
                onMouseMove={(e) => dragTo(e.clientX)}
                onTouchMove={(e) => e.touches[0] && dragTo(e.touches[0].clientX)}
            />
        </div>
    );
}

export default Globe;

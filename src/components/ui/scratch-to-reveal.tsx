// Adapted from shivy02/portfolio-website's magicui/scratch-to-reveal.tsx
// (Apache-2.0 licensed source) — the framer-motion "wiggle" on completion is
// replaced with a plain CSS keyframe animation to avoid pulling in a new
// dependency for one effect. Pointer/touch handling is unchanged: it was
// already mobile-friendly (document-level touchmove listeners + a
// destination-out canvas erase).
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScratchToRevealProps {
    children: React.ReactNode;
    width: number;
    height: number;
    minScratchPercentage?: number;
    className?: string;
    onComplete?: () => void;
    gradientColors?: [string, string, string];
    resetKey?: string | number;
}

export const ScratchToReveal: React.FC<ScratchToRevealProps> = ({
    width,
    height,
    minScratchPercentage = 40,
    onComplete,
    children,
    className,
    gradientColors = ["#A97CF8", "#F38CB8", "#FDCC92"],
    resetKey,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScratching, setIsScratching] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);

    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        ctx.globalCompositeOperation = "source-over";
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(0.5, gradientColors[1]);
        gradient.addColorStop(1, gradientColors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
        setIsComplete(false);
        setJustCompleted(false);
        initializeCanvas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    const scratch = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
    };

    const checkCompletion = () => {
        if (isComplete) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearPixels = 0;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] === 0) clearPixels++;
        }
        const percentage = (clearPixels / (data.length / 4)) * 100;

        if (percentage >= minScratchPercentage) {
            setIsComplete(true);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setJustCompleted(true);
            onComplete?.();
        }
    };

    useEffect(() => {
        const onMove = (clientX: number, clientY: number) => {
            if (!isScratching) return;
            scratch(clientX, clientY);
        };
        const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) onMove(touch.clientX, touch.clientY);
        };
        const onUp = () => {
            setIsScratching(false);
            checkCompletion();
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove, { passive: true });
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchend", onUp);
        document.addEventListener("touchcancel", onUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("mouseup", onUp);
            document.removeEventListener("touchend", onUp);
            document.removeEventListener("touchcancel", onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScratching]);

    return (
        <div
            className={cn(
                "relative select-none touch-none",
                justCompleted && "animate-scratch-reveal",
                className,
            )}
            style={{ width, height }}
        >
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute left-0 top-0 h-full w-full cursor-pointer"
                onMouseDown={() => setIsScratching(true)}
                onTouchStart={() => setIsScratching(true)}
            />
            {children}
        </div>
    );
};

export default ScratchToReveal;

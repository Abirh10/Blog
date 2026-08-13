import { memo, useCallback, useEffect, useRef } from "react";

// 16-bit color palette (reduced color options)
const STAR_COLORS = [
  "#FFFFFF", // White
  "#FFFFAA", // Light yellow
  "#AAAAFF", // Light blue
  "#FFAAAA", // Light red
  "#AAFFAA", // Light green
  "#FFAAFF", // Light purple
  "#AAFFFF", // Light cyan
] as const;

// Configuration constants
const starDensity = 0.00004; // Reduced density for larger stars
const twinkleProbability = 0.92; // most stars twinkle
const minTwinkleSpeed = 0.6; // seconds per half-cycle — lower is livelier
const maxTwinkleSpeed = 1.7;
const twinkleDimFloor = 0.12; // how dark a twinkling star gets at its dimmest (was 0.3)
const pixelSize = 5;
const starRegenerationInterval = 5000; // Interval to regenerate stars (in ms)
const percentToRegenerate = 0.15; // Percentage of stars to regenerate at each interval

// Shooting star configuration
const shootingStarPixelSize = 2;
const targetFps = 16; // 16 FPS for that retro feel
const minShootingStarDelayMs = 500; // was 2000 — meteors now arrive much more often
const maxShootingStarDelayMs = 1800; // was 6000
const meteorShowerChance = 0.3; // chance a spawn is a multi-star burst instead of a single meteor
const meteorShowerBurstSize = [3, 6] as const; // [min, max] meteors in a burst
const meteorShowerBurstStaggerMs = 120; // delay between meteors within a burst

// How long to wait after a resize/orientation change before re-measuring the
// viewport. Mobile browsers (esp. iOS Safari) fire several resize events in a
// row as the address bar shows/hides, so this avoids thrashing star layout.
const resizeDebounceMs = 150;

// Type definitions
type BackgroundStar = {
  x: number;
  y: number;
  color: string;
  baseOpacity: number;
  currentOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleDirection: number; // -1 fading out, 1 fading in
  twinkleTimer: number;
};

type TrailPoint = {
  x: number;
  y: number;
  opacity: number;
};

type ShootingStar = {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
};

type StartPoint = {
  x: number;
  y: number;
  angle: number;
};

export interface BackgroundPixelStarsProps {
  /** Default (true): the component positions and layers itself — fixed,
   * full-viewport, behind everything (used by the /stars-demo showcase).
   * Pass false to instead fill whatever positioned parent it's placed in
   * (e.g. layered on top of another background effect) without fighting
   * that parent over z-index/positioning. */
  standalone?: boolean;
  /** Multiplies star count. 1 = the original density; use a fraction for a
   * subtler field when this is a secondary layer rather than the whole
   * background on its own. */
  density?: number;
  /** Shooting stars/meteor showers on or off — off for a calmer, "just
   * stars" look when layered under something busier (e.g. an already-bright
   * shader). */
  meteors?: boolean;
  /** Star colors to draw from. Defaults to the full 16-bit-style palette;
   * pass a narrower warm-toned set to better match a specific background. */
  palette?: readonly string[];
}

export const BackgroundPixelStars = memo(
  ({ standalone = true, density = 1, meteors = true, palette = STAR_COLORS }: BackgroundPixelStarsProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const shootingStarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // State references
    const backgroundStarsRef = useRef<BackgroundStar[]>([]);
    const shootingStarsRef = useRef<ShootingStar[]>([]);
    const lastRenderTimeRef = useRef<number>(0);
    const frameInterval: number = 1000 / targetFps;

    // Match the canvas's backing-store resolution to the device's pixel
    // ratio so stars render as crisp, solid squares on high-DPI phone
    // screens instead of being upscaled/blurred by the browser. All drawing
    // code below still works in CSS-pixel coordinates (window.innerWidth /
    // window.innerHeight) — this transform maps those to physical pixels.
    const configureCanvasSize = useCallback((): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }
    }, []);

    // Get random starting point for shooting stars
    const getRandomStartPoint = useCallback((): StartPoint => {
      // Start from anywhere along the top edge
      const x = Math.random() * window.innerWidth;

      // Randomize the angle with a wider range (45-135 degrees)
      // 90 degrees is straight down
      // 45 degrees is down-right, 135 degrees is down-left
      const angle = 45 + Math.random() * 90;

      return { x, y: 0, angle };
    }, []);

    // Create a new shooting star
    const createNewShootingStar = useCallback((): ShootingStar => {
      const { x, y, angle } = getRandomStartPoint();
      return {
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * 5 + 8,
        distance: 0,
        trail: [], // Empty trail initially
      };
    }, [getRandomStartPoint]);

    // Initialize background stars (positions are in CSS-pixel space)
    const initBackgroundStars = useCallback((): void => {
      if (!canvasRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Clear existing stars
      backgroundStarsRef.current = [];

      // Generate new stars
      const area = width * height;
      const numStars = Math.floor(area * starDensity * density);

      for (let i = 0; i < numStars; i++) {
        const shouldTwinkle = Math.random() < twinkleProbability;
        const gridX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
        const gridY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
        const colorIndex = Math.floor(Math.random() * palette.length);
        const baseOpacity = Math.random() * 0.5 + 0.5;

        backgroundStarsRef.current.push({
          x: gridX,
          y: gridY,
          color: palette[colorIndex]!,
          baseOpacity,
          currentOpacity: baseOpacity,
          twinkle: shouldTwinkle,
          twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
          twinkleDirection: -1, // -1 fading out, 1 fading in
          twinkleTimer: 0,
        });
      }
    }, []);

    // Regenerate a portion of background stars
    const regenerateBackgroundStars = useCallback((): void => {
      if (!canvasRef.current || backgroundStarsRef.current.length === 0) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const numToRegenerate = Math.max(
        1,
        Math.floor(backgroundStarsRef.current.length * percentToRegenerate),
      );

      for (let i = 0; i < numToRegenerate; i++) {
        const randomIndex = Math.floor(Math.random() * backgroundStarsRef.current.length);

        // Replace with a new star
        const shouldTwinkle = Math.random() < twinkleProbability;
        const gridX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
        const gridY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
        const colorIndex = Math.floor(Math.random() * palette.length);
        const baseOpacity = Math.random() * 0.5 + 0.5;

        backgroundStarsRef.current[randomIndex] = {
          x: gridX,
          y: gridY,
          color: palette[colorIndex]!,
          baseOpacity,
          currentOpacity: baseOpacity,
          twinkle: shouldTwinkle,
          twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
          twinkleDirection: -1,
          twinkleTimer: 0,
        };
      }
    }, []);

    // Main animation loop
    const animateCanvas = useCallback(
      (timestamp: number): void => {
        // Skip frames to limit to target FPS
        if (timestamp - lastRenderTimeRef.current < frameInterval) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        lastRenderTimeRef.current = timestamp;

        if (!canvasRef.current) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        // Clear canvas (in CSS-pixel space; ctx transform handles DPR)
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // 1. Draw and update background stars
        backgroundStarsRef.current.forEach((star) => {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.currentOpacity;
          ctx.fillRect(star.x, star.y, pixelSize, pixelSize);

          // Update twinkling
          if (star.twinkle) {
            // Update twinkle timer
            star.twinkleTimer += 1 / targetFps;

            if (star.twinkleTimer >= star.twinkleSpeed) {
              star.twinkleTimer = 0;
              star.twinkleDirection *= -1; // Reverse direction
            }

            // Calculate new opacity based on discrete steps
            const progress = star.twinkleTimer / star.twinkleSpeed;
            if (progress < 0.5) {
              star.currentOpacity =
                star.twinkleDirection < 0 ? star.baseOpacity : star.baseOpacity * twinkleDimFloor;
            } else {
              star.currentOpacity =
                star.twinkleDirection < 0 ? star.baseOpacity * twinkleDimFloor : star.baseOpacity;
            }
          }
        });

        // 2. Update shooting stars
        if (shootingStarsRef.current.length) {
          shootingStarsRef.current = shootingStarsRef.current
            .map((star) => {
              // Calculate new position
              const newX = star.x + star.speed * Math.cos((star.angle * Math.PI) / 180);
              const newY = star.y + star.speed * Math.sin((star.angle * Math.PI) / 180);
              const newDistance = star.distance + star.speed;

              // Add current position to trail
              const newTrail = [...star.trail];

              // Only add to trail every few frames for pixelated effect
              if (newDistance % 8 < star.speed) {
                newTrail.push({
                  x: star.x,
                  y: star.y,
                  opacity: 1.0,
                });
              }

              // Update trail opacity and remove old trail pieces
              const updatedTrail = newTrail
                .map((point) => ({ ...point, opacity: point.opacity - 0.1 }))
                .filter((point) => point.opacity > 0);

              return {
                ...star,
                x: newX,
                y: newY,
                distance: newDistance,
                trail: updatedTrail,
              };
            })
            .filter(
              (star) =>
                // Remove stars that are out of bounds
                star.x >= -30 &&
                star.x <= window.innerWidth + 30 &&
                star.y >= -30 &&
                star.y <= window.innerHeight + 30,
            );

          // 3. Draw shooting stars
          shootingStarsRef.current.forEach((star) => {
            // Draw trail
            star.trail.forEach((point) => {
              ctx.save();
              ctx.translate(point.x, point.y);
              ctx.rotate((star.angle * Math.PI) / 180);
              ctx.translate(-point.x, -point.y);

              ctx.fillStyle = `rgba(180, 242, 255, ${point.opacity})`;
              ctx.fillRect(point.x, point.y, shootingStarPixelSize, shootingStarPixelSize);

              ctx.restore();
            });

            // Draw star (pixelated representation)
            const starWidth = 4; // 4 pixels wide
            const starHeight = 2; // 2 pixels high

            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate((star.angle * Math.PI) / 180);
            ctx.translate(-star.x, -star.y);

            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 1.0;

            for (let y = 0; y < starHeight; y++) {
              for (let x = 0; x < starWidth; x++) {
                // Skip some pixels for pixelated look
                if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;

                ctx.fillRect(
                  star.x + x * shootingStarPixelSize,
                  star.y + y * shootingStarPixelSize,
                  shootingStarPixelSize,
                  shootingStarPixelSize,
                );
              }
            }

            ctx.restore();
          });
        }

        animationFrameRef.current = requestAnimationFrame(animateCanvas);
      },
      [frameInterval],
    );

    const stopAnimation = useCallback((): void => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, []);

    const startAnimation = useCallback((): void => {
      if (animationFrameRef.current) return; // already running
      animationFrameRef.current = requestAnimationFrame(animateCanvas);
    }, [animateCanvas]);

    // Initialize the component
    useEffect(() => {
      if (!canvasRef.current) return;

      configureCanvasSize();
      initBackgroundStars();
      startAnimation();

      // Create shooting stars periodically — most spawns are a single
      // meteor, but every so often it's a proper shower: several meteors in
      // quick succession.
      const createShootingStar = (): void => {
        const isShower = Math.random() < meteorShowerChance;
        const burstSize = isShower
          ? meteorShowerBurstSize[0] +
            Math.floor(Math.random() * (meteorShowerBurstSize[1] - meteorShowerBurstSize[0] + 1))
          : 1;

        for (let i = 0; i < burstSize; i++) {
          setTimeout(() => {
            shootingStarsRef.current = [...shootingStarsRef.current, createNewShootingStar()];
          }, i * meteorShowerBurstStaggerMs);
        }

        // Set a random delay for creating the next star/shower
        const randomDelay =
          Math.random() * (maxShootingStarDelayMs - minShootingStarDelayMs) + minShootingStarDelayMs;
        shootingStarTimeoutRef.current = setTimeout(createShootingStar, randomDelay);
      };

      // Create the first shooting star (unless meteors are off entirely)
      if (meteors) createShootingStar();

      // Set up regeneration interval for background stars
      const regenerationInterval = setInterval(regenerateBackgroundStars, starRegenerationInterval);

      // Handle window resize / orientation change (debounced — mobile
      // browsers fire this repeatedly while the address bar animates)
      const handleResize = (): void => {
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(() => {
          configureCanvasSize();
          initBackgroundStars();
        }, resizeDebounceMs);
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      // Pause the animation loop when the tab/app isn't visible (saves
      // battery on phones instead of rendering an invisible canvas at 16fps).
      const handleVisibilityChange = (): void => {
        if (document.hidden) {
          stopAnimation();
        } else {
          lastRenderTimeRef.current = 0;
          startAnimation();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup
      return () => {
        stopAnimation();
        clearInterval(regenerationInterval);
        if (shootingStarTimeoutRef.current) clearTimeout(shootingStarTimeoutRef.current);
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, [
      configureCanvasSize,
      createNewShootingStar,
      initBackgroundStars,
      regenerateBackgroundStars,
      startAnimation,
      stopAnimation,
    ]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={
          standalone
            ? "pointer-events-none fixed inset-0 -z-10 touch-none"
            : "pointer-events-none absolute inset-0 touch-none"
        }
      />
    );
  },
  () => true,
);

BackgroundPixelStars.displayName = "BackgroundPixelStars";

export default BackgroundPixelStars;

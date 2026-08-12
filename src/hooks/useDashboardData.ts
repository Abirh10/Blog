// Shared fetch helper for the three live "About Me" widgets. Each hook below
// hits the dashboard-data Appwrite Function (see functions/dashboard-data)
// via VITE_DASHBOARD_FUNCTION_URL and falls back to whatever the caller
// passes as `fallback` — the placeholder data in src/data/about-me.js — if
// the function URL isn't configured yet or the request fails for any reason
// (function not deployed, secrets not set, network hiccup, etc). The page
// should never look broken just because a widget isn't wired up yet.
import { useEffect, useState } from "react";

const FUNCTION_URL = import.meta.env.VITE_DASHBOARD_FUNCTION_URL as string | undefined;

export function useDashboardData<T>(type: "github" | "wakatime" | "spotify", fallback: T) {
    const [data, setData] = useState<T>(fallback);
    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(Boolean(FUNCTION_URL));

    useEffect(() => {
        if (!FUNCTION_URL) return;

        let cancelled = false;
        const controller = new AbortController();

        fetch(`${FUNCTION_URL}?type=${type}`, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error(`dashboard-data(${type}) returned ${res.status}`);
                return res.json();
            })
            .then((json) => {
                if (cancelled || json?.error) return;
                setData(json as T);
                setIsLive(true);
            })
            .catch(() => {
                // Silent — this widget just stays on the fallback data.
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    return { data, isLive, isLoading };
}

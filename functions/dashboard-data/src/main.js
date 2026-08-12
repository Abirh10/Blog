// Appwrite Function — proxies three "About Me" dashboard widgets so their
// secrets never reach the browser:
//   ?type=github    no secret needed (scrapes github.com's public profile
//                   contribution calendar — the same markup GitHub's own
//                   profile page renders, no auth/token required)
//   ?type=wakatime  needs WAKATIME_API_KEY (function env var)
//   ?type=spotify   needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
//                   SPOTIFY_REFRESH_TOKEN (function env vars)
//
// Deploy via the Appwrite Console (Functions -> Create Function -> Node.js
// runtime), point it at this `functions/dashboard-data` directory, set the
// entrypoint to `src/main.js`, add the env vars above under the function's
// "Variables" tab (never in the frontend .env — those ship to the browser),
// and enable a public execute domain. See functions/dashboard-data/README.md
// for the full walkthrough, including how to get a Spotify refresh token.

const GITHUB_USERNAME = "Abirh10";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

async function getGithubContributions() {
    const url = `https://github.com/users/${GITHUB_USERNAME}/contributions`;
    const response = await fetch(url, {
        headers: { "User-Agent": "about-abir-hirani-dashboard" },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const html = await response.text();

    const dayRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    const contributions = [];
    let match;
    while ((match = dayRegex.exec(html)) !== null) {
        contributions.push({ date: match[1], level: Number(match[2]) });
    }

    // The page heading reads e.g. "110\ncontributions\nin the last year" —
    // pull the number out so the frontend can derive Hours Coding / Coffees
    // Drank from real yearly activity instead of just the 49-day window
    // shown in the heatmap.
    const totalMatch = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s*contributions?/);
    const totalContributions = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : null;

    // Keep the calendar itself to the last 7 full weeks (49 days) to match
    // the bento card's compact heatmap — same window the reference
    // dashboard uses.
    const last49 = contributions.slice(-49);
    return { contributions: last49, totalContributions };
}

async function getWakaTimeStats() {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) throw new Error("WAKATIME_API_KEY is not configured");

    const auth = Buffer.from(`${apiKey}:`).toString("base64");
    const response = await fetch(
        "https://wakatime.com/api/v1/users/current/all_time_since_today",
        { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!response.ok) throw new Error(`WakaTime returned ${response.status}`);
    const json = await response.json();
    const totalSeconds = json?.data?.total_seconds ?? 0;
    return { totalHours: Math.round(totalSeconds / 3600) };
}

async function getSpotifyLastPlayed() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Spotify env vars are not configured");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    if (!tokenResponse.ok) throw new Error(`Spotify token refresh returned ${tokenResponse.status}`);
    const { access_token: accessToken } = await tokenResponse.json();

    // Prefer "currently playing"; fall back to the most recent track.
    const nowPlayingRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    let track = null;
    let isPlaying = false;

    if (nowPlayingRes.status === 200) {
        const nowPlaying = await nowPlayingRes.json();
        if (nowPlaying?.item) {
            track = nowPlaying.item;
            isPlaying = Boolean(nowPlaying.is_playing);
        }
    }

    if (!track) {
        const recentRes = await fetch(
            "https://api.spotify.com/v1/me/player/recently-played?limit=1",
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!recentRes.ok) throw new Error(`Spotify recently-played returned ${recentRes.status}`);
        const recent = await recentRes.json();
        track = recent?.items?.[0]?.track ?? null;
    }

    if (!track) return { track: null };

    return {
        track: {
            title: track.name,
            artist: track.artists?.map((a) => a.name).join(", ") ?? "",
            album: track.album?.name ?? "",
            albumImageUrl: track.album?.images?.[0]?.url ?? null,
            songUrl: track.external_urls?.spotify ?? "#",
            isPlaying,
        },
    };
}

export default async ({ req, res, log, error }) => {
    if (req.method === "OPTIONS") {
        return res.send("", 204, CORS_HEADERS);
    }

    const type = req.query?.type;

    try {
        let payload;
        if (type === "github") payload = await getGithubContributions();
        else if (type === "wakatime") payload = await getWakaTimeStats();
        else if (type === "spotify") payload = await getSpotifyLastPlayed();
        else return res.json({ error: "Unknown type. Use ?type=github|wakatime|spotify" }, 400, CORS_HEADERS);

        return res.json(payload, 200, CORS_HEADERS);
    } catch (err) {
        error(err.message);
        return res.json({ error: err.message }, 502, CORS_HEADERS);
    }
};

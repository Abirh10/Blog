// One-time local helper to get a Spotify refresh token for the
// dashboard-data Appwrite Function (see functions/dashboard-data/README.md).
//
// Usage:
//   node scripts/get-spotify-refresh-token.mjs <client-id> <client-secret>
//
// Requires a Spotify app (developer.spotify.com/dashboard) with
// http://127.0.0.1:8888/callback added as a Redirect URI.
//
// This runs entirely on your machine: it opens your browser to Spotify's
// login/consent screen, catches the redirect on a local server, exchanges
// the code for tokens, and prints the refresh token to your terminal. The
// token is never sent anywhere else by this script.

import http from "node:http";
import { randomBytes } from "node:crypto";
import { exec } from "node:child_process";

const [clientId, clientSecret] = process.argv.slice(2);

if (!clientId || !clientSecret) {
    console.error("Usage: node scripts/get-spotify-refresh-token.mjs <client-id> <client-secret>");
    process.exit(1);
}

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ["user-read-currently-playing", "user-read-recently-played"].join(" ");
const state = randomBytes(8).toString("hex");

const authorizeUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state,
    });

function openBrowser(url) {
    const cmd = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

    if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
    }

    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const err = url.searchParams.get("error");

    if (err || returnedState !== state || !code) {
        res.writeHead(400, { "Content-Type": "text/plain" }).end("Authorization failed or state mismatch. Close this tab and try again.");
        server.close();
        process.exit(1);
    }

    try {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        const json = await tokenRes.json();

        if (!tokenRes.ok || !json.refresh_token) {
            console.error("\nSpotify token exchange failed:", json);
            res.writeHead(500, { "Content-Type": "text/plain" }).end("Token exchange failed — check your terminal.");
            server.close();
            process.exit(1);
        }

        console.log("\n✅ Success! Add this as SPOTIFY_REFRESH_TOKEN in the Appwrite Function's Variables tab:\n");
        console.log(json.refresh_token);
        console.log("\n(This value was only printed here — it was not sent anywhere else.)\n");

        res.writeHead(200, { "Content-Type": "text/plain" }).end("Done! Check your terminal for the refresh token. You can close this tab.");
        server.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        res.writeHead(500, { "Content-Type": "text/plain" }).end("Something went wrong — check your terminal.");
        server.close();
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`Opening your browser to log in to Spotify and approve access...`);
    console.log(`If it doesn't open automatically, visit:\n${authorizeUrl}\n`);
    openBrowser(authorizeUrl);
});

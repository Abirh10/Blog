// Copies the self-hosted TinyMCE runtime (icons/skins/plugins/themes + the
// core script) from node_modules into public/tinymce, so the editor loads
// from this app's own origin instead of TinyMCE's cloud CDN — no API key or
// tiny.cloud account needed. Runs automatically after `npm install` (see the
// "postinstall" script in package.json); public/tinymce itself isn't
// committed (see .gitignore) since it's just a copy of node_modules/tinymce.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(__dirname, "../node_modules/tinymce");
const dest = path.resolve(__dirname, "../public/tinymce");

if (!existsSync(source)) {
    console.warn("tinymce package not found in node_modules — skipping asset copy.");
    process.exit(0);
}

mkdirSync(dest, { recursive: true });

const items = ["tinymce.min.js", "icons", "models", "plugins", "skins", "themes"];
for (const item of items) {
    const from = path.join(source, item);
    if (!existsSync(from)) continue;
    cpSync(from, path.join(dest, item), { recursive: true });
}

console.log(`Copied self-hosted TinyMCE assets to ${path.relative(process.cwd(), dest)}`);

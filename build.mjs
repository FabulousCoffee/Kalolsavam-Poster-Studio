import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const source = await readFile("index.html", "utf8");

let html = source.replace(
  /  <!-- Tailwind CSS -->\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
  '  <!-- Locally compiled Tailwind CSS -->\n  <link rel="stylesheet" href="./styles.css">'
);

html = html.replace(
  /  <script>\s*tailwind\.config = \{[\s\S]*?\n  <\/script>\s*(?=  <style>)/,
  ""
);

if (html.includes("https://cdn.tailwindcss.com") || html.includes("tailwind.config =")) {
  throw new Error("Could not safely remove the runtime Tailwind CDN configuration.");
}

// Keep the production build focused on the poster studio itself. The optional
// legacy Teacher Mode script created a second wizard and hid editor panels,
// conflicting with the four-stage workflow in index.html.
if (!html.includes('href="./styles.css"')) {
  throw new Error("The application must reference the compiled local stylesheet.");
}
if (html.includes("teacher-mode.js") || html.includes("teacher-mode.css")) {
  throw new Error("Legacy Teacher Mode must not be injected into the production page.");
}

await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html, "utf8");

if (existsSync("Logo final.resized.png")) {
  await copyFile("Logo final.resized.png", "dist/Logo final.resized.png");
}

console.log("Built static site in ./dist");

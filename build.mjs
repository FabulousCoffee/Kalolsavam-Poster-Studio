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

// Progressive enhancement: keep the existing poster editor intact and add the
// optional teacher-friendly wizard/accessibility layer as separate static assets.
html = html.replace(
  "</head>",
  '  <link rel="stylesheet" href="./teacher-mode.css">\n</head>'
);
html = html.replace(
  "</body>",
  '  <script src="./teacher-mode.js" defer></script>\n</body>'
);

await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", html, "utf8");
await copyFile("teacher-mode.css", "dist/teacher-mode.css");
await copyFile("teacher-mode.js", "dist/teacher-mode.js");

if (existsSync("Logo final.resized.png")) {
  await copyFile("Logo final.resized.png", "dist/Logo final.resized.png");
}

console.log("Built static site in ./dist");

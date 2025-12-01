// scripts/lint_content.mjs
// Simple content linter for Pichonia messaging docs.
// Checks that every file in src/content/messaging has a frontmatter `title`.

import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const MESSAGING_DIR = path.join(ROOT, "src", "content", "messaging");

function extractFrontmatter(content) {
  // Very simple parser: look for --- ... --- at top of file
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) return null;

  const lines = trimmed.split("\n");
  // first line is ---; find the closing ---
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return null;

  const fmLines = lines.slice(1, endIndex);
  return fmLines.join("\n");
}

function hasTitle(frontmatter) {
  if (!frontmatter) return false;
  // crude but effective: look for a line starting with "title:"
  return frontmatter
    .split("\n")
    .some((line) => line.trim().toLowerCase().startsWith("title:"));
}

function main() {
  if (!fs.existsSync(MESSAGING_DIR)) {
    console.error(`Messaging dir not found: ${MESSAGING_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MESSAGING_DIR)
    .filter((f) => f.endsWith(".md"));

  let failures = [];

  for (const file of files) {
    const fullPath = path.join(MESSAGING_DIR, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const fm = extractFrontmatter(content);

    if (!hasTitle(fm)) {
      failures.push(`- missing title: src/content/messaging/${file}`);
    }
  }

  if (failures.length > 0) {
    console.error("Content lint failed:\n" + failures.join("\n"));
    process.exit(1);
  }

  console.log(`Content lint passed. Checked ${files.length} files in messaging.`);
}

main();

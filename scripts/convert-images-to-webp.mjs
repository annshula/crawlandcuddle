/**
 * Convert all raster images (png, jpg, jpeg) under public/images to WebP.
 * Existing .webp files are skipped. Run from project root:
 *   node scripts/convert-images-to-webp.mjs
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, extname, dirname, basename } from "node:path";
import sharp from "sharp";

const ROOT = join(process.cwd(), "public", "images");
const QUALITY = 80; // good balance for photography; bump to 90 if needed

const EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const results = { converted: 0, skipped: 0, failed: [] };

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else {
      const ext = extname(entry.name).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;
      const outPath = join(dir, basename(entry.name, ext) + ".webp");
      try {
        const input = await readFile(full);
        const webp = await sharp(input).webp({ quality: QUALITY }).toBuffer();
        await writeFile(outPath, webp);
        results.converted++;
        console.log(`✓ ${full.replace(process.cwd(), ".")} -> ${outPath.replace(process.cwd(), ".")} (${(webp.length / 1024).toFixed(0)} KB)`);
      } catch (err) {
        results.failed.push(`${full}: ${err.message}`);
        console.error(`✗ Failed: ${full} — ${err.message}`);
      }
    }
  }
}

await walk(ROOT);

console.log("\n--- Summary ---");
console.log(`Converted: ${results.converted}`);
console.log(`Skipped (already webp/other): ${results.skipped}`);
console.log(`Failed: ${results.failed.length}`);
if (results.failed.length) {
  console.log(results.failed.join("\n"));
  process.exitCode = 1;
}

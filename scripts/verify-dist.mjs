import { promises as fs } from "node:fs";
import path from "node:path";

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, "dist");
  const indexPath = path.join(distDir, "index.html");

  if (!(await fileExists(indexPath))) {
    throw new Error("Missing dist/index.html. Run npm run build first.");
  }

  const html = await fs.readFile(indexPath, "utf8");
  const assetRefs = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map((match) => match[1]);

  if (!assetRefs.length) {
    throw new Error("No /assets references found in dist/index.html.");
  }

  const missingAssets = [];
  for (const asset of assetRefs) {
    const assetPath = path.join(distDir, "assets", asset);
    if (!(await fileExists(assetPath))) {
      missingAssets.push(asset);
    }
  }

  if (missingAssets.length) {
    throw new Error(`dist/index.html references missing asset files: ${missingAssets.join(", ")}`);
  }

  const entryScript = assetRefs.find((file) => /^index-[A-Za-z0-9_-]+\.js$/.test(file));
  const entryStyle = assetRefs.find((file) => /^index-[A-Za-z0-9_-]+\.css$/.test(file));

  if (!entryScript) {
    throw new Error("Missing hashed JS entry reference (index-*.js) in dist/index.html.");
  }

  if (!entryStyle) {
    throw new Error("Missing hashed CSS entry reference (index-*.css) in dist/index.html.");
  }

  console.log(`dist verification passed: ${assetRefs.length} asset reference(s), entry JS ${entryScript}, entry CSS ${entryStyle}.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`dist verification failed: ${message}`);
  process.exitCode = 1;
});

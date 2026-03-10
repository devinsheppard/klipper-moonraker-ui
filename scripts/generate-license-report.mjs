import { promises as fs } from "node:fs";
import path from "node:path";

const OUTPUT_FILE = "THIRD_PARTY_LICENSES_REPORT.md";

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLicense(raw) {
  if (!raw) return "UNKNOWN";
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || "UNKNOWN";
  }

  if (Array.isArray(raw)) {
    const parts = raw
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          const type = typeof entry.type === "string" ? entry.type.trim() : "";
          return type;
        }
        return "";
      })
      .filter(Boolean);

    return parts.length ? [...new Set(parts)].join(" OR ") : "UNKNOWN";
  }

  if (raw && typeof raw === "object") {
    const type = typeof raw.type === "string" ? raw.type.trim() : "";
    return type || "UNKNOWN";
  }

  return "UNKNOWN";
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function normalizePackageName(packagePath) {
  const marker = "node_modules/";
  const lastIndex = packagePath.lastIndexOf(marker);
  if (lastIndex < 0) return packagePath;
  return packagePath.slice(lastIndex + marker.length);
}

function getScope(existingScope, nextScope) {
  const rank = {
    transitive: 0,
    dev: 1,
    prod: 2,
  };

  return rank[nextScope] > rank[existingScope] ? nextScope : existingScope;
}

async function main() {
  const rootDir = process.cwd();
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageLockPath = path.join(rootDir, "package-lock.json");

  const [packageJsonRaw, packageLockRaw] = await Promise.all([
    fs.readFile(packageJsonPath, "utf8"),
    fs.readFile(packageLockPath, "utf8"),
  ]);

  const packageJson = JSON.parse(packageJsonRaw);
  const packageLock = JSON.parse(packageLockRaw);

  const rootPackage = packageLock.packages?.[""] || {};

  const directProdSet = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(rootPackage.dependencies || {}),
  ]);
  const directDevSet = new Set([
    ...Object.keys(packageJson.devDependencies || {}),
    ...Object.keys(rootPackage.devDependencies || {}),
  ]);

  const byPackageVersion = new Map();

  for (const [packagePath, metadata] of Object.entries(packageLock.packages || {})) {
    if (!packagePath.startsWith("node_modules/")) continue;

    const name = normalizePackageName(packagePath);
    const version = String(metadata?.version || "UNKNOWN");
    const license = normalizeLicense(metadata?.license);

    const scope = directProdSet.has(name)
      ? "prod"
      : (directDevSet.has(name) ? "dev" : "transitive");

    const key = `${name}@${version}`;
    const existing = byPackageVersion.get(key);

    if (!existing) {
      byPackageVersion.set(key, {
        name,
        version,
        scope,
        licenses: new Set([license]),
      });
      continue;
    }

    existing.scope = getScope(existing.scope, scope);
    existing.licenses.add(license);
  }

  const records = [...byPackageVersion.values()]
    .map((entry) => ({
      name: entry.name,
      version: entry.version,
      scope: entry.scope,
      license: [...entry.licenses].sort().join(" OR "),
    }))
    .sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return a.version.localeCompare(b.version);
    });

  const licenseCounts = new Map();
  records.forEach((entry) => {
    const existing = licenseCounts.get(entry.license) || 0;
    licenseCounts.set(entry.license, existing + 1);
  });

  const sortedLicenseCounts = [...licenseCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  const unknownCount = records.filter((entry) => entry.license === "UNKNOWN").length;
  const generatedAt = new Date().toISOString();

  const lines = [];
  lines.push("# Third-Party License Report (Generated)");
  lines.push("");
  lines.push(`Generated at: ${generatedAt}`);
  lines.push(`Source: package-lock.json (lockfileVersion ${packageLock.lockfileVersion ?? "unknown"})`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total unique package@version entries: ${records.length}`);
  lines.push(`- Unknown license entries: ${unknownCount}`);
  lines.push("");
  lines.push("### License Counts");
  lines.push("");
  lines.push("| License | Count |");
  lines.push("|---|---:|");
  for (const [license, count] of sortedLicenseCounts) {
    lines.push(`| ${escapeCell(license)} | ${count} |`);
  }
  lines.push("");
  lines.push("## Package Details");
  lines.push("");
  lines.push("| Package | Version | License | Scope |");
  lines.push("|---|---:|---|---|");

  for (const record of records) {
    lines.push(
      `| ${escapeCell(record.name)} | ${escapeCell(record.version)} | ${escapeCell(record.license)} | ${escapeCell(record.scope)} |`
    );
  }

  lines.push("");
  lines.push("## Scope Legend");
  lines.push("");
  lines.push("- `prod`: direct runtime dependency from `dependencies`");
  lines.push("- `dev`: direct build/dev dependency from `devDependencies`");
  lines.push("- `transitive`: indirect dependency pulled by other packages");

  const outputPath = path.join(rootDir, OUTPUT_FILE);
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`License report generated: ${OUTPUT_FILE} (${records.length} entries)`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`License report generation failed: ${message}`);
  process.exitCode = 1;
});

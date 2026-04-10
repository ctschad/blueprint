import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicRoot = path.join(repoRoot, "public");
const searchRoots = [
  path.join(repoRoot, "app"),
  path.join(repoRoot, "components"),
  path.join(repoRoot, "lib"),
  path.join(repoRoot, "data", "generated")
];
const largeAssetThreshold = 5 * 1024 * 1024;

function walkFiles(rootDir, filter) {
  const results = [];

  function visit(currentDir) {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const nextPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        visit(nextPath);
        continue;
      }

      if (!filter || filter(nextPath)) {
        results.push(nextPath);
      }
    }
  }

  visit(rootDir);
  return results;
}

function toPublicUrl(filePath) {
  return `/${path.relative(publicRoot, filePath).split(path.sep).join("/")}`;
}

function formatMegabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const sourceFiles = searchRoots.flatMap((rootDir) => walkFiles(rootDir));
const sourceCorpus = sourceFiles
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

const publicFiles = walkFiles(publicRoot);

const extensionTotals = new Map();
const publicInventory = publicFiles.map((filePath) => {
  const stats = fs.statSync(filePath);
  const publicUrl = toPublicUrl(filePath);
  const extension = path.extname(filePath).toLowerCase() || "<none>";
  const isReferenced = sourceCorpus.includes(publicUrl) || sourceCorpus.includes(path.basename(filePath));

  extensionTotals.set(extension, (extensionTotals.get(extension) ?? 0) + stats.size);

  return {
    filePath,
    publicUrl,
    bytes: stats.size,
    extension,
    isReferenced
  };
});

const mediaExtensions = new Set([".mp4", ".webm", ".gif"]);
const mediaCandidates = publicInventory
  .filter((asset) => mediaExtensions.has(asset.extension))
  .sort((left, right) => right.bytes - left.bytes);

const unusedLargeMedia = mediaCandidates.filter(
  (asset) => asset.bytes >= largeAssetThreshold && !asset.isReferenced
);

const summary = {
  totalFiles: publicInventory.length,
  totalBytes: publicInventory.reduce((sum, asset) => sum + asset.bytes, 0),
  extensionTotals: [...extensionTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([extension, bytes]) => ({ extension, bytes })),
  heaviestMedia: mediaCandidates.slice(0, 12).map((asset) => ({
    path: path.relative(repoRoot, asset.filePath),
    publicUrl: asset.publicUrl,
    bytes: asset.bytes,
    referenced: asset.isReferenced
  })),
  unusedLargeMedia: unusedLargeMedia.map((asset) => ({
    path: path.relative(repoRoot, asset.filePath),
    publicUrl: asset.publicUrl,
    bytes: asset.bytes
  }))
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log(`Public asset inventory for ${path.relative(process.cwd(), publicRoot) || "public"}`);
console.log(`Files: ${summary.totalFiles}`);
console.log(`Total size: ${formatMegabytes(summary.totalBytes)}`);
console.log("");
console.log("Top extensions by size:");
for (const item of summary.extensionTotals.slice(0, 10)) {
  console.log(`- ${item.extension}: ${formatMegabytes(item.bytes)}`);
}

console.log("");
console.log("Heaviest media files:");
for (const item of summary.heaviestMedia) {
  console.log(
    `- ${item.path} (${formatMegabytes(item.bytes)})${item.referenced ? "" : " [unreferenced]"}`
  );
}

if (summary.unusedLargeMedia.length) {
  console.log("");
  console.log("Unused large media candidates:");
  for (const item of summary.unusedLargeMedia) {
    console.log(`- ${item.path} (${formatMegabytes(item.bytes)})`);
  }
} else {
  console.log("");
  console.log("No unused large media files met the pruning threshold.");
}

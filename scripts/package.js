import archiver from 'archiver';
import fs, { createWriteStream, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const releasesDir = join(__dirname, '..', 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

function findAssetFile(distDir, pattern) {
  const assetsDir = join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Assets directory not found: ${assetsDir}`);
  }

  const files = fs.readdirSync(assetsDir);
  const matchingFile = files.find((file) => file.match(pattern));

  if (!matchingFile) {
    throw new Error(`No file found matching pattern: ${pattern}`);
  }

  return `assets/${matchingFile}`;
}

async function updateManifest() {
  const distDir = join(__dirname, '../dist');
  const manifest = JSON.parse(
    await readFile(join(__dirname, '../public/manifest.json'), 'utf-8')
  );

  try {
    // Find the actual built filenames
    const backgroundFile = findAssetFile(
      distDir,
      /^background-[a-zA-Z0-9_-]+\.js$/
    );
    const contentFile = findAssetFile(distDir, /^content-[a-zA-Z0-9_-]+\.js$/);

    // Update manifest with correct filenames
    manifest.background.service_worker = backgroundFile;
    manifest.content_scripts[0].js = [contentFile];

    // Write updated manifest to dist directory
    const manifestPath = join(distDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('✓ Manifest updated with correct asset filenames:');
    console.log(`  - Background: ${backgroundFile}`);
    console.log(`  - Content: ${contentFile}`);

    return manifest;
  } catch (error) {
    console.error('❌ Failed to update manifest:', error.message);
    throw error;
  }
}

async function createZip() {
  const manifest = await updateManifest();
  const version = manifest.version;
  const zipPath = join(__dirname, `../releases/v${version}.zip`);
  const output = createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    console.log(`Archive created: ${zipPath}`);
    console.log(`Total bytes: ${archive.pointer()}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(join(__dirname, '../dist/'), false);
  await archive.finalize();
}

createZip().catch(console.error);

import { createGzip } from 'zlib';
import { createReadStream, createWriteStream, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';

const DIST_DIR = 'dist';
const COMPRESSIBLE_EXTENSIONS = [
  '.js',
  '.css',
  '.html',
  '.json',
  '.svg',
  '.txt',
];
const MIN_SIZE_BYTES = 1024; // Only compress files larger than 1KB

async function compressFile(filePath) {
  const gzip = createGzip({ level: 9 });
  const source = createReadStream(filePath);
  const destination = createWriteStream(`${filePath}.gz`);

  try {
    await pipeline(source, gzip, destination);
    console.log(`✓ Compressed: ${filePath}`);
  } catch (error) {
    console.error(`✗ Failed to compress ${filePath}:`, error.message);
  }
}

function shouldCompress(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!COMPRESSIBLE_EXTENSIONS.includes(ext)) {
    return false;
  }

  try {
    const stats = statSync(filePath);
    return stats.size >= MIN_SIZE_BYTES;
  } catch {
    return false;
  }
}

async function compressDirectory(dir) {
  const files = readdirSync(dir);
  const compressionPromises = [];

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      await compressDirectory(filePath);
    } else if (shouldCompress(filePath)) {
      compressionPromises.push(compressFile(filePath));
    }
  }

  await Promise.all(compressionPromises);
}

async function main() {
  console.log('🗜️  Starting gzip compression...');

  try {
    await compressDirectory(DIST_DIR);
    console.log('✅ Gzip compression completed successfully!');
  } catch (error) {
    console.error('❌ Compression failed:', error.message);
    process.exit(1);
  }
}

main();

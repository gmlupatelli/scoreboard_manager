import { mkdir, copyFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourcePath = path.join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const targetDir = path.join(rootDir, 'public');
const targetPath = path.join(targetDir, 'pdf.worker.min.mjs');

const ensureExists = async (filePath) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const run = async () => {
  const hasSource = await ensureExists(sourcePath);
  if (!hasSource) {
    console.warn('pdf.worker.min.mjs not found. Did you install dependencies?');
    return;
  }

  await mkdir(targetDir, { recursive: true });
  await copyFile(sourcePath, targetPath);
  console.info('Copied pdf.worker.min.mjs to public/');
};

await run();

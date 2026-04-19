import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = join(root, 'dist', 'index.html');
const dest404 = join(root, 'dist', '404.html');

if (!existsSync(indexHtml)) {
  console.error('copy-spa-404: dist/index.html not found. Run vite build first.');
  process.exit(1);
}

copyFileSync(indexHtml, dest404);
console.log('copy-spa-404: dist/index.html -> dist/404.html');

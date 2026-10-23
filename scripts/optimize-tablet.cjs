/* Gera a prévia WebP do GIF original, preservando quadros e duração. */
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
let sharp;
try {
  sharp = require(process.env.SEO_SHARP_MODULE || 'sharp');
} catch {
  console.error('Sharp não encontrado. Defina SEO_SHARP_MODULE com o caminho do módulo.');
  process.exit(1);
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'video tablet.gif');
  const output = path.join(root, 'assets/media');
  await fs.mkdir(output, { recursive: true });
  await sharp(source, { pages: 1 }).webp({ quality: 90, alphaQuality: 100, effort: 5 }).toFile(path.join(output, 'video-tablet-poster.webp'));
  await sharp(source, { animated: true }).webp({ quality: 88, alphaQuality: 100, effort: 5, loop: 0 }).toFile(path.join(output, 'video-tablet.webp'));
  console.log('Prévia do tablet gerada a partir de video tablet.gif.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

// Convert SVG icons to PNG using sharp
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Conversions to perform
const conversions = [
  { input: 'icon-192.svg', output: 'pwa-192x192.png', size: 192 },
  { input: 'icon-512.svg', output: 'pwa-512x512.png', size: 512 },
  { input: 'apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },
  { input: 'favicon.svg', output: 'favicon.ico', size: 32 }
];

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');

  for (const { input, output, size } of conversions) {
    const inputPath = path.join(publicDir, input);
    const outputPath = path.join(publicDir, output);

    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Created ${output} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create ${output}:`, error.message);
    }
  }

  console.log('\n✅ Icon conversion complete!');
  console.log('📦 PWA icons are ready for deployment.\n');
}

convertIcons();

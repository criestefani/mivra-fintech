// Simple PWA icon generator
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG template for the icon (Letter M with Mivra green background)
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#10B981" rx="${size * 0.15}"/>

  <!-- Letter M -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size * 0.6}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central">M</text>
</svg>`;

// Create SVG icons
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files
const sizes = [
  { name: 'icon-192.svg', size: 192 },
  { name: 'icon-512.svg', size: 512 },
  { name: 'apple-touch-icon.svg', size: 180 },
  { name: 'favicon.svg', size: 32 },
  { name: 'masked-icon.svg', size: 512 }
];

sizes.forEach(({ name, size }) => {
  const svgContent = createSVG(size);
  fs.writeFileSync(path.join(publicDir, name), svgContent);
  console.log(`✓ Created ${name}`);
});

console.log('\n📝 Note: SVG icons created. For production, convert to PNG using:');
console.log('   - Online tool: https://realfavicongenerator.net/');
console.log('   - Or install sharp: npm install sharp');
console.log('   - Then convert: node convert-svg-to-png.mjs\n');

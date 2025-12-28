import sharp from 'sharp';
import { readFileSync } from 'fs';

const svgBuffer = readFileSync('./public/icon.svg');

// Generate 192x192 icon
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile('./public/pwa-192x192.png');

console.log('Generated pwa-192x192.png');

// Generate 512x512 icon
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('./public/pwa-512x512.png');

console.log('Generated pwa-512x512.png');

// Generate favicon
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile('./public/favicon.ico');

console.log('Generated favicon.ico');

console.log('All icons generated successfully!');

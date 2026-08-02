const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogo() {
  try {
    const inputPath = path.join(__dirname, '../frontend/public/logo.jpg');
    const outputPath = path.join(__dirname, '../frontend/public/logo.png');

    const metadata = await sharp(inputPath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    
    // The user wants to crop the yellow glow and keep the gold frame.
    // Let's assume the gold frame is at around 85% of the diameter.
    const radius = Math.floor(size * 0.425); 
    const cx = Math.floor(metadata.width / 2);
    const cy = Math.floor(metadata.height / 2);

    const extractSize = radius * 2;
    const svgMask = `
      <svg width="${extractSize}" height="${extractSize}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white" />
      </svg>
    `;

    const maskBuffer = Buffer.from(svgMask);

    await sharp(inputPath)
      .extract({
        left: cx - radius,
        top: cy - radius,
        width: extractSize,
        height: extractSize
      })
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .png()
      .toFile(outputPath);

    console.log('Logo cropped successfully.');
  } catch (error) {
    console.error('Error processing logo:', error);
  }
}

processLogo();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create simple SVG icons and convert to PNG using sips (macOS built-in)
const sizes = [192, 512];
const color = '#4a7c59'; // sage-700

const iconsDir = path.join(__dirname, '../public/icons');

sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${color}"/>
  <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">C</text>
</svg>`;

  const svgPath = path.join(iconsDir, `icon-${size}.svg`);
  const pngPath = path.join(iconsDir, `icon-${size}.png`);

  fs.writeFileSync(svgPath, svg);

  // Use macOS sips to convert SVG to PNG
  try {
    // For macOS, we can use qlmanage or just keep SVG
    // Actually, let's use a different approach - create via ImageMagick if available
    execSync(`which convert && convert ${svgPath} ${pngPath}`, { stdio: 'pipe' });
    fs.unlinkSync(svgPath);
    console.log(`Created icon-${size}.png`);
  } catch (e) {
    // Keep SVG as fallback
    console.log(`Created icon-${size}.svg (PNG conversion not available)`);
  }
});

console.log('Done!');

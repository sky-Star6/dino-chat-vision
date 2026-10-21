const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="dinoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="100%" stop-color="#22c55e" />
    </linearGradient>
    <linearGradient id="bellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#064e3b" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />

  <!-- Inner border highlight -->
  <rect x="8" y="8" width="496" height="496" rx="107" fill="none" stroke="#ffffff" stroke-opacity="0.2" stroke-width="4" />

  <!-- Dinosaur Mascot Group with shadow -->
  <g filter="url(#shadow)">
    <!-- Body -->
    <path d="M170 330 C170 240, 240 220, 290 220 C340 220, 370 250, 370 340 C370 410, 320 425, 260 425 C190 425, 170 400, 170 330 Z" fill="url(#dinoGrad)" />

    <!-- Yellow Belly -->
    <path d="M230 280 C270 280, 295 310, 295 370 C295 405, 275 420, 245 420 C225 420, 215 400, 215 370 C215 320, 220 280, 230 280 Z" fill="url(#bellyGrad)" />

    <!-- Head & Snout -->
    <path d="M180 180 C180 120, 230 90, 305 90 C380 90, 420 135, 420 185 C420 230, 375 255, 310 255 C230 255, 180 235, 180 180 Z" fill="url(#dinoGrad)" />

    <!-- Cute Big Cheeks -->
    <circle cx="240" cy="215" r="22" fill="#f472b6" opacity="0.55" />
    <circle cx="375" cy="215" r="18" fill="#f472b6" opacity="0.45" />

    <!-- Nostril -->
    <circle cx="395" cy="170" r="6" fill="#15803d" />

    <!-- Big Sparkly Eye -->
    <circle cx="285" cy="155" r="32" fill="#0f172a" />
    <!-- Eye Highlights -->
    <circle cx="296" cy="145" r="12" fill="#ffffff" />
    <circle cx="274" cy="168" r="5" fill="#ffffff" />

    <!-- Happy Open Mouth Smile -->
    <path d="M315 220 Q350 250 385 220" fill="#991b1b" stroke="#166534" stroke-width="6" stroke-linecap="round" />
    <!-- White Tooth -->
    <polygon points="338,220 348,220 343,232" fill="#ffffff" />

    <!-- Little Cute Horns/Spines on Head -->
    <path d="M205 110 Q215 85 225 105 Z" fill="#f59e0b" />
    <path d="M235 96 Q245 72 255 92 Z" fill="#f59e0b" />
    <path d="M265 89 Q275 66 285 86 Z" fill="#f59e0b" />

    <!-- Small cute front arm waving -->
    <path d="M300 295 Q335 285 330 310 Q325 325 295 320 Z" fill="url(#dinoGrad)" stroke="#166534" stroke-width="4" />
  </g>

  <!-- Sparkles / Stars -->
  <g fill="#fef08a">
    <!-- Top right sparkle -->
    <path d="M410 75 Q410 95 430 95 Q410 95 410 115 Q410 95 390 95 Q410 95 410 75 Z" />
    <!-- Small star left -->
    <path d="M110 190 Q110 202 122 202 Q110 202 110 214 Q110 202 98 202 Q110 202 110 190 Z" />
    <!-- Sound wave / chat indicator -->
    <circle cx="425" cy="270" r="8" fill="#ffffff" opacity="0.8" />
    <circle cx="445" cy="255" r="12" fill="#ffffff" opacity="0.8" />
  </g>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), svgIcon);

async function generate() {
  const buf = Buffer.from(svgIcon);
  await sharp(buf).resize(512, 512).png().toFile(path.join(__dirname, '../public/icon-512.png'));
  await sharp(buf).resize(192, 192).png().toFile(path.join(__dirname, '../public/icon-192.png'));
  await sharp(buf).resize(180, 180).png().toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  await sharp(buf).resize(64, 64).png().toFile(path.join(__dirname, '../public/favicon.png'));
  console.log('Icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});

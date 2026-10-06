import sharp from 'sharp'
import path from 'node:path'
const out = process.argv[2]
const items = [
  ['hero', 2400, 1350, 'Hero image · 16:9', '#0F1F3D', '#0E7C6B'],
  ['about', 1600, 1200, 'About image · 4:3', '#13284A', '#0A5F52'],
  ['programme-pcm', 1200, 900, 'PCM · 4:3', '#0F1F3D', '#0E7C6B'],
  ['programme-nma', 1200, 900, 'NMA · 4:3', '#0A5F52', '#13284A'],
  ['programme-cew', 1200, 900, 'CEW · 4:3', '#13284A', '#0E7C6B'],
  ['programme-phr', 1200, 900, 'PHR · 4:3', '#0E7C6B', '#0F1F3D'],
  ['programme-pss', 1200, 900, 'PSS · 4:3', '#0A1730', '#0A5F52'],
  ['programme-nma-hero', 2400, 1350, 'NMA hero · 16:9', '#0A5F52', '#0F1F3D'],
  ['research-1', 1200, 900, 'Research · 4:3', '#13284A', '#0E7C6B'],
  ['research-2', 1200, 900, 'Research · 4:3', '#0E7C6B', '#13284A'],
  ['research-3', 1200, 900, 'Research · 4:3', '#0F1F3D', '#0A5F52'],
  ['og-default', 1200, 630, 'Social share image', '#0F1F3D', '#0E7C6B'],
]
for (const [name, w, h, label, a, b] of items) {
  const fs = Math.round(w / 40)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <pattern id="p" width="${w/24}" height="${w/24}" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#fff" fill-opacity=".09"/></pattern></defs>
  <rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/>
  <circle cx="${w*0.82}" cy="${h*0.2}" r="${h*0.55}" fill="#fff" fill-opacity=".05"/>
  <circle cx="${w*0.1}" cy="${h*0.95}" r="${h*0.45}" fill="#fff" fill-opacity=".04"/>
  <text x="${w/2}" y="${h/2+fs/3}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="${fs}" fill="#fff" fill-opacity=".55">Placeholder · ${label}</text></svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality: 78, progressive: true }).toFile(path.join(out, name + '.jpg'))
}
console.log('done')

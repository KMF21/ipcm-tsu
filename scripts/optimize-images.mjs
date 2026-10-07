/**
 * Converts every image in a folder to an optimised progressive JPG (max 2400px wide),
 * replacing heavy PNG originals. Run: node scripts/optimize-images.mjs public/placeholders
 */
import sharp from 'sharp'
import { readdirSync, statSync, unlinkSync, renameSync } from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
for (const f of readdirSync(dir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(f)) continue
  const src = path.join(dir, f)
  const base = f.replace(/\.(png|jpe?g|webp)$/i, '')
  const tmp = path.join(dir, `${base}.tmp.jpg`)
  const before = statSync(src).size
  await sharp(src).rotate().resize({ width: 2400, withoutEnlargement: true }).flatten({ background: '#ffffff' })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(tmp)
  if (src !== path.join(dir, `${base}.jpg`)) unlinkSync(src)
  renameSync(tmp, path.join(dir, `${base}.jpg`))
  const after = statSync(path.join(dir, `${base}.jpg`)).size
  console.log(`${f.padEnd(28)} ${(before / 1024).toFixed(0).padStart(5)} KB -> ${(after / 1024).toFixed(0).padStart(4)} KB`)
}

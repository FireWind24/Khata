import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PAPER = '#EDE7D6'
const GREEN = '#1E5C4A'
const INK = '#2B2A22'

const stampSvg = (size, maskable = false) => {
  const pad = maskable ? 0 : Math.round(size * 0.12)
  const cx = size / 2
  const cy = size / 2
  const rOuter = Math.round((size - pad * 2) * 0.42)
  const rInner = Math.round(rOuter * 0.8)
  const dash = Math.round(rInner * 0.12)
  const bar = Math.round(size * 0.09)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${PAPER}"/>
    <g transform="rotate(-6 ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="${GREEN}" stroke-width="${Math.round(size * 0.035)}"/>
      <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="${GREEN}" stroke-width="${Math.round(size * 0.014)}" stroke-dasharray="${dash} ${dash}"/>
      <rect x="${cx - bar / 2}" y="${cy - rInner * 0.62}" width="${bar}" height="${rInner * 1.24}" rx="${bar / 2}" fill="${INK}"/>
      <rect x="${cx - rInner * 0.62}" y="${cy - bar / 2}" width="${rInner * 1.24}" height="${bar}" rx="${bar / 2}" fill="${INK}"/>
    </g>
  </svg>`
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
await mkdir(out, { recursive: true })

const jobs = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
]

for (const [name, size, maskable] of jobs) {
  await sharp(Buffer.from(stampSvg(size, maskable))).png().toFile(join(out, name))
  console.log('wrote', name)
}
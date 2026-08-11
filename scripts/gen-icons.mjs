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

const W = 750
const H = 1334
const rowCount = 7

const ledgerRows = () => {
  const rowH = (H - 320) / rowCount
  let rows = ''
  for (let i = 0; i < rowCount; i++) {
    const y = 320 + i * rowH
    rows += `<rect x="36" y="${y}" width="${W - 72}" height="${rowH - 28}" rx="18" fill="#FFFFFF" opacity="0.92"/>`
    rows += `<circle cx="84" cy="${y + (rowH - 28) / 2}" r="26" fill="${GREEN}" opacity="0.9"/>`
    rows += `<rect x="132" y="${y + 34}" width="${W * 0.34}" height="26" rx="13" fill="${INK}" opacity="0.85"/>`
    rows += `<rect x="132" y="${y + 74}" width="${W * 0.2}" height="20" rx="10" fill="${GREEN}" opacity="0.45"/>`
    rows += `<rect x="${W - 240}" y="${y + 46}" width="150" height="30" rx="15" fill="${GREEN}"/>`
  }
  return rows
}

const screenshotSvg = (width, height) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="0" y="0" width="${W}" height="200" fill="${GREEN}"/>
    <text x="40" y="122" font-family="Inter, sans-serif" font-size="52" font-weight="700" fill="#EDE7D6">Khata</text>
    <rect x="38" y="220" width="${W - 76}" height="74" rx="20" fill="#FFFFFF" opacity="0.9"/>
    <text x="62" y="258" font-family="Inter, sans-serif" font-size="24" fill="${INK}" opacity="0.6">Total this month</text>
    <text x="62" y="282" font-family="Inter, sans-serif" font-size="30" font-weight="600" fill="${GREEN}">Rs 24,500</text>
    ${ledgerRows()}
  </svg>`
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'screenshots')
await mkdir(out, { recursive: true })
await mkdir(shots, { recursive: true })

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

await sharp(Buffer.from(screenshotSvg(750, 1334)))
  .resize({ width: 750, height: 1334 })
  .png()
  .toFile(join(shots, 'mobile-750x1334.png'))
console.log('wrote screenshots/mobile-750x1334.png')
import sharp from "sharp"
import path from "node:path"
import fs from "node:fs"

const src = process.argv[2]
if (!src) {
  console.error("Usage: bun generate-icons.ts <path-to-1024x1024.png>")
  process.exit(1)
}

const srcPath = path.resolve(src)
if (!fs.existsSync(srcPath)) {
  console.error(`File not found: ${srcPath}`)
  process.exit(1)
}

const channel = "dev"
const baseDir = path.join(import.meta.dirname, "..", "icons", channel)

const sizes: { name: string; size: number }[] = [
  { name: "32x32.png", size: 32 },
  { name: "64x64.png", size: 64 },
  { name: "128x128.png", size: 128 },
  { name: "128x128@2x.png", size: 256 },
  { name: "icon.png", size: 1024 },
  { name: "dock.png", size: 512 },
  { name: "Square30x30Logo.png", size: 30 },
  { name: "Square44x44Logo.png", size: 44 },
  { name: "Square71x71Logo.png", size: 71 },
  { name: "Square89x89Logo.png", size: 89 },
  { name: "Square107x107Logo.png", size: 107 },
  { name: "Square142x142Logo.png", size: 142 },
  { name: "Square150x150Logo.png", size: 150 },
  { name: "Square284x284Logo.png", size: 284 },
  { name: "Square310x310Logo.png", size: 310 },
  { name: "StoreLogo.png", size: 50 },
]

async function run() {
  console.log(`Generating icons from: ${srcPath}`)

  for (const { name, size } of sizes) {
    const out = path.join(baseDir, name)
    await sharp(srcPath).resize(size, size).png().toFile(out)
    console.log(`  ${name} (${size}x${size})`)
  }

  // Generate .ico for Windows (multi-size)
  const icoSizes = [16, 24, 32, 48, 64, 128, 256]
  const icoBuffers = await Promise.all(
    icoSizes.map((s) => sharp(srcPath).resize(s, s).png().toBuffer()),
  )

  // Write .ico manually - use a simple PNG-in-ICO approach
  const icoPath = path.join(baseDir, "icon.ico")
  await writeIco(icoPath, icoSizes.map((s, i) => ({ size: s, buffer: icoBuffers[i]! })))
  console.log(`  icon.ico (multi-size: ${icoSizes.join(", ")})`)

  // Generate Android icons
  const androidDir = path.join(baseDir, "android")
  const androidSizes: Record<string, number> = {
    "mipmap-mdpi/ic_launcher.png": 48,
    "mipmap-mdpi/ic_launcher_round.png": 48,
    "mipmap-mdpi/ic_launcher_foreground.png": 48,
    "mipmap-hdpi/ic_launcher.png": 72,
    "mipmap-hdpi/ic_launcher_round.png": 72,
    "mipmap-hdpi/ic_launcher_foreground.png": 72,
    "mipmap-xhdpi/ic_launcher.png": 96,
    "mipmap-xhdpi/ic_launcher_round.png": 96,
    "mipmap-xhdpi/ic_launcher_foreground.png": 96,
    "mipmap-xxhdpi/ic_launcher.png": 144,
    "mipmap-xxhdpi/ic_launcher_round.png": 144,
    "mipmap-xxhdpi/ic_launcher_foreground.png": 144,
    "mipmap-xxxhdpi/ic_launcher.png": 192,
    "mipmap-xxxhdpi/ic_launcher_round.png": 192,
    "mipmap-xxxhdpi/ic_launcher_foreground.png": 192,
  }

  for (const [rel, size] of Object.entries(androidSizes)) {
    const out = path.join(androidDir, rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    await sharp(srcPath).resize(size, size).png().toFile(out)
  }
  console.log(`  Android icons generated`)

  // Generate iOS icons
  const iosDir = path.join(baseDir, "ios")
  const iosSizes: Record<string, number> = {
    "AppIcon-20x20@1x.png": 20,
    "AppIcon-20x20@2x.png": 40,
    "AppIcon-20x20@2x-1.png": 40,
    "AppIcon-20x20@3x.png": 60,
    "AppIcon-29x29@1x.png": 29,
    "AppIcon-29x29@2x.png": 58,
    "AppIcon-29x29@2x-1.png": 58,
    "AppIcon-29x29@3x.png": 87,
    "AppIcon-40x40@1x.png": 40,
    "AppIcon-40x40@2x.png": 80,
    "AppIcon-40x40@2x-1.png": 80,
    "AppIcon-40x40@3x.png": 120,
    "AppIcon-60x60@2x.png": 120,
    "AppIcon-60x60@3x.png": 180,
    "AppIcon-76x76@1x.png": 76,
    "AppIcon-76x76@2x.png": 152,
    "AppIcon-83.5x83.5@2x.png": 167,
    "AppIcon-512@2x.png": 1024,
  }

  for (const [rel, size] of Object.entries(iosSizes)) {
    const out = path.join(iosDir, rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    await sharp(srcPath).resize(size, size).png().toFile(out)
  }
  console.log(`  iOS icons generated`)

  // Generate .icns for macOS (using a simple approach - 1024 PNG inside icns)
  const icnsPath = path.join(baseDir, "icon.icns")
  const mainBuffer = await sharp(srcPath).resize(1024, 1024).png().toBuffer()
  // Simple ICNS: just wrap the PNG in an ICNS container
  await writeIcns(icnsPath, mainBuffer)
  console.log(`  icon.icns`)

  console.log(`\nDone! All icons written to ${baseDir}`)
}

async function writeIco(filePath: string, images: { size: number; buffer: Buffer }[]) {
  const headerSize = 6
  const dirEntrySize = 16
  const totalDirSize = dirEntrySize * images.length

  let dataOffset = headerSize + totalDirSize
  const entries: Buffer[] = []

  for (const img of images) {
    const width = img.size >= 256 ? 0 : img.size
    const height = img.size >= 256 ? 0 : img.size
    const dirEntry = Buffer.alloc(dirEntrySize)
    dirEntry.writeUInt8(width, 0)
    dirEntry.writeUInt8(height, 1)
    dirEntry.writeUInt8(0, 2) // color palette
    dirEntry.writeUInt8(0, 3) // reserved
    dirEntry.writeUInt16LE(1, 4) // color planes
    dirEntry.writeUInt16LE(32, 6) // bits per pixel
    dirEntry.writeUInt32LE(img.buffer.length, 8) // data size
    dirEntry.writeUInt32LE(dataOffset, 12) // data offset
    entries.push(dirEntry)
    dataOffset += img.buffer.length
  }

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: ICO
  header.writeUInt16LE(images.length, 4) // count

  const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)])
  fs.writeFileSync(filePath, ico)
}

async function writeIcns(filePath: string, pngBuffer: Buffer) {
  // ICNS format: header (4+4 bytes) + icon entry (8+4+4 bytes) + PNG data
  const iconType = Buffer.from("ic07") // 1024x1024 PNG
  const entryHeader = Buffer.alloc(8)
  entryHeader.writeUInt32LE(8 + pngBuffer.length, 0) // entry size
  Buffer.from(iconType).copy(entryHeader, 4)

  const totalSize = 8 + 8 + pngBuffer.length
  const header = Buffer.alloc(8)
  header.writeUInt32LE(totalSize, 0)
  Buffer.from("icns").copy(header, 4)

  fs.writeFileSync(filePath, Buffer.concat([header, entryHeader, pngBuffer]))
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

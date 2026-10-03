import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public/icons");
mkdirSync(out, { recursive: true });

const GREEN = [0x24, 0x6b, 0x56, 255];
const CREAM = [0xf6, 0xf4, 0xef, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixels) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function rounded(x, y, left, top, width, height, radius) {
  const right = left + width - 1;
  const bottom = top + height - 1;
  if (x < left || y < top || x > right || y > bottom) return false;
  const r = Math.min(radius, width / 2, height / 2);
  const cx = x < left + r ? left + r : x > right - r ? right - r : x;
  const cy = y < top + r ? top + r : y > bottom - r ? bottom - r : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function paint(size, safeInset) {
  const pixels = Buffer.alloc(size * size * 4);
  const margin = Math.round(size * safeInset);
  const card = Math.round(size * 0.46);
  const left = Math.round((size - card) / 2);
  const top = Math.round(size * 0.22);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const ink = rounded(x, y, left, top, card, Math.round(card * 1.15), size * 0.06);
      const color = ink ? CREAM : GREEN;
      pixels.set(color, index);
      if (ink) {
        const line = Math.round(size * 0.035);
        const textLeft = left + Math.round(card * 0.18);
        const textWidth = Math.round(card * 0.64);
        for (const offset of [0.28, 0.46, 0.64]) {
          const lineTop = top + Math.round(card * offset);
          if (
            y >= lineTop &&
            y < lineTop + line &&
            x >= textLeft &&
            x < textLeft + textWidth
          ) {
            pixels.set(GREEN, index);
          }
        }
      }
    }
  }
  if (margin > 0) {
    const framed = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const sourceX = Math.round(
          ((x - margin) / (size - margin * 2)) * (size - 1),
        );
        const sourceY = Math.round(
          ((y - margin) / (size - margin * 2)) * (size - 1),
        );
        if (
          x < margin ||
          y < margin ||
          x >= size - margin ||
          y >= size - margin
        ) {
          framed.set(GREEN, index);
        } else {
          framed.set(
            pixels.subarray(
              (sourceY * size + sourceX) * 4,
              (sourceY * size + sourceX) * 4 + 4,
            ),
            index,
          );
        }
      }
    }
    return framed;
  }
  return pixels;
}

const files = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["apple-touch-icon.png", 180, 0],
  ["icon-maskable-512.png", 512, 0.1],
];
for (const [name, size, inset] of files) {
  writeFileSync(path.join(out, name), png(size, paint(size, inset)));
}
console.log(files.map(([name]) => name).join("\n"));

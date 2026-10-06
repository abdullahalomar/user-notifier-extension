const fs = require('fs');
const path = require('path');

// Minimal valid PNG generator in pure JS
function createPngBuffer(width, height, r, g, b) {
  // A raw uncompressed 1x1 PNG or simple solid color PNG header
  const zlib = require('zlib');

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Color type (RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw pixel data: each scanline starts with filter byte 0
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength;
    rawData[offset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);

  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([len, body, crcBuf]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

const iconsDir = path.join(__dirname, 'extension', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-16.png'), createPngBuffer(16, 16, 99, 102, 241));
fs.writeFileSync(path.join(iconsDir, 'icon-48.png'), createPngBuffer(48, 48, 99, 102, 241));
fs.writeFileSync(path.join(iconsDir, 'icon-128.png'), createPngBuffer(128, 128, 99, 102, 241));

console.log('✅ Icons generated successfully!');

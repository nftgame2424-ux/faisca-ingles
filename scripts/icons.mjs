import sharp from "sharp";
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#1F3FCC"/><path d="M286 84 150 292h96l-24 136 140-212h-98z" fill="#FFD84D"/></svg>`;
const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1F3FCC"/><g transform="translate(256 256) scale(.72) translate(-256 -256)"><path d="M286 84 150 292h96l-24 136 140-212h-98z" fill="#FFD84D"/></g></svg>`;
await sharp(Buffer.from(full)).resize(192).png().toFile("public/icon-192.png");
await sharp(Buffer.from(full)).resize(512).png().toFile("public/icon-512.png");
await sharp(Buffer.from(mask)).resize(512).png().toFile("public/icon-maskable-512.png");
console.log("icons ok");

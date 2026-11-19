// Vizitinė: sugeneruoja img/ (hero AVIF/WebP/JPG), fonts/inter-lt.woff2, favicon komplektą ir og.jpg.
// Paleidimas: cd tools && npm install && npm run assets   (svetainei npm nereikalingas)
import sharp from 'sharp';
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';
import fs from 'node:fs';
const R = '../';
const C = { navy: '#0E1A2B', accent: '#B92D22', red: '#E23B2E', white: '#FFFFFF', bg: '#F6F7F9', muted: '#4A5568' };

// ---------- Šriftas: Inter (latin + LT raidės), kintamo storio 400–700 ----------
const TEXT = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCodePoint(0x20 + i)).join('') + ' ©°·–—‘’‚“”„…€№→★ąčęėįšųūžĄČĘĖĮŠŲŪŽ';
fs.writeFileSync(R + 'fonts/inter-lt.woff2', await subsetFont(fs.readFileSync('fonts-src/Inter.ttf'), TEXT, { targetFormat: 'woff2', variationAxes: { wght: { min: 400, max: 700 }, opsz: 14 } }));

// ---------- Hero ----------
// Gamintojų ženklai (ratlankio emblema, „AMG“ iškaba) sulieti; kadras – mechanikas prie variklio.
const patch = async (left, top, width, height, sigma, rx) => ({ input: await sharp(R + 'hero-source.jpg').extract({ left, top, width, height }).blur(sigma).composite([{ input: Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${rx}" fill="#fff"/></svg>`), blend: 'dest-in' }]).png().toBuffer(), left, top });
const clean = await sharp(R + 'hero-source.jpg').composite([await patch(1036, 1163, 64, 64, 9, 32), await patch(392, 566, 150, 58, 7, 10)]).toBuffer();
const hero = await sharp(clean).extract({ left: 520, top: 300, width: 1640, height: 1230 }).modulate({ saturation: 0.9 }).toBuffer();
for (const w of [640, 960, 1440]) {
  const r = sharp(hero).resize(w);
  await r.clone().avif({ quality: 52, effort: 6 }).toFile(`${R}img/hero-${w}.avif`);
  await r.clone().webp({ quality: 74 }).toFile(`${R}img/hero-${w}.webp`);
  await r.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${R}img/hero-${w}.jpg`);
}

// ---------- Teksto kontūrai (OG ir logotipui, nepriklauso nuo sistemos šriftų) ----------
const inter = fontkit.openSync('fonts-src/Inter.ttf');
function text(t, size, x, y, { wght = 700, fill = C.navy, ls = 0 } = {}) {
  const f = inter.getVariation({ wght, opsz: 32 }); const run = f.layout(t); const s = size / f.unitsPerEm;
  let cx = x, d = '';
  run.glyphs.forEach((g, i) => { d += g.path.scale(s, -s).translate(cx, y).toSVG(); cx += run.positions[i].xAdvance * s + ls; });
  return { svg: `<path fill="${fill}" d="${d}"/>`, width: cx - x };
}
// Ženklas (laikinas, TODO_LOGO): geometrinė „A“ su akcentine skersine linija
const mark = (fg) => `<path d="M17 50 32 15 47 50" fill="none" stroke="${fg}" stroke-width="6" stroke-linejoin="miter"/><path d="M24.5 39H39.5" stroke="${C.red}" stroke-width="5"/>`;
const n = text('AUTOLYGA', 40, 80, 44, { ls: 1.6 }), sub = text('AUTOSERVISAS', 12.5, 81, 66, { wght: 600, fill: C.muted, ls: 2.5 });
const lw = Math.ceil(80 + n.width + 6);
fs.writeFileSync(R + 'img/logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lw} 80" width="${lw}" height="80"><g transform="translate(0 8)">${mark(C.navy)}</g>${n.svg}${sub.svg}</svg>`);

// ---------- Favicon ----------
const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${C.navy}"/>${mark(C.white)}</svg>`;
fs.writeFileSync(R + 'favicon.svg', fav);
const sizes = [16, 32, 48]; const pngs = []; for (const s of sizes) pngs.push(await sharp(Buffer.from(fav)).resize(s, s).png().toBuffer());
const head = Buffer.alloc(6 + 16 * sizes.length); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = head.length; pngs.forEach((b, i) => { const o = 6 + 16 * i; head[o] = sizes[i]; head[o + 1] = sizes[i]; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(off, o + 12); off += b.length; });
fs.writeFileSync(R + 'favicon.ico', Buffer.concat([head, ...pngs]));
const sq = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${C.navy}"/><g transform="translate(${32 * 2 * pad} ${32 * 2 * pad}) scale(${1 - 2 * pad})">${mark(C.white)}</g></svg>`;
await sharp(Buffer.from(sq(0.06))).resize(180, 180).png().toFile(R + 'apple-touch-icon.png');
await sharp(Buffer.from(fav)).resize(192, 192).png().toFile(R + 'icon-192.png');
await sharp(Buffer.from(fav)).resize(512, 512).png().toFile(R + 'icon-512.png');
await sharp(Buffer.from(sq(0.16))).resize(512, 512).png().toFile(R + 'icon-maskable-512.png');

// ---------- OG 1200×630 (šviesi tema) ----------
const t1 = text('Autoservisas Vilniuje', 62, 90, 300, { wght: 700, ls: -1.5 });
const t2 = text('– Autolyga', 62, 90, 376, { wght: 700, fill: C.accent, ls: -1.5 });
const info = text('Vytenio g. 61, Vilnius   ·   +370 686 66412', 28, 90, 470, { wght: 500, fill: C.muted });
const rate = text('4,7 iš 5 „Google“ · 98 atsiliepimai', 28, 132, 532, { wght: 600, fill: C.navy });
const lg = text('AUTOLYGA', 30, 168, 122, { ls: 1.2 }), lgs = text('AUTOSERVISAS', 12, 169, 142, { wght: 600, fill: C.muted, ls: 2.4 });
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#FFFFFF"/><rect x="0" y="0" width="1200" height="10" fill="${C.accent}"/>
<rect x="760" y="0" width="440" height="630" fill="${C.bg}"/>
<g transform="translate(90 78) scale(1.1)">${mark(C.navy)}</g>${lg.svg}${lgs.svg}
${t1.svg}${t2.svg}${info.svg}
<path transform="translate(90 508) scale(1.25)" d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="#F5B301"/>${rate.svg}
<rect x="0" y="620" width="1200" height="10" fill="${C.navy}"/></svg>`;
const photo = await sharp(hero).resize(440, 630, { fit: 'cover', position: 'centre' }).toBuffer();
await sharp(Buffer.from(og)).composite([{ input: photo, left: 760, top: 0 }, { input: Buffer.from(`<svg width="440" height="630"><rect width="440" height="630" fill="url(#g)"/><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".18" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>`), left: 760, top: 0 }])
  .jpeg({ quality: 86, mozjpeg: true }).toFile(R + 'og.jpg');
console.log('assets ok');

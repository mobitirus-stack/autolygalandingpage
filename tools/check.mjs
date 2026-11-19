// Vizitinės patikra: meta ilgiai, vienas H1, antraščių hierarchija, img atributai, inline CSS dydis,
// JSON-LD parse + FAQ = matomas tekstas pažodžiui, NAP visuose failuose, robots/sitemap/llms validumas.
import fs from 'node:fs';
const R = '../';
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
const read = (f) => fs.readFileSync(R + f, 'utf8');
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/ /g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const strip = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const h = read('index.html');
const title = decode(h.match(/<title>(.*?)<\/title>/)[1]);
const desc = decode(h.match(/<meta name="description" content="([^"]*)"/)[1]);
ok(title.length >= 50 && title.length <= 60, `title ${title.length}: ${title}`);
ok(desc.length >= 140 && desc.length <= 160, `description ${desc.length}`);
ok((h.match(/<h1[\s>]/g) || []).length === 1, 'vienas H1');
const lv = [...h.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
ok(lv.every((l, i) => i === 0 || l - lv[i - 1] <= 1), `antraščių hierarchija ${lv.join('')}`);
ok((h.match(/<h3>/g) || []).length === 9, '9 paslaugų kortelės (H3)');
for (const img of h.match(/<img [^>]*>/g) || []) ok(/ alt="[^"]+"/.test(img) && / width="/.test(img) && / height="/.test(img), 'img alt/width/height');
const css = h.match(/<style>([\s\S]*?)<\/style>/)[1];
ok(Buffer.byteLength(css) < 14 * 1024, `inline CSS ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB < 14 KB`);
for (const m of ['canonical', 'og:image', 'twitter:card', 'theme-color', 'og:title', 'og:description']) ok(h.includes(m), `meta ${m}`);
ok(h.includes('<link rel="alternate" type="text/plain" href="/llms.txt"'), 'llms.txt nuoroda');
ok(/fetchpriority="high"/.test(h) && /rel="preload" as="image"/.test(h), 'hero preload + fetchpriority');
// JSON-LD
let g; try { g = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']; ok(true, 'JSON-LD parse'); } catch (e) { ok(false, 'JSON-LD parse ' + e.message); process.exit(1); }
const types = g.map((n) => [].concat(n['@type']).join('+'));
for (const t of ['AutoRepair+LocalBusiness', 'WebSite', 'WebPage', 'FAQPage']) ok(types.includes(t), `schema ${t}`);
const ids = new Set(g.map((n) => n['@id'])); for (const r of JSON.stringify(g).match(/\{"@id":"[^"]+"\}/g)) ok(ids.has(JSON.parse(r)['@id']), `@id ${r}`);
const biz = g[0];
ok(biz.telephone === '+37068666412' && biz.address.streetAddress === 'Vytenio g. 61' && biz.address.postalCode === '03202' && biz.name === 'Autolyga', 'schema NAP');
ok(biz.aggregateRating.ratingValue === '4.7' && biz.aggregateRating.reviewCount === '98', 'aggregateRating 4.7/98');
const cards = [...h.matchAll(/<h3>(.*?)<\/h3>/g)].length;
ok(biz.hasOfferCatalog.itemListElement.length === cards, `hasOfferCatalog ${biz.hasOfferCatalog.itemListElement.length} = kortelių ${cards}`);
const faq = g.find((n) => n['@type'] === 'FAQPage').mainEntity;
const vis = [...h.matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary><div class="ans"><p>([\s\S]*?)<\/p><\/div><\/details>/g)].map((m) => [strip(m[1]), strip(m[2])]);
ok(vis.length === 5 && faq.length === 5, `DUK 5 (matoma ${vis.length}, schema ${faq.length})`);
faq.forEach((q, i) => ok(vis[i] && vis[i][0] === q.name && vis[i][1] === q.acceptedAnswer.text, `FAQ pažodžiui: ${q.name}`));
// NAP visur
for (const f of ['index.html', 'llms.txt']) { const t = decode(read(f)); ok(t.includes('Vytenio g. 61, 03202 Vilnius') && t.includes('+370 686 66412') && t.includes('4,7 iš 5') && t.includes('98 atsiliepimai'), `${f}: NAP + įvertinimas`); }
ok(decode(read('404.html')).includes('+370 686 66412') && read('404.html').includes('noindex'), '404: noindex + telefonas');
// llms FAQ = puslapio FAQ
const llms = read('llms.txt');
ok(/^# Autolyga\n\n> /.test(llms) && llms.includes('## Paslaugos') && llms.includes('## DUK') && /Atnaujinta: \d{4}-\d{2}-\d{2}/.test(llms), 'llms.txt formatas');
faq.forEach((q) => ok(llms.includes(`### ${q.name}\n${q.acceptedAnswer.text}`), `llms DUK: ${q.name}`));
// robots / sitemap
const rb = read('robots.txt');
for (const b of ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot']) ok(rb.includes(`User-agent: ${b}\nAllow: /`), `robots ${b}`);
ok(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m.test(rb), 'robots Sitemap');
const sm = read('sitemap.xml');
ok((sm.match(/<loc>/g) || []).length === 1 && /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sm), 'sitemap 1 URL + lastmod');
const date = h.match(/<time datetime="([^"]+)"/)[1];
ok(sm.includes(`<lastmod>${date}</lastmod>`) && JSON.stringify(g).includes(`"dateModified":"${date}"`) && llms.includes(`Atnaujinta: ${date}`), `data vienoda visur (${date})`);
JSON.parse(read('site.webmanifest')); ok(true, 'site.webmanifest JSON');
for (const f of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'og.jpg', 'fonts/inter-lt.woff2', 'img/hero-640.avif', 'img/hero-960.webp', 'img/hero-1440.jpg', '_headers', '.htaccess', 'vercel.json']) ok(fs.existsSync(R + f), `yra ${f}`);
ok(!/<script(?! type="application\/ld\+json")/.test(h), 'jokio JS (tik JSON-LD)');
ok(/<iframe src="https:\/\/(?:www\.google\.com\/maps\/embed|maps\.google\.com\/maps\?)[^"]+" title="[^"]+"[^>]*loading="lazy"/.test(h), 'Google Maps embed su title + lazy');
ok((h.match(/<blockquote>/g) || []).length >= 3, 'atsiliepimų ištraukos');
// TODO_GEO: gavus kliento embed kodą – įrašyti geo į JSON-LD ir grąžinti patikrą (g[0].geo)
ok(g[0].geo === undefined || (g[0].geo && g[0].geo.latitude), 'schema geo (arba TODO_GEO)');
// WCAG AA kontrastas
const lum = (x) => { const c = x.replace('#', '').match(/\w\w/g).map((v) => parseInt(v, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const [n, f, b, min] of [['tekstas/balta', '#0E1A2B', '#FFFFFF', 4.5], ['tekstas/bg', '#0E1A2B', '#F6F7F9', 4.5], ['antrinis/balta', '#4A5568', '#FFFFFF', 4.5], ['antrinis/bg', '#4A5568', '#F6F7F9', 4.5], ['akcentas/balta (nuorodos, kick)', '#B92D22', '#FFFFFF', 4.5], ['akcentas/bg', '#B92D22', '#F6F7F9', 4.5], ['balta/akcentas (mygtukas)', '#FFFFFF', '#B92D22', 4.5], ['balta/akcentas hover', '#FFFFFF', '#9A241B', 4.5], ['footer tekstas/navy', '#C7D0DB', '#0E1A2B', 4.5], ['balta/navy', '#FFFFFF', '#0E1A2B', 4.5], ['ikona akcentas/rožinis fonas (UI ≥3)', '#B92D22', '#FBEDEC', 3]]) { const r = ratio(f, b); ok(r >= min, `kontrastas ${n}: ${r.toFixed(2)}:1`); }
console.log(fail ? `\n${fail} FAILED` : '\nVISKAS OK'); if (fail) process.exit(1);

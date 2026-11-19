# Autolyga – „Vizitinė“ (vieno puslapio svetainė, pavyzdys)

Grynas HTML + CSS, be framework'o ir be build žingsnio. Visas CSS – `index.html` viduje (~9 KB), JavaScript nėra. Žemėlapis – kliento oficialus „Google Maps“ embed.

## Failai

```
index.html          – visas turinys, CSS inline, JSON-LD (@graph: AutoRepair+LocalBusiness, WebSite, WebPage, FAQPage)
404.html            – noindex, logotipas, telefonas, nuoroda į pradžią
robots.txt, sitemap.xml, llms.txt, site.webmanifest
favicon.ico / favicon.svg / apple-touch-icon.png / icon-192.png / icon-512.png / icon-maskable-512.png
og.jpg              – 1200×630
img/                – hero AVIF/WebP/JPG (640/960/1440), logo.svg (laikinas)
fonts/inter-lt.woff2 – Inter su lietuviškomis raidėmis
vercel.json         – Vercel antraštės (saugumas, cache, Content-Type)
_headers, .htaccess – tas pats Netlify / Cloudflare Pages / Apache
tools/              – tik generavimui ir patikrai (nepublikuojama, žr. .vercelignore)
```

## Įkėlimas

**Vercel:** importuokite repo → Framework Preset „Other“ (nustatoma automatiškai), Build Command ir Output Directory palikite tuščius → Deploy. `tools/`, `README.md`, `hero-source.jpg` nepublikuojami (`.vercelignore`).

**Netlify:** „Add new site → Import from Git“, Build command – tuščias, Publish directory – `.` (arba tiesiog nutempkite aplanką į app.netlify.com/drop). `_headers` pritaikomos automatiškai.

## Kur pakeisti TODO

Visi placeholderiai pažymėti `TODO_` (ieškokite failuose):

| TODO | Kur keisti |
|---|---|
| `TODO_DOMAIN` | `index.html` (canonical, og:url, og:image, JSON-LD), `robots.txt`, `sitemap.xml`, `llms.txt` – pakeisti visur, pvz. „Find & Replace“ |
| `TODO_HOURS` | darbo laikas („Google“ rodo tik užsidarymą 18:00; dabar placeholderis I–V 09:00–18:00, VI–VII nedirba – patvirtinti): `index.html` (hero `dl`, DUK, kontaktai, lentelė, footer, JSON-LD `openingHoursSpecification`), `llms.txt` |
| El. paštas | įrašytas: uabautolyga@gmail.com (kontaktai, JSON-LD, llms.txt) |
| Rekvizitai | įrašyta: UAB „Autolyga“, įmonės kodas 125515482, PVM kodas LT255154811 (footer, JSON-LD, llms.txt) |
| Aplinkiniai rajonai | JSON-LD `areaServed` – parinkti pagal adresą, patvirtinti su klientu |
| `TODO_LOGO` | laikinas tipografinis logotipas: `index.html` header'is, `img/logo.svg`, favicon'ai. Gavus logotipą – `brand/logo.*` + `cd tools && npm install && npm run assets` (pataisius `gen-assets.mjs`) |
| Facebook | pridėti į JSON-LD `sameAs` |
| Atsiliepimai | 4 tikros „Google“ ištraukos (pažodžiui, tik teigiami, vardai sutrumpinti) |

Pakeitus turinį atnaujinkite datą „Atnaujinta“ (`index.html` footer, JSON-LD `dateModified`, `sitemap.xml` `lastmod`, `llms.txt`).

## Patikros

```bash
cd tools && npm install
npm run check                                   # meta, H1, JSON-LD, DUK = schema pažodžiui, NAP, kontrastas, robots/sitemap/llms
npx html-validate -c .htmlvalidate.json ../index.html ../404.html
npx serve .. & npx linkinator http://localhost:3000/ --recurse
npx lighthouse http://localhost:3000/ --form-factor=mobile
```

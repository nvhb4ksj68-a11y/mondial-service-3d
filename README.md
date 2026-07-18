# Mondial Service Srl — sito dark luxury

Sito one-page in stile **dark luxury cinematografico** per Mondial Service Srl,
impresa di ristrutturazioni attiva a Bologna e provincia.
Stack: **HTML + CSS + JS** con Three.js, GSAP/ScrollTrigger e Lenis (tutto vendorizzato,
nessuna build necessaria). Mobile-first.

## Sito online

Il sito è pubblicato con GitHub Pages (deploy automatico a ogni push su `main`):
**https://nvhb4ksj68-a11y.github.io/mondial-service-3d/**

## Anteprima locale

Serve un server statico (i moduli ES non girano da `file://`):

```bash
npx http-server -p 8000        # dalla root del progetto
# poi apri http://localhost:8000
```

## Struttura

| Percorso | Contenuto |
|---|---|
| `index.html` | Pagina unica: preloader, intro porta, hero, servizi, portfolio, recensione, contatti, footer |
| `assets/css/main.css` | Design system dark luxury (navy `#0A1220`, oro `#F5A623` chirurgico, beige raro) |
| `assets/js/app.js` | Preloader, intro, Lenis, reveal a maschere, parallax, cursore custom, magnetic, form |
| `assets/js/scrub.js` | Motore scroll-scrub a sequenza di fotogrammi su canvas (tecnica Apple) |
| `assets/js/webgl.js` | Three.js: porta 3D dell'intro + galleria a distorsione liquida (un solo renderer) |
| `assets/vendor/` | three, gsap, ScrollTrigger, lenis (self-hosted) |
| `assets/fonts/` | Inter variabile self-hosted (stile Apple/SF Pro) |
| `assets/img/` | `logo.png` (ufficiale), `hero.jpg`, poster scene, `portfolio-1..7.jpg` |
| `assets/frames/` | Sequenze WebP delle scene (cantiere, porta, living, cucina, bagno) + varianti mobile in `m/` + `manifest.json` |
| `assets/video/` | Solo `intro-porta.mp4/.webm` (l'intro resta un video normale) |
| `CONTENUTI-DA-SOSTITUIRE.md` | **Leggilo**: elenco dei contenuti reali da reinserire |

## Art direction

- Palette: navy quasi nero `#0A1220`, oro `#F5A623` usato solo per linee sottili e dettagli,
  beige caldo (`#EFE7D8`) solo nella sezione recensione.
- Tipografia leggibile "stile Apple": **Inter** variabile per tutto (display pesante e
  compatto per i titoli, label maiuscole a tracking largo).
- Header: solo wordmark testuale "MONDIAL SERVICE srl"; il logo completo col globo vive
  nel footer, piccolo, su riquadro bianco.
- Una sola cosa protagonista per schermata, molto vuoto, poco testo.

## Motion e 3D

- **Preloader** cinematografico: contatore %, wordmark rivelato, uscita a tendina.
- **Intro**: video della porta (`assets/video/intro-porta.mp4`, rilevato da solo) o porta 3D
  Three.js come fallback; "Salta intro" sempre visibile, timeout di sicurezza, una volta per sessione.
- **Scene guidate dallo scroll** (hero cantiere + 4 capitoli della casa): sequenze di
  fotogrammi WebP disegnate su `<canvas>` dentro `requestAnimationFrame` — la stessa
  tecnica delle pagine prodotto Apple. Scrub fluido anche all'indietro, primo fotogramma
  come poster (mai canvas nero), variante 720p sotto i 768 px, precaricamento a ~1 viewport
  di distanza, con `prefers-reduced-motion` si mostra il fotogramma finale statico.
- **Lenis** smooth scroll ovunque (disattivato con `prefers-reduced-motion`).
- **GSAP + ScrollTrigger**: titoli rivelati riga per riga con maschere, parallax multi-velocità,
  pannelli servizi impilati (sticky), clip-path sulla sezione chiara, colore di fondo che
  cambia progressivamente tra le sezioni.
- **WebGL** sulle immagini del portfolio: distorsione liquida al passaggio del puntatore
  (desktop); su mobile/WebGL assente restano le `<img>` native con lo stesso trattamento CSS.
- **Cursore custom** + **magnetic buttons** solo su puntatori fini.

## Performance e accessibilità

- Un solo `WebGLRenderer` (intro → galleria), DPR ≤ 1.75, texture caricate solo vicino
  al viewport, rendering fermo quando non serve.
- Lazy loading immagini e sequenze fotogrammi (budget: <3 MB prima della prima
  interazione, intro esclusa), font self-hosted `font-display: swap`.
- Fallback completi: senza WebGL o con "riduci movimento" il sito è identico nei contenuti.
- Contrasto AA verificato su tutte le coppie, focus visibili, touch target ≥ 44 px, skip link.
- SEO: meta + Open Graph + JSON-LD `HomeAndConstructionBusiness` (riferimento: Bologna e provincia).

## Contatti cablati

- Telefono: `tel:+393297003558` (mostrato come 329 700 3558)
- WhatsApp: `https://wa.me/393297003558` (il form apre WhatsApp col messaggio pronto)
- Sede: Mordano (BO) — riferimento commerciale sempre "Bologna e provincia"

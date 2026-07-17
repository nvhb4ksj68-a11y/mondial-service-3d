# Mondial Service Srl — sito dark luxury

Sito one-page in stile **dark luxury cinematografico** per Mondial Service Srl,
impresa di ristrutturazioni attiva a Bologna e provincia.
Stack: **HTML + CSS + JS** con Three.js, GSAP/ScrollTrigger e Lenis (tutto vendorizzato,
nessuna build necessaria). Mobile-first.

## Anteprima locale

Serve un server statico (i moduli ES non girano da `file://`):

```bash
python3 -m http.server 8000    # dalla root del progetto
# poi apri http://localhost:8000
```

In alternativa apri `anteprima-standalone.html` con doppio click: è il sito intero
impacchettato in un unico file, senza bisogno di server.

## Struttura

| Percorso | Contenuto |
|---|---|
| `index.html` | Pagina unica: preloader, intro porta, hero, servizi, portfolio, recensione, contatti, footer |
| `assets/css/main.css` | Design system dark luxury (navy `#0A1220`, oro `#F5A623` chirurgico, beige raro) |
| `assets/js/app.js` | Preloader, intro, Lenis, reveal a maschere, parallax, cursore custom, magnetic, form |
| `assets/js/webgl.js` | Three.js: porta 3D dell'intro + galleria a distorsione liquida (un solo renderer) |
| `assets/vendor/` | three, gsap, ScrollTrigger, lenis (self-hosted) |
| `assets/fonts/` | Bodoni Moda (display) + Jost (testo), woff2 variabili self-hosted |
| `assets/img/` | `logo.png` (ufficiale), `hero.jpg`, `portfolio-1..7.jpg` (segnaposto da sovrascrivere) |
| `assets/video/` | Qui va il video reale `intro-porta.mp4` |
| `CONTENUTI-DA-SOSTITUIRE.md` | **Leggilo**: elenco dei contenuti reali da reinserire |

## Art direction

- Palette: navy quasi nero `#0A1220`, oro `#F5A623` usato solo per linee sottili e dettagli,
  beige caldo (`#EFE7D8`) solo nella sezione recensione.
- Tipografia (skill ui-ux-pro-max, "Exaggerated Minimalism"): **Bodoni Moda** enorme per i
  titoli, **Jost** per testi e label maiuscole a tracking largo.
- Header: solo wordmark testuale "MONDIAL SERVICE srl"; il logo completo col globo vive
  nel footer, piccolo, su riquadro bianco.
- Una sola cosa protagonista per schermata, molto vuoto, poco testo.

## Motion e 3D

- **Preloader** cinematografico: contatore %, wordmark rivelato, uscita a tendina.
- **Intro**: video della porta (`assets/video/intro-porta.mp4`, rilevato da solo) o porta 3D
  Three.js come fallback; "Salta intro" sempre visibile, timeout di sicurezza, una volta per sessione.
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
- Lazy loading immagini, font self-hosted `font-display: swap`, video `preload="none"`.
- Fallback completi: senza WebGL o con "riduci movimento" il sito è identico nei contenuti.
- Contrasto AA verificato su tutte le coppie, focus visibili, touch target ≥ 44 px, skip link.
- SEO: meta + Open Graph + JSON-LD `HomeAndConstructionBusiness` (riferimento: Bologna e provincia).

## Contatti cablati

- Telefono: `tel:+393297003558` (mostrato come 329 700 3558)
- WhatsApp: `https://wa.me/393297003558` (il form apre WhatsApp col messaggio pronto)
- Sede: Mordano (BO) — riferimento commerciale sempre "Bologna e provincia"

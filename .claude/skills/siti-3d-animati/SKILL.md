---
name: siti-3d-animati
description: "Workflow per siti web animati/3D premium (da 'Guida siti animati' di Vibe Coding Italia + esperienza del progetto Mondial Service). Usare quando si costruisce o rinnova un sito animato, si generano asset video/immagine con AI (Whisk, Veo, Nano Banana), si sostituiscono gli sfondi/video di un sito, o si fa il deploy di un sito statico. Copre: librerie di prompt per hero animati, generazione video di sfondo, integrazione asset nel sito, deploy con Claude Code."
---

# Siti animati premium — workflow e integrazione asset

Distillato dalla guida PDF "Siti web animati premium in 3 step" (Vibe Coding Italia)
e dall'esperienza di costruzione del sito Mondial Service in questo repository.

## Il workflow in 4 fasi

### 1 · Template / direzione (motionsites.ai)
- **motionsites.ai** — libreria gratuita di prompt per hero animati e landing
  (gratis, senza account). Si sceglie un design dalla galleria e si clicca **Copy**:
  si ottiene un prompt pronto da incollare a Claude.
- Uso corretto: come *punto di partenza per la direzione visiva*, sostituendo il
  placeholder col brief reale (es. "un sito per un'impresa di ristrutturazioni premium").
- In questo repo la direzione è già definita: dark luxury `#0A1220` + oro `#F5A623`
  chirurgico + Bodoni Moda/Jost (vedi `README.md` e `design-system/`). Prima di
  cambiare stile, generare comunque il design system con la skill `ui-ux-pro-max`.

### 2 · Costruzione (Claude)
- Incollare il prompt/brief e costruire in HTML/CSS/JS. Le regole che hanno
  funzionato qui: una cosa protagonista per schermata, reveal riga per riga con
  maschere, Lenis + GSAP/ScrollTrigger con `scrub`, un solo `WebGLRenderer`
  per pagina, fallback completi (no-WebGL, `prefers-reduced-motion`, mobile).

### 3 · Asset animati con AI (Whisk / Veo / Nano Banana)
- **labs.google/fx/tools/whisk** (login Google): si carica un'immagine di
  *reference*, si generano 2 immagini con **Nano Banana**, poi **Animate**
  crea il video con **Veo**. Si scarica il video e si chiede a Claude di
  sostituire lo sfondo/asset con quel file.
- Reference utile: uno screenshot del sito attuale o dei segnaposto in
  `assets/img/` mantiene coerenza di palette e inquadratura.
- Prompt tips per il mood dark luxury di questo progetto: "cinematic interior,
  near-black navy ambience, single warm golden light source, film grain,
  slow dolly, no people, no text". Formato 16:10 o 16:9, loop breve (4–8 s).

### 4 · Deploy (Claude Code)
- Installazione CLI: `curl -fsSL https://claude.ai/install.sh | bash`
- Chiedere a Claude Code il deploy su **Vercel** (sito statico: nessuna build,
  la root del repo è già servibile così com'è). In alternativa: GitHub Pages.

## Integrazione asset in QUESTO repository (drop-in, zero codice)

| Asset | Percorso esatto | Note |
|---|---|---|
| Video intro porta | `assets/video/intro-porta.mp4` | Rilevato da solo al load; se assente parte la porta 3D Three.js. MP4 H.264, ~4-5 MB max, muto |
| Hero | `assets/img/hero.jpg` | ~1600×1000+; il trattamento scuro/caldo/vignettato è applicato da CSS e shader |
| Portfolio | `assets/img/portfolio-1.jpg` … `portfolio-7.jpg` | Stesso discorso: sovrascrivere i file e basta |
| Logo | `assets/img/logo.png` (originale) + `logo-footer.png` (ottimizzato 440px) | Il footer usa la versione ottimizzata |

Dopo ogni sostituzione: ricostruire `anteprima-standalone.html` se serve la
versione a file unico, e verificare peso/lazy loading (video `preload="none"`,
immagini `loading="lazy"` tranne la hero).

## Regole di qualità (imparate sul campo, da non ripetere come errori)

- **Texture WebGL + ShaderMaterial**: non impostare `tex.colorSpace = SRGBColorSpace`
  se lo shader scrive `gl_FragColor` grezzo — l'immagine esce scurita (doppio decode).
- **Un solo renderer WebGL** per pagina: riusarlo tra intro e galleria (limite
  contesti GPU su mobile).
- **`hidden` + `display`**: una classe con `display:grid/flex` vince
  sull'attributo `hidden` — aggiungere sempre `.classe[hidden]{display:none}`.
- Titoli enormi: verificare che a 1440×900 il blocco hero (titolo+payoff+CTA)
  stia nel viewport; `clamp()` con max ~8rem.
- Galleria con transform 3D: `overflow-x: clip` sul contenitore e su `html`,
  o la pagina scorre in orizzontale su mobile.
- Cursore custom: nasconderlo finché non arriva il primo `pointermove`
  (altrimenti appare fisso in alto a sinistra).
- Sempre: contrasti AA verificati a calcolo, `prefers-reduced-motion` che
  disattiva intro/parallax/cursor, test a 390/768/1440, zero errori console.

## Fonte

Guida originale: PDF "Siti web animati premium in 3 step" — Vibe Coding Italia
(vibe-coding-italia.vercel.app). Strumenti citati: motionsites.ai · claude.ai ·
labs.google/fx/tools/whisk · claude.com/product/claude-code.

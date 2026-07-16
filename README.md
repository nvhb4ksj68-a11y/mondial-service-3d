# Mondial Service Srl — sito 3D immersivo

Ricostruzione in chiave 3D del sito di **Mondial Service Srl**, impresa di ristrutturazioni
premium attiva a Bologna e provincia. Stack: **HTML + CSS + JavaScript con Three.js**
(vendorizzato, nessuna build necessaria), mobile-first.

## Anteprima locale

Serve un server statico (i moduli ES non funzionano da `file://`):

```bash
cd mondial-service-3d
python3 -m http.server 8000
# poi apri http://localhost:8000
```

oppure `npx serve .` se preferisci Node.

## Cosa c'è dentro

| Percorso | Contenuto |
|---|---|
| `index.html` | Pagina unica: intro, hero, servizi, portfolio, recensione, contatti, footer |
| `assets/css/main.css` | Design system (palette navy `#0F1B2E` / oro `#F5A623` / beige) e layout |
| `assets/js/main.js` | Intro, navbar, reveal, tilt 3D delle card, galleria 3D, form WhatsApp, parallax |
| `assets/js/scene.js` | Scene Three.js: porta che si apre (intro) e fondale architettonico dell'hero |
| `assets/vendor/` | `three.module.min.js`, `gsap.min.js`, `ScrollTrigger.min.js` (self-hosted) |
| `assets/fonts/` | Playfair Display + Inter (woff2 variabili, self-hosted) |
| `assets/img/portfolio/` | 7 tavole segnaposto da sostituire con le foto reali |
| `assets/video/` | Qui va il video reale `intro-porta.mp4` (vedi il README nella cartella) |
| `design-system/` | Design system generato dalla skill ui-ux-pro-max |
| `CONTENUTI-DA-SOSTITUIRE.md` | **Leggilo**: elenco dei contenuti reali da reinserire |

## Caratteristiche 3D

- **Intro**: video della porta che si apre (se presente in `assets/video/intro-porta.mp4`),
  altrimenti porta 3D animata in Three.js; pulsante **Salta intro** sempre visibile,
  timeout di sicurezza a 9 s, mostrata una sola volta per sessione.
- **Hero**: scena Three.js con volumi architettonici in wireframe dorato e pulviscolo,
  parallax legato a puntatore/touch e allo scroll.
- **Card servizi**: tilt 3D con riflesso dorato che segue il puntatore (anche al tocco).
- **Portfolio**: galleria coverflow 3D con trascinamento/swipe, frecce, tastiera e
  indicatori; annunci `aria-live` per gli screen reader.
- **Scroll**: parallax di profondità tra le sezioni con GSAP ScrollTrigger (`scrub`).

## Performance e accessibilità

- Un solo `WebGLRenderer` per la pagina, DPR limitato a 2, rendering in pausa quando
  l'hero non è visibile o la scheda è in background.
- **Fallback senza WebGL**: fondale sfumato CSS + intro solo video (o nessuna intro).
- `prefers-reduced-motion`: intro saltata, tilt/parallax disattivati.
- Lazy loading di immagini e mappa (caricata solo su richiesta), font self-hosted
  con `font-display: swap`, video `preload="none"`.
- Contrasto AA sulla palette, focus visibili, touch target ≥ 44 px, skip link.
- SEO: meta description/keywords, geo tag Bologna, Open Graph, JSON-LD `HomeAndConstructionBusiness`.

## Contatti cablati nel sito

- Telefono: `tel:+393297003558` (mostrato come 329 700 3558)
- WhatsApp: `https://wa.me/393297003558` (il form preventivo apre WhatsApp con il messaggio pronto)

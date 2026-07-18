# ⚠️ Contenuti da sostituire con quelli reali

Il sito originale (`https://mondialservice.readdy.co`) non era raggiungibile dall'ambiente
di sviluppo (dominio bloccato dalla policy di rete). Questi contenuti sono **segnaposto**:

## 1. Video e scene (✅ fatti — render AI via Kling 3.0)
- L'intro (`assets/video/intro-porta.mp4/.webm`) è un video normale: per sostituirlo
  con una ripresa reale basta sovrascrivere i due file.
- Le scene guidate dallo scroll (hero cantiere + capitoli porta/living/cucina/bagno)
  sono **sequenze di fotogrammi WebP** in `assets/frames/<scena>/`. Per sostituirle
  con riprese reali, estrarre i fotogrammi dal nuovo video (stesso numero di frame
  o aggiornare `manifest.json`):
  `ffmpeg -i clip.mp4 -vf "fps=12,scale=1280:-2" -f image2 -c:v libwebp -quality 80 frame-%03d.webp`
  e la variante mobile 720px in `<scena>/m/`.

## 2. Foto portfolio
- `portfolio-1…4.jpg` sono fotogrammi dei render AI; `portfolio-5/6/7.jpg` sono ancora
  tavole segnaposto. Sostituiscili con foto reali dei lavori quando disponibili
  (stesso nome file, ≈1600×1000): il trattamento scuro/caldo lo applica il sito.
- ⚠️ I render AI mostrano interni *verosimili ma non reali*: per correttezza verso i
  clienti, appena possibile usare foto vere dei cantieri nel portfolio.

## 3. Recensione
- In `index.html`, sezione `#recensioni` (commento `TODO`): il testo tra «…» è segnaposto
  e la firma è generica ("Un cliente, Bologna"). Quando c'è una recensione Google reale,
  incolla il testo, il nome e ripristina pure il badge/stelle Google.

## 4. P.IVA nel footer
- `P.IVA [DA INSERIRE]` in fondo a `index.html` è un segnaposto (commento `TODO`).
  Non è stato possibile verificare online la P.IVA della Mondial Service di Mordano/Bologna.

## 5. Indirizzo sede
- Nei contatti c'è "Sede: Mordano (BO)": aggiungi via e numero civico se vuoi
  (anche nel JSON-LD in `<head>`, campo `address`).

## 6. Canonical / dominio
- `<link rel="canonical">` e i meta `og:` puntano a `https://mondialservice.readdy.co/`:
  aggiornali quando il sito andrà su un dominio proprio.

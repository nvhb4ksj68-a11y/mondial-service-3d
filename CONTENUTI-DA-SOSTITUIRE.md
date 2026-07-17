# ⚠️ Contenuti da sostituire con quelli reali

Il sito originale (`https://mondialservice.readdy.co`) non era raggiungibile dall'ambiente
di sviluppo (dominio bloccato dalla policy di rete). Questi contenuti sono **segnaposto**:

## 1. Video (✅ fatti — render AI via Kling 3.0)
- `intro-porta` (porta che si apre), `hero-loop` (walkthrough 15 s) e le tre scene
  dei capitoli (`scene-living/cucina/bagno`) sono render AI fotorealistici già montati.
- Per sostituirli con riprese reali basta sovrascrivere i file mp4+webm in `assets/video/`
  (per le scene capitolo ricodificare con keyframe fitti: `ffmpeg … -g 8`).

## 2. Foto portfolio
- `portfolio-1…4.jpg` sono fotogrammi dei render AI; `portfolio-5/6/7.jpg` sono ancora
  tavole segnaposto. Sostituiscili con foto reali dei lavori quando disponibili
  (stesso nome file, ≈1600×1000): il trattamento scuro/caldo lo applica il sito.
- ⚠️ I render AI mostrano interni *verosimili ma non reali*: per correttezza verso i
  clienti, appena possibile usare foto vere dei cantieri nel portfolio.

## 3. Recensione Google
- In `index.html`, sezione `#recensioni` (commento `TODO`): il testo tra «…» è segnaposto.
  Incolla la recensione reale.

## 4. P.IVA nel footer
- `P.IVA 00000000000` in fondo a `index.html` è un segnaposto (commento `TODO`).
  Non è stato possibile verificare online la P.IVA della Mondial Service di Mordano/Bologna.

## 5. Indirizzo sede
- Nei contatti c'è "Sede: Mordano (BO)": aggiungi via e numero civico se vuoi
  (anche nel JSON-LD in `<head>`, campo `address`).

## 6. Canonical / dominio
- `<link rel="canonical">` e i meta `og:` puntano a `https://mondialservice.readdy.co/`:
  aggiornali quando il sito andrà su un dominio proprio.

# ⚠️ Contenuti da sostituire con quelli reali

Il sito originale (`https://mondialservice.readdy.co`) non era raggiungibile dall'ambiente
di sviluppo (dominio bloccato dalla policy di rete). Questi contenuti sono **segnaposto**:

## 1. Video intro (porta che si apre)
- Copia il video del sito attuale in `assets/video/intro-porta.mp4`.
- Finché manca, l'intro usa la porta 3D animata (Three.js) con lo stesso pulsante "Salta intro".
- Dettagli in `assets/video/README.md`.

## 2. Foto (hero + 7 progetti)
- Ora in `assets/img/` ci sono render segnaposto in stile dark luxury con i **nomi definitivi**:
  `hero.jpg`, `portfolio-1.jpg` … `portfolio-7.jpg` (≈1600×1000, il trattamento
  scuro/caldo/vignettato viene applicato da CSS e shader, quindi vanno bene anche foto normali).
- Per sostituirli basta **sovrascrivere i file** con lo stesso nome: nessuna modifica al codice.
- Verifica poi che titoli e tag dei progetti in `index.html` corrispondano ai lavori reali.

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

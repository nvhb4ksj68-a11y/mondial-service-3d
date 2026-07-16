# ⚠️ Contenuti da sostituire con quelli reali

Il sito originale (`https://mondialservice.readdy.co`) **non era raggiungibile** dall'ambiente di
sviluppo (dominio bloccato dalla policy di rete, nessuna copia in cache o su archive.org).
Struttura, testi e palette seguono la descrizione fornita, ma questi contenuti sono
**segnaposto** e vanno sostituiti con gli originali:

## 1. Video intro (porta che si apre)
- Scarica il video dal sito attuale e copialo in `assets/video/intro-porta.mp4`.
- Finché manca, l'intro usa una porta 3D animata (Three.js) come fallback automatico.
- Dettagli in `assets/video/README.md`.

## 2. Le 7 foto del portfolio
- Ora in `assets/img/portfolio/01.svg … 07.svg` ci sono tavole grafiche segnaposto.
- Sostituiscile con le foto reali (idealmente `.webp` o `.jpg`, ~1200×900) e aggiorna
  i `src`, gli `alt` e le `figcaption` dei 7 `<figure class="gallery__item">` in `index.html`.
- Verifica anche che i titoli dei progetti (es. "Cucina su misura") corrispondano ai reali.

## 3. Recensione Google
- In `index.html`, sezione `#recensioni`: il testo tra `«…»` e il nome dell'autore sono
  segnaposto (cerca il commento `TODO` nel file). Incolla la recensione reale dal sito attuale.

## 4. P.IVA nel footer
- In `index.html`, footer: `P.IVA 00000000000` è un segnaposto (commento `TODO` accanto).
- Non è stato possibile verificare online la P.IVA della Mondial Service Srl di Bologna
  (le omonime trovate sono di Napoli e Milano): inserire quella riportata sul sito attuale.

## 5. Testi delle card servizi e hero
- Titoli hero e card corrispondono a quelli indicati ("Ristrutturiamo case. Costruiamo
  eccellenza.", "Ristrutturazioni chiavi in mano", ecc.).
- Le **descrizioni** delle card e il sottotitolo dell'hero sono stati riscritti in tono
  premium coerente: confrontali con i testi reali del sito e allineali se differiscono.

## 6. Canonical / dominio
- Il tag `<link rel="canonical">` e le URL nei meta `og:` puntano a
  `https://mondialservice.readdy.co/`: aggiornali se il sito verrà pubblicato su un
  dominio proprio (es. `mondialservicebologna.it`).

## 7. Indirizzo e mappa
- La mappa (caricata su richiesta) inquadra Bologna in generale. Se esiste una sede
  fisica da mostrare, aggiorna la query dell'iframe in `assets/js/main.js`
  (funzione del pulsante `map-load`) e l'indirizzo nel JSON-LD in `index.html`.

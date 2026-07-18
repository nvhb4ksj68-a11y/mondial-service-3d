/* Mondial Service — motore scroll-scrub a sequenza di fotogrammi su canvas
   (tecnica delle pagine prodotto Apple).

   Per ogni scena: i frame WebP vengono precaricati quando la sezione è a
   ~1 viewport di distanza, decodificati con createImageBitmap dove c'è,
   e disegnati SOLO dentro requestAnimationFrame. Lo scroll aggiorna solo
   una variabile `target` (0..1): il disegno replica object-fit: cover.

   Nessuna dipendenza esterna. */

const DPR = Math.min(window.devicePixelRatio || 1, 2);
// Variante mobile 720p SOLO sotto i 768px: da 768px in su si servono
// sempre i fotogrammi desktop a 1440px (nessun 720p sui monitor grandi).
const IS_MOBILE = window.matchMedia('(max-width: 767.98px)').matches;

/* Disegna l'immagine coprendo il canvas senza distorcere (object-fit: cover) */
function drawCover(ctx, img, cw, ch) {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

async function decode(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frame ${url}: ${res.status}`);
  const blob = await res.blob();
  if ('createImageBitmap' in window) {
    return createImageBitmap(blob);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

export class ScrubScene {
  /**
   * @param canvas  <canvas> della scena
   * @param manifestUrl  manifest.json della sequenza
   * @param opts { idlePlay, idleFps, reducedMotion, onReady }
   *   idlePlay: a riposo (target≈0 e mai scrollato) la scena avanza da sola
   *   reducedMotion: mostra solo il fotogramma finale, statico
   */
  constructor(canvas, manifestUrl, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.manifestUrl = manifestUrl;
    this.opts = opts;
    this.frames = [];
    this.loaded = 0;
    this.count = 0;
    this.target = 0;
    this.lastIndex = -1;
    this.failed = false;
    this.idleClock = 0;
    this.userScrolled = false;
    this.started = false;

    this.resize();
    window.addEventListener('resize', () => { this.resize(); this.lastIndex = -1; });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    // Il backing non supera la risoluzione utile dei fotogrammi sorgente
    // (1280px desktop, 720px mobile): oltre è solo costo di disegno in più.
    const maxW = IS_MOBILE ? 828 : 1500;
    const maxH = IS_MOBILE ? 1024 : 1500;
    const scale = Math.min(DPR, maxW / Math.max(rect.width, 1), maxH / Math.max(rect.height, 1));
    this.cw = Math.round(rect.width * scale);
    this.ch = Math.round(rect.height * scale);
    this.canvas.width = this.cw;
    this.canvas.height = this.ch;
  }

  frameUrl(m, i) {
    const base = IS_MOBILE ? m.pathMobile : m.path;
    return `${base}${m.prefix}${String(i + 1).padStart(m.pad, '0')}${m.ext}`;
  }

  /* Avvia il caricamento: prima il primo frame (poster), poi il resto in
     sequenza. Il disegno parte appena c'è qualcosa da mostrare. */
  async start() {
    if (this.started) return;
    this.started = true;
    try {
      const m = await (await fetch(this.manifestUrl)).json();
      this.count = m.count;
      this.frames = new Array(m.count).fill(null);

      if (this.opts.reducedMotion) {
        // Solo il fotogramma finale, statico
        this.frames[m.count - 1] = await decode(this.frameUrl(m, m.count - 1));
        this.draw(m.count - 1);
        return;
      }

      // Primo frame subito: mai canvas nero
      this.frames[0] = await decode(this.frameUrl(m, 0));
      this.loaded = 1;
      this.draw(0);
      this.loop();

      // Il resto in sequenza, senza saturare la rete (4 alla volta)
      const BATCH = 4;
      for (let i = 1; i < m.count; i += BATCH) {
        const jobs = [];
        for (let j = i; j < Math.min(i + BATCH, m.count); j++) {
          jobs.push(decode(this.frameUrl(m, j)).then((img) => {
            this.frames[j] = img;
            this.loaded = Math.max(this.loaded, j + 1);
          }));
        }
        await Promise.all(jobs);
      }
    } catch {
      // Rete lenta o frame mancanti: resta il poster/primo frame, testo leggibile
      this.failed = true;
    }
  }

  /* target 0..1 dall'esterno (ScrollTrigger). */
  setProgress(p, fromUser = true) {
    this.target = p;
    if (fromUser && p > 0.004) this.userScrolled = true;
  }

  /* Indice più vicino DISPONIBILE: mai buchi, mai nero */
  nearestLoaded(index) {
    if (this.frames[index]) return index;
    for (let d = 1; d < this.count; d++) {
      if (index - d >= 0 && this.frames[index - d]) return index - d;
      if (index + d < this.count && this.frames[index + d]) return index + d;
    }
    return -1;
  }

  draw(index) {
    const img = this.frames[index];
    if (!img) return;
    // Niente clearRect: il disegno "cover" copre sempre l'intero canvas
    drawCover(this.ctx, img, this.cw, this.ch);
    this.lastIndex = index;
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    if (!this.count || this.failed) return;

    let progress = this.target;

    // A riposo la scena avanza da sola (usato dall'hero: la casa si
    // costruisce anche senza scroll, e si ferma sull'ultimo frame)
    if (this.opts.idlePlay && !this.userScrolled) {
      this.idleClock = Math.min(this.idleClock + (this.opts.idleFps || 12) / 60 / this.count, 1);
      progress = this.idleClock;
    }

    const wanted = Math.min(this.count - 1, Math.round(progress * (this.count - 1)));
    const index = this.nearestLoaded(wanted);
    if (index !== -1 && index !== this.lastIndex) this.draw(index);
  }
}

/* Precarica una scena quando entra a ~1 viewport di distanza */
export function lazyStart(scene, watchedEl) {
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    scene.start();
  }, { rootMargin: '100% 0px' }).observe(watchedEl);
}

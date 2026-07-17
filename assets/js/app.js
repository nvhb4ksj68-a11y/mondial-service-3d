/* Mondial Service — orchestrazione
   Preloader → intro porta (video o 3D) → hero. Lenis + GSAP/ScrollTrigger,
   reveal con maschere riga per riga, parallax multi-velocità, cursore custom,
   magnetic buttons, galleria WebGL a distorsione liquida (con fallback). */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const supportsWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
})();

if (reducedMotion) document.body.classList.add('no-motion');

// Hero video-first: con "riduci movimento" resta il poster fermo
const heroVideo = document.getElementById('hero-video');
if (heroVideo && reducedMotion) {
  heroVideo.removeAttribute('autoplay');
  heroVideo.pause();
}

let webglMod = null;
async function getWebgl() {
  if (!webglMod) webglMod = await import('./webgl.js');
  return webglMod;
}

/* ============================== SPLIT RIGHE ============================== */
/* Divide un titolo in righe visive, ognuna in una maschera overflow:hidden. */

function splitLines(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';

  const tokens = [];
  (function walk(node, italic) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/\s+/).filter(Boolean)
          .forEach((word) => tokens.push({ word, italic, br: false }));
      } else if (child.nodeName === 'BR') {
        tokens.push({ br: true });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, italic || child.nodeName === 'EM' || child.nodeName === 'I');
      }
    });
  })(el, false);

  // Fase di misura: una span per parola
  el.textContent = '';
  const probes = tokens.map((t) => {
    if (t.br) {
      const br = document.createElement('br');
      el.appendChild(br);
      return { ...t, node: br };
    }
    const s = document.createElement('span');
    s.style.display = 'inline-block';
    if (t.italic) s.style.fontStyle = 'italic';
    s.textContent = t.word;
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    return { ...t, node: s };
  });

  const lines = [];
  let line = null;
  let lastTop = null;
  probes.forEach((t) => {
    if (t.br) { lastTop = null; return; }
    const top = t.node.offsetTop;
    if (top !== lastTop) {
      line = [];
      lines.push(line);
      lastTop = top;
    }
    line.push(t);
  });

  // Ricostruzione: .split-line > span (la span scorre dentro la maschera)
  el.textContent = '';
  lines.forEach((words) => {
    const mask = document.createElement('span');
    mask.className = 'split-line';
    const inner = document.createElement('span');
    words.forEach(({ word, italic }, i) => {
      const w = italic ? document.createElement('em') : document.createTextNode('');
      if (italic) { w.textContent = (i ? ' ' : '') + word; inner.appendChild(w); }
      else inner.appendChild(document.createTextNode((i ? ' ' : '') + word));
    });
    mask.appendChild(inner);
    el.appendChild(mask);
  });
}

function revealLines(el, opts = {}) {
  const spans = el.querySelectorAll('.split-line > span');
  return gsap.to(spans, {
    y: 0,
    yPercent: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    delay: opts.delay || 0,
    onComplete: () => el.classList.add('lines-in'),
  });
}

/* ============================== PRELOADER ============================== */

const preloader = document.getElementById('preloader');
const countEl = document.getElementById('preloader-count');

function runPreloader() {
  return new Promise((resolve) => {
    if (reducedMotion) {
      preloader.classList.add('preloader--done');
      resolve();
      return;
    }
    const word = preloader.querySelector('.preloader__word');
    const rule = preloader.querySelector('.preloader__rule');
    gsap.from(word, { yPercent: 110, duration: 1, ease: 'power4.out', delay: 0.15 });
    gsap.to(rule, { scaleX: 1, duration: 1.4, ease: 'power2.inOut', delay: 0.3 });

    const state = { v: 0 };
    const loaded = new Promise((r) => {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });

    gsap.to(state, {
      v: 100,
      duration: 1.7,
      ease: 'power2.out',
      onUpdate: () => { countEl.textContent = Math.round(state.v); },
      onComplete: async () => {
        await loaded;
        gsap.to(preloader, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.85,
          ease: 'power3.inOut',
          onComplete: () => {
            preloader.classList.add('preloader--done');
            resolve();
          },
        });
      },
    });
  });
}

/* ============================== INTRO PORTA ============================== */

const intro = document.getElementById('intro');
const introVideo = document.getElementById('intro-video');
let introEnded = false;

function endIntro(onAfter) {
  if (introEnded) return;
  introEnded = true;
  intro.classList.add('intro--done');
  document.body.classList.remove('intro-locked');
  try { sessionStorage.setItem('ms-intro-seen', '1'); } catch { /* storage off */ }
  if (introVideo) { introVideo.pause(); introVideo.removeAttribute('src'); }
  getWebgl().then((m) => m.stopIntro()).catch(() => {});
  window.setTimeout(() => intro.classList.add('intro--off'), 800);
  onAfter?.();
}

async function runIntro() {
  const seen = (() => {
    try { return sessionStorage.getItem('ms-intro-seen') === '1'; } catch { return false; }
  })();

  if (seen || reducedMotion) {
    intro.classList.add('intro--off');
    return;
  }

  document.body.classList.add('intro-locked');
  return new Promise((resolve) => {
    const finish = () => endIntro(resolve);
    document.getElementById('intro-skip').addEventListener('click', finish);
    window.setTimeout(finish, 9500); // l'intro non blocca mai la pagina

    (async () => {
      let hasVideo = false;
      try {
        const res = await fetch('assets/video/intro-porta.mp4', { method: 'HEAD' });
        hasVideo = res.ok && /video/.test(res.headers.get('content-type') || 'video');
      } catch { /* file assente o file:// */ }

      if (hasVideo) {
        intro.classList.add('intro--video');
        introVideo.preload = 'auto';
        introVideo.addEventListener('ended', finish);
        introVideo.addEventListener('error', finish);
        try { await introVideo.play(); } catch { finish(); }
        return;
      }
      if (supportsWebGL) {
        try {
          const m = await getWebgl();
          m.playDoorIntro(document.getElementById('intro-canvas-slot'), finish);
          return;
        } catch { /* niente WebGL: chiudi subito */ }
      }
      window.setTimeout(finish, 1200);
    })();
  });
}

/* ============================== LENIS ============================== */

let lenis = null;
function initLenis() {
  if (reducedMotion || !window.Lenis) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  window.__lenis = lenis; // esposto per test/debug
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: -64, duration: 1.4 });
  else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  if (hash.length < 2) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(hash);
  history.replaceState(null, '', hash);
});

/* ============================== HEADER + MENU ============================== */

const head = document.getElementById('site-head');
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');

function syncHead() {
  head.classList.toggle('is-scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', syncHead, { passive: true });

function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Apri il menu');
  lenis?.start();
}
burger.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  if (open) {
    lenis?.stop();
    if (!reducedMotion) {
      gsap.fromTo(menu.querySelectorAll('.menu__nav a'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
    }
  } else {
    lenis?.start();
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// Voce di navigazione attiva
const navLinks = [...document.querySelectorAll('[data-nav]')];
const watched = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) =>
      a.setAttribute('aria-current', String(a.getAttribute('href') === `#${entry.target.id}`)));
  });
}, { rootMargin: '-35% 0px -55% 0px' });
watched.forEach((s) => navObserver.observe(s));

/* ============================== SCROLL SCENOGRAPHY ============================== */

function initScrollFx() {
  gsap.registerPlugin(ScrollTrigger);

  // Reveal dei titoli fuori dall'hero
  document.querySelectorAll('[data-lines]').forEach((el) => {
    if (el.closest('.hero') || el.closest('.chapter')) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => revealLines(el),
    });
  });

  // Fade degli elementi secondari
  document.querySelectorAll('[data-fade]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Parallax multi-velocità
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      yPercent: parseFloat(el.dataset.parallax),
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  });
  document.querySelectorAll('.project__media img').forEach((img, i) => {
    gsap.fromTo(img, { yPercent: 5 + (i % 3) * 2.5 }, {
      yPercent: -(5 + (i % 3) * 2.5),
      ease: 'none',
      scrollTrigger: { trigger: img.closest('.project'), start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    });
  });

  // Cambio progressivo del colore di fondo tra le sezioni
  const bgSteps = [
    ['#portfolio', '#070D18'],
    ['#contatti', '#0A1220'],
  ];
  bgSteps.forEach(([sel, color]) => {
    gsap.to('.page-bg', {
      backgroundColor: color,
      ease: 'none',
      scrollTrigger: { trigger: sel, start: 'top 75%', end: 'top 25%', scrub: true },
    });
  });

  // La parentesi chiara si apre con un clip-path
  gsap.fromTo('.review',
    { clipPath: 'inset(8% 5% round 3px)' },
    {
      clipPath: 'inset(0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: '.review', start: 'top 90%', end: 'top 30%', scrub: true },
    });

  // I numeri dei pannelli scorrono leggermente più veloci del pannello
  document.querySelectorAll('.panel__index').forEach((el) => {
    gsap.fromTo(el, { yPercent: 24 }, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: { trigger: el.closest('.panel'), start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });
}

/* ============================== HERO REVEAL ============================== */

function revealHero() {
  const hero = document.querySelector('.hero');
  const title = hero.querySelector('[data-lines]');
  if (reducedMotion) return;
  const tl = gsap.timeline();
  tl.fromTo(hero.querySelector('.hero__media video, .hero__media img'),
    { scale: 1.06 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0);
  tl.add(revealLines(title), 0.15);
  tl.to(hero.querySelectorAll('[data-fade]'),
    { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.55);
}

/* ============================== CURSORE + MAGNETIC ============================== */

function initCursor() {
  if (!finePointer || reducedMotion) return;
  document.body.classList.add('cursor-on');
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power2.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power2.out' });

  window.addEventListener('pointermove', (e) => {
    document.body.classList.add('cursor-live');
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    const media = e.target.closest('.project__media');
    const link = e.target.closest('a, button');
    ring.classList.toggle('is-view', !!media);
    ring.classList.toggle('is-link', !!link && !media);
    label.textContent = media ? 'Vedi' : '';
  }, { passive: true });
}

function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 8;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
    });
  });
}

/* ============================== GALLERIA LIQUIDA ============================== */

async function initLiquid() {
  const heavyOk = finePointer && !reducedMotion && supportsWebGL && window.innerWidth >= 980
    && (navigator.deviceMemory === undefined || navigator.deviceMemory >= 4);
  if (!heavyOk) return; // fallback: immagini native con zoom CSS
  try {
    const m = await getWebgl();
    m.initLiquidGallery([...document.querySelectorAll('.project__media')]);
  } catch { /* fallback CSS */ }
}

/* ============================== CAPITOLI SCROLL-SCRUB ============================== */
/* Lo scroll guida il tempo del video: il target segue ScrollTrigger, un rAF
   ammorbidisce i seek (mai più di ~30/s) così il video resta fluido anche
   su mobile. I file sono ricodificati con keyframe fitti apposta. */

function initChapters() {
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  if (!chapters.length) return;

  // Senza motion (o senza dati video) i capitoli restano poster statici
  const scrubOk = !reducedMotion;
  if (!scrubOk) {
    document.body.classList.add('no-scrub');
    return;
  }

  chapters.forEach((chapter) => {
    const video = chapter.querySelector('.chapter__video');
    const bar = chapter.querySelector('.chapter__progress i');
    let target = 0;
    let current = -1;
    let duration = 0;
    let failed = false;

    // L'errore di una <source> non risale al <video>: si ascolta l'ultima
    const lastSource = video.querySelector('source:last-of-type');
    (lastSource || video).addEventListener('error', () => {
      failed = true;
      chapter.classList.add('chapter--novideo');
    }, { once: true });

    const ready = () => { duration = video.duration || 0; };
    if (video.readyState >= 1) ready();
    video.addEventListener('loadedmetadata', ready);
    video.addEventListener('durationchange', ready);

    // Se la selezione della sorgente si è arenata (es. primo codec rifiutato),
    // un load() esplicito la riavvia; parte poco prima che il capitolo entri in vista.
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 130%',
      once: true,
      onEnter: () => {
        if (video.readyState === 0) { try { video.load(); } catch { /* ok */ } }
      },
    });

    ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        target = self.progress;
        if (bar) bar.style.transform = `scaleY(${self.progress.toFixed(3)})`;
      },
    });

    // Reveal del titolo alla prima entrata (il resto lo fa il video)
    const title = chapter.querySelector('[data-lines]');
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 55%',
      once: true,
      onEnter: () => revealLines(title),
    });

    // La copy respira con lo scrub: entra, resta, esce (stile pagine prodotto)
    const copy = chapter.querySelector('.chapter__copy');
    gsap.timeline({
      scrollTrigger: { trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    })
      .fromTo(copy, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.02)
      .to(copy, { autoAlpha: 0, y: -30, duration: 0.12 }, 0.86);

    function tick() {
      requestAnimationFrame(tick);
      if (failed || !duration) return;
      const t = target * Math.max(duration - 0.08, 0);
      if (Math.abs(t - current) < 0.033) return; // niente seek inutili
      current = t;
      try { video.currentTime = t; } catch { /* metadata non pronti */ }
    }
    requestAnimationFrame(tick);
  });
}

/* ============================== CTA BAR ============================== */

const ctaBar = document.getElementById('cta-bar');
let heroSeen = true;
let contactSeen = false;
function syncCta() {
  ctaBar.classList.toggle('is-visible', !heroSeen && !contactSeen);
}
new IntersectionObserver((en) => { heroSeen = en[0].isIntersecting; syncCta(); }, { threshold: 0.1 })
  .observe(document.getElementById('hero'));
new IntersectionObserver((en) => { contactSeen = en[0].isIntersecting; syncCta(); }, { threshold: 0.1 })
  .observe(document.getElementById('contatti'));

/* ============================== FORM → WHATSAPP ============================== */

const form = document.getElementById('quote-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const checks = [
    ['f-name', (v) => v.trim().length >= 2],
    ['f-phone', (v) => /[\d\s+()-]{6,}/.test(v.trim())],
    ['f-msg', (v) => v.trim().length >= 5],
  ];
  let firstBad = null;
  checks.forEach(([id, ok]) => {
    const input = document.getElementById(id);
    const good = ok(input.value);
    document.getElementById(`${id}-err`).hidden = good;
    input.closest('.field').classList.toggle('has-error', !good);
    input.setAttribute('aria-invalid', String(!good));
    if (!good && !firstBad) firstBad = input;
  });
  if (firstBad) { firstBad.focus(); return; }
  const msg = `Buongiorno, sono ${form.name.value.trim()}.%0A` +
    `Vorrei un preventivo per: ${encodeURIComponent(form.message.value.trim())}%0A` +
    `Potete richiamarmi al ${encodeURIComponent(form.phone.value.trim())}? Grazie.`;
  window.open(`https://wa.me/393297003558?text=${msg.replaceAll(' ', '%20')}`, '_blank', 'noopener');
});
['f-name', 'f-phone', 'f-msg'].forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener('blur', () => {
    if (!input.value.trim()) return;
    input.closest('.field').classList.remove('has-error');
    document.getElementById(`${id}-err`).hidden = true;
    input.setAttribute('aria-invalid', 'false');
  });
});

/* ============================== BOOT ============================== */

(async function boot() {
  gsap.registerPlugin(ScrollTrigger);

  // Split subito dopo i font, così le righe misurate sono definitive
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]); } catch { }
  document.querySelectorAll('[data-lines]').forEach(splitLines);

  initLenis();
  initScrollFx();
  initChapters();
  initCursor();
  initMagnetic();
  syncHead();
  initLiquid();

  await runPreloader();
  document.body.classList.remove('is-loading');
  await runIntro();
  revealHero();
  ScrollTrigger.refresh();
})();

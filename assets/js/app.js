/* Mondial Service — orchestrazione
   Preloader → intro porta (video o 3D) → hero. Lenis + GSAP/ScrollTrigger,
   reveal con maschere riga per riga, parallax multi-velocità, cursore custom,
   magnetic buttons, galleria WebGL a distorsione liquida (con fallback). */

import { ScrubScene, lazyStart } from './scrub.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const supportsWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
})();

if (reducedMotion) document.body.classList.add('no-motion');


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
  // L'intro va mostrata una sola volta per sessione (framework, Fase 4).
  const seen = (() => {
    try { return sessionStorage.getItem('ms-intro-seen') === '1'; } catch { return false; }
  })();
  const skip = seen || new URLSearchParams(location.search).has('nointro');

  if (skip || reducedMotion) {
    intro.classList.add('intro--off');
    return;
  }

  document.body.classList.add('intro-locked');
  return new Promise((resolve) => {
    const finish = () => endIntro(resolve);
    document.getElementById('intro-skip').addEventListener('click', finish);
    window.setTimeout(finish, 6500); // l'intro non blocca mai la pagina

    (async () => {
      const doorFallback = async () => {
        intro.classList.remove('intro--video');
        if (supportsWebGL) {
          try {
            const m = await getWebgl();
            m.playDoorIntro(document.getElementById('intro-canvas-slot'), finish);
            return;
          } catch { /* niente WebGL */ }
        }
        window.setTimeout(finish, 1200);
      };

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
        try {
          await introVideo.play();
        } catch {
          // Autoplay negato (risparmio energetico iOS): il primo tocco fa
          // partire il video; se non arriva, dopo 2.5s entra la porta 3D.
          let resolved = false;
          const tryPlay = () => {
            if (resolved) return;
            introVideo.play().then(() => { resolved = true; }).catch(() => {});
          };
          window.addEventListener('touchstart', tryPlay, { passive: true });
          window.addEventListener('pointerdown', tryPlay, { passive: true });
          window.setTimeout(() => {
            if (!resolved && introVideo.paused && !introEnded) {
              resolved = true;
              doorFallback();
            }
          }, 2500);
        }
        return;
      }
      doorFallback();
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

let lastScrollY = 0;
function syncHead() {
  const y = window.scrollY;
  head.classList.toggle('is-scrolled', y > 40);
  head.classList.toggle('is-hidden', y > 200 && y > lastScrollY && menu.hidden);
  lastScrollY = y;
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
    if (el.closest('.hero') || el.closest('.chapter') || el.closest('.metodo')) return;
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
  tl.fromTo(hero.querySelector('.hero__media video'),
    { scale: 1.06 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0);
  tl.add(revealLines(title), 0.15);
  tl.to(hero.querySelectorAll('[data-fade]'),
    { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 0.55);
}

/* ============================== HERO SCRUB ============================== */
/* Sequenza di fotogrammi su canvas (stile Apple): a riposo la scena avanza
   da sola; appena scorri, lo scroll diventa l'unica fonte di verità. */

function initHeroScrub() {
  const heroCanvas = document.getElementById('hero-canvas');
  if (!heroCanvas) { document.body.classList.add('no-scrub'); return; }

  if (reducedMotion) {
    document.body.classList.add('no-scrub');
    new ScrubScene(heroCanvas, 'assets/frames/cantiere/manifest.json', { reducedMotion: true }).start();
    return;
  }

  const hero = document.querySelector('.hero');
  const bar = document.getElementById('hero-progress');
  const scene = new ScrubScene(heroCanvas, 'assets/frames/cantiere/manifest.json',
    { idlePlay: true, idleFps: 8 });
  scene.start(); // l'hero è subito in vista: parte ora

  // I livelli del testo scivolano via a velocità diverse (parallax multi-strato)
  document.querySelectorAll('[data-hero-layer]').forEach((el) => {
    const speed = parseFloat(el.dataset.heroLayer) || 1;
    gsap.to(el, {
      yPercent: -90 * speed,
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '55% bottom', scrub: true },
    });
  });

  // L'hero esce sfumando a nero, agganciandosi al velo del primo capitolo
  gsap.fromTo('.hero__fade', { opacity: 0 }, {
    opacity: 1,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: '92% bottom', end: 'bottom bottom', scrub: true },
  });

  // Uscendo dall'hero la camera "entra" nella scena successiva
  gsap.to(heroCanvas, {
    scale: 1.12,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: '88% bottom', end: 'bottom bottom', scrub: true },
  });

  gsap.to('.hero__watermark', {
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: '40% bottom', scrub: true },
  });

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      scene.setProgress(self.progress);
      if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(3)})`;
    },
  });
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
/* Ogni capitolo è una sequenza di fotogrammi su canvas. I testi vivono in
   finestre di progresso (0-0.15 ingresso, 0.15-0.85 stabile, 0.85-1 uscita)
   mappate sullo stesso progress del canvas: un'unica fonte di verità. */

function initChapters() {
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  if (!chapters.length) return;

  if (reducedMotion) {
    document.body.classList.add('no-scrub');
    chapters.forEach((chapter) => {
      const canvas = chapter.querySelector('.chapter__canvas');
      if (!canvas) return;
      new ScrubScene(canvas, `assets/frames/${canvas.dataset.scene}/manifest.json`,
        { reducedMotion: true }).start();
    });
    return;
  }

  chapters.forEach((chapter) => {
    const canvas = chapter.querySelector('.chapter__canvas');
    if (!canvas) return;
    const bar = chapter.querySelector('.chapter__progress i');
    const scene = new ScrubScene(canvas, `assets/frames/${canvas.dataset.scene}/manifest.json`);
    lazyStart(scene, chapter); // precarica a ~1 viewport di distanza

    ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        scene.setProgress(self.progress);
        if (bar) bar.style.transform = `scaleY(${self.progress.toFixed(3)})`;
      },
    });

    // Reveal a maschera del titolo alla prima entrata
    const title = chapter.querySelector('[data-lines]');
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 55%',
      once: true,
      onEnter: () => revealLines(title),
    });

    // Finestra della copy: entra 0-0.15, stabile, esce 0.85-1
    const copy = chapter.querySelector('.chapter__copy');
    gsap.timeline({
      scrollTrigger: { trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    })
      .fromTo(copy, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0)
      .to(copy, { autoAlpha: 0, y: -30, duration: 0.15 }, 0.85);

    // Zoom-through: si entra nella scena e la si attraversa uscendo
    gsap.timeline({
      scrollTrigger: { trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    })
      .fromTo(canvas, { scale: 1.14 }, { scale: 1, duration: 0.16 }, 0)
      .to(canvas, { scale: 1.16, duration: 0.14 }, 0.86);

    // Ponte di buio tra le scene
    const fade = chapter.querySelector('.chapter__fade');
    if (fade) {
      gsap.timeline({
        scrollTrigger: { trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true },
        defaults: { ease: 'none' },
      })
        .fromTo(fade, { opacity: 1 }, { opacity: 0, duration: 0.07 }, 0)
        .to(fade, { opacity: 1, duration: 0.07 }, 0.93);
    }

    // La scheda-ambiente arriva quando sei "dentro" la stanza
    const card = chapter.querySelector('.chapter__card');
    if (card) {
      gsap.timeline({
        scrollTrigger: { trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true },
        defaults: { ease: 'none' },
      })
        .fromTo(card, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.3)
        .to(card, { autoAlpha: 0, y: -20, duration: 0.1 }, 0.82);
    }
  });
}

/* ============================== METODO: CANTIERE 3D ============================== */
/* Scena Three.js real-time: la casa si assembla sotto il controllo dello
   scroll (camera orbitante, bloom, luce volumetrica). Il modulo pesante si
   carica solo quando la sezione è a ~1 viewport di distanza. */

function initMetodo() {
  const section = document.getElementById('metodo');
  const canvas = document.getElementById('metodo-canvas');
  if (!section || !canvas) return;

  if (!supportsWebGL) {
    section.classList.add('metodo--flat');
    return;
  }

  let scene3d = null;
  let lastProgress = 0;

  new IntersectionObserver(async (entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    try {
      const m = await import('./metodo3d.js');
      scene3d = m.createMetodo(canvas, { reducedMotion });
      scene3d.setProgress(lastProgress);
    } catch {
      section.classList.add('metodo--flat');
    }
  }, { rootMargin: '100% 0px' }).observe(section);

  const title = section.querySelector('[data-lines]');
  if (reducedMotion) return; // layout statico: ci pensa il CSS .no-motion

  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    once: true,
    onEnter: () => revealLines(title),
  });

  const bar = document.getElementById('metodo-progress');
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      lastProgress = self.progress;
      scene3d?.setProgress(self.progress);
      if (bar) bar.style.transform = `scaleY(${self.progress.toFixed(3)})`;
    },
  });

  // Ogni passo vive nella finestra di progresso della sua fase di cantiere
  const windows = [[0.05, 0.33], [0.38, 0.66], [0.72, 0.97]];
  section.querySelectorAll('.metodo__step').forEach((step, i) => {
    const [a, b] = windows[i] || [0.1, 0.9];
    gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
      defaults: { ease: 'none' },
    })
      .fromTo(step, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, a)
      .to(step, { autoAlpha: 0, y: -26, duration: 0.07 }, b - 0.07)
      .to({}, { duration: 0 }, 1); // àncora: la timeline copre TUTTA la sezione
  });

  // Il titolo lascia il palco quando la casa prende la scena
  gsap.to(section.querySelector('.metodo__head'), {
    autoAlpha: 0,
    y: -34,
    ease: 'none',
    scrollTrigger: { trigger: section, start: '30% bottom', end: '46% bottom', scrub: true },
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
  initHeroScrub();
  initChapters();
  initMetodo();
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

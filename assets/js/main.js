/* Mondial Service — orchestrazione del sito
   - intro: video reale (assets/video/intro-porta.mp4) se presente, altrimenti porta 3D via Three.js
   - hero: scena Three.js con parallax scroll/puntatore (fallback CSS senza WebGL)
   - card servizi: tilt 3D, galleria portfolio 3D, reveal, navbar, form WhatsApp */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const supportsWebGL = (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
})();

document.body.classList.toggle('no-webgl', !supportsWebGL);

/* ============================== INTRO ============================== */

const intro = document.getElementById('intro');
const introVideo = document.getElementById('intro-video');
const introSkip = document.getElementById('intro-skip');
let introEnded = false;
let scene3d = null;

function endIntro() {
  if (introEnded) return;
  introEnded = true;
  intro.classList.add('intro--done');
  document.body.classList.remove('intro-locked');
  try { sessionStorage.setItem('ms-intro-seen', '1'); } catch { /* storage disabilitato */ }
  if (introVideo) { introVideo.pause(); introVideo.removeAttribute('src'); }
  scene3d?.stopIntro?.();
  window.setTimeout(() => intro.classList.add('intro--off'), 700);
  startHeroScene();
}

async function startIntro() {
  const alreadySeen = (() => {
    try { return sessionStorage.getItem('ms-intro-seen') === '1'; } catch { return false; }
  })();

  if (alreadySeen || prefersReducedMotion) {
    intro.classList.add('intro--off');
    document.body.classList.remove('intro-locked');
    startHeroScene();
    return;
  }

  introSkip.addEventListener('click', endIntro);
  // Timeout di sicurezza: l'intro non deve mai bloccare la pagina.
  window.setTimeout(endIntro, 9000);

  // Il video reale della porta va in assets/video/intro-porta.mp4:
  // se c'è lo usiamo, altrimenti passiamo alla porta 3D.
  let hasVideo = false;
  try {
    const res = await fetch('assets/video/intro-porta.mp4', { method: 'HEAD' });
    hasVideo = res.ok;
  } catch { /* file assente o protocollo file:// */ }

  if (hasVideo) {
    intro.classList.add('intro--video');
    introVideo.preload = 'auto';
    introVideo.addEventListener('ended', endIntro);
    introVideo.addEventListener('error', endIntro);
    try {
      await introVideo.play();
    } catch {
      endIntro(); // autoplay negato: meglio il sito subito che un'intro ferma
    }
    return;
  }

  if (supportsWebGL) {
    try {
      const mod = await import('./scene.js');
      scene3d = mod;
      await mod.playDoorIntro(document.getElementById('intro-canvas-slot'), endIntro);
      return;
    } catch { /* la scena non è disponibile: chiudiamo l'intro */ }
  }

  window.setTimeout(endIntro, 1800);
}

/* ============================== HERO 3D ============================== */

let heroStarted = false;
async function startHeroScene() {
  if (heroStarted) return;
  heroStarted = true;
  if (!supportsWebGL || prefersReducedMotion) return;
  try {
    scene3d = scene3d || await import('./scene.js');
    scene3d.mountHero(document.getElementById('hero-canvas-slot'));
    document.body.classList.add('webgl-on');
  } catch { /* resta il fondale CSS */ }
}

/* ============================== NAVBAR ============================== */

const nav = document.getElementById('nav');
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('nav-mobile');

function syncNav() {
  nav.classList.toggle('nav--solid', window.scrollY > 24 || !mobileMenu.hidden);
}
window.addEventListener('scroll', syncNav, { passive: true });
syncNav();

burger.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  syncNav();
});
mobileMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    mobileMenu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
  }
});

// Link attivo in base alla sezione visibile
const sectionLinks = [...document.querySelectorAll('.nav__links a')];
const watched = sectionLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const linkObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach((a) =>
      a.setAttribute('aria-current', String(a.getAttribute('href') === `#${entry.target.id}`)));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
watched.forEach((s) => linkObserver.observe(s));

/* ============================== REVEAL ============================== */

const revealEls = [...document.querySelectorAll('.reveal')];
if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  // Ritardo a cascata per gli elementi fratelli (30-50ms come da linee guida motion)
  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    const idx = groups.get(parent) ?? 0;
    el.style.setProperty('--reveal-delay', `${Math.min(idx * 70, 350)}ms`);
    groups.set(parent, idx + 1);
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ============================== TILT 3D CARD ============================== */

if (!prefersReducedMotion) {
  document.querySelectorAll('.card3d').forEach((card) => {
    let raf = 0;

    const applyTilt = (clientX, clientY) => {
      const r = card.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;   // 0..1
      const py = (clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rx = (0.5 - py) * 10; // gradi, contenuti: eleganza, non videogioco
        const ry = (px - 0.5) * 12;
        card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        card.classList.add('is-tilting');
      });
    };

    const resetTilt = () => {
      cancelAnimationFrame(raf);
      card.classList.remove('is-tilting');
      card.style.transform = '';
    };

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return; // sul touch il tilt segue lo scroll, sotto
      applyTilt(e.clientX, e.clientY);
    });
    card.addEventListener('pointerleave', resetTilt);
    card.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      applyTilt(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener('touchend', resetTilt);
    card.addEventListener('touchcancel', resetTilt);
  });
}

/* ============================== GALLERIA 3D ============================== */

const stage = document.getElementById('gallery-stage');
const items = [...stage.querySelectorAll('.gallery__item')];
const dotsWrap = document.getElementById('gallery-dots');
const statusEl = document.getElementById('gallery-status');
let current = 0;

items.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('role', 'tab');
  dot.setAttribute('aria-label', `Vai al progetto ${i + 1} di ${items.length}`);
  dot.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(dot);
});
const dots = [...dotsWrap.children];

function layoutGallery() {
  const n = items.length;
  items.forEach((item, i) => {
    // offset più corto tra -n/2 e n/2 rispetto all'elemento corrente
    let off = i - current;
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;

    const abs = Math.abs(off);
    const visible = abs <= 2;
    const x = off * (window.innerWidth < 760 ? 46 : 38);   // % di traslazione
    const z = -abs * 220;                                   // profondità
    const ry = off * -18;                                   // rotazione coverflow
    item.style.transform =
      `translateX(${x}%) translateZ(${z}px) rotateY(${ry}deg)`;
    item.style.opacity = visible ? String(1 - abs * 0.28) : '0';
    item.style.filter = abs === 0 ? 'none' : `brightness(${1 - abs * 0.22})`;
    item.style.zIndex = String(10 - abs);
    item.classList.toggle('is-active', off === 0);
    item.setAttribute('aria-hidden', String(off !== 0));
  });
  dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === current)));
  const caption = items[current].querySelector('figcaption').textContent;
  statusEl.textContent = `Progetto ${current + 1} di ${n}: ${caption}`;
}

function goTo(i) {
  current = (i + items.length) % items.length;
  layoutGallery();
}

document.getElementById('gallery-prev').addEventListener('click', () => goTo(current - 1));
document.getElementById('gallery-next').addEventListener('click', () => goTo(current + 1));

const gallery = document.getElementById('gallery');
gallery.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
});

// Trascinamento/swipe orizzontale
let dragStartX = null;
stage.addEventListener('pointerdown', (e) => { dragStartX = e.clientX; });
window.addEventListener('pointerup', (e) => {
  if (dragStartX === null) return;
  const dx = e.clientX - dragStartX;
  dragStartX = null;
  if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
});
items.forEach((item) => {
  item.addEventListener('click', () => {
    const i = Number(item.dataset.index);
    if (i !== current) goTo(i);
  });
});

window.addEventListener('resize', layoutGallery);
layoutGallery();

/* ============================== PARALLAX SEZIONI ============================== */

if (!prefersReducedMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // L'hero scivola in profondità mentre entrano i servizi (scrub continuo, mai a scatti)
  gsap.to('.hero__content', {
    yPercent: -14,
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });

  document.querySelectorAll('.section__head').forEach((head) => {
    gsap.fromTo(head, { y: 40 }, {
      y: -20,
      ease: 'none',
      scrollTrigger: { trigger: head, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });

  gsap.fromTo('.gallery__stage', { rotateX: 6, y: 60 }, {
    rotateX: 0,
    y: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.portfolio', start: 'top 80%', end: 'top 20%', scrub: 1 },
  });

  gsap.fromTo('.review__card', { rotateX: 5, y: 50 }, {
    rotateX: 0,
    y: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.review', start: 'top 85%', end: 'top 30%', scrub: 1 },
  });
}

/* ============================== BARRA CTA MOBILE ============================== */

const ctaBar = document.getElementById('cta-bar');
const heroEl = document.getElementById('hero');
const contactEl = document.getElementById('contatti');
let heroVisible = true;
let contactVisible = false;

function syncCtaBar() {
  ctaBar.classList.toggle('is-visible', !heroVisible && !contactVisible && !document.body.classList.contains('intro-locked'));
}
new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.target === heroEl) heroVisible = entry.isIntersecting;
    if (entry.target === contactEl) contactVisible = entry.isIntersecting;
  });
  syncCtaBar();
}, { threshold: 0.15 }).observe(heroEl);
new IntersectionObserver((entries) => {
  entries.forEach((entry) => { contactVisible = entry.isIntersecting; });
  syncCtaBar();
}, { threshold: 0.15 }).observe(contactEl);
window.addEventListener('scroll', syncCtaBar, { passive: true });

/* ============================== FORM PREVENTIVO → WHATSAPP ============================== */

const form = document.getElementById('quote-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = [
    { input: form.name, error: document.getElementById('f-name-err'), valid: (v) => v.trim().length >= 2 },
    { input: form.phone, error: document.getElementById('f-phone-err'), valid: (v) => /[\d\s+()-]{6,}/.test(v.trim()) },
    { input: form.message, error: document.getElementById('f-msg-err'), valid: (v) => v.trim().length >= 5 },
  ];
  let firstInvalid = null;
  fields.forEach(({ input, error, valid }) => {
    const ok = valid(input.value);
    error.hidden = ok;
    input.closest('.field').classList.toggle('has-error', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) { firstInvalid.focus(); return; }

  const text = `Buongiorno, sono ${form.name.value.trim()}.%0A` +
    `Vorrei un preventivo per: ${encodeURIComponent(form.message.value.trim())}%0A` +
    `Potete richiamarmi al ${encodeURIComponent(form.phone.value.trim())}? Grazie.`;
  window.open(`https://wa.me/393297003558?text=${text.replaceAll(' ', '%20')}`, '_blank', 'noopener');
});

// Validazione al blur (non a ogni tasto)
['f-name', 'f-phone', 'f-msg'].forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      input.closest('.field').classList.remove('has-error');
      document.getElementById(`${id}-err`).hidden = true;
      input.setAttribute('aria-invalid', 'false');
    }
  });
});

/* ============================== MAPPA (caricamento su richiesta) ============================== */

document.getElementById('map-load').addEventListener('click', () => {
  const facade = document.getElementById('map-facade');
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.google.com/maps?q=Bologna%2C%20Italia&z=11&output=embed';
  iframe.title = 'Mappa di Bologna e provincia — zona in cui operiamo';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.allowFullscreen = true;
  facade.innerHTML = '';
  facade.appendChild(iframe);
});

/* ============================== AVVIO ============================== */

startIntro();

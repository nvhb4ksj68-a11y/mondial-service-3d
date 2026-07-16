/* Mondial Service — scene Three.js
   Un solo WebGLRenderer per tutta la pagina (limite contesti GPU su mobile):
   prima serve l'intro della porta, poi passa al fondale dell'hero. */

import * as THREE from '../vendor/three.module.min.js';

const NAVY = 0x0a1424;
const NAVY_SOFT = 0x16263f;
const GOLD = 0xf5a623;
const WARM = 0xffd9a0;

let renderer = null;

function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return renderer;
}

function fitRenderer(slot) {
  const r = getRenderer();
  const w = slot.clientWidth || window.innerWidth;
  const h = slot.clientHeight || window.innerHeight;
  r.setSize(w, h);
  return { w, h };
}

/* ============================== INTRO: LA PORTA ============================== */

let introState = null;

export function playDoorIntro(slot, onDone) {
  const r = getRenderer();
  slot.appendChild(r.domElement);
  const { w, h } = fitRenderer(slot);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  scene.fog = new THREE.Fog(NAVY, 8, 22);

  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 60);
  camera.position.set(0, 1.45, 7.5);

  // Luci: ambiente freddo davanti, luce calda oltre la soglia
  scene.add(new THREE.AmbientLight(0x8fa3c2, 0.5));
  const front = new THREE.DirectionalLight(0xbfd0e8, 0.7);
  front.position.set(2, 4, 6);
  scene.add(front);
  const warm = new THREE.PointLight(WARM, 0, 18, 1.6);
  warm.position.set(0, 1.6, -3.5);
  scene.add(warm);

  // Pavimento riflettente scuro
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0c1727, roughness: 0.35, metalness: 0.4 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Parete con vano porta
  const wallMat = new THREE.MeshStandardMaterial({ color: NAVY_SOFT, roughness: 0.9 });
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 0.4), wallMat);
  wallL.position.set(-8.1, 3, 0);
  const wallR = wallL.clone();
  wallR.position.x = 8.1;
  const wallTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.4), wallMat);
  wallTop.position.set(0, 4.8, 0);
  scene.add(wallL, wallR, wallTop);

  // Cornice dorata
  const frameMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.35, metalness: 0.75 });
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.7, 0.5), frameMat);
  jambL.position.set(-1.17, 1.85, 0);
  const jambR = jambL.clone();
  jambR.position.x = 1.17;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.14, 0.5), frameMat);
  lintel.position.set(0, 3.67, 0);
  scene.add(jambL, jambR, lintel);

  // La porta: perno sul lato sinistro per l'apertura
  const pivot = new THREE.Group();
  pivot.position.set(-1.1, 0, 0);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x203450, roughness: 0.55, metalness: 0.25 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 0.1), doorMat);
  door.position.set(1.1, 1.8, 0);
  // Pannellature della porta (sottili riquadri dorati)
  const trimMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.4, metalness: 0.7 });
  for (const [py, ph] of [[2.55, 1.15], [1.1, 1.35]]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.5, ph, 0.02), trimMat);
    t.position.set(1.1, py, 0.06);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.34, ph - 0.16, 0.03), doorMat);
    inner.position.set(1.1, py, 0.061);
    pivot.add(t, inner);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 20), frameMat);
  knob.position.set(1.98, 1.75, 0.1);
  pivot.add(door, knob);
  scene.add(pivot);

  // Oltre la porta: bagliore caldo (la casa finita)
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 5),
    new THREE.MeshBasicMaterial({ color: WARM, transparent: true, opacity: 0 })
  );
  glow.position.set(0, 2, -5.5);
  scene.add(glow);

  let done = false;
  let rafId = 0;
  const clock = new THREE.Clock();
  const DURATION = 6.2;

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  function frame() {
    const t = clock.getElapsedTime();

    // 0-1.2s: quiete; 1.2-3.4s la porta si apre; 2.6-6s la camera attraversa la soglia
    const open = easeInOut(clamp01((t - 1.2) / 2.2));
    pivot.rotation.y = -open * THREE.MathUtils.degToRad(108);

    const dolly = easeInOut(clamp01((t - 2.6) / 3.2));
    camera.position.z = 7.5 - dolly * 9.2;
    camera.position.y = 1.45 + dolly * 0.25;
    camera.lookAt(0, 1.6, camera.position.z - 6);

    warm.intensity = open * 2.6 + dolly * 3;
    glow.material.opacity = Math.min(0.9, open * 0.35 + dolly * 1.1);

    renderer.render(scene, camera);

    if (t >= DURATION && !done) {
      done = true;
      onDone?.();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  introState = {
    stop() {
      cancelAnimationFrame(rafId);
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (obj.material) [].concat(obj.material).forEach((m) => m.dispose());
      });
      introState = null;
    },
  };

  function onResize() {
    const { w: nw, h: nh } = fitRenderer(slot);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  introState.cleanupResize = () => window.removeEventListener('resize', onResize);

  rafId = requestAnimationFrame(frame);
}

export function stopIntro() {
  introState?.cleanupResize?.();
  introState?.stop?.();
}

/* ============================== HERO: PROFONDITÀ ARCHITETTONICA ============================== */

export function mountHero(slot) {
  stopIntro();
  const r = getRenderer();
  slot.appendChild(r.domElement);
  const { w, h } = fitRenderer(slot);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NAVY);
  scene.fog = new THREE.Fog(NAVY, 6, 26);

  const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 60);
  camera.position.set(0, 0.6, 9);

  scene.add(new THREE.AmbientLight(0x8fa3c2, 0.6));
  const key = new THREE.PointLight(GOLD, 1.6, 30, 1.8);
  key.position.set(4, 3, 4);
  scene.add(key);

  const world = new THREE.Group();
  scene.add(world);

  // Volumi architettonici in wireframe dorato: le "stanze" che prendono forma
  const goldLine = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.38 });
  const paleLine = new THREE.LineBasicMaterial({ color: 0xedf1f7, transparent: true, opacity: 0.12 });
  const rooms = [
    { size: [3.4, 2.4, 3], pos: [-3.6, 0.4, -2], mat: goldLine },
    { size: [2.6, 3.2, 2.6], pos: [3.4, 0.8, -4], mat: paleLine },
    { size: [4.4, 2, 3.4], pos: [0.6, -0.9, -7], mat: goldLine },
    { size: [2, 2, 2], pos: [-2.4, 1.7, -9], mat: paleLine },
  ];
  rooms.forEach(({ size, pos, mat }) => {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(...size));
    const box = new THREE.LineSegments(edges, mat);
    box.position.set(...pos);
    box.rotation.y = Math.random() * 0.6 - 0.3;
    box.userData.spin = (Math.random() * 0.5 + 0.25) * (Math.random() > 0.5 ? 1 : -1);
    world.add(box);
  });

  // Polvere dorata in sospensione (contenuta: 900 particelle, sicura su mobile)
  const COUNT = 900;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = -Math.random() * 20 + 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: GOLD, size: 0.035, transparent: true, opacity: 0.55, sizeAttenuation: true, depthWrite: false,
  }));
  world.add(dust);

  // Parallax: puntatore (mouse e touch) + scroll
  const target = new THREE.Vector2(0, 0);
  const eased = new THREE.Vector2(0, 0);
  function onPointer(x, y) {
    target.x = (x / window.innerWidth) * 2 - 1;
    target.y = -((y / window.innerHeight) * 2 - 1);
  }
  window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    onPointer(t.clientX, t.clientY);
  }, { passive: true });

  let scrollDepth = 0;
  window.addEventListener('scroll', () => {
    scrollDepth = Math.min(1, window.scrollY / window.innerHeight);
  }, { passive: true });

  // Pausa quando l'hero non è visibile o la scheda è in secondo piano
  let heroVisible = true;
  let pageVisible = !document.hidden;
  let rafId = 0;
  const clock = new THREE.Clock();

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (!heroVisible || !pageVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    world.rotation.y = Math.sin(t * 0.05) * 0.16;
    world.children.forEach((child) => {
      if (child.userData.spin) child.rotation.y += child.userData.spin * dt * 0.12;
    });
    dust.rotation.y += dt * 0.012;
    dust.position.y = Math.sin(t * 0.18) * 0.25;

    eased.lerp(target, 0.045); // inseguimento morbido, mai nervoso
    camera.position.x = eased.x * 0.9;
    camera.position.y = 0.6 + eased.y * 0.45 - scrollDepth * 1.6;
    camera.position.z = 9 - scrollDepth * 1.2;
    camera.lookAt(0, 0.2 - scrollDepth * 0.8, -5);

    renderer.render(scene, camera);
  }

  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
  }, { threshold: 0.02 }).observe(slot);
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  function onResize() {
    const { w: nw, h: nh } = fitRenderer(slot);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

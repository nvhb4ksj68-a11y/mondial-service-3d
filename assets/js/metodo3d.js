/* Mondial Service — "Il metodo": cantiere 3D real-time guidato dallo scroll.

   Una casa si assembla pezzo per pezzo (platea → murature → serramenti →
   impianti → copertura → luce) mentre la camera le orbita attorno e si
   avvicina. Post-processing con bloom (EffectComposer) e tone mapping
   cinematografico; un cono di luce additiva simula il volumetrico.

   Renderer dedicato, creato solo quando la sezione è a ~1 viewport di
   distanza e fermo quando la sezione non è visibile. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const INK = 0x060b14;
const GOLD = 0xf5a623;
const WARM = 0xe8b45a;
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

const easeOut = (t) => 1 - (1 - t) ** 3;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

export function createMetodo(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.Fog(INK, 16, 42);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

  scene.add(new THREE.AmbientLight(0x8fa3c7, 0.5));
  scene.add(new THREE.HemisphereLight(0x9db1d6, 0x0a1220, 0.4));
  const key = new THREE.DirectionalLight(0xc6d4ee, 1.25);
  key.position.set(6, 9, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5a729e, 0.65);
  rim.position.set(-7, 3, -6);
  scene.add(rim);
  const interior = new THREE.PointLight(WARM, 0, 14, 1.4);
  interior.position.set(0, 1.5, 0);
  scene.add(interior);

  // Suolo scuro, appena riflettente: raccoglie i riflessi della casa
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(26, 48),
    new THREE.MeshStandardMaterial({ color: 0x0c1830, roughness: 0.32, metalness: 0.5 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Griglia da tracciamento di cantiere, appena accennata
  const grid = new THREE.GridHelper(36, 36, GOLD, 0x24406b);
  grid.position.y = 0.02;
  grid.material.transparent = true;
  grid.material.opacity = 0.13;
  scene.add(grid);

  /* ---------------- La casa: pezzi + finestre di montaggio ---------------- */

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x24406b, roughness: 0.8 });
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x1a2c4d, roughness: 0.68 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x16273f, roughness: 0.55, metalness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.8 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x101d33, roughness: 0.5, metalness: 0.3 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: GOLD, emissiveIntensity: 1.8, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x2a3c5c, emissive: WARM, emissiveIntensity: 0, roughness: 0.15, metalness: 0.4 });

  const house = new THREE.Group();
  scene.add(house);

  // Ogni pezzo: mesh + posa iniziale + finestra [inizio, fine] sul progresso
  const parts = [];
  function part(mesh, from, [a, b]) {
    mesh.userData.to = { p: mesh.position.clone(), r: mesh.rotation.clone() };
    if (from.p) mesh.position.set(...from.p);
    if (from.r) mesh.rotation.set(...from.r);
    mesh.userData.from = { p: mesh.position.clone(), r: mesh.rotation.clone() };
    mesh.userData.win = [a, b];
    mesh.visible = false;
    house.add(mesh);
    parts.push(mesh);
    return mesh;
  }
  // Ogni volume porta i suoi spigoli dorati: la casa nasce come un
  // disegno tecnico che diventa reale
  const edgeMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 });
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (mat === wallMat || mat === slabMat || mat === roofMat) {
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat));
    }
    m.position.set(x, y, z);
    return m;
  };

  const W = 6.2;   // larghezza casa
  const D = 4.6;   // profondità
  const H = 2.7;   // altezza pareti
  const T = 0.22;  // spessore muri

  // 01 — platea e murature (il grezzo)
  part(box(W, 0.35, D, slabMat, 0, 0.175, 0), { p: [0, -4, 0] }, [0.02, 0.13]);
  part(box(W, H, T, wallMat, 0, H / 2 + 0.35, -D / 2 + T / 2),
    { p: [0, -3.4, -D / 2 + T / 2], r: [-0.35, 0, 0] }, [0.09, 0.22]);
  part(box(T, H, D, wallMat, -W / 2 + T / 2, H / 2 + 0.35, 0),
    { p: [-9, H / 2 + 0.35, 0] }, [0.13, 0.26]);
  part(box(T, H, D, wallMat, W / 2 - T / 2, H / 2 + 0.35, 0),
    { p: [9, H / 2 + 0.35, 0] }, [0.17, 0.30]);
  // Facciata in sei pezzi che combaciano, lasciando i vuoti esatti di
  // porta (x −0.65…0.55) e finestra (x 1.15…2.65, y 1.05…2.45)
  const FZ = D / 2 - T / 2;
  part(box(2.45, H, T, wallMat, -1.875, 1.7, FZ),
    { p: [-1.875, 6.5, FZ], r: [0, 0, 0.5] }, [0.20, 0.32]);            // a sinistra della porta
  part(box(0.6, H, T, wallMat, 0.85, 1.7, FZ),
    { p: [0.85, 7.2, FZ], r: [0, 0, -0.4] }, [0.23, 0.35]);             // tra porta e finestra
  part(box(0.45, H, T, wallMat, 2.875, 1.7, FZ),
    { p: [2.875, 7.8, FZ], r: [0, 0, -0.5] }, [0.26, 0.38]);            // a destra della finestra
  part(box(1.2, 0.61, T, wallMat, -0.05, 2.745, FZ),
    { p: [-0.05, 8.4, FZ] }, [0.29, 0.41]);                             // sopra la porta
  part(box(1.5, 0.6, T, wallMat, 1.9, 2.75, FZ),
    { p: [1.9, 8.8, FZ] }, [0.31, 0.43]);                               // sopra la finestra
  part(box(1.5, 0.7, T, wallMat, 1.9, 0.7, FZ),
    { p: [1.9, -2.6, FZ] }, [0.33, 0.45]);                              // sotto la finestra

  // 02 — serramenti (oro), porta, copertura, impianti
  const doorX = -0.05;
  part(box(0.09, 2.0, 0.3, goldMat, doorX - 0.55, 1.35, D / 2 - T / 2),
    { p: [doorX - 0.55, 1.35, 6], r: [0, 1.6, 0] }, [0.36, 0.46]);
  part(box(0.09, 2.0, 0.3, goldMat, doorX + 0.55, 1.35, D / 2 - T / 2),
    { p: [doorX + 0.55, 1.35, 6.6], r: [0, -1.6, 0] }, [0.38, 0.48]);
  part(box(1.19, 0.09, 0.3, goldMat, doorX, 2.39, D / 2 - T / 2),
    { p: [doorX, 5.5, D / 2 - T / 2] }, [0.40, 0.50]);
  part(box(1.0, 1.95, 0.07, doorMat, doorX, 1.32, D / 2 - T / 2),
    { p: [doorX, 1.32, 5], r: [0, 0.9, 0] }, [0.42, 0.53]);
  // finestra sulla facciata destra + vetro che si accenderà
  const winFrame = new THREE.Group();
  winFrame.add(box(1.5, 0.08, 0.28, goldMat, 0, 0.66, 0));
  winFrame.add(box(1.5, 0.08, 0.28, goldMat, 0, -0.66, 0));
  winFrame.add(box(0.08, 1.4, 0.28, goldMat, -0.71, 0, 0));
  winFrame.add(box(0.08, 1.4, 0.28, goldMat, 0.71, 0, 0));
  winFrame.position.set(W / 2 - 1.2, 1.75, D / 2 - T / 2);
  part(winFrame, { p: [W / 2 + 4, 1.75, D / 2 + 3], r: [0, -1.2, 0] }, [0.44, 0.56]);
  const glass = part(box(1.34, 1.24, 0.05, glassMat, W / 2 - 1.2, 1.75, D / 2 - T / 2),
    { p: [W / 2 - 1.2, 1.75, D / 2 - T / 2] }, [0.5, 0.58]);

  // impianti: tre linee dorate che corrono lungo la parete di fondo
  for (let i = 0; i < 3; i++) {
    const pipe = part(box(W - 0.8, 0.045, 0.045, pipeMat, 0, 0.85 + i * 0.5, -D / 2 + T + 0.06),
      { p: [0, 0.85 + i * 0.5, -D / 2 + T + 0.06] }, [0.52 + i * 0.035, 0.62 + i * 0.035]);
    pipe.userData.growX = true; // cresce in larghezza invece di volare in posa
  }

  // Copertura a due falde: la geometria va traslata PRIMA di generare gli
  // spigoli, così le linee dorate restano incollate alla falda
  const roofSlope = (dir) => {
    const geo = new THREE.BoxGeometry(W / 2 + 0.7, 0.16, D + 0.6);
    geo.translate(dir * (W / 4 + 0.1), 0, 0);
    const m = new THREE.Mesh(geo, roofMat);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    m.position.set(0, H + 0.35 + 0.68, 0);
    m.rotation.z = -dir * 0.42;
    return m;
  };
  part(roofSlope(-1), { p: [-2.5, 7.5, 0], r: [0, 0, 1.1] }, [0.62, 0.74]);
  part(roofSlope(1), { p: [2.5, 8.5, 0], r: [0, 0, -1.1] }, [0.66, 0.78]);
  part(box(0.1, 1.6, 0.1, goldMat, 0, H + 0.35 + 1.15, 0), { p: [0, 9.5, 0] }, [0.74, 0.82]);

  // 03 — luce volumetrica dalla finestra (cono additivo) + bagliore porta
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 3.6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: WARM, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  // Apice alla finestra, si allarga scendendo verso l'esterno
  shaft.position.set(W / 2 - 1.2, 1.05, D / 2 + 1.3);
  shaft.rotation.x = 2.0;
  scene.add(shaft);
  const doorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.98),
    new THREE.MeshBasicMaterial({
      color: WARM, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  doorGlow.position.set(doorX, 1.32, D / 2 - T / 2 + 0.06);
  scene.add(doorGlow);

  /* ---------------- Composer: bloom + output ---------------- */

  // Su mobile niente bloom: i materiali emissivi bastano, e si risparmiano
  // più passate a schermo intero per ogni fotogramma
  let composer = null;
  let bloom = null;
  try {
    if (IS_MOBILE) throw new Error('mobile: render diretto');
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.7, 0.78);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  } catch { composer = null; }

  /* ---------------- Timeline: posa dei pezzi + regia di camera ---------------- */

  function pose(progress) {
    parts.forEach((mesh) => {
      const [a, b] = mesh.userData.win;
      const t = easeOut(clamp01((progress - a) / (b - a)));
      mesh.visible = t > 0.001;
      if (!mesh.visible) return;
      const { from, to } = mesh.userData;
      if (mesh.userData.growX) {
        mesh.scale.x = Math.max(t, 0.001);
        return;
      }
      mesh.position.lerpVectors(from.p, to.p, t);
      mesh.rotation.set(
        lerp(from.r.x, to.r.x, t),
        lerp(from.r.y, to.r.y, t),
        lerp(from.r.z, to.r.z, t)
      );
    });

    // La luce si accende nell'ultimo atto
    const lightT = easeOut(clamp01((progress - 0.74) / 0.2));
    interior.intensity = lightT * 2.1;
    glass.material.emissiveIntensity = lightT * 0.85;
    doorGlow.material.opacity = lightT * 0.26;
    shaft.material.opacity = easeOut(clamp01((progress - 0.8) / 0.16)) * 0.055;
    if (bloom) bloom.strength = 0.32 + lightT * 0.22;
  }

  function aimCamera(progress, time) {
    // Orbita lenta + avvicinamento; un filo di deriva anche da fermo
    // (su mobile la deriva è spenta: si ridisegna solo durante lo scroll)
    if (IS_MOBILE) time = 0;
    const az = lerp(2.3, 0.72, progress) + Math.sin(time * 0.22) * 0.022;
    const radius = lerp(15, 10.4, easeOut(progress));
    const height = lerp(6.4, 3.15, easeOut(progress)) + Math.sin(time * 0.17) * 0.05;
    camera.position.set(Math.sin(az) * radius, height, Math.cos(az) * radius);
    camera.lookAt(0, 1.35, 0);
  }

  /* ---------------- Loop: disegna solo quando la sezione è in vista ---------------- */

  let target = 0;
  let visible = false;
  let disposed = false;
  const clock = new THREE.Clock();

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { rootMargin: '20% 0px' }).observe(canvas);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    let w = Math.max(1, Math.round(rect.width));
    let h = Math.max(1, Math.round(rect.height));
    // Su mobile la scena riempie comunque lo schermo: si può rendere a metà
    // risoluzione senza che si noti (canvas scalato via CSS)
    if (IS_MOBILE) {
      const cap = 720; // lato lungo massimo del buffer di disegno
      const k = Math.min(1, cap / Math.max(w, h));
      renderer.setPixelRatio(1);
      renderer.setSize(Math.round(w * k), Math.round(h * k), false);
      composer?.setSize(Math.round(w * k), Math.round(h * k));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return;
    }
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

  if (reducedMotion) {
    // Casa finita, statica: un solo disegno (più uno a ogni resize)
    pose(1);
    aimCamera(0.85, 0);
    draw();
    window.addEventListener('resize', () => { resize(); draw(); });
  } else {
    let drawn = -1;
    (function loop() {
      if (disposed) return;
      requestAnimationFrame(loop);
      if (!visible) return;
      // Su mobile si ridisegna solo se il progresso è cambiato davvero
      if (IS_MOBILE && Math.abs(target - drawn) < 0.0005) return;
      drawn = target;
      const t = clock.getElapsedTime();
      pose(target);
      aimCamera(target, t);
      draw();
    })();
  }

  return {
    setProgress(p) { target = clamp01(p); },
    destroy() {
      disposed = true;
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}

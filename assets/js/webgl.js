/* Mondial Service — WebGL
   Un solo WebGLRenderer per l'intera pagina (limite di contesti GPU su mobile):
   prima l'intro della porta, poi la galleria a distorsione liquida. */

import * as THREE from '../vendor/three.module.min.js';

const INK = 0x060b14;
const INK_WALL = 0x0c1626;
const GOLD = 0xf5a623;
const WARM = 0xe8b45a;

let renderer = null;

function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return renderer;
}

/* ============================== INTRO: LA PORTA ============================== */

let introState = null;

export function playDoorIntro(slot, onDone) {
  const r = getRenderer();
  slot.appendChild(r.domElement);
  r.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.Fog(INK, 8, 22);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 1.45, 7.5);

  scene.add(new THREE.AmbientLight(0x7a8cab, 0.45));
  const front = new THREE.DirectionalLight(0xaebfdd, 0.6);
  front.position.set(2, 4, 6);
  scene.add(front);
  const warm = new THREE.PointLight(WARM, 0, 18, 1.6);
  warm.position.set(0, 1.6, -3.5);
  scene.add(warm);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x081020, roughness: 0.32, metalness: 0.42 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: INK_WALL, roughness: 0.92 });
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 0.4), wallMat);
  wallL.position.set(-8.1, 3, 0);
  const wallR = wallL.clone();
  wallR.position.x = 8.1;
  const wallTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.4), wallMat);
  wallTop.position.set(0, 4.8, 0);
  scene.add(wallL, wallR, wallTop);

  const frameMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.35, metalness: 0.75 });
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.7, 0.5), frameMat);
  jambL.position.set(-1.17, 1.85, 0);
  const jambR = jambL.clone();
  jambR.position.x = 1.17;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.12, 0.5), frameMat);
  lintel.position.set(0, 3.67, 0);
  scene.add(jambL, jambR, lintel);

  const pivot = new THREE.Group();
  pivot.position.set(-1.1, 0, 0);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x14223a, roughness: 0.5, metalness: 0.3 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 0.1), doorMat);
  door.position.set(1.1, 1.8, 0);
  for (const [py, ph] of [[2.55, 1.15], [1.1, 1.35]]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.5, ph, 0.02), frameMat);
    trim.position.set(1.1, py, 0.06);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.34, ph - 0.16, 0.03), doorMat);
    inner.position.set(1.1, py, 0.061);
    pivot.add(trim, inner);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), frameMat);
  knob.position.set(1.98, 1.75, 0.1);
  pivot.add(door, knob);
  scene.add(pivot);

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
    const open = easeInOut(clamp01((t - 1.2) / 2.2));
    pivot.rotation.y = -open * THREE.MathUtils.degToRad(108);
    const dolly = easeInOut(clamp01((t - 2.6) / 3.2));
    camera.position.z = 7.5 - dolly * 9.2;
    camera.position.y = 1.45 + dolly * 0.25;
    camera.lookAt(0, 1.6, camera.position.z - 6);
    warm.intensity = open * 2.4 + dolly * 3;
    glow.material.opacity = Math.min(0.85, open * 0.3 + dolly * 1.1);
    renderer.render(scene, camera);
    if (t >= DURATION && !done) {
      done = true;
      onDone?.();
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  introState = {
    stop() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (obj.material) [].concat(obj.material).forEach((m) => m.dispose());
      });
      introState = null;
    },
  };

  rafId = requestAnimationFrame(frame);
}

export function stopIntro() {
  introState?.stop?.();
}

/* ============================== GALLERIA LIQUIDA ============================== */
/* Piani WebGL sincronizzati con i riquadri DOM; al passaggio del puntatore
   la texture si increspa come un liquido. Le <img> restano per layout e SEO. */

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uCover; // scala per il cover-fit
  void main() {
    vec2 d = vUv - uMouse;
    float dist = length(d);
    float force = smoothstep(0.45, 0.0, dist) * uHover;
    vec2 uv = vUv + normalize(d + 1e-5) * sin(dist * 24.0 - uTime * 4.2) * 0.026 * force;
    uv = (uv - 0.5) * uCover + 0.5;
    float shift = 0.006 * force;
    float rC = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    float gC = texture2D(uTex, uv).g;
    float bC = texture2D(uTex, uv - vec2(shift, 0.0)).b;
    // Trattamento uniforme come il CSS: scuro, caldo, vignettato
    vec3 col = vec3(rC, gC, bC) * vec3(1.03, 0.99, 0.9) * 0.88;
    float vig = smoothstep(1.05, 0.4, distance(vUv, vec2(0.5, 0.44)));
    col *= mix(0.6, 1.0, vig);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function initLiquidGallery(mediaEls) {
  const r = getRenderer();
  r.domElement.classList.add('gl-canvas');
  r.setClearColor(0x000000, 0);
  document.body.appendChild(r.domElement);
  document.body.classList.add('gl-on');

  const scene = new THREE.Scene();
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  const CAMERA_Z = 600;
  const camera = new THREE.PerspectiveCamera(
    (2 * Math.atan(vh / 2 / CAMERA_Z) * 180) / Math.PI, vw / vh, 10, 1200);
  camera.position.z = CAMERA_Z;

  const loader = new THREE.TextureLoader();
  const planes = [];

  mediaEls.forEach((media) => {
    const img = media.querySelector('img');
    const uniforms = {
      uTex: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uCover: { value: new THREE.Vector2(1, 1) },
    };
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 1, 1),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    );
    mesh.visible = false;
    scene.add(mesh);
    const item = { media, img, mesh, uniforms, ready: false, hover: 0, hoverTarget: 0 };
    planes.push(item);

    // La texture si carica poco prima che il progetto entri in vista
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const src = img.currentSrc || img.src;
      loader.load(src, (tex) => {
        // Niente decode sRGB: lo shader scrive i valori così come sono
        tex.minFilter = THREE.LinearFilter;
        uniforms.uTex.value = tex;
        setCover(item, tex);
        item.ready = true;
        mesh.visible = true;
        media.classList.add('gl-ready');
      });
    }, { rootMargin: '60% 0px' }).observe(media);

    media.addEventListener('pointermove', (e) => {
      const rect = media.getBoundingClientRect();
      uniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
      item.hoverTarget = 1;
    });
    media.addEventListener('pointerleave', () => { item.hoverTarget = 0; });
  });

  function setCover(item, tex) {
    const rect = item.media.getBoundingClientRect();
    const planeRatio = rect.width / Math.max(rect.height, 1);
    const imgRatio = tex.image.width / tex.image.height;
    if (imgRatio > planeRatio) item.uniforms.uCover.value.set(planeRatio / imgRatio, 1);
    else item.uniforms.uCover.value.set(1, imgRatio / planeRatio);
  }

  const clock = new THREE.Clock();
  let pageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!pageVisible) return;
    const t = clock.getElapsedTime();
    let anyVisible = false;

    planes.forEach((item) => {
      if (!item.ready) return;
      const rect = item.media.getBoundingClientRect();
      const visible = rect.bottom > -80 && rect.top < vh + 80;
      item.mesh.visible = visible;
      if (!visible) return;
      anyVisible = true;
      item.mesh.scale.set(rect.width, rect.height, 1);
      item.mesh.position.set(
        rect.left + rect.width / 2 - vw / 2,
        -(rect.top + rect.height / 2 - vh / 2),
        0
      );
      item.hover += (item.hoverTarget - item.hover) * 0.07;
      item.uniforms.uHover.value = item.hover;
      item.uniforms.uTime.value = t;
    });

    if (anyVisible) renderer.render(scene, camera);
  }

  function onResize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    r.setSize(vw, vh);
    camera.aspect = vw / vh;
    camera.fov = (2 * Math.atan(vh / 2 / CAMERA_Z) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    planes.forEach((item) => {
      if (item.uniforms.uTex.value) setCover(item, item.uniforms.uTex.value);
    });
  }
  window.addEventListener('resize', onResize);

  requestAnimationFrame(frame);
}

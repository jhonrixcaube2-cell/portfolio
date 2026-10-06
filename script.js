// Mobile menu
const burger = document.getElementById('burger'), menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

// Missing images fall back to the gradient placeholder
document.querySelectorAll('.img-slot img').forEach(img => {
  const miss = () => img.classList.add('missing');
  img.addEventListener('error', miss);
  if (img.complete && !img.naturalWidth) miss();
});

// Scroll reveal + progress bars
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in');
  const bar = en.target.querySelector('.track b');
  if (bar) bar.style.width = bar.dataset.w + '%';
  io.unobserve(en.target);
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Active nav link
const links = [...menu.querySelectorAll('a')];
const spy = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section').forEach(s => spy.observe(s));

// Project filter
const cards = document.querySelectorAll('.card');
document.querySelectorAll('.filters button').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  cards.forEach(c => c.classList.toggle('hide', btn.dataset.f !== 'all' && c.dataset.cat !== btn.dataset.f));
}));

// Contact form validation (opens the visitor's email app; swap for Formspree/EmailJS later)
// Paste your Formspree endpoint here, e.g. https://formspree.io/f/abcdwxyz
const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
const form = document.getElementById('form');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
    msg: v => v.trim().length >= 10 || 'Write at least 10 characters.'
  };
  for (const id in rules) {
    const field = form.elements[id], res = rules[id](field.value);
    form.querySelector(`[data-for=${id}]`).textContent = res === true ? '' : res;
    field.classList.toggle('bad', res !== true);
    if (res !== true) ok = false;
  }
  if (!ok) return;
  const f = form.elements, okMsg = document.getElementById('ok');
  if (FORM_ENDPOINT.includes('YOUR_FORM_ID')) {   // not set up yet: fall back to the visitor's email app
    location.href = `mailto:youremail@example.com?subject=${encodeURIComponent('Portfolio message from ' + f.name.value)}&body=${encodeURIComponent(f.msg.value + '\n\n' + f.email.value)}`;
    okMsg.textContent = 'Opening your email app to send the message.';
    return;
  }
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true; okMsg.textContent = 'Sending...';
  fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
    .then(r => { if (!r.ok) throw 0; form.reset(); okMsg.textContent = 'Message sent. Thank you, I will reply soon.'; })
    .catch(() => { okMsg.textContent = 'Could not send. Please email me directly instead.'; })
    .finally(() => { btn.disabled = false; });
});

/* ===== 3D upgrade ===== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 700;
const weak = (navigator.hardwareConcurrency || 4) < 4 || (navigator.deviceMemory || 4) < 4;
const lite = reduce || weak;
if (lite) document.documentElement.classList.add('lite');

// Mouse position shared by everything
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });

// CSS 3D tilt: cards, hero card, monitor, skill icons
if (!reduce) {
  document.querySelectorAll('[data-tilt], .skill-groups li i').forEach(el => {
    const max = +el.dataset.tilt || 18;
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateZ(${max}px)`;
      const img = el.querySelector('img'); if (img) img.style.transform = 'scale(1.06)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; const img = el.querySelector('img'); if (img) img.style.transform = ''; });
  });
  // Cursor glow + magnetic buttons
  const cur = document.querySelector('.cur');
  addEventListener('pointermove', e => { cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; cur.classList.add('on'); });
  document.querySelectorAll('a,button,input,textarea').forEach(el => {
    el.addEventListener('pointerenter', () => cur.classList.add('big'));
    el.addEventListener('pointerleave', () => { cur.classList.remove('big'); el.style.translate = ''; });
    if (el.classList.contains('btn')) el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * .2}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
    });
  });
}

// WebGL background: looping digital tunnel (dark blocks + glowing blue data streams) and the hero object
addEventListener('load', () => {
  if (lite || !window.THREE) return;
  const T = THREE, cv = document.getElementById('bg');
  const renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: !small });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(60, 1, .1, 90);
  scene.fog = new T.FogExp2(0x0a0d1a, .035);          // far end of the tunnel fades into darkness
  scene.add(new T.AmbientLight(0x4a5cff, .35));
  const lamp = new T.PointLight(0x4de1ff, 3, 32); lamp.position.set(0, 0, 4); scene.add(lamp);
  const lamp2 = new T.PointLight(0x8b6bff, 2, 30); lamp2.position.set(-4, 3, -6); scene.add(lamp2);

  const ZMAX = 10, L = 72, R = Math.random;
  // Dark geometric blocks lining the tunnel walls
  const B = small ? 150 : 380, blocks = [];
  const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0x0c1330, emissive: 0x08183a, metalness: .8, roughness: .35 }), B);
  const dm = new T.Object3D();
  for (let i = 0; i < B; i++) blocks.push({ a: R() * 6.283, r: 6.5 + R() * 5, z: ZMAX - R() * L, w: .6 + R() * 2, h: .6 + R() * 3, d: 1 + R() * 4 });
  scene.add(im);

  // Glowing data streams: streaks with a dark tail and bright head
  const S = small ? 70 : 170, st = [], sp = new Float32Array(S * 6), sc = new Float32Array(S * 6);
  for (let i = 0; i < S; i++) {
    st.push({ a: R() * 6.283, r: 3 + R() * 6, z: ZMAX - R() * L, len: 2 + R() * 6, v: .6 + R() * 1.2 });
    const vi = R() < .15, c = vi ? [.55, .42, 1] : [.3, .88, 1];
    sc.set([0, 0, 0, ...c], i * 6);
  }
  const sg = new T.BufferGeometry();
  sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('color', new T.BufferAttribute(sc, 3));
  scene.add(new T.LineSegments(sg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })));

  // Interconnected digital network: glowing nodes that link up when they drift close
  const g2 = document.createElement('canvas'); g2.width = g2.height = 64;
  const gx = g2.getContext('2d'), gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
  const NN = small ? 36 : 75, MAXL = small ? 90 : 260, D2 = 40, pal = [[.3, .88, 1], [.55, .42, 1], [1, .35, .8], [.35, .6, 1]];
  const nodes = [], np = new Float32Array(NN * 3), nc = new Float32Array(NN * 3);
  for (let i = 0; i < NN; i++) {
    nodes.push({ x: (R() - .5) * 20, y: (R() - .5) * 11, z: ZMAX - R() * 60, p: R() * 6.28 });
    nc.set(pal[i % 4], i * 3);
  }
  const ng = new T.BufferGeometry();
  ng.setAttribute('position', new T.BufferAttribute(np, 3)); ng.setAttribute('color', new T.BufferAttribute(nc, 3));
  scene.add(new T.Points(ng, new T.PointsMaterial({ size: small ? .5 : .6, map: new T.CanvasTexture(g2), vertexColors: true, transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false })));
  const lp = new Float32Array(MAXL * 6), lc = new Float32Array(MAXL * 6), lgeo = new T.BufferGeometry();
  lgeo.setAttribute('position', new T.BufferAttribute(lp, 3)); lgeo.setAttribute('color', new T.BufferAttribute(lc, 3));
  scene.add(new T.LineSegments(lgeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false })));

  // "YOTA DEV" sign: stacked layers give the lettering real depth; it flies through the tunnel like a gate
  const tc = document.createElement('canvas'); tc.width = 1024; tc.height = 256;
  const tx = tc.getContext('2d'), tex = new T.CanvasTexture(tc);
  const paint = () => {
    tx.clearRect(0, 0, 1024, 256); tx.font = '700 170px "Space Grotesk", system-ui, sans-serif'; tx.textAlign = 'center'; tx.textBaseline = 'middle';
    const g = tx.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#4de1ff'); g.addColorStop(.55, '#a58bff'); g.addColorStop(1, '#ff7ad9');
    tx.fillStyle = g; tx.shadowColor = '#4de1ff'; tx.shadowBlur = 24; tx.fillText('YOTA DEV', 512, 134); tex.needsUpdate = true;
  };
  paint(); if (document.fonts) document.fonts.ready.then(paint);
  const sign = new T.Group(), SW = small ? 7 : 11, layers = [];
  for (let i = 0; i < 8; i++) {
    const front = i === 7;
    const m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: front ? 0xffffff : new T.Color(0x0d1f55).lerp(new T.Color(0x3a7bff), i / 7), blending: front ? T.AdditiveBlending : T.NormalBlending });
    m.userData = { base: front ? .95 : .55 }; m.opacity = m.userData.base;
    const p = new T.Mesh(new T.PlaneGeometry(SW, SW / 4), m); p.position.z = i * .09; sign.add(p); layers.push(m);
  }
  const frame = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(SW + 1.2, SW / 4 + 1, .8)), new T.LineBasicMaterial({ color: 0x4de1ff, transparent: true, opacity: .7 }));
  frame.position.z = .3; sign.add(frame); sign.position.set(0, 1.2, -45); scene.add(sign);

  // Subtle tech atmosphere: wireframe spheres/cubes + faint floating code symbols (all drift with the tunnel)
  const wires = [], wm = new T.MeshBasicMaterial({ color: 0x5b7bff, wireframe: true, transparent: true, opacity: .16, depthWrite: false });
  const wg = [new T.IcosahedronGeometry(1.4, 1), new T.BoxGeometry(1.6, 1.6, 1.6)];
  for (let i = 0; i < (small ? 3 : 6); i++) {
    const m = new T.Mesh(wg[i % 2], wm);
    m.position.set((R() < .5 ? -1 : 1) * (4 + R() * 7), (R() - .5) * 8, -R() * 50); m.scale.setScalar(.7 + R() * 1.2); scene.add(m); wires.push(m);
  }
  const syms = ['{ }', '</>', '( )', ';', '[ ]', '=>', '0x1F', '&&'], codes = [];
  const symTex = syms.map(sym => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.font = '600 74px ui-monospace, Menlo, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#9fd8ff'; x.fillText(sym, 128, 66);
    return new T.CanvasTexture(c);
  });
  for (let i = 0; i < (small ? 7 : 16); i++) {
    const sp2 = new T.Sprite(new T.SpriteMaterial({ map: symTex[i % syms.length], transparent: true, opacity: .2, depthWrite: false, blending: T.AdditiveBlending }));
    sp2.scale.set(1.6, .8, 1); sp2.position.set((R() - .5) * 26, (R() - .5) * 12, -R() * 60); sp2.userData.p = R() * 6; scene.add(sp2); codes.push(sp2);
  }

  // Hero object (core cube + wireframe + rings), sits inside the tunnel
  const hero = new T.Group();
  const core = new T.Mesh(new T.BoxGeometry(1.2, 1.2, 1.2), new T.MeshStandardMaterial({ color: 0x1b2a6b, emissive: 0x2a58ff, emissiveIntensity: .6, metalness: .7, roughness: .25 }));
  const shell = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(2, 2, 2)), new T.LineBasicMaterial({ color: 0x4de1ff }));
  const ring1 = new T.Mesh(new T.TorusGeometry(2, .015, 8, 80), new T.MeshBasicMaterial({ color: 0x8b6bff }));
  const ring2 = ring1.clone(); ring2.rotation.x = Math.PI / 2; ring2.scale.setScalar(1.25);
  const big = new T.Mesh(new T.IcosahedronGeometry(3.4, 1), new T.MeshBasicMaterial({ color: 0x4d6bff, wireframe: true, transparent: true, opacity: .09, depthWrite: false }));
  hero.add(core, shell, ring1, ring2, big); scene.add(hero);

  const narrow = () => innerWidth < 860;
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); hero.position.set(narrow() ? 0 : 3.2, narrow() ? 2.4 : .3, 0); hero.scale.setScalar(narrow() ? .6 : 1); };
  cam.position.set(0, 0, 8); resize(); addEventListener('resize', resize);

  let fcount = 0, speed = 7, lastY = scrollY, visible = true, last = performance.now();
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); loop(); } });
  function loop() {
    if (!visible) return;
    requestAnimationFrame(loop);
    if (small && (fcount++ & 1)) return;   // phones render at half rate
    const now = performance.now(), dt = Math.min((now - last) / 1000, .05), t = now / 1000; last = now;
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    speed += (7 + Math.min(dy * .6, 30) - speed) * .05;            // scrolling pushes you through faster
    const dz = speed * dt;
    // blocks
    for (let i = 0; i < B; i++) {
      const b = blocks[i]; b.z += dz; if (b.z - b.d > ZMAX) b.z -= L;
      dm.position.set(Math.cos(b.a) * b.r * 1.5, Math.sin(b.a) * b.r * .85, b.z);
      dm.rotation.set(0, 0, b.a); dm.scale.set(b.w, b.h, b.d); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    // streams (head moves toward camera, tail trails behind)
    for (let i = 0; i < S; i++) {
      const s = st[i]; s.z += dz * 1.6 * s.v; if (s.z - s.len > ZMAX) { s.z -= L + s.len; s.a = R() * 6.283; }
      const x = Math.cos(s.a) * s.r * 1.4, y = Math.sin(s.a) * s.r * .8;
      sp.set([x, y, s.z - s.len, x, y, s.z], i * 6);
    }
    sg.attributes.position.needsUpdate = true;
    // network nodes drift, wrap, and connect to near neighbours
    for (let i = 0; i < NN; i++) {
      const n = nodes[i]; n.z += dz * .5; if (n.z > ZMAX) n.z -= 60;
      np.set([n.x + Math.sin(t * .4 + n.p) * .9, n.y + Math.cos(t * .35 + n.p) * .7, n.z], i * 3);
    }
    let k = 0;
    for (let i = 0; i < NN && k < MAXL; i++) for (let j = i + 1; j < NN && k < MAXL; j++) {
      const dx = np[i*3]-np[j*3], dy = np[i*3+1]-np[j*3+1], dz2 = np[i*3+2]-np[j*3+2], d = dx*dx + dy*dy + dz2*dz2;
      if (d > D2) continue;
      const f = 1 - d / D2;
      lp.set([np[i*3], np[i*3+1], np[i*3+2], np[j*3], np[j*3+1], np[j*3+2]], k * 6);
      lc.set([nc[i*3]*f, nc[i*3+1]*f, nc[i*3+2]*f, nc[j*3]*f, nc[j*3+1]*f, nc[j*3+2]*f], k * 6); k++;
    }
    lgeo.setDrawRange(0, k * 2); lgeo.attributes.position.needsUpdate = lgeo.attributes.color.needsUpdate = true; ng.attributes.position.needsUpdate = true;
    // sign: approaches, sways with the mouse, fades out before reaching the camera
    sign.position.z += dz * .8; if (sign.position.z > 7) sign.position.z = -100;
    sign.rotation.y = Math.sin(t * .5) * .25 + mouse.x * .3; sign.rotation.x = -mouse.y * .15; sign.position.y = 1.2 + Math.sin(t * .8) * .25;
    const fade = Math.max(0, Math.min(1, (6 - sign.position.z) / 5));
    layers.forEach(m => m.opacity = m.userData.base * fade); frame.material.opacity = .7 * fade;
    wires.forEach((m, i) => { m.position.z += dz * .7; if (m.position.z > ZMAX) m.position.z -= 60; m.rotation.x += dt * .15; m.rotation.y += dt * .2; });
    codes.forEach(c => { c.position.z += dz * .6; if (c.position.z > ZMAX) c.position.z -= 60; c.position.y += Math.sin(t * .5 + c.userData.p) * .003; });
    big.rotation.y = t * .08; big.rotation.x = t * .05;
    // camera, hero, lights
    const sc = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    cam.position.x += (mouse.x * .8 - cam.position.x) * .04; cam.position.y += (-mouse.y * .5 - cam.position.y) * .04;
    cam.lookAt(0, 0, -20); cam.rotation.z = -mouse.x * .05 + sc * .5;
    hero.position.y += ((narrow() ? 2.4 : .3) - hero.position.y) * .1 + Math.sin(t) * .002;
    hero.rotation.y += (t * .3 + mouse.x * .8 - hero.rotation.y) * .03;
    hero.rotation.x += (mouse.y * .5 + sc * 3 - hero.rotation.x) * .03;
    ring1.rotation.z = t * .4; ring2.rotation.y = t * .3;
    core.material.emissiveIntensity = .5 + Math.sin(t * 2) * .15;
    renderer.render(scene, cam);
  }
  loop();
});

// Hero glow parallax (CSS variables) + heading entrance
if (!reduce) addEventListener('pointermove', e => {
  document.documentElement.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
  document.documentElement.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
});
const h2io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); h2io.unobserve(en.target); } }), { threshold: .3 });
document.querySelectorAll('h2').forEach(h => { h.classList.add('reveal'); h2io.observe(h); });

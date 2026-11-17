/* Starfield dodge game — hidden route /starfield.
   Arrow keys / WASD to steer. Dodge asteroids, collect stardust, survive.
   Reduced-motion: static starfield. No external deps. */
(() => {
  'use strict';
  const canvas = document.getElementById('starfield-canvas');
  const overlay = document.getElementById('starfield-overlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, state = 'ready', score = 0, best = 0, t0 = 0;
  let ship = { x: 0, y: 0, vx: 0, vy: 0, r: 12, trail: [] };
  const rocks = [], dust = [], stars = [];
  const NROCKS = 14, NDUST = 22, NSTARS = 180;
  let keys = {};

  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * d);
    canvas.height = Math.round(canvas.clientHeight * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function init() {
    size();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ship.x = w / 2; ship.y = h * .78; ship.vx = 0; ship.vy = 0; ship.trail = [];
    rocks.length = 0; dust.length = 0;
    for (let i = 0; i < NROCKS; i++) rocks.push(makeRock(true));
    for (let i = 0; i < NDUST; i++) dust.push(makeDust(true));
    if (!stars.length) for (let i = 0; i < NSTARS; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, z: .2 + Math.random() * .8, s: .5 + Math.random() * 1.6 });
    best = Number(localStorage.getItem('sf-best') || 0);
    state = 'ready'; score = 0; t0 = 0;
    draw();
  }

  function makeRock(offscreen = false) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const r = 10 + Math.random() * 24;
    return { x: Math.random() * w, y: offscreen ? -r - Math.random() * 400 : -r, r, speed: 1.4 + Math.random() * 2.6, spin: (Math.random() - .5) * .06, a: Math.random() * Math.PI * 2, hue: 20 + Math.random() * 40 };
  }
  function makeDust(offscreen = false) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    return { x: Math.random() * w, y: offscreen ? -20 - Math.random() * 600 : -20, r: 3 + Math.random() * 4, speed: 1.1 + Math.random() * 2.2, hue: 40 + Math.random() * 60 };
  }

  function start() {
    if (state !== 'ready' && state !== 'over') return;
    state = 'play'; score = 0; t0 = performance.now();
    ship.x = canvas.clientWidth / 2; ship.y = canvas.clientHeight * .78; ship.vx = 0; ship.vy = 0; ship.trail = [];
    rocks.length = 0; dust.length = 0;
    for (let i = 0; i < NROCKS; i++) rocks.push(makeRock(true));
    for (let i = 0; i < NDUST; i++) dust.push(makeDust(true));
    loop();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (state !== 'play') { draw(); return; }
    update(); draw();
  }

  function update() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dt = 1;
    // input
    let ax = 0, ay = 0;
    if (keys.ArrowLeft || keys.a || keys.A) ax -= 1;
    if (keys.ArrowRight || keys.d || keys.D) ax += 1;
    if (keys.ArrowUp || keys.w || keys.W) ay -= 1;
    if (keys.ArrowDown || keys.s || keys.S) ay += 1;
    const len = Math.hypot(ax, ay) || 1;
    ax /= len; ay /= len;
    ship.vx += ax * .55; ship.vy += ay * .55;
    ship.vx *= .86; ship.vy *= .86;
    ship.x = Math.max(ship.r, Math.min(w - ship.r, ship.x + ship.vx));
    ship.y = Math.max(ship.r, Math.min(h - ship.r, ship.y + ship.vy));
    ship.trail.push({ x: ship.x, y: ship.y }); if (ship.trail.length > 14) ship.trail.shift();

    // difficulty ramp
    const elapsed = (performance.now() - t0) / 1000;
    const speedMul = 1 + elapsed * .018;

    // rocks
    for (let i = rocks.length - 1; i >= 0; i--) {
      const rk = rocks[i];
      rk.y += rk.speed * speedMul; rk.a += rk.spin;
      if (rk.y - rk.r > h) { rocks.splice(i, 1); rocks.push(makeRock(true)); continue; }
      const dd = Math.hypot(rk.x - ship.x, rk.y - ship.y);
      if (dd < rk.r + ship.r - 3) { gameOver(); return; }
    }
    // dust collect
    for (let i = dust.length - 1; i >= 0; i--) {
      const du = dust[i];
      du.y += du.speed * speedMul;
      if (du.y - du.r > h) { dust.splice(i, 1); dust.push(makeDust(true)); continue; }
      const dd = Math.hypot(du.x - ship.x, du.y - ship.y);
      if (dd < du.r + ship.r) { score += 10; dust.splice(i, 1); dust.push(makeDust(true)); }
    }
    // score over time
    score += Math.round(speedMul * .4);
    // spawn pressure
    if (rocks.length < NROCKS + Math.floor(elapsed / 8)) rocks.push(makeRock(true));
  }

  function gameOver() {
    state = 'over';
    if (score > best) { best = score; localStorage.setItem('sf-best', String(best)); }
  }

  function draw() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    // stars
    for (const st of stars) {
      let y = st.y; if (!reduced.matches) y = (y + (st.z * .12)) % h;
      ctx.beginPath();
      ctx.fillStyle = `rgba(214,226,255,${.25 + st.z * .55})`;
      ctx.arc(st.x, y, st.s * st.z, 0, Math.PI * 2); ctx.fill();
    }
    // dust
    for (const du of dust) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,211,147,${.55})`;
      ctx.arc(du.x, du.y, du.r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,211,147,${.18})`;
      ctx.arc(du.x, du.y, du.r * 2.6, 0, Math.PI * 2); ctx.fill();
    }
    // rocks
    for (const rk of rocks) {
      ctx.save();
      ctx.translate(rk.x, rk.y); ctx.rotate(rk.a);
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const rr = rk.r * (.75 + .25 * Math.sin(a * 3 + rk.a));
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `hsl(${rk.hue}, 18%, 32%)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${rk.hue}, 30%, 55%, .55)`;
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    // ship trail
    for (let i = 0; i < ship.trail.length; i++) {
      const p = ship.trail[i];
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,211,147,${(i / ship.trail.length) * .55})`;
      ctx.arc(p.x, p.y, (i / ship.trail.length) * 6 + 1, 0, Math.PI * 2); ctx.fill();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const ang = Math.atan2(ship.vy, ship.vx || .001) + Math.PI / 2;
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * .7, ship.r * .9);
    ctx.lineTo(0, ship.r * .4);
    ctx.lineTo(-ship.r * .7, ship.r * .9);
    ctx.closePath();
    ctx.fillStyle = '#FFF8EC'; ctx.fill();
    ctx.strokeStyle = '#FFD393'; ctx.lineWidth = 1.5; ctx.stroke();
    // thruster
    ctx.beginPath();
    ctx.moveTo(-ship.r * .3, ship.r * .6);
    ctx.lineTo(0, ship.r * 1.5 + Math.random() * 4);
    ctx.lineTo(ship.r * .3, ship.r * .6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(244,154,120,.85)'; ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(255,248,236,.92)';
    ctx.font = '600 16px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE  ' + score, 18, 26);
    ctx.textAlign = 'right';
    ctx.fillText('BEST  ' + best, w - 18, 26);

    // overlay text
    overlay.innerHTML = '';
    if (state === 'ready') {
      overlay.innerHTML = `<div class="sf-card"><h2>Starfield</h2><p>Arrow keys / WASD to steer. Dodge the rocks, collect stardust. <br>Press <b>Space</b> to start.</p><p class="sf-hint">Click anywhere to begin.</p></div>`;
    } else if (state === 'over') {
      overlay.innerHTML = `<div class="sf-card"><h2>Game Over</h2><p>Score: ${score} · Best: ${best}</p><p class="sf-hint">Press <b>Space</b> or click to try again.</p></div>`;
    }
  }

  function keydown(e) {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); start(); }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  }
  function keyup(e) { keys[e.key] = false; }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  canvas.addEventListener('click', start);
  window.addEventListener('resize', () => { size(); if (state !== 'play') draw(); });

  // init on load
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // pause when tab hidden
  document.addEventListener('visibilitychange', () => { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } else if (!document.hidden && state === 'play' && !raf) loop(); });
})();

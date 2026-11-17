/* Sound design — opt-in (muted by default).
   - route-change chime (soft, ascending two-tone)
   - supernova detonation rumble (low sine swell)
   - hover tick on project cards (tiny, throttled)
   Toggle: nav button #sound-toggle + localStorage 'sn-sound'.
   AudioContext created on first user gesture (browser policy). */
(() => {
  'use strict';
  let ctx = null, enabled = false, gain = null;
  try { enabled = localStorage.getItem('sn-sound') === 'on'; } catch (e) {}

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = enabled ? .22 : 0;
    gain.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, when, type = 'sine', vol = .55) {
    if (!ctx || !enabled) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(gain);
    const t = when || ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.start(t); o.stop(t + dur + .05);
  }

  function chime() {
    if (!enabled) return; ensureCtx();
    const t = ctx.currentTime;
    tone(523.25, .18, t, 'sine', .35);
    tone(783.99, .26, t + .09, 'sine', .4);
  }
  function rumble() {
    if (!enabled) return; ensureCtx();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 62;
    o.connect(g); g.connect(gain);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.5, t + .12);
    g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
    o.frequency.linearRampToValueAtTime(48, t + 1.6);
    o.start(t); o.stop(t + 1.7);
    // shimmer
    tone(220, .5, t + .05, 'triangle', .12);
    tone(330, .5, t + .18, 'triangle', .10);
  }
  let lastTick = 0;
  function tick() {
    if (!enabled) return; ensureCtx();
    const now = performance.now();
    if (now - lastTick < 90) return; lastTick = now;
    tone(1320, .05, ctx.currentTime, 'square', .08);
  }

  function setEnabled(v) {
    enabled = v;
    try { localStorage.setItem('sn-sound', v ? 'on' : 'off'); } catch (e) {}
    if (ctx) gain.gain.setTargetAtTime(v ? .22 : 0, ctx.currentTime, .05);
    syncBtn();
  }
  function syncBtn() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.querySelector('.sound-icon').textContent = enabled ? '♪' : '♪̸';
    btn.querySelector('.sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
    btn.setAttribute('aria-pressed', String(enabled));
  }

  // init button
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    btn.addEventListener('click', () => { ensureCtx(); if (ctx && ctx.state === 'suspended') ctx.resume(); setEnabled(!enabled); if (enabled) chime(); });
    syncBtn();
  }
  // route chime on SPA navigation
  const orig = window.route;
  if (typeof orig === 'function') {
    window.route = function (...a) { const r = orig.apply(this, a); chime(); return r; };
  }
  // supernova rumble when detonation begins (~1.2s after load on home)
  window.addEventListener('load', () => { if (location.pathname === '/' || location.pathname === '') setTimeout(rumble, 1250); });

  // hover tick on project cards (delegated, throttled)
  document.addEventListener('mouseover', (e) => {
    if (!enabled) return;
    const card = e.target.closest('.project-card');
    if (!card) return;
    tick();
  });

  // expose for debugging
  window.snSound = { chime, rumble, tick, setEnabled };
})();

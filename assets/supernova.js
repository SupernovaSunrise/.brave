/* Supernova v4 — full-page cinematic engine.
   WebGL: 6-octave domain-warped nebula, filament ridges, RT-instability shock shell,
   sunrise horizon + reflection, ACES tone map, film grain, chromatic aberration.
   2D ejecta: 1800 additive sparks with trails + shock-front alignment.
   Fixed full-page backdrop; three acts drive by hero scroll, then drift
   pans the camera through the remnant for the rest of the page.
   Dark = deep-space supernova. Light = dawn sky, pastel watercolor nebula.
   Pointer gravity + click flare. Reduced-motion = calm static frame. */
(() => {
  'use strict';

  const VERT = `#version 300 es
    in vec2 position;
    void main(){ gl_Position = vec4(position, 0., 1.); }
  `;

  const FRAG = `#version 300 es
    precision highp float;
    uniform vec2 u_res;
    uniform vec2 u_pointer;
    uniform float u_time;
    uniform float u_progress;
    uniform float u_flash;
    uniform float u_theme; // 0 dark, 1 light
    uniform float u_intensity;
    uniform float u_drift; // 0..1 page scroll — camera pan through remnant
    out vec4 color;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.-2.*f);
      return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
                 mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0., a = .5;
      for(int i=0;i<6;i++){ v += noise(p)*a; p = p*2.03 + vec2(11.7, -7.3); a *= .5; }
      return v;
    }
    float ridged(vec2 p){
      float v = 0., a = .55;
      for(int i=0;i<5;i++){
        float n = noise(p);
        v += (1. - abs(2.*n - 1.)) * a;
        p = p*2.17 + vec2(3.1, 8.7);
        a *= .52;
      }
      return v;
    }

    vec3 aces(vec3 x){
      return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.);
    }

    void main(){
      vec2 px = gl_FragCoord.xy;
      vec2 uv = (px - u_res*.5) / min(u_res.x, u_res.y);
      float r = length(uv);
      float ang = atan(uv.y, uv.x);
      float t = u_time;

      // --- scroll acts ---
      float collapse = smoothstep(.0,.28, 1.-u_progress);
      float detonation = smoothstep(.16,.42,u_progress)*(1.-smoothstep(.58,.98,u_progress));
      float remnant = smoothstep(.42,1.,u_progress);
      float boom = detonation;

      // camera: slow push-in through explosion
      vec2 cuv = uv / (1. + boom*.28 - collapse*.10);
      float cr = length(cuv);

      // --- sunrise horizon (sun rises from below) ---
      // horizon sits at y = -.42 in uv; below = sea reflection
      float hz = -.40;
      float above = smoothstep(hz-.06, hz+.06, cuv.y);
      float sunRise = smoothstep(.0,.5,u_progress); // 0 collapsed low -> high
      float horY = hz + sunRise*.28; // supernova climbs as you scroll
      float sunBody = exp(-pow((length(cuv - vec2(0., horY)) - .10 - collapse*.03)/.16, 2.));
      float horGlow = exp(-abs(cuv.y - horY)*3.2);
      float seaRef = smoothstep(hz+.02, hz+.5, cuv.y) * exp(-abs(cuv.x)*1.6);
      // reflection streaks
      float streak = pow(max(0., .5 + .5*sin(cuv.x*55. + fbm(vec2(cuv.x*4., t*.4))*8.)), 6.) * seaRef;

      // --- nebula: domain-warped FBM + filaments (drift pans camera) ---
      vec2 driftOff = vec2(u_drift*.55, u_drift*.32);
      vec2 warp = vec2(fbm(cuv*3.2 + vec2(t*.035, 0.) + driftOff),
                       fbm(cuv*3.2 + vec2(5.2, 1.3) - t*.025 + driftOff));
      vec2 dp = cuv*4.2 + 7.*warp;
      float neb = fbm(dp);
      float fil = ridged(cuv*5.5 + 9.*warp);
      float filament = pow(clamp(fil, 0., 1.), 3.) * exp(-cr*1.15);
      float nebFall = exp(-cr*1.05);

      // --- shock shell with Rayleigh-Taylor fingers ---
      float rt = fbm(vec2(ang*4. + t*.25, cr*6. - t*.5)) * .10;
      float shellR = (.28 + boom*.52) + rt;
      float shellBase = exp(-pow((cr - shellR)/.035, 2.));
      float shellFinger = exp(-pow((cr - shellR - sin(ang*24. + t*1.8)*.03 - rt*.5)/.06, 2.));
      float shell = max(shellBase, shellFinger*.8);

      // --- core + prominences ---
      float wob = fbm(vec2(ang*3. + t*.18, cr*5. - t*.3)) * .07;
      float core = exp(-pow((cr - .018 - wob)/(.055 + boom*.02), 2.));
      float corona = exp(-pow((cr - .085 - wob)/.13, 2.)) * (.55 + .45*sin(ang*11. + t*1.4));
      float prom = pow(max(0., .5 + .5*sin(ang*27. + sin(ang*7. - t)*2. + cr*10.)), 7.) * exp(-cr*2.8);
      float flashBoost = 1. + u_flash*2.6;

      // --- palettes ---
      vec3 deepDark = vec3(.012,.016,.045);
      vec3 dawnBase = vec3(.992,.961,.894);
      vec3 hot = vec3(1.,.99,.94);
      vec3 gold = vec3(1.,.80,.52);
      vec3 ion = vec3(.54,.70,1.);
      vec3 remnantC = vec3(.76,.54,.98);
      vec3 ember = vec3(.96,.58,.48);
      // light pastel palette
      vec3 pastelPink = vec3(1.,.78,.82);
      vec3 pastelPeach = vec3(1.,.87,.68);
      vec3 pastelBlue = vec3(.62,.80,1.);
      vec3 pastelLav = vec3(.82,.72,1.);

      // --- dark composition ---
      vec3 imgD = deepDark;
      vec3 nebD = mix(ion, remnantC, neb);
      nebD = mix(nebD, gold, .38*boom);
      nebD = mix(nebD, ember, .22*collapse);
      imgD += nebD * neb * nebFall * (.20 + boom*.58 + remnant*.30);
      imgD += mix(remnantC, gold, .5) * filament * (.28 + boom*.35);
      imgD += hot * core * (1.7*flashBoost) * (.5 + boom*.95);
      imgD += gold * corona * (.55 + boom*.6) * flashBoost;
      imgD += hot * prom * (.35 + boom*.5) * flashBoost;
      imgD += mix(gold, ion, .5) * shell * (.7 + boom*.5);
      // horizon/sea glow (dark: ember horizon + reflection)
      imgD += ember * horGlow * (.22 + sunRise*.38);
      imgD += gold * sunBody * (.35 + sunRise*.4);
      imgD += mix(ember, gold, .5) * streak * .55;

      // --- light composition (dawn: cream sky, watercolor nebula) ---
      vec3 imgL = dawnBase;
      // soft dawn gradient (warm below, cool above)
      imgL = mix(vec3(.94,.89,.84), vec3(1.,.97,.92), smoothstep(hz-.2, hz+.8, cuv.y));
      imgL += vec3(1.,.86,.62) * horGlow * (.4 + sunRise*.5);
      vec3 nebL = mix(pastelBlue, pastelLav, neb);
      nebL = mix(nebL, pastelPink, .45);
      nebL = mix(nebL, pastelPeach, .35*boom);
      imgL = mix(imgL, nebL, neb * nebFall * (.42 + boom*.30));
      imgL += pastelPink * filament * .35;
      imgL += hot * core * (1.35*flashBoost) * (.45 + boom*.75);
      imgL += pastelPeach * corona * (.45 + boom*.5) * flashBoost;
      imgL += pastelPeach * prom * .3 * flashBoost;
      imgL += pastelPeach * shell * (.5 + boom*.45);
      imgL += pastelPeach * sunBody * (.5 + sunRise*.5);
      imgL += vec3(1.,.75,.55) * streak * .45;
      // light sea: soft reflection smudge
      imgL = mix(imgL, vec3(1.,.93,.85), seaRef*.35);

      vec3 img = mix(imgD, imgL, u_theme);

      // --- click pulse rings ---
      float pulse = exp(-pow((cr - (1.02 - u_flash*.8))/.055, 2.));
      img += mix(hot, vec3(1.,.85,.6), u_theme) * pulse * u_flash * .85;

      // --- pointer lens glow ---
      vec2 m = u_pointer * vec2(u_res.x/u_res.y, 1.);
      float glow = exp(-length(cuv - m)*2.0);
      img += mix(ion, pastelPeach, u_theme*.7) * glow * .10 * (.4 + boom*.6);

      // --- chromatic aberration near core ---
      float ca = smoothstep(.45,.02, cr) * .012;
      float n0 = hash(px + fract(t));
      img.r += ca * sin(ang + n0);
      img.b -= ca * cos(ang);

      // --- tone map + vignette + grain ---
      img = aces(img * (1.05 + u_flash*.4));
      img *= 1. - smoothstep(.72,1.45, r) * (mix(.5,.22,u_theme));
      float grain = (hash(px + fract(t)*100.) - .5) * .035;
      img += grain;

      float a = clamp(max(max(img.r,img.g),img.b), 0., 1.);
      color = vec4(img * u_intensity, max(a, ekappa01(above)*0.));
    }
    float ekappa01(float x){ return clamp(x,0.,1.)*0.; }
  `;

  // --- 2D ejecta overlay (additive sparks + shock alignment) ---
  function createSupernova(canvas, opts = {}) {
    const canvas2d = opts.ejectaCanvas || null;
    const reduced = opts.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)');
    const isLight = () => document.documentElement.dataset.theme === 'light';

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'high-performance' });
    let program = null, uni = {}, buf = null, glOK = false;
    if (gl) {
      const mk = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Supernova shader:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
        return s;
      };
      const vs = mk(gl.VERTEX_SHADER, VERT), fs = mk(gl.FRAGMENT_SHADER, FRAG);
      if (vs && fs) {
        program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          glOK = true;
          buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
          const loc = gl.getAttribLocation(program, 'position');
          ['u_res','u_pointer','u_time','u_progress','u_flash','u_theme','u_intensity','u_drift'].forEach(n => uni[n] = gl.getUniformLocation(program, n));
          uni._loc = loc;
        }
      }
    }

    const ctx = canvas2d ? canvas2d.getContext('2d') : null;

    let progress = 0, drift = 0, intensity = 1, flash = 0, startTime = performance.now();
    let px = 0, py = 0, tpx = 0, tpy = 0, hover = 0, hoverTarget = 0;
    let raf = 0, lastPaint = 0, lastProgress = -1;
    const sparks = [];
    const N = reduced.matches ? 0 : 1800;
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({
        a, d: Math.random(),
        sp: .3 + Math.random() * 1.1,
        v: 0,
        size: .4 + Math.random() * 1.9,
        tw: Math.random() * Math.PI * 2,
        cool: Math.random(),
        x: 0, y: 0
      });
    }

    function sizeAll(scale) {
      const d = Math.min(window.devicePixelRatio || 1, 2) * scale;
      if (canvas.clientWidth) {
        canvas.width = Math.round(canvas.clientWidth * d);
        canvas.height = Math.round(canvas.clientHeight * d);
        if (glOK) gl.viewport(0, 0, canvas.width, canvas.height);
      }
      if (canvas2d && canvas2d.clientWidth) {
        canvas2d.width = Math.round(canvas2d.clientWidth * d);
        canvas2d.height = Math.round(canvas2d.clientHeight * d);
        if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
      }
    }

    function smooth(a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

    function render(now) {
      raf = requestAnimationFrame(render);
      if (document.hidden) return;
      if (reduced.matches && Math.abs(progress - lastProgress) < .004 && flash < .01) return;
      if (now - lastPaint < 32 && !reduced.matches) return;
      lastPaint = now; lastProgress = progress;
      const t = (now - startTime) / 1000;
      if (reduced.matches) { px = tpx; py = tpy; hover = hoverTarget; }
      else { px += (tpx - px) * .12; py += (tpy - py) * .12; hover += (hoverTarget - hover) * .09; }
      flash *= .95; if (flash < .01) flash = 0;

      const env = 1 - smooth(.78, 1, progress) * .5;

      if (glOK && canvas.width) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(uni._loc);
        gl.vertexAttribPointer(uni._loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uni.u_res, canvas.width, canvas.height);
        gl.uniform2f(uni.u_pointer, px, py);
        gl.uniform1f(uni.u_time, reduced.matches ? 12 : t);
        gl.uniform1f(uni.u_progress, progress);
        gl.uniform1f(uni.u_flash, flash);
        gl.uniform1f(uni.u_theme, isLight() ? 1 : 0);
        gl.uniform1f(uni.u_intensity, intensity * env);
        gl.uniform1f(uni.u_drift, drift);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (ctx && canvas2d.width) {
        const w = canvas2d.clientWidth, h = canvas2d.clientHeight;
        const cx = w / 2, cy = h / 2 - Math.min(w, h) * .28; // horizon sits high, supernova climbs from it
        const boom = smooth(.16, .45, progress) * (1 - smooth(.66, 1, progress) * .5);
        const drag = 1 - .028; // velocity retention per frame

        // motion-blur trails
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        // shock fronts (2 shells + flash ring)
        const ringR = Math.min(w, h) * (.05 + smooth(.18, .6, progress) * .68);
        [0, 1].forEach(i => {
          const rr = ringR * (.72 + i * .38);
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          const c = isLight() ? '255,190,140' : (i ? '138,182,255' : '255,211,147');
          ctx.strokeStyle = `rgba(${c},${(.30 * boom + .05).toFixed(3)})`;
          ctx.lineWidth = 2.6 - i * .8;
          ctx.stroke();
        });
        if (flash > .02) {
          ctx.beginPath(); ctx.arc(cx, cy, Math.min(w, h) * (.55 - flash * .45), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,240,210,${(flash * .55).toFixed(3)})`;
          ctx.lineWidth = 2; ctx.stroke();
        }

        const mx = cx + px * Math.min(w, h) * .5, my = cy - py * Math.min(w, h) * .5;
        for (const s of sparks) {
          // ballistic: radius grows with time, velocity damped
          const travel = s.d * (.35 + s.sp * boom) + (reduced.matches ? 0 : (t * .02 * s.sp) % .45);
          const rr = Math.min(w, h) * travel;
          let x = cx + Math.cos(s.a) * rr, y = cy + Math.sin(s.a) * rr;
          const dx = mx - x, dy = my - y, dd = Math.hypot(dx, dy) + .01;
          const g = Math.min(48 / dd, .55) * hover;
          x += dx / dd * g * 9; y += dy / dd * g * 9;
          const tw = reduced.matches ? 1 : .65 + .35 * Math.sin(t * 2.2 + s.tw);
          const heat = Math.max(0, Math.min(1, (1 - s.cool * (1 - boom)) * 1.2 + .15 - travel * .8));
          let r = 255, gcol, b;
          if (isLight()) { gcol = Math.round(150 + heat * 105); b = Math.round(140 + heat * 115); }
          else { gcol = Math.round(120 + heat * 135); b = Math.round(90 + heat * 165); }
          const alpha = (.10 + boom * .78) * tw * (1 - travel * .5);
          ctx.beginPath();
          ctx.fillStyle = `rgba(${r},${gcol},${b},${alpha.toFixed(3)})`;
          ctx.arc(x, y, s.size * (.7 + heat * .7), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    const onMove = e => {
      if (reduced.matches) return;
      tpx = (e.clientX / innerWidth - .5) * 2;
      tpy = (.5 - e.clientY / innerHeight) * 2;
      hoverTarget = 1;
    };
    const onDown = e => {
      if (reduced.matches || e.target.closest('a,button,input,select,textarea,iframe,.hero-copy')) return;
      flash = 1;
      for (let i = 0; i < 60 && sparks.length; i++) {
        const s = sparks[(Math.random() * sparks.length) | 0];
        s.a = Math.random() * Math.PI * 2; s.d = .02; s.cool = Math.random() * .35;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => hoverTarget = 0);
    window.addEventListener('resize', () => sizeAll(1));

    sizeAll(1);
    raf = requestAnimationFrame(render);

    return {
      setProgress(v) { progress = Math.max(0, Math.min(1, v)); },
      setDrift(v) { drift = Math.max(0, Math.min(1, v)); },
      pulse() { flash = Math.min(1, flash + .55); },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onDown);
      }
    };
  }

  window.createSupernova = createSupernova;
})();

/* A lightweight WebGL2 burst for the static portfolio, informed by the supplied
   React Bits PrismaticBurst visual reference. No React or third-party runtime. */
(() => {
  'use strict';
  const vertex = `#version 300 es
    in vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }
  `;
  const fragment = `#version 300 es
    precision highp float;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform float phase;
    uniform float bloom;
    out vec4 color;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
    }
    float fbm(vec2 p) {
      float v = 0.;
      float amp = .5;
      for (int i = 0; i < 4; i++) {
        v += noise(floor(p) + fract(p) * fract(p) * (3. - 2. * fract(p))) * amp;
        p *= 2.07;
        amp *= .5;
      }
      return v;
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - resolution * .5) / min(resolution.x, resolution.y);
      uv -= pointer * .025;
      float r = length(uv);
      float angle = atan(uv.y, uv.x);
      float t = phase * .28;
      float uneven = sin(angle * 5. + t) * .034 + sin(angle * 11. - t * .53) * .019;
      float cloud = fbm(uv * 6. + vec2(t * .17, -t * .13));
      float ringRadius = .36 + uneven + (cloud - .5) * .075;
      float ring = exp(-pow((r - ringRadius) / .081, 2.));
      float inner = exp(-pow((r - .19 - uneven * .4) / .15, 2.));
      float strands = pow(max(0., .5 + .5 * sin(angle * 27. + sin(angle * 7. - t) * 2. + r * 9.)), 9.);
      float rays = strands * exp(-r * 3.) * smoothstep(.11, .28, r);
      float feathers = pow(max(0., .5 + .5 * sin(angle * 13. - t * .45 + cloud * 2.)), 5.) * exp(-pow((r - .44) / .24, 2.));
      float core = exp(-r * r * 43.);
      float flecks = pow(max(0., noise(floor(uv * 150. + t * 2.)) - .955), 2.) * 90. * smoothstep(.13, .34, r) * (1. - smoothstep(.62, .84, r));
      vec3 blue = vec3(.32,.57,1.);
      vec3 lavender = vec3(.64,.51,.92);
      vec3 amber = vec3(1.,.51,.21);
      vec3 ivory = vec3(1.,.96,.81);
      vec3 result = blue * (inner * .65 + rays * .47);
      result += lavender * (ring * .36 + feathers * .24);
      result += amber * (ring * (.55 + .4 * sin(angle * 3. + t)) + feathers * .58 + flecks * .32);
      result += ivory * (core * 1.18 + ring * strands * .24 + rays * .45);
      result *= 1. - smoothstep(.62, .88, r);
      float alpha = clamp(max(max(result.r, result.g), result.b) * .89, 0., .96);
      color = vec4(result * bloom, alpha * bloom);
    }
  `;
  window.createPrismaticBurst = (canvas, reducedMotion) => {
    const gl = canvas?.getContext('webgl2', { alpha:true, premultipliedAlpha:false, antialias:false, powerPreference:'low-power' });
    if (!gl) return { setProgress() {} };
    const shader = (type, source) => {
      const item = gl.createShader(type);
      gl.shaderSource(item, source);
      gl.compileShader(item);
      if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) { console.warn('Burst shader unavailable:', gl.getShaderInfoLog(item)); gl.deleteShader(item); return null; }
      return item;
    };
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return { setProgress() {} };
    const program = gl.createProgram();
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return { setProgress() {} }; }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'position');
    const uniforms = Object.fromEntries(['resolution','pointer','phase','bloom'].map(name => [name, gl.getUniformLocation(program,name)]));
    let strength = 0, phase = 0, previous = 0, lastPaint = 0, lastStrength = -1, frame = 0;
    let mouseX = 0, mouseY = 0;
    function resize() {
      const scale = Math.min(window.devicePixelRatio || 1, 1.4) * (innerWidth < 650 ? .48 : .58);
      const width = Math.max(1,Math.round(canvas.clientWidth * scale));
      const height = Math.max(1,Math.round(canvas.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0,0,width,height); }
    }
    function draw(time) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || strength < .015 || (reducedMotion.matches ? Math.abs(strength-lastStrength) < .015 : time-lastPaint < 32)) return;
      lastPaint = time;
      lastStrength = strength;
      resize();
      phase += reducedMotion.matches ? 0 : Math.min(50, time - (previous || time)) * .001;
      previous = time;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, mouseX, mouseY);
      gl.uniform1f(uniforms.phase, phase);
      gl.uniform1f(uniforms.bloom, .48 + strength * .52);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    const onPointer = event => {
      if (reducedMotion.matches) return;
      mouseX = (event.clientX / innerWidth - .5) * 2;
      mouseY = (.5 - event.clientY / innerHeight) * 2;
    };
    window.addEventListener('pointermove', onPointer, { passive:true });
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return {
      setProgress(value) {
        strength = Math.max(0, Math.min(1, value));
      }
    };
  };
})();

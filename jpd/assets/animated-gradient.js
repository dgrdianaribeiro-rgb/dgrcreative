/**
 * SpellAnimatedGradient — vanilla-JS port of the AnimatedGradient shader
 * (see github.com/dgrdianaribeiro-rgb/animated-gradient). One WebGL
 * fragment shader drives 6 presets: Lava, Prism, Plasma, Pulse, Vortex, Mist.
 * Falls back to an animated CSS gradient when WebGL is unavailable or the
 * viewer prefers reduced motion.
 */
(function (global) {
  "use strict";

  var PRESETS = {
    Lava: { mode: 0, speed: 0.55, scale: 1.1, colors: ["#1a0500", "#ff3d00", "#ff9100", "#ffd54f"] },
    Prism: { mode: 1, speed: 0.85, scale: 1.1, colors: ["#7c3aed", "#06b6d4", "#ec4899", "#facc15"] },
    Plasma: { mode: 2, speed: 1.0, scale: 1.0, colors: ["#1e1b4b", "#7c3aed", "#ec4899", "#22d3ee"] },
    Pulse: { mode: 3, speed: 1.1, scale: 1.4, colors: ["#0f172a", "#0ea5e9", "#38bdf8", "#e0f2fe"] },
    Vortex: { mode: 4, speed: 0.8, scale: 1.8, colors: ["#0a0a0a", "#059669", "#0891b2", "#a7f3d0"] },
    Mist: { mode: 5, speed: 0.35, scale: 1.1, colors: ["#e2e8f0", "#cbd5e1", "#94a3b8", "#f8fafc"] },
  };

  var VERTEX_SHADER = [
    "attribute vec2 a_position;",
    "void main() {",
    "  gl_Position = vec4(a_position, 0.0, 1.0);",
    "}",
  ].join("\n");

  var FRAGMENT_SHADER = [
    "precision highp float;",
    "uniform vec2 u_resolution;",
    "uniform float u_time;",
    "uniform float u_speed;",
    "uniform float u_scale;",
    "uniform int u_mode;",
    "uniform vec3 u_c0;",
    "uniform vec3 u_c1;",
    "uniform vec3 u_c2;",
    "uniform vec3 u_c3;",
    "",
    "vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
    "vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }",
    "",
    "float snoise(vec2 v) {",
    "  const vec4 C = vec4(0.211324865405187, 0.366025403784439,",
    "                      -0.577350269189626, 0.024390243902439);",
    "  vec2 i  = floor(v + dot(v, C.yy));",
    "  vec2 x0 = v - i + dot(i, C.xx);",
    "  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);",
    "  vec4 x12 = x0.xyxy + C.xxzz;",
    "  x12.xy -= i1;",
    "  i = mod289(i);",
    "  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))",
    "          + i.x + vec3(0.0, i1.x, 1.0));",
    "  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);",
    "  m = m * m;",
    "  m = m * m;",
    "  vec3 x = 2.0 * fract(p * C.www) - 1.0;",
    "  vec3 h = abs(x) - 0.5;",
    "  vec3 ox = floor(x + 0.5);",
    "  vec3 a0 = x - ox;",
    "  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);",
    "  vec3 g;",
    "  g.x  = a0.x  * x0.x  + h.x  * x0.y;",
    "  g.yz = a0.yz * x12.xz + h.yz * x12.yw;",
    "  return 130.0 * dot(m, g);",
    "}",
    "",
    "float fbm(vec2 p) {",
    "  float v = 0.0;",
    "  float a = 0.5;",
    "  for (int i = 0; i < 5; i++) {",
    "    v += a * snoise(p);",
    "    p *= 2.0;",
    "    a *= 0.5;",
    "  }",
    "  return v;",
    "}",
    "",
    "vec3 palette(float t) {",
    "  t = clamp(t, 0.0, 1.0);",
    "  if (t < 0.3333) return mix(u_c0, u_c1, t / 0.3333);",
    "  if (t < 0.6667) return mix(u_c1, u_c2, (t - 0.3333) / 0.3334);",
    "  return mix(u_c2, u_c3, (t - 0.6667) / 0.3333);",
    "}",
    "",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
    "  float aspect = u_resolution.x / u_resolution.y;",
    "  vec2 p = uv;",
    "  p.x *= aspect;",
    "  vec2 center = vec2(aspect, 1.0) * 0.5;",
    "",
    "  float time = u_time * u_speed;",
    "  float t = 0.5;",
    "  float brightness = 1.0;",
    "",
    "  if (u_mode == 2) {",
    "    float v = sin(p.x * 6.0 * u_scale + time)",
    "            + sin(p.y * 6.0 * u_scale + time * 0.8)",
    "            + sin((p.x + p.y) * 6.0 * u_scale + time * 1.3)",
    "            + sin(length(p - center) * 8.0 * u_scale - time * 1.5);",
    "    t = v / 8.0 + 0.5;",
    "    t += fbm(p * u_scale * 1.5 + time * 0.1) * 0.08;",
    "  } else if (u_mode == 4) {",
    "    vec2 d = p - center;",
    "    float radius = length(d);",
    "    float ang = atan(d.y, d.x) + radius * 5.0 - time * 1.2;",
    "    vec2 warped = center + radius * vec2(cos(ang), sin(ang));",
    "    t = fbm(warped * u_scale * 2.0 + time * 0.06) * 0.5 + 0.5;",
    "  } else if (u_mode == 0) {",
    "    vec2 q = vec2(",
    "      fbm(p * u_scale + time * 0.15),",
    "      fbm(p * u_scale + vec2(5.2, 1.3) + time * 0.12)",
    "    );",
    "    vec2 r = vec2(",
    "      fbm(p * u_scale + 2.2 * q + vec2(1.7, 9.2) + time * 0.18),",
    "      fbm(p * u_scale + 2.2 * q + vec2(8.3, 2.8) + time * 0.15)",
    "    );",
    "    float n = fbm(p * u_scale + 2.2 * r);",
    "    t = smoothstep(0.22, 0.78, n * 0.5 + 0.5);",
    "  } else if (u_mode == 3) {",
    "    float base = fbm(p * u_scale + time * 0.35) * 0.5 + 0.5;",
    "    float pulse = 0.5 + 0.5 * sin(time * 1.6);",
    "    t = clamp(mix(base, pulse, 0.35), 0.0, 1.0);",
    "    brightness = mix(0.8, 1.25, pulse);",
    "  } else if (u_mode == 1) {",
    "    t = fbm(p * u_scale * 1.1 + time * 0.25);",
    "  } else {",
    "    float n = fbm(p * u_scale * 0.6 + time * 0.12) * 0.5 + 0.5;",
    "    t = mix(0.5, n, 0.45);",
    "  }",
    "",
    "  vec3 col;",
    "  if (u_mode == 1) {",
    "    float freq = 5.0;",
    "    float rC = palette(0.5 + 0.5 * sin((t + 0.06) * freq)).r;",
    "    float gC = palette(0.5 + 0.5 * sin(t * freq)).g;",
    "    float bC = palette(0.5 + 0.5 * sin((t - 0.06) * freq)).b;",
    "    col = vec3(rC, gC, bC);",
    "  } else {",
    "    col = palette(t);",
    "  }",
    "",
    "  col *= brightness;",
    "",
    "  float vig = smoothstep(1.1, 0.2, length(uv - 0.5) * 1.3);",
    "  col *= mix(0.85, 1.0, vig);",
    "",
    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  function hexToRgb01(hex) {
    var clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean.split("").map(function (c) { return c + c; }).join("");
    }
    var bigint = parseInt(clean, 16);
    return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255];
  }

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("[SpellAnimatedGradient] shader error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[SpellAnimatedGradient] link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{preset?: string, speed?: number, scale?: number, colors?: string[]}} config
   * @returns {{destroy: function(): void} | null}
   */
  function createAnimatedGradient(canvas, config) {
    config = config || {};
    var def = PRESETS[config.preset] || PRESETS.Plasma;
    var speed = def.speed * (config.speed || 1);
    var scale = def.scale * (config.scale || 1);
    var colors = config.colors || def.colors;

    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return null;

    var program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return null;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "a_position");
    var resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    var timeLoc = gl.getUniformLocation(program, "u_time");
    var speedLoc = gl.getUniformLocation(program, "u_speed");
    var scaleLoc = gl.getUniformLocation(program, "u_scale");
    var modeLoc = gl.getUniformLocation(program, "u_mode");
    var c0Loc = gl.getUniformLocation(program, "u_c0");
    var c1Loc = gl.getUniformLocation(program, "u_c1");
    var c2Loc = gl.getUniformLocation(program, "u_c2");
    var c3Loc = gl.getUniformLocation(program, "u_c3");

    var c0 = hexToRgb01(colors[0]);
    var c1 = hexToRgb01(colors[1]);
    var c2 = hexToRgb01(colors[2]);
    var c3 = hexToRgb01(colors[3]);

    var reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var raf = 0;
    var startTime = performance.now();

    function resize() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    var resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(modeLoc, def.mode);
    gl.uniform1f(speedLoc, speed);
    gl.uniform1f(scaleLoc, scale);
    gl.uniform3f(c0Loc, c0[0], c0[1], c0[2]);
    gl.uniform3f(c1Loc, c1[0], c1[1], c1[2]);
    gl.uniform3f(c2Loc, c2[0], c2[1], c2[2]);
    gl.uniform3f(c3Loc, c3[0], c3[1], c3[2]);

    function render(now) {
      var elapsed = reduceMotion ? 1.5 : (now - startTime) / 1000;
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduceMotion) raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
      },
    };
  }

  global.SpellAnimatedGradient = { create: createAnimatedGradient, presets: PRESETS };
})(window);

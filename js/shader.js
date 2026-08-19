/* ==========================================================================
   VELO — o mar vivo (WebGL1 puro, sem biblioteca nenhuma)

   Shader "Smoke" rodando atrás das faixas escuras do site. É a mesma água do
   mar da barbatana, só que vista de perto: fumaça de fbm em navy, azul e
   espuma, devagar o bastante pra não competir com o texto por cima.

   Cada elemento com [data-vivo] ganha o seu canvas. Só desenha o que está na
   tela — fora dela o rAF nem roda, e a aba escondida derruba tudo.
   ========================================================================== */

(function () {
  'use strict';

  var alvos = document.querySelectorAll('[data-vivo]');
  if (!alvos.length) return;

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------- shaders */

  var VERTEX = [
    'attribute vec2 a_pos;',
    'void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  /* "Smoke" — feito com o 21st.dev Shader Builder.
     Uniforms empacotados em vec4 pra caber no mínimo garantido do WebGL1
     (16 vetores no fragmento); as macros u_* mantêm o código legível. */
  var FRAGMENT = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec3 u_colors[8];',
    'uniform vec4 u_scene;      // resolution.xy, time, contagem de cores',
    'uniform vec4 u_shape;      // scale, intensity, paramA, warp',
    'uniform vec4 u_surface;    // detail, contrast, brightness, saturation',
    'uniform vec4 u_finish;     // hue, vignette, blur, grain',
    'uniform vec4 u_transform;  // seed, rotation, drift, OKLab',
    'uniform vec4 u_space;      // offset.xy, pointer.xy',
    'uniform vec4 u_cursor;',
    '',
    '#define u_resolution u_scene.xy',
    '#define u_time u_scene.z',
    '#define u_colorCount u_scene.w',
    '#define u_scale u_shape.x',
    '#define u_intensity u_shape.y',
    '#define u_paramA u_shape.z',
    '#define u_warp u_shape.w',
    '#define u_detail u_surface.x',
    '#define u_contrast u_surface.y',
    '#define u_brightness u_surface.z',
    '#define u_saturation u_surface.w',
    '#define u_hue u_finish.x',
    '#define u_vignette u_finish.y',
    '#define u_blur u_finish.z',
    '#define u_grain u_finish.w',
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    '#define u_seed u_transform.x',
    '#else',
    '#define u_seed mod(u_transform.x, 31.0)',
    '#endif',
    '#define u_rotate u_transform.y',
    '#define u_drift u_transform.z',
    '#define u_oklab u_transform.w',
    '#define u_offset u_space.xy',
    '#define u_mouse u_space.zw',
    '#define u_cursorPresence u_cursor.x',
    '#define u_cursorEffect u_cursor.y',
    '#define u_cursorStrength u_cursor.z',
    '#define u_cursorRadius u_cursor.w',
    '',
    'float hash21(vec2 p) {',
    '#ifndef GL_FRAGMENT_PRECISION_HIGH',
    '  p = mod(p, 31.0);',
    '#endif',
    '  p = fract(p * vec2(234.34, 435.345));',
    '  p += dot(p, p + 34.23);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float grainHash(vec2 p) {',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),',
    '    u.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'vec3 srgbToLinear(vec3 c) {',
    '  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),',
    '    step(0.04045, c));',
    '}',
    'vec3 linearToSrgb(vec3 c) {',
    '  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,',
    '    step(0.0031308, c));',
    '}',
    'vec3 linToOklab(vec3 c) {',
    '  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;',
    '  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;',
    '  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;',
    '  l = pow(max(l, 0.0), 1.0 / 3.0);',
    '  m = pow(max(m, 0.0), 1.0 / 3.0);',
    '  s = pow(max(s, 0.0), 1.0 / 3.0);',
    '  return vec3(',
    '    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,',
    '    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,',
    '    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);',
    '}',
    'vec3 oklabToLin(vec3 c) {',
    '  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;',
    '  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;',
    '  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;',
    '  l = l * l * l; m = m * m * m; s = s * s * s;',
    '  return vec3(',
    '    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,',
    '    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,',
    '    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);',
    '}',
    'vec3 mixColour(vec3 a, vec3 b, float t) {',
    '  if (u_oklab > 0.5) {',
    '    vec3 la = linToOklab(srgbToLinear(a));',
    '    vec3 lb = linToOklab(srgbToLinear(b));',
    '    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);',
    '  }',
    '  return mix(a, b, t);',
    '}',
    '',
    'vec3 palette(float x) {',
    '  float n = max(u_colorCount - 1.0, 1.0);',
    '  float f = clamp(x, 0.0, 1.0) * n;',
    '  vec3 col = u_colors[0];',
    '  for (int i = 0; i < 7; i++) {',
    '    if (float(i) < n)',
    '      col = mixColour(col, u_colors[i + 1],',
    '        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));',
    '  }',
    '  return col;',
    '}',
    '',
    'vec3 hueRotate(vec3 col, float a) {',
    '  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,',
    '                          0.587, -0.274, -0.523,',
    '                          0.114, -0.322, 0.312);',
    '  const mat3 toRGB = mat3(1.0, 1.0, 1.0,',
    '                          0.956, -0.272, -1.106,',
    '                          0.621, -0.647, 1.703);',
    '  vec3 yiq = toYIQ * col;',
    '  float ca = cos(a), sa = sin(a);',
    '  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);',
    '  return toRGB * yiq;',
    '}',
    '',
    'vec3 shade(vec2 uv, vec2 p, float t) {',
    '  float warp = 2.0 + u_intensity * 4.0;',
    '  vec2 q = vec2(fbm(p + t * 0.08), fbm(p + vec2(5.2, 1.3) - t * 0.06));',
    '  vec2 r = vec2(fbm(p + warp * q + vec2(1.7, 9.2)),',
    '                fbm(p + warp * q + vec2(8.3, 2.8)));',
    '  return palette(fbm(p + 3.0 * r + u_seed));',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  vec2 screenUv = uv;',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)',
    '    / min(u_resolution.x, u_resolution.y);',
    '  float cursorMask = 0.0;',
    '',
    '  if (u_cursorPresence > 0.001) {',
    '    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)',
    '      / min(u_resolution.x, u_resolution.y);',
    '    vec2 cursorDelta = p - cursor;',
    '    if (u_cursorEffect < 0.5) {',
    '      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;',
    '    } else {',
    '      float cursorDistance = length(cursorDelta);',
    '      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);',
    '      cursorMask = u_cursorPresence',
    '        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));',
    '      if (u_cursorEffect < 1.5) {',
    '        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;',
    '      } else if (u_cursorEffect < 2.5) {',
    '        float cursorAngle = cursorMask * u_cursorStrength * 2.2;',
    '        float cc = cos(cursorAngle), cs = sin(cursorAngle);',
    '        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;',
    '      } else if (u_cursorEffect < 3.5) {',
    '        float ripple = sin(',
    '          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);',
    '        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;',
    '      }',
    '    }',
    '  }',
    '',
    '  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;',
    '  p *= u_scale;',
    '  if (abs(u_rotate) > 0.0001) {',
    '    float cr = cos(u_rotate), sr = sin(u_rotate);',
    '    p = mat2(cr, -sr, sr, cr) * p;',
    '  }',
    '  p += u_offset;',
    '  if (u_drift > 0.0001)',
    '    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));',
    '  if (u_warp > 0.0) {',
    '    p += u_warp * (vec2(',
    '      fbm(p * u_detail + u_seed),',
    '      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);',
    '  }',
    '  vec3 col;',
    '  if (u_blur > 0.0) {',
    '    float e = u_blur;',
    '    float pe = e * u_scale;',
    '    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;',
    '    col  = shade(uv, p, u_time) * 0.36;',
    '    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;',
    '    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;',
    '    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;',
    '    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;',
    '  } else {',
    '    col = shade(uv, p, u_time);',
    '  }',
    '  if (abs(u_contrast - 1.0) > 0.0001)',
    '    col = (col - 0.5) * u_contrast + 0.5;',
    '  if (abs(u_saturation - 1.0) > 0.0001) {',
    '    float luma = dot(col, vec3(0.299, 0.587, 0.114));',
    '    col = mix(vec3(luma), col, u_saturation);',
    '  }',
    '  if (abs(u_hue) > 0.0001)',
    '    col = hueRotate(col, u_hue);',
    '  if (abs(u_brightness) > 0.0001)',
    '    col += u_brightness;',
    '  if (u_vignette > 0.0001) {',
    '    float vd = length(screenUv - 0.5) * 1.41421356;',
    '    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);',
    '  }',
    '  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)',
    '    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;',
    '  if (u_grain > 0.0001)',
    '    col += (grainHash(',
    '      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* Paleta da receita, do fundo do mar até a espuma. É praticamente a paleta
     da Velo: #031C26 → #1B6CA8 → #5AD2F4 → #EAF9FF. */
  var CORES = [
    0.012, 0.110, 0.149,
    0.106, 0.424, 0.659,
    0.353, 0.824, 0.957,
    0.918, 0.976, 1.000,
    0, 0, 0,  0, 0, 0,  0, 0, 0,  0, 0, 0
  ];

  /* ------------------------------------------------------- uma instância */

  function montar(alvo) {
    var canvas = document.createElement('canvas');
    canvas.className = 'vivo__tela';

    var caixa = document.createElement('div');
    caixa.className = 'vivo';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.appendChild(canvas);
    alvo.insertBefore(caixa, alvo.firstChild);

    var gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      powerPreference: 'low-power', preserveDrawingBuffer: false
    }) || canvas.getContext('experimental-webgl');

    // Sem WebGL o gradiente navy de sempre continua por baixo: a faixa fica
    // como era antes e ninguém vê buraco nenhum.
    if (!gl) { caixa.remove(); return null; }

    function compilar(tipo, fonte) {
      var s = gl.createShader(tipo);
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[velo/vivo] shader:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    var vs = compilar(gl.VERTEX_SHADER, VERTEX);
    var fs = compilar(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) { caixa.remove(); return null; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[velo/vivo] link:', gl.getProgramInfoLog(prog));
      caixa.remove();
      return null;
    }
    gl.useProgram(prog);

    // triângulo que cobre a tela inteira — mais barato que dois triângulos
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var u = {
      colors:    gl.getUniformLocation(prog, 'u_colors[0]'),
      scene:     gl.getUniformLocation(prog, 'u_scene'),
      shape:     gl.getUniformLocation(prog, 'u_shape'),
      surface:   gl.getUniformLocation(prog, 'u_surface'),
      finish:    gl.getUniformLocation(prog, 'u_finish'),
      transform: gl.getUniformLocation(prog, 'u_transform'),
      space:     gl.getUniformLocation(prog, 'u_space'),
      cursor:    gl.getUniformLocation(prog, 'u_cursor')
    };

    function num(nome, padrao) {
      var v = parseFloat(alvo.getAttribute('data-vivo-' + nome));
      return isNaN(v) ? padrao : v;
    }

    var conf = {
      velocidade: num('velocidade', 0.97),
      escala:     num('escala', 1.72),
      semente:    num('semente', 635),
      // O canvas é sempre menor que o CSS: fumaça é tudo gradiente macio, então
      // ninguém enxerga a diferença — e economiza uns 60% de fragmento.
      resolucao:  num('resolucao', 0.6),
      deriva:     num('deriva', 0.55)   // quanto a rolagem empurra a fumaça
    };

    gl.uniform3fv(u.colors, new Float32Array(CORES));
    gl.uniform4f(u.shape, conf.escala, 0.60, 0.50, 0.00);
    gl.uniform4f(u.surface, 2.40, 1.22, 0.00, 1.00);
    gl.uniform4f(u.finish, 0.0, 0.0, 0.0, 0.0);
    gl.uniform4f(u.transform, conf.semente, 0.0, 0.0, 0.0);
    gl.uniform4f(u.cursor, 0.0, 2.0, 0.65, 0.46);   // cursor desligado

    var larg = 0, alt = 0, offsetY = 0;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2) * conf.resolucao;
      var w = Math.max(1, Math.round(alvo.clientWidth * dpr));
      var h = Math.max(1, Math.round(alvo.clientHeight * dpr));
      if (w === larg && h === alt) return;
      larg = canvas.width = w;
      alt = canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    /* A fumaça anda junto com a rolagem: entrando na seção ela vem de baixo,
       saindo ela continua subindo. É o que dá profundidade sem parallax de
       transform (que borraria o texto por cima). */
    function derivar() {
      var r = alvo.getBoundingClientRect();
      var alcance = window.innerHeight + r.height;
      if (alcance <= 0) return;
      var t = (window.innerHeight - r.top) / alcance;   // 0 entrando, 1 saindo
      offsetY = (t - 0.5) * conf.deriva;
    }

    function desenhar(segundos) {
      medir();
      derivar();
      gl.uniform4f(u.scene, larg, alt, segundos * conf.velocidade, 4.0);
      gl.uniform4f(u.space, 0.0, offsetY, 0.0, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);

    return { alvo: alvo, desenhar: desenhar, visivel: false };
  }

  /* ------------------------------------------------- laço único pra todos */

  var telas = [];
  Array.prototype.forEach.call(alvos, function (a) {
    var t = montar(a);
    if (t) telas.push(t);
  });
  if (!telas.length) return;

  var relogio = 0, ultimo = 0, rodando = false, pedido = 0;

  function algumaVisivel() {
    for (var i = 0; i < telas.length; i++) if (telas[i].visivel) return true;
    return false;
  }

  function quadro(agora) {
    if (!rodando) return;
    if (ultimo) relogio += Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    for (var i = 0; i < telas.length; i++) {
      if (telas[i].visivel) telas[i].desenhar(relogio);
    }
    pedido = requestAnimationFrame(quadro);
  }

  function ligar() {
    if (rodando || semMovimento.matches || document.hidden || !algumaVisivel()) return;
    rodando = true; ultimo = 0;
    pedido = requestAnimationFrame(quadro);
  }

  function desligar() {
    rodando = false;
    if (pedido) cancelAnimationFrame(pedido);
    pedido = 0;
  }

  /* Movimento reduzido: um quadro parado e mais nada. A imagem continua lá,
     só não se mexe. */
  function quadroParado() {
    telas.forEach(function (t) { t.desenhar(0); });
  }

  if ('IntersectionObserver' in window) {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        for (var i = 0; i < telas.length; i++) {
          if (telas[i].alvo === e.target) telas[i].visivel = e.isIntersecting;
        }
      });
      if (semMovimento.matches) quadroParado();
      else if (algumaVisivel()) ligar();
      else desligar();
    }, { rootMargin: '15% 0px' });
    telas.forEach(function (t) { olho.observe(t.alvo); });
  } else {
    telas.forEach(function (t) { t.visivel = true; });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) desligar(); else ligar();
  });

  var remedir;
  window.addEventListener('resize', function () {
    clearTimeout(remedir);
    remedir = setTimeout(function () {
      if (!rodando) quadroParado();
    }, 150);
  }, { passive: true });

  semMovimento.addEventListener('change', function () {
    if (semMovimento.matches) { desligar(); quadroParado(); }
    else ligar();
  });

  if (semMovimento.matches) quadroParado(); else ligar();
})();

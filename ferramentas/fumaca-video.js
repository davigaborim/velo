#!/usr/bin/env node
/* ==========================================================================
   VELO — gera o vídeo da fumaça/água das faixas escuras

   A água que roda atrás do hero, da chamada etc. era um shader WebGL
   desenhado ao vivo (o antigo js/shader.js). Agora é um vídeo curto em loop,
   e este script é o que fabrica esse vídeo A PARTIR DO MESMO SHADER: abre um
   Chromium sem janela, desenha os quadros um por um com o tempo controlado
   aqui, e entrega tudo pro ffmpeg.

   O loop é perfeito (o último quadro emenda no primeiro sem pulo): o campo
   que deforma a fumaça é calculado em duas fases — o de agora e o de um
   ciclo atrás — e as duas são misturadas ao longo do ciclo. No começo só
   vale a fase A; no fim só a B, que é exatamente a A do começo. As duas
   andam na mesma direção e velocidade, então a fumaça continua escorrendo
   como no shader ao vivo; a mistura compensa a variância pra fumaça não
   "lavar" no meio do ciclo.

   Precisa de: Node, o pacote `playwright` (com o Chromium dele) e ffmpeg
   com libsvtav1 (ou libaom-av1) e libx264.

   uso:   node ferramentas/fumaca-video.js            (gera tudo em video/)
          node ferramentas/fumaca-video.js --so-quadros   (só PNGs de conferência)
   opções: --segundos 10  --fps 24  --saida video  --tmp /algum/lugar
   ========================================================================== */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const arg = (nome, padrao) => {
  const i = process.argv.indexOf('--' + nome);
  return i > 0 ? process.argv[i + 1] : padrao;
};

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.resolve(RAIZ, arg('saida', 'video'));
const TMP = arg('tmp', '') || fs.mkdtempSync(path.join(os.tmpdir(), 'velo-fumaca-'));
fs.mkdirSync(TMP, { recursive: true });
const SEGUNDOS = parseFloat(arg('segundos', '10'));
const FPS = parseInt(arg('fps', '24'), 10);
const QUADROS = Math.round(SEGUNDOS * FPS);
const SO_QUADROS = process.argv.includes('--so-quadros');

/* O desenho base do vídeo. Cada faixa varia em cima disto no js/agua.js
   (ponto de início, velocidade, zoom, espelho) — ver lá e o LEIA-ME.
   ESCALA é a da chamada (1.72, a mais fina): as faixas com escala menor
   ampliam o vídeo, que é o que deixa a fumaça mais graúda. VELOCIDADE é o
   meio do caminho entre as faixas (0.62–0.97); o playbackRate corrige. */
const BASE = { semente: 97, escala: 1.72, velocidade: 0.78 };

// Duas molduras: deitada pra computador/tablet, em pé pra celular.
const VARIANTES = [
  { nome: 'largo', w: 640, h: 360 },
  { nome: 'alto', w: 360, h: 640 }
];

/* ------------------------------------------------------------- o shader */
// Mesmo fragmento do shader ao vivo (paleta, fbm, warp 4.4, contraste
// 1.22), só que com o tempo virando ciclo. Ver o cabeçalho.
const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_fase;            // 0..1 ao longo do ciclo
uniform float u_ciclo;           // duração do ciclo, em tempo de shader
uniform float u_escala;
uniform float u_semente;
uniform vec4 u_estat;            // média qx, média qy, correlação qx, correlação qy

const vec3 C0 = vec3(0.012, 0.110, 0.149);
const vec3 C1 = vec3(0.106, 0.424, 0.659);
const vec3 C2 = vec3(0.353, 0.824, 0.957);
const vec3 C3 = vec3(0.918, 0.976, 1.000);

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}
vec3 palette(float x) {
  float f = clamp(x, 0.0, 1.0) * 3.0;
  vec3 col = mix(C0, C1, smoothstep(0.0, 1.0, clamp(f, 0.0, 1.0)));
  col = mix(col, C2, smoothstep(0.0, 1.0, clamp(f - 1.0, 0.0, 1.0)));
  col = mix(col, C3, smoothstep(0.0, 1.0, clamp(f - 2.0, 0.0, 1.0)));
  return col;
}
vec2 campo(vec2 p, float t) {
  return vec2(fbm(p + t * 0.08), fbm(p + vec2(5.2, 1.3) - t * 0.06));
}
void main() {
  // gl_FragCoord começa embaixo; o script lê os pixels e desvira
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  p *= u_escala;
  float t = u_fase * u_ciclo;
  vec2 qa = campo(p, t);
  vec2 qb = campo(p, t - u_ciclo);
  float w = smoothstep(0.0, 1.0, u_fase);
  vec2 m = u_estat.xy;
  vec2 rho = u_estat.zw;
  vec2 dp = sqrt((1.0 - w) * (1.0 - w) + w * w + 2.0 * w * (1.0 - w) * rho);
  vec2 q = m + ((1.0 - w) * (qa - m) + w * (qb - m)) / dp;
  const float warp = 4.4;
  vec2 r = vec2(fbm(p + warp * q + vec2(1.7, 9.2)),
                fbm(p + warp * q + vec2(8.3, 2.8)));
  vec3 col = palette(fbm(p + 3.0 * r + u_semente));
  col = (col - 0.5) * 1.22 + 0.5;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/* Média e correlação entre as duas fases do campo, medidas no próprio
   ruído (mesma conta do shader, em JS). Servem pra mistura não perder
   contraste no meio do ciclo. */
function estatisticas(ciclo) {
  const fract = x => x - Math.floor(x);
  const hash = (x, y) => {
    x = fract(x * 234.34); y = fract(y * 435.345);
    const d = x * (x + 34.23) + y * (y + 34.23);
    x += d; y += d;
    return fract(x * y);
  };
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
  };
  const fbm = (x, y) => {
    let v = 0, a = 0.5;
    for (let i = 0; i < 4; i++) { v += a * noise(x, y); x = x * 2.03 + 17; y = y * 2.03 + 9.2; a *= 0.5; }
    return v;
  };
  let semente = 12345;
  const aleatorio = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const N = 200000;
  const res = [];
  for (const [k, ox, oy] of [[0.08, 0, 0], [-0.06, 5.2, 1.3]]) {
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
    for (let i = 0; i < N; i++) {
      const x = aleatorio() * 6 - 3, y = aleatorio() * 6 - 3;
      const a = fbm(x + ox, y + oy);
      const b = fbm(x + ox - k * ciclo, y + oy - k * ciclo);
      sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b;
    }
    const ma = sa / N, mb = sb / N;
    const rho = (sab / N - ma * mb) / Math.sqrt((saa / N - ma * ma) * (sbb / N - mb * mb));
    res.push({ media: ma, rho });
  }
  return res;
}

async function renderizar(navegador, v, estat, ciclo) {
  const pagina = await navegador.newPage();
  await pagina.setContent(`<canvas id="c" width="${v.w}" height="${v.h}"></canvas>`);
  await pagina.evaluate(({ FRAGMENT, BASE, estat, ciclo }) => {
    const c = document.getElementById('c');
    const gl = c.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false });
    const sh = (tipo, src) => {
      const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(prog, n);
    gl.uniform2f(u('u_res'), c.width, c.height);
    gl.uniform1f(u('u_ciclo'), ciclo);
    gl.uniform1f(u('u_escala'), BASE.escala);
    gl.uniform1f(u('u_semente'), BASE.semente);
    gl.uniform4f(u('u_estat'), estat[0].media, estat[1].media, estat[0].rho, estat[1].rho);
    const px = new Uint8Array(c.width * c.height * 4);
    window.quadro = fase => {
      gl.uniform1f(u('u_fase'), fase);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let s = '';
      for (let i = 0; i < px.length; i += 0x8000) s += String.fromCharCode.apply(null, px.subarray(i, i + 0x8000));
      return btoa(s);
    };
  }, { FRAGMENT, BASE, estat, ciclo });

  const bruto = path.join(TMP, `${v.nome}.rgba`);
  const fd = fs.openSync(bruto, 'w');
  const t0 = Date.now();
  for (let i = 0; i < QUADROS; i++) {
    // fase i/QUADROS: o quadro QUADROS seria igual ao 0, então não entra
    const b64 = await pagina.evaluate(f => window.quadro(f), i / QUADROS);
    fs.writeSync(fd, Buffer.from(b64, 'base64'));
    if (i % 24 === 0) process.stdout.write(`\r  ${v.nome}: quadro ${i + 1}/${QUADROS} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  fs.closeSync(fd);
  process.stdout.write(`\r  ${v.nome}: ${QUADROS} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s          \n`);
  await pagina.close();
  return bruto;
}

/* ------------------------------------------------------------- ffmpeg */

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y'].concat(args), { stdio: 'inherit', env: Object.assign({ SVT_LOG: '1' }, process.env) });
}

function temEncoder(nome) {
  return execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' }).includes(' ' + nome + ' ');
}

// Entrada comum: RGBA cru, desvirado (o readPixels lê de baixo pra cima).
// As cores são sRGB e vão marcadas como BT.709 com curva sRGB — é como o
// navegador desenha a página, então a fumaça bate com o CSS em volta.
function entrada(v, bruto) {
  return ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${v.w}x${v.h}`, '-r', String(FPS), '-i', bruto];
}
const COR = ['-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-colorspace', 'bt709', '-color_range', 'tv'];
const ESCALA_COR = 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int';
// um quadro-chave a cada 2 s: o loop volta pro quadro 0 (que é chave) e
// cada faixa começa num ponto diferente sem decodificar o vídeo inteiro
const GOP = String(FPS * 2);

function codificar(v, bruto) {
  const base = path.join(SAIDA, `agua-${v.nome}`);

  // AV1 10 bits em WebM: o menor e sem degrau no degradê escuro
  const av1 = temEncoder('libsvtav1')
    ? ['-c:v', 'libsvtav1', '-preset', '3', '-crf', '38', '-svtav1-params', 'tune=0:enable-overlays=1:scd=0']
    : ['-c:v', 'libaom-av1', '-cpu-used', '3', '-crf', '34', '-b:v', '0'];
  ffmpeg(entrada(v, bruto).concat(['-vf', `vflip,${ESCALA_COR},format=yuv420p10le`],
    av1, ['-g', GOP, '-an'], COR, [base + '.webm']));

  // H.264 em MP4: o de reserva (Safari sem AV1, aparelho que só decodifica
  // H.264 na placa). faststart põe o índice no começo do arquivo.
  ffmpeg(entrada(v, bruto).concat(['-vf', `vflip,${ESCALA_COR},format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '26', '-profile:v', 'high', '-level', '3.0',
    '-x264-params', 'aq-mode=3:keyint=' + GOP + ':min-keyint=' + GOP + ':scenecut=0',
    '-an', '-movflags', '+faststart'], COR, [base + '.mp4']));

  // Pôster: o quadro 0, em AVIF (~4 KB) e JPG (~17 KB, só pra navegador
  // sem AVIF). O js/agua.js mostra antes do vídeo, e sozinho pra quem tem
  // movimento reduzido ou economia de dados.
  ffmpeg(entrada(v, bruto).concat(['-frames:v', '1', '-vf', `vflip,${ESCALA_COR},format=yuv420p`,
    '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '34', '-b:v', '0'], COR, [base + '.avif']));
  ffmpeg(entrada(v, bruto).concat(['-frames:v', '1', '-vf', 'vflip', '-q:v', '6', base + '.jpg']));

  for (const ext of ['webm', 'mp4', 'avif', 'jpg']) {
    console.log(`  ${path.relative(RAIZ, base + '.' + ext)}  ${(fs.statSync(base + '.' + ext).size / 1024).toFixed(1)} KB`);
  }
}

function conferencia(v, bruto) {
  // primeiro, meio e último quadro em PNG, pra olhar a emenda do loop
  const dir = path.join(TMP, 'conferencia');
  fs.mkdirSync(dir, { recursive: true });
  for (const n of [0, Math.floor(QUADROS / 2), QUADROS - 1]) {
    ffmpeg(entrada(v, bruto).concat(['-vf', `select=eq(n\\,${n}),vflip`, '-frames:v', '1',
      path.join(dir, `${v.nome}-${String(n).padStart(3, '0')}.png`)]));
  }
  console.log('  conferência em', dir);
}

(async () => {
  const ciclo = SEGUNDOS * BASE.velocidade;
  console.log(`fumaça: ${SEGUNDOS} s, ${FPS} quadros/s, ciclo de shader ${ciclo.toFixed(2)}; temporários em ${TMP}`);
  const estat = estatisticas(ciclo);
  console.log('  campo: média', estat.map(e => e.media.toFixed(4)).join(' / '), ' correlação', estat.map(e => e.rho.toFixed(4)).join(' / '));
  fs.mkdirSync(SAIDA, { recursive: true });
  const navegador = await chromium.launch();
  for (const v of VARIANTES) {
    const bruto = await renderizar(navegador, v, estat, ciclo);
    conferencia(v, bruto);
    if (!SO_QUADROS) codificar(v, bruto);
  }
  await navegador.close();
})().catch(e => { console.error(e); process.exit(1); });

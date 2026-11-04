/* ==========================================================================
   VELO — o mar vivo (WebGL1 puro, sem biblioteca nenhuma)

   Shader "Smoke" rodando atrás das faixas escuras do site. É a mesma água do
   mar da barbatana, só que vista de perto: fumaça de fbm em navy, azul e
   espuma, devagar o bastante pra não competir com o texto por cima.

   Cada elemento com [data-vivo] ganha o seu canvas. Só desenha o que está na
   tela — fora dela o rAF nem roda, e a aba escondida derruba tudo. E só
   NASCE quando chega perto da tela: a chamada lá do fim não cria contexto
   nem compila shader enquanto o visitante ainda está no hero.
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

  /* "Smoke" — feito com o 21st.dev Shader Builder, e depois enxugado à mão.

     A receita original vinha com cursor, desfoque, vinheta, grão, giro de
     matiz, OKLab, deriva, warp extra e paleta de até 8 cores, tudo ligado por
     uniform. O site usa só o caminho de base, com 4 cores e contraste 1.22 —
     o resto ficava zerado, mas o navegador compilava tudo mesmo assim, duas
     ou três vezes por página (uma por faixa escura). Sobrou só a conta que
     de fato desenha, na mesma ordem, então o desenho é o mesmo de antes: a
     paleta abaixo é o laço antigo de 7 voltas aberto nas 3 que contavam, e o
     contraste e a intensidade (0.60 → warp 4.4) viraram constantes. */
  var FRAGMENT = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec4 u_scene;      // resolution.xy, time, scale',
    'uniform float u_seedRaw;',
    '',
    '#define u_resolution u_scene.xy',
    '#define u_time u_scene.z',
    '#define u_scale u_scene.w',
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    '#define u_seed u_seedRaw',
    '#else',
    '#define u_seed mod(u_seedRaw, 31.0)',
    '#endif',
    '',
    // do fundo do mar até a espuma: #031C26 → #1B6CA8 → #5AD2F4 → #EAF9FF
    'const vec3 C0 = vec3(0.012, 0.110, 0.149);',
    'const vec3 C1 = vec3(0.106, 0.424, 0.659);',
    'const vec3 C2 = vec3(0.353, 0.824, 0.957);',
    'const vec3 C3 = vec3(0.918, 0.976, 1.000);',
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
    '  for (int i = 0; i < 4; i++) {',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'vec3 palette(float x) {',
    '  float f = clamp(x, 0.0, 1.0) * 3.0;',
    '  vec3 col = mix(C0, C1, smoothstep(0.0, 1.0, clamp(f, 0.0, 1.0)));',
    '  col = mix(col, C2, smoothstep(0.0, 1.0, clamp(f - 1.0, 0.0, 1.0)));',
    '  col = mix(col, C3, smoothstep(0.0, 1.0, clamp(f - 2.0, 0.0, 1.0)));',
    '  return col;',
    '}',
    '',
    'void main() {',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)',
    '    / min(u_resolution.x, u_resolution.y);',
    '  p *= u_scale;',
    '  float t = u_time;',
    '  const float warp = 4.4;',   // 2.0 + intensidade 0.60 * 4.0
    '  vec2 q = vec2(fbm(p + t * 0.08), fbm(p + vec2(5.2, 1.3) - t * 0.06));',
    '  vec2 r = vec2(fbm(p + warp * q + vec2(1.7, 9.2)),',
    '                fbm(p + warp * q + vec2(8.3, 2.8)));',
    '  vec3 col = palette(fbm(p + 3.0 * r + u_seed));',
    '  col = (col - 0.5) * 1.22 + 0.5;',   // contraste
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------- uma instância */

  function montar(alvo) {
    var canvas = document.createElement('canvas');
    canvas.className = 'vivo__tela';
    // Escondido até o primeiro quadro: canvas WebGL nunca desenhado é preto,
    // e o gradiente navy da seção fica por baixo enquanto isso.
    canvas.style.visibility = 'hidden';

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
      return s;
    }

    var vs = compilar(gl.VERTEX_SHADER, VERTEX);
    var fs = compilar(gl.FRAGMENT_SHADER, FRAGMENT);
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    /* Compilação sem travar a página. Perguntar "compilou?" logo depois do
       linkProgram faz o JS esperar a placa de vídeo terminar — no Windows,
       onde o shader é traduzido pra Direct3D, isso pode levar centenas de
       milissegundos com a página parada, bem na hora em que ela está
       abrindo. Com a extensão de compilação paralela, o laço só confere se
       ficou pronto e desenha no quadro seguinte. */
    var paralela = gl.getExtension('KHR_parallel_shader_compile');
    var pronto = false, falhou = false, u = null;

    function terminar() {
      if (pronto || falhou) return pronto;
      if (paralela && !gl.getProgramParameter(prog, paralela.COMPLETION_STATUS_KHR)) return false;
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('[velo/vivo] shader:', gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(prog));
        falhou = true;
        caixa.remove();
        return false;
      }
      gl.useProgram(prog);

      // triângulo que cobre a tela inteira — mais barato que dois triângulos
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      u = {
        scene: gl.getUniformLocation(prog, 'u_scene'),
        seed:  gl.getUniformLocation(prog, 'u_seedRaw')
      };
      gl.uniform1f(u.seed, conf.semente);
      pronto = true;
      return true;
    }

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
      // quanto a fumaça fica para trás na rolagem, em fração da altura da
      // seção (o canvas sobra 12% em cima e embaixo para isso)
      deriva:     num('deriva', 0.55) * 0.2
    };

    var larg = 0, alt = 0, deslocado = '';

    /* Tamanho e posição da seção ficam guardados e só são relidos quando ela
       muda de tamanho. Perguntar isso ao navegador dentro do quadro, depois
       que o mar já mexeu no SVG, força um layout inteiro a cada quadro. */
    var caixaL = 0, caixaA = 0, caixaTopo = 0;

    function medirCaixa() {
      caixaL = alvo.clientWidth;
      caixaA = alvo.clientHeight;
      caixaTopo = alvo.getBoundingClientRect().top + window.scrollY;
    }

    function medir() {
      // Teto de 0.45 pixel de canvas por pixel CSS, e no máximo ~300 mil
      // pixels: a fumaça é só gradiente macio, e o navegador amplia o canvas
      // sem ninguém ver a diferença. Era 0.75, e o hero ainda pesava no
      // notebook com vídeo integrado (21/10).
      var dpr = Math.min((window.devicePixelRatio || 1) * conf.resolucao, 0.45);
      var area = caixaL * caixaA * SOBRA * dpr * dpr;
      if (area > 300000) dpr *= Math.sqrt(300000 / area);
      var w = Math.max(1, Math.round(caixaL * dpr));
      var h = Math.max(1, Math.round(caixaA * SOBRA * dpr));
      if (w === larg && h === alt) return;
      larg = canvas.width = w;
      alt = canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    /* Parallax: a fumaça anda mais devagar que a página. Antes isso era
       feito DENTRO do shader, o que obrigava a redesenhar a 60 quadros
       enquanto a página rolava, bem na hora em que o notebook mais
       precisa da placa de vídeo. Agora é um transform no canvas, que o
       compositor faz de graça, e o shader nem desenha durante a rolagem. */
    function derivar() {
      var alcance = window.innerHeight + caixaA;
      if (alcance <= 0) return;
      var topoNaTela = caixaTopo - window.scrollY;
      var t = (window.innerHeight - topoNaTela) / alcance;   // 0 entrando, 1 saindo
      t = Math.max(0, Math.min(1, t));
      var y = ((t - 0.5) * 2 * conf.deriva * caixaA).toFixed(1);
      if (y === deslocado) return;
      deslocado = y;
      canvas.style.transform = 'translate3d(0,' + y + 'px,0)';
    }

    medirCaixa();
    if ('ResizeObserver' in window) {
      // observa o body também: a seção não muda de tamanho quando uma foto
      // lá em cima termina de carregar, mas o topo dela desce
      var vigia = new ResizeObserver(medirCaixa);
      vigia.observe(alvo);
      vigia.observe(document.body);
    } else {
      window.addEventListener('resize', medirCaixa, { passive: true });
      window.addEventListener('load', medirCaixa);
    }

    var inst = { alvo: alvo, desenhar: desenhar, derivar: derivar, visivel: false, desenhou: false };

    // devolve false enquanto o shader ainda está compilando
    function desenhar(segundos) {
      if (falhou) return true;   // nada a desenhar: a faixa ficou no gradiente
      if (!terminar()) return false;
      medir();
      gl.uniform4f(u.scene, larg, alt, segundos * conf.velocidade, conf.escala);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!inst.desenhou) { inst.desenhou = true; canvas.style.visibility = ''; }
      return true;
    }

    derivar();

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); }, false);

    return inst;
  }

  /* ------------------------------------------------- laço único pra todos */

  var SOBRA = 1.24;   // o canvas é 24% mais alto que a seção (ver .vivo__tela)

  var telas = [];

  var relogio = 0, ultimo = 0, rodando = false, pedido = 0, espera = 0, rolouEm = 0;
  var PASSO = 1000 / 30;   // a mesma grade do mar no main.js

  function algumaVisivel() {
    for (var i = 0; i < telas.length; i++) if (telas[i].visivel) return true;
    return false;
  }

  var derivaPedida = 0;
  function derivaTodas() {
    derivaPedida = 0;
    for (var i = 0; i < telas.length; i++) if (telas[i].visivel) telas[i].derivar();
  }
  window.addEventListener('scroll', function () {
    rolouEm = performance.now();
    if (!derivaPedida) derivaPedida = requestAnimationFrame(derivaTodas);
  }, { passive: true });

  /* A fumaça anda devagar: 30 quadros por segundo bastam e cortam pela metade
     o trabalho da placa de vídeo. Enquanto a página rola, ela NÃO desenha:
     a rolagem é a hora em que o notebook com vídeo integrado mais precisa
     da placa, e uma fumaça lenta parada por meio segundo ninguém nota. O
     parallax continua, porque é transform (ver derivar()). A espera é por
     relógio (ver o comentário do agendar() no main.js). */
  function agendar() {
    if (pedido || espera) return;
    var rolando = performance.now() - rolouEm < 200;
    espera = setTimeout(function () {
      espera = 0;
      pedido = requestAnimationFrame(quadro);
    }, rolando ? 200 : PASSO - performance.now() % PASSO);
  }

  function quadro(agora) {
    pedido = 0;
    if (!rodando) return;
    // o relógio da fumaça para junto com a rolagem: volta de onde estava
    if (ultimo) relogio += Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    var parada = agora - rolouEm >= 200;
    for (var i = 0; i < telas.length; i++) {
      var t = telas[i];
      // o primeiro quadro sai mesmo rolando: canvas nunca desenhado fica
      // escondido, e a faixa sem água chamaria atenção
      if (t.visivel && (parada || !t.desenhou)) t.desenhar(relogio);
    }
    agendar();
  }

  function ligar() {
    if (rodando || semMovimento.matches || document.hidden || !algumaVisivel()) return;
    rodando = true; ultimo = 0;
    agendar();
  }

  function desligar() {
    rodando = false;
    if (pedido) cancelAnimationFrame(pedido);
    if (espera) clearTimeout(espera);
    pedido = 0; espera = 0;
  }

  /* Movimento reduzido: um quadro parado e mais nada. A imagem continua lá,
     só não se mexe. Se o shader ainda está compilando, tenta de novo no
     próximo quadro. */
  function quadroParado() {
    var falta = false;
    telas.forEach(function (t) { if (!t.desenhar(0)) falta = true; });
    if (falta) requestAnimationFrame(quadroParado);
  }

  /* Cada faixa só monta o canvas quando chega a uma tela de distância. Quem
     abre no hero não paga o contexto WebGL da chamada lá embaixo — e quem
     nunca rola até lá, nunca paga. */
  var porAlvo = [];
  function instancia(alvo) {
    for (var i = 0; i < porAlvo.length; i++) if (porAlvo[i][0] === alvo) return porAlvo[i][1];
    var t = montar(alvo);
    porAlvo.push([alvo, t]);
    if (t) telas.push(t);
    return t;
  }

  if ('IntersectionObserver' in window) {
    // perto: monta o canvas com folga, antes de a faixa aparecer
    var perto = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        perto.unobserve(e.target);
        var t = instancia(e.target);
        if (t) olho.observe(e.target);
      });
    }, { rootMargin: '100% 0px' });

    // na tela: liga e desliga o desenho
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

    Array.prototype.forEach.call(alvos, function (a) { perto.observe(a); });
  } else {
    // navegador sem observador: monta todas e desenha todas, como era antes
    Array.prototype.forEach.call(alvos, function (a) {
      var t = instancia(a);
      if (t) t.visivel = true;
    });
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

  if (!('IntersectionObserver' in window)) {
    if (semMovimento.matches) quadroParado(); else ligar();
  }
})();

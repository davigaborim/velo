/* ==========================================================================
   VELO — comportamento
   1. O mar: ondas em SVG + a barbatana da logo surfando a crista conforme
      a página rola. É a assinatura da marca; o resto é discreto de propósito.
   2. Revelação no scroll, navegação e utilidades.
   ========================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ======================================================================
     1. O MAR
     ====================================================================== */

  var mar        = document.getElementById('mar');
  var svg        = document.getElementById('marSvg');
  var svgFrente  = document.getElementById('marSvgFrente');
  var pFundo     = document.getElementById('ondaFundo');
  var pMeio      = document.getElementById('ondaMeio');
  var pFrente    = document.getElementById('ondaFrente');
  var pCrista    = document.getElementById('cristaFrente');
  var gEspuma    = document.getElementById('espuma');
  var gFin       = document.getElementById('finWrap');
  var pRastro    = document.getElementById('rastro');
  var pega       = document.getElementById('finPega');
  var boia       = document.querySelector('.zap-boia');

  var L = 0, A = 0;              // largura e altura do mar, em px
  var bolhas = [];               // pontos de espuma na crista

  /* Medidas da página, guardadas. Ler scrollHeight ou offsetWidth dentro do
     quadro, logo depois de mexer no SVG, obriga o navegador a recalcular o
     layout inteiro a cada quadro — era isso que deixava o site pesado em
     notebook. Agora elas só são lidas quando a página muda de tamanho. */
  var alcance = 0;               // quanto dá pra rolar, em px
  var reservaBoia = 0;           // espaço da boia do WhatsApp na direita

  /* O brilho azul em cima da onda da frente. Antes era um drop-shadow em CSS
     na camada inteira, que repinta o mar todo a cada quadro; um traço largo
     e transparente atrás da crista dá o mesmo halo quase de graça. */
  var pBrilho = null;
  if (svgFrente && pFrente) {
    pBrilho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pBrilho.setAttribute('fill', 'none');
    pBrilho.setAttribute('stroke', '#2E86D6');
    pBrilho.setAttribute('stroke-opacity', '.09');
    pBrilho.setAttribute('stroke-width', '16');
    pBrilho.setAttribute('stroke-linecap', 'round');
    pBrilho.setAttribute('transform', 'translate(0,-4)');
    svgFrente.insertBefore(pBrilho, pFrente);
  }

  // +1 = nadando pra direita (a página está descendo), -1 = pra esquerda.
  // O tubarão vira de lado junto com o sentido do scroll.
  var sentido = 1;

  // Cada camada: base (fração da altura), duas ondas somadas e velocidade.
  var camadas = [
    { alvo: pFundo,  base: 0.30, a1: 0.15, k1: 1.5, a2: 0.07, k2: 3.1, v:  0.10, f: 0.0 },
    { alvo: pMeio,   base: 0.47, a1: 0.13, k1: 2.1, a2: 0.06, k2: 4.3, v: -0.15, f: 1.7 },
    { alvo: pFrente, base: 0.64, a1: 0.12, k1: 1.8, a2: 0.05, k2: 3.6, v:  0.21, f: 3.4 }
  ];

  var frente = camadas[2];

  // Altura da onda em x (px), no tempo t (s).
  function alturaEm(c, x, t) {
    var u = x / Math.max(L, 1);
    return A * c.base
         - A * c.a1 * Math.sin(u * Math.PI * 2 * c.k1 + t * c.v * 6.28 + c.f)
         - A * c.a2 * Math.sin(u * Math.PI * 2 * c.k2 - t * c.v * 4.10 + c.f * 2);
  }

  function medir() {
    if (!mar) return;
    L = mar.clientWidth;
    A = mar.clientHeight;
    // as duas camadas dividem o mesmo sistema de coordenadas
    var caixa = '0 0 ' + L + ' ' + A;
    svg.setAttribute('viewBox', caixa);
    if (svgFrente) svgFrente.setAttribute('viewBox', caixa);

    // espuma: pontos fixos em x, redistribuídos quando a tela muda de tamanho
    gEspuma.textContent = '';
    bolhas = [];
    var n = Math.max(5, Math.round(L / 190));
    for (var i = 0; i < n; i++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var r = 2 + (i % 3) * 1.4;
      c.setAttribute('r', r);
      gEspuma.appendChild(c);
      bolhas.push({ el: c, x: (i + 0.5) / n, dx: 0.012 * (i % 2 ? 1 : -1), fase: i * 1.3 });
    }
  }

  function margem() { return Math.min(70, L * 0.08); }

  /* Faixa que a barbatana percorre. No fim da página ela para um pouco antes
     da borda direita: é onde a boia do WhatsApp está ancorada, e o tubarão
     passando por cima esconderia justamente o botão. */
  function faixaUtil() {
    return Math.max(1, L - margem() * 2 - reservaBoia);
  }

  function medirPagina() {
    alcance = document.documentElement.scrollHeight - window.innerHeight;
    reservaBoia = boia ? Math.min(L * 0.28, boia.offsetWidth + 22) : 0;
  }

  function desenhar(t, avanco) {
    if (!mar || L === 0) return;
    var passo = 12;
    var i, x, y;

    for (var c = 0; c < camadas.length; c++) {
      var cam = camadas[c];
      var d = 'M0,' + A + ' L0,' + alturaEm(cam, 0, t).toFixed(1);
      for (x = passo; x <= L; x += passo) {
        d += ' L' + x + ',' + alturaEm(cam, x, t).toFixed(1);
      }
      d += ' L' + L + ',' + alturaEm(cam, L, t).toFixed(1) + ' L' + L + ',' + A + ' Z';
      cam.alvo.setAttribute('d', d);
    }

    // contorno cartoon só na crista da onda da frente
    var linha = 'M0,' + alturaEm(frente, 0, t).toFixed(1);
    for (x = passo; x <= L; x += passo) {
      linha += ' L' + x + ',' + alturaEm(frente, x, t).toFixed(1);
    }
    pCrista.setAttribute('d', linha);
    if (pBrilho) pBrilho.setAttribute('d', linha);

    // espuma acompanhando a crista
    for (i = 0; i < bolhas.length; i++) {
      var b = bolhas[i];
      var bx = ((b.x + b.dx * t) % 1 + 1) % 1 * L;
      b.el.setAttribute('cx', bx.toFixed(1));
      b.el.setAttribute('cy', (alturaEm(frente, bx, t) + 4 + Math.sin(t * 2 + b.fase) * 1.5).toFixed(1));
    }

    // ---- a barbatana ----
    // começa na esquerda e nada pra direita conforme a página desce.
    var fx = margem() + avanco * faixaUtil();
    var fy = alturaEm(frente, fx, t) + 3;

    // inclina a barbatana conforme a inclinação da crista
    var dy = alturaEm(frente, fx + 8, t) - alturaEm(frente, fx - 8, t);
    var ang = Math.atan2(dy, 16) * 180 / Math.PI;

    var alturaFin = Math.max(30, Math.min(A * 0.52, 64));
    var s = alturaFin / 234;                       // 234 = altura do path original
    // O desenho original da barbatana aponta pra esquerda, então o x do scale
    // é o sentido invertido: nadando pra direita (sentido +1) ela precisa ser
    // espelhada; voltando pra esquerda, fica como veio.
    gFin.setAttribute('transform',
      'translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ') ' +
      'rotate(' + ang.toFixed(2) + ') ' +
      'scale(' + (-sentido * s).toFixed(4) + ',' + s.toFixed(4) + ') ' +
      'translate(-451,-366)');

    // área invisível de agarre, sempre em cima da barbatana
    if (pega) {
      pega.setAttribute('cx', fx.toFixed(1));
      pega.setAttribute('cy', (fy - alturaFin * 0.35).toFixed(1));
      pega.setAttribute('r', Math.max(26, alturaFin * 0.7).toFixed(1));
    }

    // rastro de espuma: sempre atrás, ou seja, do lado oposto ao que ela nada.
    // Nunca passa da borda e afina até zero pra não virar um bloco branco.
    var espaco = sentido > 0 ? (fx - 4) : (L - fx - 4);
    var comp = Math.min(alturaFin * 2.6, Math.max(0, espaco));
    if (comp < 10) {
      pRastro.setAttribute('d', '');
    } else {
      var n = 12, larg = alturaFin * 0.085;
      var rastro = '', volta = '';
      for (i = 0; i <= n; i++) {
        var rx = fx - sentido * comp * (i / n);
        var ry = alturaEm(frente, rx, t) + 4;
        // afina nas duas pontas: sem corte reto colado na barbatana
        var e = larg * Math.sin(Math.PI * Math.pow(i / n, 0.55));
        rastro += (i ? ' L' : 'M') + rx.toFixed(1) + ',' + (ry - e).toFixed(1);
        volta = ' L' + rx.toFixed(1) + ',' + (ry + e).toFixed(1) + volta;
      }
      pRastro.setAttribute('d', rastro + volta + ' Z');
    }
  }

  function alcanceDaPagina() {
    return alcance;
  }

  function avancoDaPagina() {
    var alcance = alcanceDaPagina();
    if (alcance <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / alcance));
  }

  /* ---- o tubarão vira de lado conforme o sentido do scroll ----
     A folga de 2px evita que ele fique piscando de lado com o tremor de
     trackpad; enquanto ela não é vencida, o ponto de partida não se move. */
  var ultimoY = window.scrollY;
  var rolouEm = 0;               // quando a página rolou pela última vez

  window.addEventListener('scroll', function () {
    rolouEm = performance.now();
    if (animando) agendar();   // o mar acorda se estava parado
    var y = window.scrollY, d = y - ultimoY;
    if (d > 2)       { sentido =  1; ultimoY = y; }
    else if (d < -2) { sentido = -1; ultimoY = y; }
  }, { passive: true });

  /* ---- arrastar a barbatana rola a página ----
     Ela já é o indicador de progresso; deixar puxar fecha o ciclo. O gesto é
     um atalho, não a única forma de navegar: quem não usa mouse rola normal. */
  if (pega && mar) {
    var arrastando = false, xInicial = 0, yInicial = 0, faixa = 1;

    pega.addEventListener('pointerdown', function (e) {
      if (alcanceDaPagina() <= 0) return;
      arrastando = true;
      xInicial = e.clientX;
      yInicial = window.scrollY;
      faixa = faixaUtil();   // a mesma que o desenhar() usa
      document.documentElement.classList.add('is-puxando-mar');
      if (pega.setPointerCapture) pega.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    pega.addEventListener('pointermove', function (e) {
      if (!arrastando) return;
      var alcance = alcanceDaPagina();
      // puxar pra direita desce a página, que é o caminho que ela já fazia
      var alvo = yInicial + (e.clientX - xInicial) * (alcance / faixa);
      window.scrollTo(0, Math.min(alcance, Math.max(0, alvo)));
      e.preventDefault();
    });

    ['pointerup', 'pointercancel'].forEach(function (evt) {
      pega.addEventListener(evt, function (e) {
        if (!arrastando) return;
        arrastando = false;
        document.documentElement.classList.remove('is-puxando-mar');
        if (pega.releasePointerCapture) {
          try { pega.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      });
    });
  }

  var relogio = 0, ultimo = 0, animando = false, pedido = 0, espera = 0;

  /* O mar mexe quando a página mexe. Parado no mesmo lugar, ele vai
     acalmando até parar de vez, e o laço desliga: era a peça que mais
     ocupava a placa de vídeo com a página parada (uns 15% num notebook
     com vídeo integrado, medido em 21/10), porque está sempre na tela.
     Rolou, ele volta a ondular. Na chegada ondula um pouco antes de
     acalmar, para quem abre o site ver que é água. */
  var agito = 1;                 // 1 = ondulando, 0 = parado
  var AGITADO_MS = 1500;         // quanto tempo depois da rolagem ainda ondula
  var acordouEm = performance.now();

  /* As boias (os mascotes, o balão, o botão do WhatsApp) eram animação de
     CSS infinita. Animação infinita obriga o navegador a recompor a página
     inteira a 60 quadros por segundo, para sempre, mesmo com tudo parado:
     custava uns 14% da placa de vídeo (21/10). Agora elas balançam no
     relógio do mar e acalmam junto com ele.
     [seletor, período (s), quanto sobe (px), giro de, giro até (graus), atraso (s)] */
  var boias = [
    ['.hero__mascote img', 6, 14, 0, 1.2, 0],
    ['.balao', 6, 14, 0, 1.2, 0.3],
    ['.chamada__mascote img', 7, 14, 0, 1.2, 0],
    ['.zap-boia', 4.6, 7, -2.5, 2.5, 0]
  ].reduce(function (lista, b) {
    Array.prototype.forEach.call(document.querySelectorAll(b[0]), function (el) {
      lista.push({ el: el, periodo: b[1], sobe: b[2], de: b[3], ate: b[4], atraso: b[5] });
    });
    return lista;
  }, []);

  function balancar(t, forca) {
    for (var i = 0; i < boias.length; i++) {
      var b = boias[i];
      // 0 embaixo, 1 no alto, com a mesma curva suave do ease-in-out de antes
      var k = (1 - Math.cos((t - b.atraso) / b.periodo * Math.PI * 2)) / 2;
      var giro = b.de + (b.ate - b.de) * k;
      b.el.style.transform = 'translateY(' + (-b.sobe * k * forca).toFixed(2) + 'px) rotate(' + (giro * forca).toFixed(2) + 'deg)';
    }
  }

  /* Com a página parada, a onda anda devagar o bastante pra 30 quadros por
     segundo parecerem 60 — e é metade do trabalho. Rolando, volta pra 60,
     senão a barbatana atrasa em relação ao dedo.
     A espera é por relógio, não pulando quadro: pedir requestAnimationFrame
     e não desenhar ainda faz o navegador montar o quadro inteiro. O passo cai
     sempre na mesma grade de 1/30 s que o shader.js usa, então os dois acordam
     juntos e dividem o mesmo quadro. */
  var PASSO = 1000 / 30;

  function agendar() {
    if (pedido || espera) return;
    if (performance.now() - rolouEm < 300) {
      pedido = requestAnimationFrame(quadro);
    } else {
      espera = setTimeout(function () {
        espera = 0;
        pedido = requestAnimationFrame(quadro);
      }, PASSO - performance.now() % PASSO);
    }
  }

  function quadro(agora) {
    pedido = 0;
    if (!animando) return;
    var dt = ultimo ? Math.min(0.05, (agora - ultimo) / 1000) : 0;
    ultimo = agora;
    var agitado = agora - rolouEm < AGITADO_MS || agora - acordouEm < 2500 || arrastando;
    // acelera e freia aos poucos: o mar acalma, não congela
    agito += ((agitado ? 1 : 0) - agito) * Math.min(1, dt * 2.2);
    relogio += dt * agito;
    desenhar(relogio, avancoDaPagina());
    balancar(relogio, agito);
    if (!agitado && agito < 0.02) { agito = 0; ultimo = 0; return; }   // dorme até a próxima rolagem
    agendar();
  }

  function ligarMar() {
    if (!mar) return;
    medir();
    medirPagina();
    if (semMovimento.matches) {
      animando = false;
      desenhar(0, avancoDaPagina());
      window.addEventListener('scroll', function () { desenhar(0, avancoDaPagina()); }, { passive: true });
    } else if (!animando) {
      animando = true; ultimo = 0;
      agendar();
    }
  }

  var remedir;
  window.addEventListener('resize', function () {
    clearTimeout(remedir);
    remedir = setTimeout(function () {
      medir();
      medirPagina();
      desenhar(relogio, avancoDaPagina());
    }, 150);
  });

  // A página cresce sozinha quando foto e fonte terminam de chegar; o
  // alcance da rolagem precisa acompanhar sem ninguém redimensionar a janela.
  if ('ResizeObserver' in window) {
    new ResizeObserver(medirPagina).observe(document.body);
  } else {
    window.addEventListener('load', medirPagina);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      animando = false;
    } else if (!semMovimento.matches) {
      // agendar() não duplica o laço se o pedido de antes ainda está na fila
      animando = true; ultimo = 0;
      agendar();
    }
  });

  semMovimento.addEventListener('change', ligarMar);
  ligarMar();

  /* ======================================================================
     2. REVELAÇÃO NO SCROLL
     ====================================================================== */

  var aRevelar = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-vista');
          olho.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    aRevelar.forEach(function (el) { olho.observe(el); });
  } else {
    aRevelar.forEach(function (el) { el.classList.add('is-vista'); });
  }

  /* ======================================================================
     3. NAVEGAÇÃO
     ====================================================================== */

  var topo   = document.getElementById('topo');
  var nav    = document.getElementById('nav');
  var burger = document.getElementById('hamburguer');

  function fecharMenu() {
    nav.classList.remove('is-aberto');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
  }

  burger.addEventListener('click', function () {
    var aberto = nav.classList.toggle('is-aberto');
    burger.setAttribute('aria-expanded', String(aberto));
    burger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', fecharMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-aberto')) {
      fecharMenu();
      burger.focus();
    }
  });

  // sombra do cabeçalho ao sair do topo
  window.addEventListener('scroll', function () {
    topo.classList.toggle('is-preso', window.scrollY > 8);
  }, { passive: true });

  // link ativo conforme a seção visível
  var secoes = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var links  = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window && secoes.length) {
    var vistas = new Set();
    var espia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) vistas.add(e.target.id); else vistas.delete(e.target.id);
      });
      var atual = secoes.filter(function (s) { return vistas.has(s.id); })[0];
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-atual', !!atual && atual.id === id);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    secoes.forEach(function (s) { espia.observe(s); });
  }

  /* ======================================================================
     4. UTILIDADES
     ====================================================================== */

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();

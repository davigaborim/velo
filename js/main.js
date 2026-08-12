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
  var pFundo     = document.getElementById('ondaFundo');
  var pMeio      = document.getElementById('ondaMeio');
  var pFrente    = document.getElementById('ondaFrente');
  var pCrista    = document.getElementById('cristaFrente');
  var gEspuma    = document.getElementById('espuma');
  var gFin       = document.getElementById('finWrap');
  var pRastro    = document.getElementById('rastro');

  var L = 0, A = 0;              // largura e altura do mar, em px
  var bolhas = [];               // pontos de espuma na crista

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
    svg.setAttribute('viewBox', '0 0 ' + L + ' ' + A);

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

    // espuma acompanhando a crista
    for (i = 0; i < bolhas.length; i++) {
      var b = bolhas[i];
      var bx = ((b.x + b.dx * t) % 1 + 1) % 1 * L;
      b.el.setAttribute('cx', bx.toFixed(1));
      b.el.setAttribute('cy', (alturaEm(frente, bx, t) + 4 + Math.sin(t * 2 + b.fase) * 1.5).toFixed(1));
    }

    // ---- a barbatana ----
    var margem = Math.min(70, L * 0.08);
    var fx = margem + avanco * (L - margem * 2);
    var fy = alturaEm(frente, fx, t) + 3;

    // inclina a barbatana conforme a inclinação da crista
    var dy = alturaEm(frente, fx + 8, t) - alturaEm(frente, fx - 8, t);
    var ang = Math.atan2(dy, 16) * 180 / Math.PI;

    var alturaFin = Math.max(30, Math.min(A * 0.52, 64));
    var s = alturaFin / 234;                       // 234 = altura do path original
    gFin.setAttribute('transform',
      'translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ') ' +
      'rotate(' + ang.toFixed(2) + ') ' +
      'scale(' + s.toFixed(4) + ') ' +
      'translate(-451,-366)');

    // rastro de espuma atrás da barbatana — nunca passa da borda esquerda,
    // e afina até zero pra não virar um bloco branco.
    var comp = Math.min(alturaFin * 2.6, Math.max(0, fx - 4));
    if (comp < 10) {
      pRastro.setAttribute('d', '');
    } else {
      var n = 12, larg = alturaFin * 0.085;
      var rastro = '', volta = '';
      for (i = 0; i <= n; i++) {
        var rx = fx - comp * (i / n);
        var ry = alturaEm(frente, rx, t) + 4;
        // afina nas duas pontas: sem corte reto colado na barbatana
        var e = larg * Math.sin(Math.PI * Math.pow(i / n, 0.55));
        rastro += (i ? ' L' : 'M') + rx.toFixed(1) + ',' + (ry - e).toFixed(1);
        volta = ' L' + rx.toFixed(1) + ',' + (ry + e).toFixed(1) + volta;
      }
      pRastro.setAttribute('d', rastro + volta + ' Z');
    }
  }

  function avancoDaPagina() {
    var alcance = document.documentElement.scrollHeight - window.innerHeight;
    if (alcance <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / alcance));
  }

  var relogio = 0, ultimo = 0, animando = false;

  function quadro(agora) {
    if (!animando) return;
    if (ultimo) relogio += Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    desenhar(relogio, avancoDaPagina());
    requestAnimationFrame(quadro);
  }

  function ligarMar() {
    if (!mar) return;
    medir();
    if (semMovimento.matches) {
      animando = false;
      desenhar(0, avancoDaPagina());
      window.addEventListener('scroll', function () { desenhar(0, avancoDaPagina()); }, { passive: true });
    } else if (!animando) {
      animando = true; ultimo = 0;
      requestAnimationFrame(quadro);
    }
  }

  var remedir;
  window.addEventListener('resize', function () {
    clearTimeout(remedir);
    remedir = setTimeout(function () {
      medir();
      desenhar(relogio, avancoDaPagina());
    }, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      animando = false;
    } else if (!semMovimento.matches) {
      animando = true; ultimo = 0;
      requestAnimationFrame(quadro);
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

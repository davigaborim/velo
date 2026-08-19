/* ==========================================================================
   VELO — camada de vida

   O que dá a sensação de site caro: coisas que entram de longe e desfocadas,
   camadas que andam em velocidades diferentes e superfícies que reagem ao
   ponteiro. Nada aqui é essencial — se este arquivo não carregar, o site
   continua inteiro e legível.

   1. Reveal: tira o desfoque do elemento depois que ele entrou (senão a
      composição fica ligada pra sempre e o texto amolece na GPU).
   2. Deslize: parallax por variável CSS, pra não brigar com transform de
      hover nem com as animações de boia.
   3. Contadores dos selos do hero.
   4. Inclinação 3D e brilho seguindo o ponteiro.
   5. Barra de progresso de leitura.
   ========================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pontFino = window.matchMedia('(hover:hover) and (pointer:fine)');

  /* ======================================================================
     1. REVEAL — desligar o desfoque quando o bicho já entrou
     ====================================================================== */

  /* A folga de 300ms é porque a máscara dos títulos dura um pouco mais que a
     opacidade: limpar no fim do fade cortaria o resto do movimento. */
  document.addEventListener('transitionend', function (e) {
    var el = e.target;
    if (e.propertyName !== 'opacity') return;
    if (!el.classList || !el.classList.contains('is-vista')) return;
    setTimeout(function () { el.classList.add('is-limpo'); }, 300);
  }, true);

  /* ======================================================================
     2. DESLIZE — parallax em camadas
     ====================================================================== */

  var deslizantes = Array.prototype.slice.call(document.querySelectorAll('[data-desliza]'));
  var barra = null;
  var sujo = true;
  var laco = 0;

  function passo() {
    laco = 0;
    if (!sujo) return;
    sujo = false;

    var meio = window.innerHeight / 2;

    for (var i = 0; i < deslizantes.length; i++) {
      var el = deslizantes[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;

      var fator = parseFloat(el.getAttribute('data-desliza')) || 0;
      var limite = parseFloat(el.getAttribute('data-desliza-max')) || 60;
      var centro = r.top + r.height / 2;
      var y = (centro - meio) / window.innerHeight * fator * 100;
      if (y > limite) y = limite; else if (y < -limite) y = -limite;

      el.style.setProperty('--px', y.toFixed(2) + 'px');
    }

    if (barra) {
      var alcance = document.documentElement.scrollHeight - window.innerHeight;
      var t = alcance > 0 ? Math.min(1, Math.max(0, window.scrollY / alcance)) : 0;
      barra.style.transform = 'scaleX(' + t.toFixed(4) + ')';
    }
  }

  function marcar() {
    sujo = true;
    if (!laco) laco = requestAnimationFrame(passo);
  }

  /* ======================================================================
     3. BARRA DE PROGRESSO
     ====================================================================== */

  if (document.querySelector('main')) {
    var trilho = document.createElement('div');
    trilho.className = 'progresso';
    trilho.setAttribute('aria-hidden', 'true');
    barra = document.createElement('i');
    trilho.appendChild(barra);
    document.body.appendChild(trilho);
  }

  if (deslizantes.length || barra) {
    window.addEventListener('scroll', marcar, { passive: true });
    window.addEventListener('resize', marcar, { passive: true });
    marcar();
  }

  /* ======================================================================
     4. CONTADORES
     ====================================================================== */

  function contar(el) {
    var fim = parseFloat(el.getAttribute('data-conta'));
    if (isNaN(fim)) return;
    var sufixo = el.getAttribute('data-sufixo') || '';
    var dur = 1100;
    var t0 = 0;

    function tique(agora) {
      if (!t0) t0 = agora;
      var t = Math.min(1, (agora - t0) / dur);
      var e = 1 - Math.pow(1 - t, 4);           // easeOutQuart
      el.textContent = Math.round(fim * e) + sufixo;
      if (t < 1) requestAnimationFrame(tique);
    }

    if (semMovimento.matches) { el.textContent = fim + sufixo; return; }
    el.textContent = '0' + sufixo;
    requestAnimationFrame(tique);
  }

  var contadores = document.querySelectorAll('[data-conta]');

  if (contadores.length && 'IntersectionObserver' in window) {
    var olhoConta = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        contar(e.target);
        olhoConta.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(contadores, function (el) { olhoConta.observe(el); });
  }

  /* ======================================================================
     5. INCLINAÇÃO 3D E BRILHO
     Só em quem tem mouse de verdade: no celular isso seria só um transform
     morto ocupando camada de composição.
     ====================================================================== */

  function ligarInclinacao() {
    var caixas = document.querySelectorAll('[data-inclina]');

    Array.prototype.forEach.call(caixas, function (el) {
      var forca = parseFloat(el.getAttribute('data-inclina')) || 5;
      var dentro = false;

      function mover(e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;      // 0..1
        var y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--tx', ((x - 0.5) * 2 * forca).toFixed(2) + 'deg');
        el.style.setProperty('--ty', ((0.5 - y) * 2 * forca).toFixed(2) + 'deg');
        el.style.setProperty('--bx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--by', (y * 100).toFixed(1) + '%');
        if (!dentro) { dentro = true; el.classList.add('is-inclinado'); }
      }

      function sair() {
        dentro = false;
        el.classList.remove('is-inclinado');
        el.style.removeProperty('--tx');
        el.style.removeProperty('--ty');
      }

      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        mover(e);
      });
      el.addEventListener('pointerleave', sair);
      el.addEventListener('blur', sair, true);
    });
  }

  if (pontFino.matches && !semMovimento.matches) ligarInclinacao();
})();

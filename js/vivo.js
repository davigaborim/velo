/* ==========================================================================
   VELO — camada de vida

   Superfícies que reagem ao ponteiro e os números do hero contando. Nada
   aqui é essencial: se este arquivo não carregar, o site continua inteiro.

   O parallax e a entrada dos elementos saíram daqui em 21/10: viraram CSS
   com animation-timeline (seção 12 do style.css), que o compositor roda
   sem ler layout a cada rolagem. Ficou aqui só a barra de leitura, para o
   navegador que ainda não tem animation-timeline.
   ========================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pontFino = window.matchMedia('(hover:hover) and (pointer:fine)');
  var linhaDoTempo = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));

  /* ======================================================================
     BARRA DE PROGRESSO
     Com animation-timeline o CSS enche a barra sozinho; sem, este laço.
     ====================================================================== */

  if (document.querySelector('main')) {
    var trilho = document.createElement('div');
    trilho.className = 'progresso';
    trilho.setAttribute('aria-hidden', 'true');
    var barra = document.createElement('i');
    trilho.appendChild(barra);
    document.body.appendChild(trilho);

    if (!linhaDoTempo) {
      var laco = 0;
      var passo = function () {
        laco = 0;
        var alcance = document.documentElement.scrollHeight - window.innerHeight;
        var t = alcance > 0 ? Math.min(1, Math.max(0, window.scrollY / alcance)) : 0;
        barra.style.transform = 'scaleX(' + t.toFixed(4) + ')';
      };
      var marcar = function () { if (!laco) laco = requestAnimationFrame(passo); };
      window.addEventListener('scroll', marcar, { passive: true });
      window.addEventListener('resize', marcar, { passive: true });
      marcar();
    }
  }

  /* ======================================================================
     CONTADORES
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
     INCLINAÇÃO 3D E BRILHO
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

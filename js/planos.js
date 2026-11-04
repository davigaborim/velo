/* ==========================================================================
   VELO — página de planos
   Upsell: um clique em "Tenho interesse" abre a oferta do plano de cima.

   O relógio da promoção que morava aqui virou o js/campanhas.js: as datas
   e os preços promocionais agora estão em dados/campanhas.json, e é de lá
   também que vem o texto de cada oferta enquanto uma campanha vale.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     UPSELL
     ----------------------------------------------------------------------
     Só uma oferta aberta por vez: a ideia é empurrar um degrau, não abrir
     um cardápio.
     ====================================================================== */

  var gatilhos = Array.prototype.slice.call(document.querySelectorAll('.plano__gatilho'));

  function fechar(botao) {
    var alvo = document.getElementById(botao.getAttribute('aria-controls'));
    if (!alvo) return;
    alvo.hidden = true;
    botao.setAttribute('aria-expanded', 'false');
    botao.textContent = botao.getAttribute('data-fechado') || 'Tenho interesse';
  }

  gatilhos.forEach(function (botao) {
    botao.setAttribute('data-fechado', botao.textContent.trim());

    botao.addEventListener('click', function () {
      var alvo = document.getElementById(botao.getAttribute('aria-controls'));
      if (!alvo) return;

      var abrindo = alvo.hidden;
      gatilhos.forEach(fechar);

      if (abrindo) {
        alvo.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
        botao.textContent = 'Deixa pra lá';
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') gatilhos.forEach(fechar);
  });
})();

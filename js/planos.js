/* ==========================================================================
   VELO — página de planos
   1. Relógio da promoção de lançamento.
   2. Upsell: um clique em "Tenho interesse" abre a oferta do plano de cima.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     1. O RELÓGIO
     ----------------------------------------------------------------------
     A data abaixo é o único lugar pra mexer. Ela é uma data DE VERDADE:
     quando chegar, o relógio some sozinho e os preços voltam pro cheio.
     Pra esticar a promoção, troque a data. Não faça o relógio reiniciar
     sozinho a cada visita — contador falso é propaganda enganosa (CDC art.
     37) e queima justamente a confiança do cliente pequeno que a Velo quer.
     ====================================================================== */

  var FIM_DA_PROMO = new Date(2026, 7, 31, 23, 59, 59);   // mês 7 = agosto

  var promo   = document.getElementById('promo');
  var relogio = document.getElementById('relogio');
  var campos  = relogio && {
    d: document.getElementById('relD'),
    h: document.getElementById('relH'),
    m: document.getElementById('relM'),
    s: document.getElementById('relS')
  };

  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

  // Volta os preços de mídia pro valor cheio e tira a tarja de promoção.
  function encerrarPromo() {
    if (promo) promo.hidden = true;

    document.querySelectorAll('.plano--mar').forEach(function (card) {
      var antes = card.querySelector('.plano__antes');
      var valor = card.querySelector('.plano__valor');
      if (antes && valor) {
        valor.textContent = antes.textContent.replace(/^de\s+/i, '').trim();
        antes.remove();
      }
      var linha = card.querySelector('.upsell__linha[data-fim]');
      if (linha) linha.innerHTML = linha.getAttribute('data-fim');
    });
  }

  function tique() {
    var falta = FIM_DA_PROMO - new Date();

    if (falta <= 0) {
      encerrarPromo();
      return false;
    }

    var s = Math.floor(falta / 1000);
    campos.d.textContent = doisDigitos(Math.floor(s / 86400));
    campos.h.textContent = doisDigitos(Math.floor(s / 3600) % 24);
    campos.m.textContent = doisDigitos(Math.floor(s / 60) % 60);
    campos.s.textContent = doisDigitos(s % 60);
    return true;
  }

  if (relogio && campos.d) {
    if (tique()) {
      var batida = setInterval(function () {
        if (!tique()) clearInterval(batida);
      }, 1000);
    }
  } else if (new Date() > FIM_DA_PROMO) {
    encerrarPromo();
  }

  /* ======================================================================
     2. UPSELL
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

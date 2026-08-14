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

  // Duas tarjas com o mesmo prazo: a da criação de site e a de mídia.
  var tarjas   = Array.prototype.slice.call(document.querySelectorAll('.promo'));
  var relogios = Array.prototype.slice.call(document.querySelectorAll('.promo__relogio'))
    .map(function (r) {
      return {
        d: r.querySelector('[data-rel="d"]'),
        h: r.querySelector('[data-rel="h"]'),
        m: r.querySelector('[data-rel="m"]'),
        s: r.querySelector('[data-rel="s"]')
      };
    })
    .filter(function (c) { return c.d && c.h && c.m && c.s; });

  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

  /* Fim da promoção: cada card que tem um `.plano__antes` volta pro valor
     cheio (o próprio texto riscado é a fonte da verdade) e as ofertas de
     upsell trocam pelo texto do `data-fim`. Serve tanto pros cards de site
     — onde o `.plano__antes` está na linha da criação — quanto pros de
     mídia, que só têm um preço. */
  function encerrarPromo() {
    tarjas.forEach(function (t) { t.hidden = true; });

    document.querySelectorAll('.plano__antes').forEach(function (antes) {
      var cifra = antes.parentNode;
      var valor = cifra && cifra.querySelector('.plano__valor');
      if (!valor) return;
      var periodo = valor.querySelector('.plano__periodo');
      valor.textContent = antes.textContent.replace(/^de\s+/i, '').trim();
      if (periodo) valor.appendChild(periodo);
      antes.remove();
    });

    document.querySelectorAll('.upsell__linha[data-fim]').forEach(function (linha) {
      linha.innerHTML = linha.getAttribute('data-fim');
    });
  }

  function tique() {
    var falta = FIM_DA_PROMO - new Date();

    if (falta <= 0) {
      encerrarPromo();
      return false;
    }

    var s = Math.floor(falta / 1000);
    var texto = {
      d: doisDigitos(Math.floor(s / 86400)),
      h: doisDigitos(Math.floor(s / 3600) % 24),
      m: doisDigitos(Math.floor(s / 60) % 60),
      s: doisDigitos(s % 60)
    };
    relogios.forEach(function (c) {
      c.d.textContent = texto.d; c.h.textContent = texto.h;
      c.m.textContent = texto.m; c.s.textContent = texto.s;
    });
    return true;
  }

  if (relogios.length) {
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

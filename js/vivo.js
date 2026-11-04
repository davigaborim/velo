/* ==========================================================================
   VELO — camada de vida

   O que mexe com a rolagem é CSS (seção 12 do style.css, com
   animation-timeline): o compositor roda sozinho, sem JS lendo layout a
   cada quadro. Aqui ficam só as peças que o CSS não sabe fazer:

   1. barra de leitura, pro navegador que ainda não tem animation-timeline;
   2. títulos partidos em palavras (pra elas saírem da água uma por uma);
   3. odômetro: preços e números rolando os dígitos quando aparecem;
   4. a onda que abre de onde o ponteiro entrou no botão, e o ímã dos
      botões grandes.

   Nada aqui é essencial: se este arquivo não carregar, o site continua
   inteiro, legível e parado.
   ========================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pontFino = window.matchMedia('(hover:hover) and (pointer:fine)');
  var linhaDoTempo = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  var temOlho = 'IntersectionObserver' in window;
  var cada = function (lista, fn) { Array.prototype.forEach.call(lista, fn); };

  /* ======================================================================
     1. BARRA DE PROGRESSO
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
     2. TÍTULOS EM PALAVRAS
     Cada palavra vira <span class="pal"><span style="--i:n">palavra</span>
     </span>: a de fora é a janela parada (a linha d'água), a de dentro é
     quem sobe. O texto não muda — o leitor de tela lê igual.

     Só parte onde o CSS vai animar (tem linha do tempo, sem movimento
     reduzido). E não parte título que JÁ está na tela quando a página abre
     (recarregou no meio, link com #): ele sumiria e voltaria na sua frente.
     Pontuação colada ("R$ 600.") fica na mesma palavra, senão o ponto podia
     cair sozinho na linha de baixo. Elemento dentro do título (o preço que
     a campanha troca) vira uma palavra inteira — o campanhas.js continua
     escrevendo no mesmo <span data-preco>.
     ====================================================================== */

  function partir(titulo) {
    var n = 0, ultima = null;
    function nova(conteudo) {
      var fora = document.createElement('span');
      var dentro = document.createElement('span');
      fora.className = 'pal';
      dentro.style.setProperty('--i', n++);
      fora.appendChild(dentro);
      dentro.appendChild(conteudo);
      return fora;
    }
    cada(Array.prototype.slice.call(titulo.childNodes), function (no) {
      if (no.nodeType === 3) {
        var frag = document.createDocumentFragment();
        no.nodeValue.split(/(\s+)/).forEach(function (pedaco) {
          if (!pedaco) return;
          if (/^\s+$/.test(pedaco)) { frag.appendChild(document.createTextNode(pedaco)); ultima = null; return; }
          if (ultima) { ultima.firstChild.appendChild(document.createTextNode(pedaco)); return; }
          ultima = nova(document.createTextNode(pedaco));
          frag.appendChild(ultima);
        });
        titulo.replaceChild(frag, no);
      } else if (no.nodeName === 'BR') {
        ultima = null;
      } else if (no.nodeType === 1) {
        if (ultima) { ultima.firstChild.appendChild(no); return; }
        var lugar = document.createComment('');
        titulo.replaceChild(lugar, no);
        ultima = nova(no);
        titulo.replaceChild(ultima, lugar);
      }
    });
  }

  if (linhaDoTempo && !semMovimento.matches) {
    var altura = window.innerHeight;
    cada(document.querySelectorAll('.cab h2, .chamada h2'), function (h) {
      if (h.getBoundingClientRect().top < altura) return;   // já está na tela
      partir(h);
    });
  }

  /* ======================================================================
     3. ODÔMETRO
     Quando um número aparece, cada dígito vira uma fita de 0 a 9 que rola
     até o valor certo (as da direita giram mais, como num odômetro de
     verdade). Só transform numa janela parada: o compositor anda sozinho.

     - A largura não muda: cada coluna guarda o dígito final invisível, que
       é quem mede o espaço. Zero deslocamento de layout.
     - O leitor de tela lê o número inteiro (cópia escondida), não a fita.
     - Ao terminar, o elemento volta exatamente ao que era. Se o
       campanhas.js trocar o preço no meio da rolagem, ele escreve por cima
       da fita e o odômetro sai de cena sem desfazer nada.
     ====================================================================== */

  function rolar(el) {
    if (el.__rolou) return;
    el.__rolou = true;
    var texto = el.textContent;
    if (!/\d/.test(texto)) return;

    var originais = Array.prototype.slice.call(el.childNodes);
    var visual = document.createElement('span');
    visual.className = 'rola';
    visual.setAttribute('aria-hidden', 'true');
    var leitor = document.createElement('span');
    leitor.className = 'rola__leitor';
    leitor.textContent = texto.trim();

    var colunas = [];
    originais.forEach(function (no) {
      if (no.nodeType !== 3) { visual.appendChild(no.cloneNode(true)); return; }
      var solto = '';
      no.nodeValue.split('').forEach(function (ch) {
        if (!/\d/.test(ch)) { solto += ch; return; }
        if (solto) { visual.appendChild(document.createTextNode(solto)); solto = ''; }
        var c = document.createElement('span');
        c.className = 'rola__c';
        var alvo = document.createElement('span');
        alvo.className = 'rola__alvo';
        alvo.textContent = ch;
        var fita = document.createElement('span');
        fita.className = 'rola__fita';
        c.appendChild(alvo);
        c.appendChild(fita);
        visual.appendChild(c);
        colunas.push({ fita: fita, d: +ch });
      });
      if (solto) visual.appendChild(document.createTextNode(solto));
    });

    // quantos dígitos cada fita percorre: a da esquerda pouco, a da direita muito
    var total = colunas.length;
    colunas.forEach(function (col, k) {
      var voltas = 6 + k * 4;   // 6, 10, 14, 18...
      var digitos = [];
      for (var j = voltas; j >= 0; j--) digitos.push(((col.d - j) % 10 + 10) % 10);
      col.fita.textContent = digitos.join('\n');
      col.ate = -(voltas / (voltas + 1)) * 100;
      col.fita.style.transitionDelay = (k * 70) + 'ms';
    });

    el.textContent = '';
    el.appendChild(leitor);
    el.appendChild(visual);

    var feito = false;
    function voltar() {
      if (feito) return;
      feito = true;
      if (visual.parentNode !== el) return;   // alguém já reescreveu o número
      el.textContent = '';
      originais.forEach(function (no) { el.appendChild(no); });
    }

    // dois quadros: o primeiro pinta a fita no começo, o segundo manda rolar
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        colunas.forEach(function (col) { col.fita.style.transform = 'translateY(' + col.ate.toFixed(3) + '%)'; });
        var ultima = colunas[colunas.length - 1].fita;
        ultima.addEventListener('transitionend', voltar);
        setTimeout(voltar, 1300 + total * 70 + 400);   // aba escondida não dispara transitionend
      });
    });
  }

  function ligarOdometros() {
    var numeros = document.querySelectorAll('[data-conta], [data-rola], .plano__valor, .avulso__preco, .erro__num');
    if (!numeros.length || !temOlho || semMovimento.matches) return;
    // dispara um pouco acima do pé da tela: abaixo disso, nos cards de site,
    // ainda é água e o número rolaria escondido
    var olhoNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        olhoNum.unobserve(e.target);
        rolar(e.target);
      });
    }, { rootMargin: '0px 0px -22% 0px', threshold: 0.9 });
    var altura = window.innerHeight;
    cada(numeros, function (el) {
      // os números do hero fazem parte da chegada: se já estão na primeira
      // tela (mesmo atrás do mar, lá embaixo), rolam junto com o resto
      if (el.closest('.hero') && el.getBoundingClientRect().top < altura) {
        rolar(el);
        return;
      }
      olhoNum.observe(el);
    });
  }

  // DOMContentLoaded vem depois de todos os scripts defer: o campanhas.js
  // já leu os preços cheios do HTML antes de qualquer fita existir
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligarOdometros);
  else ligarOdometros();

  /* ======================================================================
     4. ONDA E ÍMÃ NOS BOTÕES
     A onda abre do ponto em que o mouse entrou (ou de onde o dedo tocou).
     O ímã puxa os botões grandes alguns pixels pro ponteiro — só com mouse
     de verdade, e escrevendo uma vez por quadro. A caixa do botão é lida
     ao entrar (e de novo só se a página rolar), não a cada movimento.
     ====================================================================== */

  if (semMovimento.matches) return;

  function onda(el, x, y, r) {
    var px = x - r.left, py = y - r.top;
    var raio = Math.sqrt(Math.pow(Math.max(px, r.width - px), 2) + Math.pow(Math.max(py, r.height - py), 2));
    el.style.setProperty('--ox', px.toFixed(0) + 'px');
    el.style.setProperty('--oy', py.toFixed(0) + 'px');
    el.style.setProperty('--or', raio.toFixed(0) + 'px');
    if (!el.animate) return;
    try {
      el.animate(
        [{ scale: '0', opacity: 1 }, { scale: '1', opacity: 0 }],
        { duration: 720, easing: 'cubic-bezier(.2,.6,.3,1)', pseudoElement: '::after' }
      );
    } catch (_) { /* navegador sem animação em pseudo-elemento: fica sem onda */ }
  }

  cada(document.querySelectorAll('.btn, .pl-pulo'), function (el) {
    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') onda(el, e.clientX, e.clientY, el.getBoundingClientRect());
    });
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') onda(el, e.clientX, e.clientY, el.getBoundingClientRect());
    });
  });

  if (!pontFino.matches) return;

  var caixaVelha = false;
  window.addEventListener('scroll', function () { caixaVelha = true; }, { passive: true });

  cada(document.querySelectorAll('.btn--lg'), function (el) {
    var caixa = null, mx = 0, my = 0, pedido = 0;

    function aplicar() {
      pedido = 0;
      if (!caixa || caixaVelha) { caixa = el.getBoundingClientRect(); caixaVelha = false; }
      var dx = (mx - (caixa.left + caixa.width / 2)) / (caixa.width / 2);
      var dy = (my - (caixa.top + caixa.height / 2)) / (caixa.height / 2);
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      el.style.setProperty('--ima-x', (dx * 7).toFixed(1) + 'px');
      el.style.setProperty('--ima-y', (dy * 4).toFixed(1) + 'px');
    }

    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      caixa = el.getBoundingClientRect();
      el.classList.add('is-ima');
    });
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!pedido) pedido = requestAnimationFrame(aplicar);
    });
    el.addEventListener('pointerleave', function () {
      if (pedido) { cancelAnimationFrame(pedido); pedido = 0; }
      caixa = null;
      el.classList.remove('is-ima');           // volta com a mola do CSS
      el.style.removeProperty('--ima-x');
      el.style.removeProperty('--ima-y');
    });
  });
})();

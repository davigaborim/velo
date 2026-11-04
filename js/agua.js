/* ==========================================================================
   VELO — a água das faixas escuras (vídeo em loop)

   Atrás do hero, da chamada, da abertura e dos planos de Instagram roda uma
   fumaça/água. Ela era um shader WebGL desenhado ao vivo; agora é um vídeo
   de 10 s em loop perfeito, fabricado a partir do MESMO shader pelo
   ferramentas/fumaca-video.js. O desenho é o mesmo, mas quem trabalha é o
   decodificador de vídeo (quase sempre na placa), não o processador: anda
   até em computador sem placa de vídeo, onde a fumaça antiga ficava parada.

   Um vídeo só, compartilhado: todas as faixas apontam pro mesmo arquivo (o
   navegador baixa uma vez). Pra não parecer repetido, cada faixa começa num
   ponto diferente do loop, anda num ritmo um pouco diferente, tem zoom e
   enquadramento próprios e pode vir espelhada — tudo tirado dos mesmos
   data-vivo-* de antes (ver o LEIA-ME).

   O parallax é CSS (animation-timeline: view(), seção 17 do style.css):
   este arquivo não escuta rolagem nenhuma.
   ========================================================================== */

(function () {
  'use strict';

  var alvos = document.querySelectorAll('[data-vivo]');
  if (!alvos.length) return;

  /* A pasta video/ fica ao lado da js/. O caminho sai do próprio <script>
     pra funcionar igual no 404.html, que usa caminhos a partir da raiz. */
  var eu = document.currentScript && document.currentScript.src;
  var PASTA = eu ? eu.replace(/js\/agua\.js.*$/, 'video/') : 'video/';

  /* Duas molduras do mesmo vídeo: deitada (computador, tablet) e em pé
     (celular). No celular as faixas são mais altas que largas; com o vídeo
     deitado, o cover ampliaria tudo e a fumaça ficaria graúda demais. A
     moldura vale pro pôster também. */
  var celular = window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
  var MOLDURA = celular ? 'alto' : 'largo';

  var FONTES = [
    // AV1 10 bits: o menor arquivo (~200 KB) e sem degrau no degradê escuro
    { tipo: 'video/webm; codecs="av01.0.01M.10"', ext: 'webm', kbps: 170 },
    // H.264: o de reserva (Safari sem AV1) e o que quase todo aparelho
    // decodifica na placa de vídeo
    { tipo: 'video/mp4; codecs="avc1.64001E"', ext: 'mp4', kbps: 290 }
  ];

  /* Vai no ?v= de vídeos e pôsteres. Suba sempre que o vídeo for refeito:
     o .htaccess guarda a água por um ano. */
  var VERSAO = 1;

  var BASE_VELOCIDADE = 0.78;   // a velocidade em que o vídeo foi gerado
  var BASE_ESCALA = 1.72;       // a escala em que o vídeo foi gerado

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var rede = navigator.connection || {};
  /* Quem pediu economia de dados (ou está em 2G) fica só com o pôster: o
     vídeo são ~200 KB que não mudam nada no que a página diz. */
  var economia = !!rede.saveData || /(^|-)2g$/.test(rede.effectiveType || '');

  var candidatas = [];   // preenchida no iniciar(): perguntar ao navegador
                         // o que ele toca acorda a pilha de mídia

  function parado() { return semMovimento.matches || economia || !candidatas.length; }

  /* ----------------------------------------------- qual arquivo baixar */

  /* Entre AV1 e H.264, prefere o que o aparelho decodifica na placa
     ("powerEfficient"): é o que não esquenta o celular nem gasta bateria.
     AV1 na placa só existe em aparelho recente; nos outros o H.264 ganha,
     mesmo sendo maior. Sem a API, fica a ordem da lista. A escolha é feita
     uma vez e vale pra todas as faixas — mesmo arquivo, um download só. */
  var fonte = null;
  function escolherFonte() {
    if (fonte) return fonte;
    var mc = navigator.mediaCapabilities;
    if (!mc || !mc.decodingInfo) return (fonte = Promise.resolve(candidatas[0]));
    fonte = Promise.all(candidatas.map(function (f) {
      return mc.decodingInfo({
        type: 'file',
        video: {
          contentType: f.tipo,
          width: celular ? 360 : 640, height: celular ? 640 : 360,
          bitrate: f.kbps * 1000, framerate: 24
        }
      }).catch(function () { return { supported: true, smooth: true, powerEfficient: false }; });
    })).then(function (infos) {
      for (var i = 0; i < infos.length; i++) if (infos[i].supported && infos[i].powerEfficient) return candidatas[i];
      for (i = 0; i < infos.length; i++) if (infos[i].supported && infos[i].smooth) return candidatas[i];
      return candidatas[0];
    }, function () { return candidatas[0]; });
    return fonte;
  }

  /* ------------------------------------------------------ cada faixa */

  function num(alvo, nome, padrao) {
    var v = parseFloat(alvo.getAttribute('data-vivo-' + nome));
    return isNaN(v) ? padrao : v;
  }
  function fracao(x) { return x - Math.floor(x); }
  function entre(x, a, b) { return Math.max(a, Math.min(b, x)); }

  var faixas = [];

  function montar(alvo) {
    var conf = {
      semente:    num(alvo, 'semente', 635),
      velocidade: num(alvo, 'velocidade', 0.97),
      escala:     num(alvo, 'escala', 1.72),
      deriva:     num(alvo, 'deriva', 0.55)
    };

    var caixa = document.createElement('div');
    caixa.className = 'vivo';
    caixa.setAttribute('aria-hidden', 'true');
    var tela = document.createElement('div');
    tela.className = 'vivo__tela';

    /* Variações da faixa (no CSS, ver seção 17):
       - zoom: a escala do shader antigo. O vídeo foi gerado na mais fina
         (1.72); escala menor = fumaça mais graúda = vídeo ampliado.
       - espelho: semente ímpar vira o vídeo de lado.
       - foco: onde o enquadramento/zoom se apoia na horizontal.
       - deriva: quanto o parallax empurra, em % da altura da tela de vídeo
         (que é 124% da faixa) — a mesma conta do shader antigo. */
    var s = tela.style;
    s.setProperty('--vivo-zoom', entre(BASE_ESCALA / conf.escala, 1, 1.4).toFixed(3));
    s.setProperty('--vivo-espelho', conf.semente % 2 ? '-1' : '1');
    s.setProperty('--vivo-foco', (20 + fracao(conf.semente * 0.371) * 60).toFixed(1) + '%');
    s.setProperty('--vivo-deriva', (conf.deriva * 0.2 / 1.24 * 100).toFixed(2) + '%');

    caixa.appendChild(tela);
    alvo.insertBefore(caixa, alvo.firstChild);

    var f = { alvo: alvo, conf: conf, caixa: caixa, tela: tela, poster: null, video: null, visivel: false, tocando: false };
    faixas.push(f);
    altura(f);
    return f;
  }

  /* O pôster é o primeiro quadro do vídeo (AVIF, 4 KB; JPG pra quem não
     tem AVIF). É ele que aparece antes do vídeo, e sozinho pra quem tem
     movimento reduzido ou economia de dados. Um arquivo só pra todas. */
  var semAvif = false;
  function porPoster(f) {
    var img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');
    img.onload = function () {
      var pronto = function () { f.poster = img; crescer(f, img); };
      if (img.decode) img.decode().then(pronto, pronto); else pronto();
    };
    img.onerror = function () {
      // nem o JPG abriu: fica sem pôster (o gradiente navy continua ali)
      if (/\.jpg/.test(img.src)) { if (img.parentNode) img.parentNode.removeChild(img); return; }
      semAvif = true;
      img.src = arquivo('jpg');
    };
    img.src = arquivo(semAvif ? 'jpg' : 'avif');
    f.tela.insertBefore(img, f.tela.firstChild);
  }

  function arquivo(ext) { return PASTA + 'agua-' + MOLDURA + '.' + ext + '?v=' + VERSAO; }

  /* Pôster e vídeo nascem com 2 px (ver o style.css, seção 17) e só ganham
     o tamanho cheio depois de pintados uma vez com a faixa na tela: o
     Chrome mede o LCP no primeiro quadro em que cada imagem/vídeo aparece,
     e assim a água nunca passa o título como "maior elemento" da página.
     Pra o vídeo, "pintado" é o requestVideoFrameCallback (um quadro chegou
     à tela); pra imagem, dois quadros de animação depois de decodificada. */
  function crescer(f, el) {
    if (!el || el.classList.contains('is-pronto') || el.__crescendo || !f.visivel) return;
    el.__crescendo = true;
    var fim = function () { el.__crescendo = false; if (f.visivel) el.classList.add('is-pronto'); };
    if (el.tagName === 'VIDEO' && el.requestVideoFrameCallback) {
      el.requestVideoFrameCallback(function () { requestAnimationFrame(fim); });
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(fim); });
    }
  }

  /* Faixa bem mais alta que a tela (os planos de Instagram no celular têm
     2000 px): esticar o vídeo nela inteira ampliaria a fumaça 5×. Ali a
     tela de vídeo vira uma janela do tamanho da tela, grudada (sticky): a
     água fica parada enquanto os cards passam por cima — parallax máximo,
     de graça, pelo compositor. */
  function altura(f) {
    f.caixa.classList.toggle('vivo--alta', f.alvo.clientHeight > window.innerHeight * 1.5);
  }

  function criarVideo(f) {
    if (f.video || f.falhou || parado()) return;
    var v = document.createElement('video');
    // iOS só deixa tocar sozinho vídeo mudo e "inline", e confere os
    // atributos — não basta a propriedade
    v.muted = true;
    v.defaultMuted = true;
    v.loop = true;
    v.playsInline = true;
    ['muted', 'loop', 'playsinline', 'webkit-playsinline', 'autoplay',
     'disablepictureinpicture', 'disableremoteplayback'].forEach(function (a) { v.setAttribute(a, ''); });
    v.setAttribute('preload', 'metadata');
    v.setAttribute('aria-hidden', 'true');
    v.setAttribute('tabindex', '-1');
    f.video = v;

    var ritmo = entre(f.conf.velocidade / BASE_VELOCIDADE, 0.75, 1.3);

    v.addEventListener('loadedmetadata', function () {
      // cada faixa começa num ponto diferente do loop
      if (v.duration) v.currentTime = fracao(f.conf.semente * 0.618034) * v.duration;
      v.defaultPlaybackRate = ritmo;
      v.playbackRate = ritmo;
      if (f.visivel) tocar(f);
    });
    // só aparece quando já tem quadro andando: até lá, o pôster — e nunca
    // um botão de play do iOS por cima da água
    v.addEventListener('playing', function () { crescer(f, v); });
    // o autoplay do navegador não manda aqui: se a faixa já saiu da tela
    // quando o vídeo ficou pronto, ele espera parado
    v.addEventListener('play', function () { if (!f.tocando) v.pause(); });
    // arquivo que não abre: fica o pôster, e não tenta de novo
    v.addEventListener('error', function () {
      f.video = null;
      f.falhou = true;
      if (v.parentNode) v.parentNode.removeChild(v);
    });

    escolherFonte().then(function (c) {
      if (!c || f.video !== v) return;
      v.src = arquivo(c.ext);
      f.tela.appendChild(v);
    });
  }

  function tocar(f) {
    if (!f.video || parado() || document.hidden) return;
    f.tocando = true;
    // ainda sem arquivo (a escolha AV1/H.264 é assíncrona): o
    // loadedmetadata chama de novo
    if (!f.video.getAttribute('src')) return;
    var p = f.video.play();
    if (p && p.catch) p.catch(function (e) {
      f.tocando = false;
      // Bloqueado (iOS em Modo de Pouca Energia, autoplay desligado no
      // navegador): fica o pôster, e tenta de novo no primeiro toque.
      if (e && e.name === 'NotAllowedError') esperarToque();
    });
  }

  function pausar(f) {
    f.tocando = false;
    if (f.video && !f.video.paused) f.video.pause();
  }

  var esperando = false;
  function esperarToque() {
    if (esperando) return;
    esperando = true;
    var de = function () {
      esperando = false;
      ['touchend', 'click', 'keydown'].forEach(function (t) { document.removeEventListener(t, de, true); });
      faixas.forEach(function (f) { if (f.visivel) tocar(f); });
    };
    ['touchend', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, de, true); });
  }

  function atualizar() {
    faixas.forEach(function (f) {
      if (!f.posterPedido) { f.posterPedido = true; porPoster(f); }
      if (f.visivel) {
        crescer(f, f.poster);
        if (f.video && !f.video.paused) crescer(f, f.video);
      }
      if (liberado && f.visivel && !parado() && !document.hidden) { criarVideo(f); tocar(f); }
      else pausar(f);
    });
  }

  /* ---------------------------------------------------------- ligação */

  /* Nada da água entra na abertura da página: ela não pode disputar banda
     nem processador com a fonte, o mascote e o CSS. Até o load a faixa fica
     no gradiente navy de sempre; no load chega o pôster (4 KB, o mesmo
     arquivo pra todas); o vídeo só um segundo depois, com o navegador
     ocioso. O segundo a mais tira o vídeo da conta do LCP no PageSpeed: o
     "maior elemento" (o mascote, o título) às vezes termina de entrar só
     depois do load, por causa da animação de entrada, e download que
     começa antes disso entra na simulação de rede lenta do LCP. */
  var carregou = document.readyState === 'complete';
  var liberado = false;
  var iniciado = false;

  /* Até a montagem da camada fica pra depois da primeira pintura: medida
     em 04/11, montar tudo direto no script (ele roda antes da página
     aparecer) atrasava a primeira pintura uns 30 ms no computador. */
  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    var prova = document.createElement('video');
    candidatas = FONTES.filter(function (f) { return prova.canPlayType && prova.canPlayType(f.tipo); });
    Array.prototype.forEach.call(alvos, montar);

    if ('IntersectionObserver' in window) {
      var olho = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          for (var i = 0; i < faixas.length; i++) {
            if (faixas[i].alvo === e.target) faixas[i].visivel = e.isIntersecting;
          }
        });
        if (carregou) atualizar();
      }, { rootMargin: '15% 0px' });
      faixas.forEach(function (f) { olho.observe(f.alvo); });
    } else {
      faixas.forEach(function (f) { f.visivel = true; });
    }

    if ('ResizeObserver' in window) {
      var vigia = new ResizeObserver(function () { faixas.forEach(altura); });
      faixas.forEach(function (f) { vigia.observe(f.alvo); });
    }
  }
  requestAnimationFrame(function () { setTimeout(iniciar, 0); });

  function depoisDoLoad() {
    iniciar();
    carregou = true;
    atualizar();
    setTimeout(function () {
      var ja = function () { liberado = true; atualizar(); };
      if ('requestIdleCallback' in window) requestIdleCallback(ja, { timeout: 1500 });
      else ja();
    }, 1000);
  }
  if (carregou) depoisDoLoad();
  else window.addEventListener('load', depoisDoLoad);

  document.addEventListener('visibilitychange', function () { if (carregou) atualizar(); });

  semMovimento.addEventListener && semMovimento.addEventListener('change', function () {
    if (semMovimento.matches) faixas.forEach(function (f) { if (f.video) f.video.classList.remove('is-pronto'); });
    if (carregou) atualizar();
  });

  window.addEventListener('resize', function () { faixas.forEach(altura); }, { passive: true });
})();

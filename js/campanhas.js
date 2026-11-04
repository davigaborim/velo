/* ==========================================================================
   VELO — calendário de campanhas e sinais de vida
   Roda nas duas páginas (home e planos).

   1. Os dados: dados/campanhas.json, com uma cópia de reserva aqui dentro.
   2. Hora de Campo Grande e formatação.
   3. Campanha vigente: preços, selos e upsell.
   4. Atendimento: "respondendo agora" ou "fora do horário".
   5. Vagas do mês e "revisado em".
   6. A agenda: quando reler a data, quando buscar o JSON de novo.

   A regra que manda em tudo: nada aqui é inventado. Toda promoção tem data
   real de início e fim, o selo de "últimos dias" sai da data de fim, o
   "respondendo agora" sai do horário de atendimento. Não ponha contador que
   reinicia a cada visita, visitante online nem "fulano acabou de comprar":
   é propaganda enganosa (CDC art. 37) e queima justamente a confiança do
   cliente pequeno que a Velo quer.

   Sem este arquivo o site continua de pé: o HTML traz os preços CHEIOS e
   os selos escondidos. Preço cheio é o único que vale em qualquer dia —
   se o HTML trouxesse o promocional e o JS falhasse, a promoção ficaria no
   ar pra sempre depois de vencida (foi o que aconteceu com a de agosto).
   ========================================================================== */

(function () {
  'use strict';

  var BUSCA_A_CADA = 5 * 60 * 1000;    // relê o JSON no servidor a cada 5 min
  var BUSCA_MINIMA = 60 * 1000;        // voltando pra aba, busca se a última tem mais de 1 min
  var URGENTE = 72 * 3600 * 1000;      // menos que isso pro fim: "Últimos dias"
  var FINAL = 24 * 3600 * 1000;        // menos que isso: "Termina hoje", com relógio
  var CHAVE_LOCAL = 'velo:campanhas';  // última versão boa do JSON, neste navegador

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ======================================================================
     1. OS DADOS
     ----------------------------------------------------------------------
     Quem manda é o dados/campanhas.json. A RESERVA abaixo é cópia dele e só
     entra quando o JSON não chega: página aberta direto do disco (file://),
     servidor fora ou arquivo com erro de digitação. Mudou o JSON? Copie
     pra cá também quando der — não é urgente, é só a rede de segurança.
     ====================================================================== */

  var RESERVA = {
    atualizado_em: '2026-11-04',
    campanhas: [
      {
        id: 'novembro-2026',
        inicio: '2026-11-01T00:00:00-04:00',
        fim: '2026-11-30T23:59:59-04:00',
        selo: '<b>{desconto}</b> em novembro, até {fim}',
        precos: { 'recife': 300, 'alto-mar': 550, 'abissal': 1500, 'presenca': 350, 'ataque': 650, 'dominancia': 850 },
        upsell: {
          'recife':   { texto: 'Por mais <strong>R$ 200</strong> na criação você sobe pro <strong>Alto mar</strong> — de R$ 550 por <b>R$ 500</b>.', zap: 'Oi, Velo! Quero o Alto mar por R$ 500 de criação.' },
          'alto-mar': { texto: 'Por mais <strong>R$ 850</strong> na criação você sobe pro <strong>Abissal</strong> — de R$ 1.500 por <b>R$ 1.400</b>.', zap: 'Oi, Velo! Quero o Abissal por R$ 1.400 de criação.' },
          'presenca': { texto: 'Por mais <strong>R$ 250/mês</strong> você leva o <strong>Ataque</strong> — de R$ 650 por <b>R$ 600</b>.', zap: 'Oi, Velo! Quero o plano Ataque por R$ 600/mês.' },
          'ataque':   { texto: 'Por mais <strong>R$ 150/mês</strong> você leva a <strong>Dominância</strong> — de R$ 850 por <b>R$ 800</b>.', zap: 'Oi, Velo! Quero o plano Dominância por R$ 800/mês.' }
        }
      },
      {
        id: 'fim-de-ano-2026',
        inicio: '2026-12-01T00:00:00-04:00',
        fim: '2026-12-31T23:59:59-04:00',
        selo: '<b>{desconto}</b> de fim de ano, até {fim}',
        saudacao: 'Boas festas!',
        precos: { 'recife': 300, 'alto-mar': 550, 'abissal': 1500, 'presenca': 350, 'ataque': 650, 'dominancia': 850 },
        upsell: {
          'recife':   { texto: 'Por mais <strong>R$ 200</strong> na criação você sobe pro <strong>Alto mar</strong> — de R$ 550 por <b>R$ 500</b>.', zap: 'Oi, Velo! Quero o Alto mar por R$ 500 de criação.' },
          'alto-mar': { texto: 'Por mais <strong>R$ 850</strong> na criação você sobe pro <strong>Abissal</strong> — de R$ 1.500 por <b>R$ 1.400</b>.', zap: 'Oi, Velo! Quero o Abissal por R$ 1.400 de criação.' },
          'presenca': { texto: 'Por mais <strong>R$ 250/mês</strong> você leva o <strong>Ataque</strong> — de R$ 650 por <b>R$ 600</b>.', zap: 'Oi, Velo! Quero o plano Ataque por R$ 600/mês.' },
          'ataque':   { texto: 'Por mais <strong>R$ 150/mês</strong> você leva a <strong>Dominância</strong> — de R$ 850 por <b>R$ 800</b>.', zap: 'Oi, Velo! Quero o plano Dominância por R$ 800/mês.' }
        }
      }
    ],
    atendimento: {
      seg: '00:00-24:00', ter: '00:00-24:00', qua: '00:00-24:00',
      qui: '00:00-24:00', sex: '00:00-24:00', sab: '00:00-24:00', dom: '00:00-24:00',
      feriados: []
    },
    vagas: { ligado: false, mes: '2026-11', quantas: 3 }
  };

  // O JSON mora em ../dados/ a partir deste script — assim continua achando
  // o arquivo mesmo se o site um dia for pra uma subpasta.
  var URL_DADOS = 'dados/campanhas.json';
  try {
    if (document.currentScript && document.currentScript.src) {
      URL_DADOS = new URL('../dados/campanhas.json', document.currentScript.src).href;
    }
  } catch (e) { /* fica o caminho relativo */ }

  function valido(d) {
    return !!(d && typeof d === 'object' && Array.isArray(d.campanhas));
  }

  function lerLocal() {
    try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || 'null'); } catch (e) { return null; }
  }
  function gravarLocal(texto) {
    try { localStorage.setItem(CHAVE_LOCAL, texto); } catch (e) { /* aba anônima, tudo bem */ }
  }

  /* A cópia que este navegador guardou da última busca boa vence a RESERVA
     quando é tão nova quanto ela: veio do servidor, é mais confiável. */
  var dados = RESERVA;
  var guardado = lerLocal();
  if (valido(guardado) && String(guardado.atualizado_em || '') >= String(RESERVA.atualizado_em || '')) {
    dados = guardado;
  }

  var campanhas = [];

  /* "fim" vale até o último instante daquele segundo: 23:59:59 cobre o
     23:59:59,999, e a campanha seguinte, que começa às 00:00:00, assume
     sem um segundo de preço cheio no meio. */
  function preparar(d) {
    campanhas = (d.campanhas || []).map(function (c) {
      var ini = Date.parse(c && c.inicio);
      var fim = Date.parse(c && c.fim);
      if (!c || isNaN(ini) || isNaN(fim) || fim < ini) return null;
      return {
        id: c.id, ini: ini, fimEx: fim + 1000,
        selo: c.selo, desconto: c.desconto, saudacao: c.saudacao,
        precos: c.precos || {}, upsell: c.upsell || {}
      };
    }).filter(Boolean);
  }

  // Se duas campanhas se sobrepõem, vale a que começou por último.
  function vigente(agora) {
    var achada = null;
    campanhas.forEach(function (c) {
      if (c.ini <= agora && agora < c.fimEx && (!achada || c.ini > achada.ini)) achada = c;
    });
    return achada;
  }

  // O próximo instante em que alguma coisa muda de estado por causa da data.
  function proximaVirada(agora) {
    var prox = Infinity;
    campanhas.forEach(function (c) {
      [c.ini, c.fimEx, c.fimEx - URGENTE, c.fimEx - FINAL].forEach(function (t) {
        if (t > agora && t < prox) prox = t;
      });
    });
    return prox;
  }

  /* ======================================================================
     2. HORA DE CAMPO GRANDE
     ----------------------------------------------------------------------
     O visitante pode estar em outro fuso; o atendimento e o "termina hoje"
     são sempre pela hora de Campo Grande. Sem Intl com fuso, cai no -04:00
     fixo (MS não tem horário de verão desde 2019).
     ====================================================================== */

  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  var NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var NOMES_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var relogioCG = null;
  try {
    relogioCG = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Campo_Grande', hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
    if (!relogioCG.formatToParts) relogioCG = null;
  } catch (e) { relogioCG = null; }

  // { ano, mes (1-12), dia, hora, min, n } — n é o número do dia desde 1970,
  // bom pra contar "hoje", "amanhã" e achar o dia da semana.
  function emCG(ms) {
    var p = { ano: 0, mes: 0, dia: 0, hora: 0, min: 0 };
    if (relogioCG) {
      relogioCG.formatToParts(new Date(ms)).forEach(function (x) {
        if (x.type === 'year') p.ano = +x.value;
        else if (x.type === 'month') p.mes = +x.value;
        else if (x.type === 'day') p.dia = +x.value;
        else if (x.type === 'hour') p.hora = +x.value % 24;
        else if (x.type === 'minute') p.min = +x.value;
      });
    } else {
      var d = new Date(ms - 4 * 3600 * 1000);
      p = { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate(), hora: d.getUTCHours(), min: d.getUTCMinutes() };
    }
    p.n = Math.round(Date.UTC(p.ano, p.mes - 1, p.dia) / 864e5);
    return p;
  }

  function doisDigitos(n) { return (n < 10 ? '0' : '') + n; }

  function diaDoNumero(n) {          // n → { iso: 'aaaa-mm-dd', semana: 0-6 }
    var d = new Date(n * 864e5);
    return { iso: d.toISOString().slice(0, 10), semana: d.getUTCDay() };
  }

  function ddmm(p) { return doisDigitos(p.dia) + '/' + doisDigitos(p.mes); }

  function hora(minutos) {           // 480 → "8h", 510 → "8h30"
    var h = Math.floor(minutos / 60), m = minutos % 60;
    return h + 'h' + (m ? doisDigitos(m) : '');
  }

  function dinheiro(n) {             // 1500 → "R$ 1.500"
    var inteiro = Math.floor(n);
    var texto = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var centavos = Math.round((n - inteiro) * 100);
    return 'R$ ' + texto + (centavos ? ',' + doisDigitos(centavos) : '');
  }

  function lerValor(texto) {         // "R$ 1.500" → 1500
    var n = parseFloat(String(texto).replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  function $$(sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel));
  }

  /* Valor que mudou com a página aberta pisca de leve (só opacidade: não
     mexe em tamanho nem empurra nada). Com movimento reduzido, troca seco. */
  function piscar(el) {
    if (semMovimento.matches) return;
    el.classList.remove('is-trocou');
    void el.offsetWidth;             // reinicia a animação
    el.classList.add('is-trocou');
  }

  /* ======================================================================
     3. CAMPANHA VIGENTE
     ----------------------------------------------------------------------
     O preço cheio é o texto que está no HTML (data-preco). A campanha só
     diz o promocional; se ele não for menor que o cheio, é ignorado.
     ====================================================================== */

  var precos = $$('[data-preco]').map(function (el) {
    var texto = el.textContent.trim();
    return { el: el, id: el.getAttribute('data-preco'), cheioTexto: texto, cheio: lerValor(texto) };
  });

  var cheios = {};
  precos.forEach(function (p) { if (!(p.id in cheios)) cheios[p.id] = p; });

  var antes = $$('[data-preco-antes]').map(function (el) {
    return { el: el, id: el.getAttribute('data-preco-antes') };
  });

  /* Cada selo cobre os planos da seção em que está. Sem campanha ele fica
     invisível (CSS) mas guardando o lugar: no celular ele quebra linha
     embaixo do título, e aparecer depois do carregamento empurraria os
     cards. */
  var selos = $$('[data-selo]').map(function (el) {
    var secao = el.closest('section') || document;
    var ids = [];
    $$('[data-preco]', secao).forEach(function (p) {
      var id = p.getAttribute('data-preco');
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    return { el: el, ids: ids, texto: el.querySelector('[data-selo-texto]') || el, html: null };
  });

  // As ofertas de upsell: o HTML traz a versão sem campanha.
  var upsells = $$('[data-upsell]').map(function (caixa) {
    var linha = caixa.querySelector('.upsell__linha');
    var zap = caixa.querySelector('[data-upsell-zap]');
    return {
      id: caixa.getAttribute('data-upsell'),
      linha: linha, html0: linha ? linha.innerHTML : '', html: null,
      zap: zap, href0: zap ? zap.getAttribute('href') : ''
    };
  });

  function promoDe(camp, id) {
    var p = camp && camp.precos[id];
    var cheio = cheios[id] && cheios[id].cheio;
    return (typeof p === 'number' && p > 0 && cheio && p < cheio) ? p : 0;
  }

  // "50% off" se todos os planos da seção têm o mesmo desconto; senão "até X% off".
  function textoDesconto(camp, ids) {
    var pcts = [];
    ids.forEach(function (id) {
      var p = promoDe(camp, id);
      if (p) pcts.push(Math.round((1 - p / cheios[id].cheio) * 100));
    });
    if (!pcts.length) return '';
    if (camp.desconto) return camp.desconto;
    var maior = Math.max.apply(null, pcts);
    var iguais = pcts.every(function (x) { return x === maior; });
    return (iguais ? '' : 'até ') + maior + '% off';
  }

  function pintarPrecos(camp, animar) {
    precos.forEach(function (p) {
      var promo = promoDe(camp, p.id);
      var texto = promo ? dinheiro(promo) : p.cheioTexto;
      if (p.el.textContent === texto) return;
      p.el.textContent = texto;
      if (animar) piscar(p.el);
    });

    // O riscado vem do mesmo cheio do HTML; sem promoção ele fica invisível
    // mas guarda o lugar, pro card não mudar de altura.
    antes.forEach(function (a) {
      var tem = !!promoDe(camp, a.id);
      if (cheios[a.id]) a.el.textContent = 'de ' + cheios[a.id].cheioTexto;
      if (a.el.classList.contains('is-promo') === tem) return;
      a.el.classList.toggle('is-promo', tem);
      if (animar && tem) piscar(a.el);
    });
  }

  function htmlDoSelo(camp, desconto, agora) {
    var falta = camp.fimEx - agora;
    var fim = emCG(camp.fimEx - 1);
    var dias = fim.n - emCG(agora).n;           // 0 = termina hoje, 1 = amanhã
    var horaFim = hora(fim.hora * 60 + fim.min);

    if (falta < FINAL) {
      return {
        nivel: 'final',
        html: '<b>' + (dias <= 0 ? 'Termina hoje' : 'Termina amanhã') + '</b> · ' + desconto +
          ' · faltam <span class="promo-selo__relogio" data-relogio></span>'
      };
    }
    if (falta < URGENTE) {
      return {
        nivel: 'urgente',
        html: dias === 1 ? '<b>Termina amanhã</b> · ' + desconto + ' até ' + horaFim
                         : '<b>Últimos dias</b> · ' + desconto + ' até ' + ddmm(fim)
      };
    }
    return {
      nivel: '',
      html: String(camp.selo || '<b>{desconto}</b> até {fim}')
        .replace(/\{desconto\}/g, desconto).replace(/\{fim\}/g, ddmm(fim))
    };
  }

  function pintarSelos(camp, agora, animar) {
    var mudou = false;
    selos.forEach(function (s) {
      var desconto = camp ? textoDesconto(camp, s.ids) : '';
      var some = !desconto;
      s.el.classList.toggle('is-vigente', !some);
      if (some) {
        if (s.html !== null) { s.html = null; mudou = true; }
        return;
      }

      var r = htmlDoSelo(camp, desconto, agora);
      s.el.classList.toggle('promo-selo--urgente', r.nivel !== '');
      s.el.classList.toggle('promo-selo--final', r.nivel === 'final');
      if (s.html === r.html) return;
      s.texto.innerHTML = r.html;
      s.html = r.html;
      mudou = true;
      if (animar) piscar(s.texto);
    });
    if (mudou) observarRelogios();
  }

  function pintarUpsell(camp) {
    upsells.forEach(function (u) {
      var oferta = camp && camp.upsell[u.id];
      if (u.linha) {
        var html = oferta && oferta.texto ? oferta.texto : u.html0;
        if (u.html !== html) { u.linha.innerHTML = html; u.html = html; }
      }
      if (u.zap) {
        var href = oferta && oferta.zap
          ? u.href0.split('?')[0] + '?text=' + encodeURIComponent(oferta.zap)
          : u.href0;
        if (u.zap.getAttribute('href') !== href) u.zap.setAttribute('href', href);
      }
    });
  }

  /* ---------- o relógio de segundos ----------
     Só existe nas últimas 24h e só bate com ele na tela (IntersectionObserver)
     e a aba visível. Fora disso, nem um timer ligado. */

  var campAtual = null;
  var relogios = [];
  var batida = 0;
  var olho = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (vistos) {
        vistos.forEach(function (v) { v.target._naTela = v.isIntersecting; });
        ajustarBatida();
      })
    : null;

  function observarRelogios() {
    relogios = $$('[data-relogio]');
    if (olho) {
      olho.disconnect();
      relogios.forEach(function (r) { olho.observe(r); });
    }
    atualizarRelogios(Date.now());
    ajustarBatida();
  }

  function atualizarRelogios(agora) {
    if (!campAtual || !relogios.length) return;
    var s = Math.max(0, Math.ceil((campAtual.fimEx - agora) / 1000));
    var texto = doisDigitos(Math.floor(s / 3600)) + ':' +
      doisDigitos(Math.floor(s / 60) % 60) + ':' + doisDigitos(s % 60);
    relogios.forEach(function (r) { if (r.textContent !== texto) r.textContent = texto; });
  }

  function ajustarBatida() {
    var precisa = !document.hidden && relogios.some(function (r) {
      return !olho || r._naTela;
    });
    if (precisa && !batida) bater();
    else if (!precisa && batida) { clearTimeout(batida); batida = 0; }
  }

  // Bate na virada de cada segundo do prazo, não a cada 1000 ms soltos.
  function bater() {
    var agora = Date.now();
    if (campAtual && agora >= campAtual.fimEx) { batida = 0; reavaliar(true); agendar(); return; }
    atualizarRelogios(agora);
    var resto = campAtual ? (campAtual.fimEx - agora) % 1000 : 1000;
    batida = setTimeout(bater, (resto || 1000) + 5);
  }

  /* ======================================================================
     4. ATENDIMENTO
     ----------------------------------------------------------------------
     Pelo horário do JSON, na hora de Campo Grande. Dia em "feriados" conta
     como fechado.
     ====================================================================== */

  var atendes = $$('[data-atendimento]').map(function (el) { return { el: el, texto: null }; });
  var boia = document.querySelector('.zap-boia');
  var rotuloBoia = boia ? boia.getAttribute('aria-label') || '' : '';

  function janela(at, semana) {        // "08:00-18:00" → [480, 1080]
    var m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(String(at[DIAS[semana]] || '').trim());
    if (!m) return null;
    var a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4];
    return b > a ? [a, b] : null;
  }

  function situacao(at, agora) {
    var c = emCG(agora);
    var minuto = c.hora * 60 + c.min;
    var feriados = Array.isArray(at.feriados) ? at.feriados : [];
    var feriadoHoje = feriados.indexOf(diaDoNumero(c.n).iso) >= 0;

    for (var d = 0; d < 15; d++) {
      var dia = diaDoNumero(c.n + d);
      if (feriados.indexOf(dia.iso) >= 0) continue;
      var j = janela(at, dia.semana);
      if (!j || (d === 0 && minuto >= j[1])) continue;
      if (d === 0 && minuto >= j[0]) return { aberto: true, ate: j[1] };
      return { aberto: false, emDias: d, abre: j[0], semana: dia.semana, feriadoHoje: feriadoHoje, n: c.n + d };
    }
    return null;                         // sem horário nenhum cadastrado
  }

  function textoAtendimento(s) {
    // Dia inteiro aberto ("00:00-24:00") não tem "até as 24h": é 24 horas.
    if (s.aberto && s.ate >= 1440) return 'Respondendo no WhatsApp 24 horas por dia, todo dia';
    if (s.aberto) return 'Respondendo agora no WhatsApp, até as ' + hora(s.ate);
    var quando = s.emDias === 0 ? '' :
      s.emDias === 1 ? 'amanhã ' :
      s.emDias < 7 ? NOMES_DIA[s.semana] + ' ' :
      'dia ' + diaDoNumero(s.n).iso.slice(8, 10) + '/' + diaDoNumero(s.n).iso.slice(5, 7) + ' ';
    return (s.feriadoHoje ? 'Feriado hoje' : 'Fora do horário') +
      ' — respondemos ' + quando + 'a partir das ' + hora(s.abre);
  }

  function pintarAtendimento(camp, agora, animar) {
    var s = dados.atendimento ? situacao(dados.atendimento, agora) : null;
    var texto = s ? textoAtendimento(s) : '';
    if (texto && camp && camp.saudacao) texto = camp.saudacao + ' ' + texto;

    atendes.forEach(function (a) {
      a.el.hidden = !texto;
      if (!texto || a.texto === texto) return;
      a.el.setAttribute('data-estado', s.aberto ? 'aberto' : 'fechado');
      a.el.innerHTML = '<span class="atende__ponto" aria-hidden="true"></span><span class="atende__texto"></span>';
      a.el.lastChild.textContent = texto;
      if (animar && a.texto !== null) piscar(a.el.lastChild);
      a.texto = texto;
    });

    if (boia) {
      var aberto = !!(s && s.aberto);
      boia.setAttribute('data-atende', aberto ? 'sim' : 'nao');
      boia.setAttribute('aria-label', rotuloBoia + (aberto ? ' — respondendo agora' : ''));
    }
  }

  /* ======================================================================
     5. VAGAS DO MÊS E "REVISADO EM"
     ----------------------------------------------------------------------
     Vagas só aparecem com "ligado": true e no próprio mês do JSON — número
     esquecido de outubro some sozinho em novembro em vez de virar mentira.
     ====================================================================== */

  function pintarVagas(agora) {
    var v = dados.vagas;
    var c = emCG(agora);
    var mes = c.ano + '-' + doisDigitos(c.mes);
    var ok = !!(v && v.ligado === true && v.mes === mes && typeof v.quantas === 'number' && v.quantas >= 0);
    var texto = !ok ? '' :
      v.quantas === 0 ? 'Agenda de ' + NOMES_MES[c.mes - 1] + ' completa' :
      v.quantas + (v.quantas === 1 ? ' vaga aberta' : ' vagas abertas') + ' para começar em ' + NOMES_MES[c.mes - 1];
    $$('[data-vagas]').forEach(function (el) {
      el.hidden = !texto;
      if (el.textContent !== texto) el.textContent = texto;
    });
  }

  function pintarRevisado() {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dados.atualizado_em || ''));
    var texto = m ? ' · preços revisados em ' + m[3] + '/' + m[2] + '/' + m[1] : '';
    $$('[data-atualizado]').forEach(function (el) {
      el.hidden = !texto;
      if (el.textContent !== texto) el.textContent = texto;
    });
  }

  /* ======================================================================
     6. A AGENDA
     ----------------------------------------------------------------------
     - reavaliar(): olha a hora e pinta tudo. Barato: só mexe no que mudou.
     - agendar(): acorda na próxima virada de minuto ou no próximo instante
       em que uma campanha começa, acaba ou entra nas 72h/24h finais — o que
       vier antes. É isso que troca novembro por dezembro na hora, sem
       recarregar.
     - buscar(): relê o JSON a cada 5 min e ao voltar pra aba, pra quem
       está com a página aberta ver a mudança que o dono subiu.
     Com a aba escondida, nenhum timer fica ligado.
     ====================================================================== */

  var timerAgenda = 0, timerBusca = 0, ultimaBusca = 0, buscando = false;
  var assinatura = '';

  function usar(d) {
    dados = d;
    assinatura = JSON.stringify(d);
    preparar(d);
  }

  function reavaliar(animar) {
    var agora = Date.now();
    var camp = vigente(agora);
    campAtual = camp;
    pintarPrecos(camp, animar);
    pintarSelos(camp, agora, animar);
    pintarUpsell(camp);
    pintarAtendimento(camp, agora, animar);
    pintarVagas(agora);
    pintarRevisado();
    atualizarRelogios(agora);
  }

  function agendar() {
    clearTimeout(timerAgenda);
    timerAgenda = 0;
    if (document.hidden) return;
    var agora = Date.now();
    var alvo = Math.min(agora - (agora % 60000) + 60000, proximaVirada(agora));
    timerAgenda = setTimeout(function () {
      reavaliar(true);
      agendar();
    }, alvo - agora + 20);
  }

  function agendarBusca(espera) {
    clearTimeout(timerBusca);
    timerBusca = 0;
    if (!document.hidden) timerBusca = setTimeout(buscar, Math.max(0, espera));
  }

  function buscar() {
    // Do disco (file://) o navegador nem deixa buscar: fica a RESERVA.
    if (!window.fetch || location.protocol === 'file:') return;
    if (buscando) return;
    buscando = true;
    ultimaBusca = Date.now();

    fetch(URL_DADOS + (URL_DADOS.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (texto) {
        var novo = JSON.parse(texto);
        if (!valido(novo)) throw new Error('formato');
        gravarLocal(texto);
        if (JSON.stringify(novo) === assinatura) return;
        usar(novo);
        reavaliar(true);
        agendar();
      })
      .catch(function () { /* fica com o que já tem na tela */ })
      .then(function () {
        buscando = false;
        agendarBusca(BUSCA_A_CADA);
      });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearTimeout(timerAgenda);
      clearTimeout(timerBusca);
      timerAgenda = timerBusca = 0;
      ajustarBatida();
      return;
    }
    reavaliar(true);
    agendar();
    ajustarBatida();
    var passou = Date.now() - ultimaBusca;
    if (passou >= BUSCA_MINIMA) buscar();
    else agendarBusca(BUSCA_A_CADA - passou);
  });

  // Voltou pelo "voltar" do navegador (página guardada inteira na memória).
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { reavaliar(true); agendar(); }
  });

  usar(dados);
  reavaliar(false);
  agendar();
  buscar();
})();

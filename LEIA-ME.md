# Site da Velo

Site estático, sem build. É só subir a pasta inteira num servidor (Hostinger,
Netlify, Vercel — qualquer um serve). Para ver localmente, abra `index.html`
no navegador.

```
velo/
├── index.html
├── planos.html                 (planos e preços, página inteira)
├── favicon.svg
├── css/style.css
├── js/
│   ├── main.js                 (o mar, scroll, menu — nas duas páginas)
│   ├── shader.js               (a água viva em WebGL das faixas escuras)
│   ├── vivo.js                 (parallax, inclinação 3D, contadores)
│   └── planos.js               (relógio da promoção e upsell)
└── images/
    ├── mascote-novo.png        (mascote atual, recortado)
    ├── mascote-apoiado.png     (mascote cortado na linha do braço, pra
    │                            apoiar na borda de cima dos cards)
    ├── mascote-velo.png        (o antigo, tubarão-leopardo — não usado)
    ├── fundo-raso.jpg          (praia    → card Recife)
    ├── fundo-correnteza.jpg    (surf     → card Alto mar)
    ├── fundo-alto-mar.jpg      (tubarão  → card Abissal)
    ├── barbatana.svg           (só a barbatana, usa currentColor)
    └── velo-logo-original.svg  (arquivo que você mandou, guardado)
```

Os cinco `WhatsApp Image ....jpeg` na raiz são os originais de onde saíram os
recortes acima. Não são usados pelo site — se for publicar, pode apagar ou
mover pra fora da pasta, senão vão junto pro servidor.

## Trocar antes de publicar

Estes valores estão como espaço reservado no `index.html`:

| O quê | Onde procurar | Está como |
|---|---|---|
| WhatsApp | `wa.me/5567000000000` (3 lugares) | número fictício |
| E-mail | `contato@velo.com.br` (2 lugares) | domínio fictício |
| Instagram | `https://instagram.com/` (2 lugares) e o texto `@velo` | link vazio |
| Domínio | `og:image` no `<head>` | caminho relativo |

Os números do hero (`2 sites no ar`, `24h pra responder`, `0 fidelidade`)
e os itens de cada plano estão no `index.html` em texto puro — é só editar.

## Sobre os planos

A home tem só uma **prévia**: três cards de site cortados por um fadeout
(`.planos--teaser`) e o botão "Veja os planos", que leva pro `planos.html`.
Todo o resto — manutenção, mídia e avulsos — mora lá, pra não afogar quem
está só passando os olhos.

O `planos.html` tem três blocos, com peso visual diferente de propósito:

| Bloco | Cobrança | Planos | Valores |
|---|---|---|---|
| 01 Sites | criação (1x) + manutenção (mês) | Recife / Alto mar / Abissal | 300+80 / 550+150 / 1.500+300 |
| 02 Mídia | por mês | Presença / Ataque / Dominância | 350 / 650 / 850 (metade) |
| 03 Avulsos | uma vez | — | 18 a 2.200 |

**Site e manutenção são o mesmo plano.** Quem faz o Recife paga a manutenção
do Recife, e por aí vai — os dois valores aparecem juntos no card
(`.plano__duplo`: a criação em cima, a manutenção embaixo). Não existe mais um
bloco separado de mensalidade; o que cada manutenção inclui está no último item
da lista de cada card (`.plano__mens`) e no bloco `.pagto`.

**Nenhum preço é tabela.** O bloco `.pl-negocia`, logo abaixo dos cards, diz
isso com todas as letras, e as manutenções são todas "a partir de". Se mudar
essa política, mude o texto de lá junto.

Pra mudar um preço, é texto puro no HTML: `<span class="plano__valor">` nos
cards de site e mídia e `<p class="avulso__preco">` nos avulsos.

Os cards escuros vêm em dois sabores: `.plano--mar` (site, com foto de fundo
escolhida pelo `data-fundo`) e `.plano--noite` (mídia, sem foto — é o próprio
fundo escuro da seção que aparece, com um fio no degradê do Instagram no topo).
O que os dois têm em comum está em `.plano--escuro`.

### O relógio da promoção

A data de fim está numa constante só, no topo do `js/planos.js`:

```js
var FIM_DA_PROMO = new Date(2026, 7, 31, 23, 59, 59);   // mês 7 = agosto
```

São **duas tarjas com o mesmo prazo**: uma na criação dos sites
(`.promo--claro`, versão clara) e outra na mídia. As duas leem a mesma
constante e usam `data-rel="d|h|m|s"` nos dígitos — é assim que o script acha
os dois relógios de uma vez.

É uma data **de verdade**: quando ela passa, os relógios e as tarjas somem
sozinhos, todo preço que tiver um `.plano__antes` volta pro cheio (o próprio
texto riscado é a fonte da verdade) e as ofertas de upsell trocam pelo texto do
atributo `data-fim`. Pra esticar a promoção, muda a data e pronto.

O `index.html` também carrega o `planos.js` — sem ele a prévia da home ficaria
com o preço promocional pra sempre depois que a promoção acabasse.

Resista à ideia de fazer o relógio reiniciar a cada visita: contador que
nunca chega ao fim é propaganda enganosa (CDC art. 37) e queima a confiança
justamente do cliente pequeno que a Velo quer atender.

### O upsell

Cada "Tenho interesse" abre um bloco `.upsell` com a oferta do plano de cima
("por mais R$ X você leva o Y"), com desconto de ~15% do valor do plano menor.
Só uma oferta fica aberta por vez, e `Esc` fecha. Pra mudar uma oferta, é o
`<p class="upsell__linha">` dentro de cada card — e, nos cards de mídia,
também o `data-fim` correspondente.

### O mascote apoiado

O `mascote-apoiado.png` foi cortado exatamente na linha do braço, então ele
encosta na borda de cima do card. Quem posiciona é `.planos__mascote`
(`bottom:100%` + `margin-bottom:-10px`). Some abaixo de 760px de largura.

## Trabalhos

As duas miniaturas são prints de verdade (`images/trabalho-*.jpg`) dentro de
uma moldura de navegador falsa. Pra trocar, basta substituir o arquivo: o
enquadramento (`aspect-ratio: 16/11`) e o recorte já estão prontos. A foto é
desenhada em `scale(1.09)` de propósito — a sobra é o que permite ela
escorregar dentro da moldura conforme a página rola, e a `.tela__barra` sobe
um `z-index` pra a foto passar por baixo dela em vez de tampar a URL.

## O mar

A onda fixa no rodapé da tela e a barbatana que atravessa a página conforme
você rola estão em `js/main.js`, no bloco `1. O MAR`.

- **Camadas.** O mar são dois `<div class="mar">` empilhados: `.mar--fundo`
  (z 40, as duas ondas de trás) e `.mar--frente` (z 50, a onda da frente, a
  crista, a espuma e a barbatana). A boia do WhatsApp fica no z 45, entre as
  duas — é isso que a deixa meio afundada. As duas camadas compartilham o
  mesmo `viewBox`, montado no `medir()`.
- **Sentido.** No topo da página a barbatana está na esquerda e nada para a
  direita conforme você desce; subindo, ela **vira de lado** e volta. Quem
  manda nisso é a variável `sentido` (`+1` direita, `-1` esquerda), atualizada
  por um listener de scroll com folga de 2px pra não piscar com tremor de
  trackpad. Ela decide o lado pra onde o rastro sai e o espelhamento do
  desenho — que é `scale(-sentido * s, s)`, com o sinal invertido porque o
  path original da barbatana já aponta pra esquerda.
- **Fim do percurso.** A `faixaUtil()` desconta a largura da boia do WhatsApp,
  então no fim da página a barbatana para um pouco antes da borda direita em
  vez de passar por cima do botão.
- **Arrastar.** Dá pra puxar a barbatana com o mouse ou o dedo pra rolar a
  página: o `#finPega` é um círculo invisível que acompanha a barbatana e
  converte o movimento horizontal em `scrollTo` — puxar pra direita desce.
  Enquanto o gesto está ativo,
  o `<html>` ganha `.is-puxando-mar`, que desliga o `scroll-behavior:smooth`
  (senão o suave briga com o arrasto) e a seleção de texto.

Os ajustes ficam em:

- `camadas` — base, amplitude e velocidade de cada uma das 3 ondas
- `--mar-h` no `style.css` — altura do mar (104px no desktop, 78px no celular)
- `alturaFin` no `desenhar()` — tamanho da barbatana

Com `prefers-reduced-motion: reduce` ligado no sistema, a onda para de ondular
mas a barbatana continua acompanhando o scroll.

## O WhatsApp boiando

O `.zap-boia` é um link fixo no canto inferior direito, no `z-index` 45 — entre
as duas camadas do mar, de forma que a onda da frente passa por cima do terço
de baixo dele. O `padding-bottom` é maior que o de cima de propósito: é o
pedaço que fica submerso, então o rótulo continua acima da linha d'água. A
animação `boia` sobe/desce com um gingado curto (a água já ondula por cima).
Abaixo de 560px o texto some e sobra só o ícone. Está nas duas páginas, logo
antes dos `<script>`.

## A água viva (WebGL)

As partes escuras do site — o hero da home, a abertura dos planos, a chamada
final, o rodapé e os planos de Instagram — têm um shader de fumaça rodando por
trás do texto. É WebGL1 puro, sem biblioteca nenhuma, em `js/shader.js`.

O miolo (serviços, planos de site, trabalhos, avulsos) continua claro como
sempre foi. A página abre e fecha na água, e o meio é papel.

**Como ligar numa seção nova:** basta pôr `data-vivo` no elemento. O script
cria o canvas sozinho, empurra o conteúdo pra cima dele e começa a desenhar.
Ajustes opcionais, todos por atributo:

| Atributo | Padrão | O que faz |
|---|---|---|
| `data-vivo-velocidade` | `0.97` | o quão rápido a fumaça anda |
| `data-vivo-escala` | `1.72` | zoom: maior = desenho mais fino |
| `data-vivo-semente` | `635` | muda o desenho sem mudar o resto |
| `data-vivo-resolucao` | `0.6` | fração da tela em que ele desenha |
| `data-vivo-deriva` | `0.55` | quanto a rolagem empurra a fumaça |

Detalhes que importam se for mexer:

- **Custo.** O canvas é renderizado a 60% do tamanho real e o `devicePixelRatio`
  é limitado a 2. Fumaça é tudo gradiente macio, então ninguém enxerga a
  diferença — e economiza uns 60% de fragmento. O rodapé roda ainda menor
  (`0.45`), porque é só um eco.
- **Quando não desenha.** Um `IntersectionObserver` desliga o `requestAnimation
  Frame` de quem está fora da tela, e a aba escondida derruba o laço inteiro.
  Todas as seções compartilham um único laço.
- **Legibilidade.** O canvas roda em opacidade cheia; quem protege a leitura é
  o véu do `.vivo::after`. No hero e na chamada ele é **lateral**: fecha na
  esquerda, onde mora o texto, e abre na direita, onde está o mascote — assim
  a água aparece limpa em vez de apagada por inteiro. É o mesmo truque de
  vídeo de fundo. Abaixo de 900px o mascote sai de cena e o texto ocupa a
  largura toda, então o véu volta a ser chapado. Se for mexer nele, confira o
  texto por cima: os fiapos de espuma da paleta são quase brancos.
- **Texto claro.** Água em opacidade cheia não convive com o texto navy do
  site, então os dois topos têm o texto invertido — está tudo na seção 18 do
  `style.css`, num bloco só. Pra voltar ao hero claro, apague a seção 18 e o
  `data-vivo` das duas aberturas.
- **Cabeçalho.** No topo da página ele é sólido `#04182C`, a mesma primeira
  parada do gradiente do hero, e clareia quando ganha `.is-preso`. Sólido e
  não translúcido de propósito: o cabeçalho é sticky, fica *acima* do hero, e
  não tem água atrás pra o `backdrop-filter` borrar — translúcido ali pegava a
  bruma do body e virava uma barra cinza.
- **Sem WebGL.** Se o navegador não der contexto, o canvas é removido e a
  faixa fica no gradiente navy de antes. Nada quebra.
- **Movimento reduzido.** Desenha um quadro parado e não anima mais.

## Movimento

O `js/vivo.js` é a camada de vida. Se ele não carregar, o site continua
inteiro e legível — nada ali é essencial.

- **Reveal.** Todo `.reveal` entra de baixo, desfocado, e o `.is-vista` (posto
  pelo `main.js`) traz ele. Assim que a transição acaba o `.is-limpo` tira o
  `filter` de vez: `filter` deixa uma camada de composição ligada pra sempre e
  amolece o texto na GPU.
- **Títulos.** Os `h2` (e o `h1` da página de planos) são descobertos de baixo
  pra cima por uma **máscara**, não por `clip-path`. É de propósito: `clip-path`
  zera a área do elemento e o `IntersectionObserver` passa a enxergar o título
  como fora da tela — ele nunca recebe `.is-vista` e o site fica sem títulos.
  Máscara é efeito de pintura e não mexe na geometria que o observador mede.
- **Parallax.** `data-desliza="-0.13"` faz o elemento andar mais devagar que a
  página (`data-desliza-max` limita em px). O valor é escrito numa variável
  CSS `--px` em vez de num `transform` direto — assim ele não briga com o
  `transform` de hover nem com a animação de boia do mascote.
- **Inclinação 3D.** `data-inclina="4"` (graus) faz o card inclinar seguindo o
  ponteiro, com uma luz junto. Só liga em quem tem mouse de verdade
  (`hover:hover` + `pointer:fine`): no celular seria transform morto ocupando
  camada de composição. A luz do card passa **por baixo** do texto — por cima
  ela apaga a leitura do parágrafo.
- **Contadores.** `data-conta="24" data-sufixo="h"` num `<strong>` faz o número
  contar do zero quando entra na tela.
- **Barra de progresso.** Criada pelo próprio script, no topo de tudo.

## Fontes

Bricolage Grotesque (títulos), Instrument Sans (texto) e DM Mono (rótulos
pequenos), carregadas do Google Fonts. Se precisar funcionar offline, baixe os
`.woff2` e troque o `<link>` por um `@font-face` local.

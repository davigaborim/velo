# Site da Velo

Site estático, sem build. É só subir os arquivos num servidor (Hostinger,
Netlify, Vercel — qualquer um serve); tem uma pasta `site-hostinger/` já
separada pra isso, ver "Publicar na Hostinger" abaixo. Para ver localmente,
abra `index.html` no navegador.

```
velo/
├── index.html
├── planos.html                 (planos e preços, página inteira)
├── 404.html                    (endereço errado — o tubarão comeu a página)
├── .htaccess                   (liga o 404 no Apache/Hostinger + cache)
├── favicon.svg
├── css/style.css
├── dados/
│   └── campanhas.json          (promoções com data, horário de atendimento)
├── js/
│   ├── main.js                 (o mar, scroll, menu — nas duas páginas)
│   ├── shader.js               (a água viva em WebGL das faixas escuras)
│   ├── vivo.js                 (títulos em palavras, odômetro, onda e ímã dos botões)
│   ├── campanhas.js            (lê o campanhas.json e aplica — nas duas páginas)
│   └── planos.js               (abre e fecha o upsell)
├── fonts/                      (Bricolage, Instrument Sans e DM Mono em woff2)
└── images/                     (cada foto tem um .avif do lado — ver "Imagens em AVIF")
    ├── mascote-novo.png        (mascote atual, recortado)
    ├── mascote-apoiado.png     (mascote cortado na linha do braço, pra
    │                            apoiar na borda de cima dos cards)
    ├── fundo-raso.jpg          (praia    → card Recife)
    ├── fundo-correnteza.jpg    (surf     → card Alto mar)
    ├── fundo-alto-mar.jpg      (tubarão  → card Abissal)
    ├── barbatana.svg           (só a barbatana, usa currentColor)
    └── velo-logo-original.svg  (arquivo que você mandou, guardado)
```

Os cinco `WhatsApp Image ....jpeg` na raiz são os originais de onde saíram os
recortes acima. Não são usados pelo site — se for publicar, pode apagar ou
mover pra fora da pasta, senão vão junto pro servidor.

## Publicar na Hostinger

A pasta `site-hostinger/` é o site pronto pra subir: as mesmas páginas, sem o
`LEIA-ME.md`, sem os originais de WhatsApp e sem as três imagens que o site
não usa (`velo-logo-original.svg`, `barbatana.svg`).

No hPanel, o caminho é **Gerenciador de arquivos → `public_html`** e arrastar
pra lá **o conteúdo** da pasta — os arquivos e as pastas `css/`, `dados/`,
`js/`, `fonts/` e `images/` soltos, não a pasta `site-hostinger` inteira. Se a pasta for junto,
o site cai em `seudominio.com/site-hostinger/` e os caminhos do `404.html`,
que começam na raiz, quebram.

Dois detalhes que costumam morder:

- o `.htaccess` começa com ponto, e programa de FTP costuma escondê-lo. Se
  ele não subir, o 404 do tubarão não aparece — o visitante vê a tela cinza
  padrão do servidor;
- essa pasta não está no Git (`site-hostinger/` está no `.gitignore`). Ela é
  cópia do que já está versionado aqui do lado, então é só refazer quando for
  publicar de novo.

## Contatos (e o que ainda é espaço reservado)

Os contatos reais já estão nas três páginas:

| O quê | Está como | Onde |
|---|---|---|
| WhatsApp | `wa.me/5567991914699` — (67) 99191-4699 | 20 links (botões dos planos, rodapé, boia) |
| E-mail | `naorespondavelo@gmail.com` | 9 lugares |
| Instagram | `instagram.com/velocg` — `@velocg` | 5 lugares |

Se o número, o e-mail ou o @ mudarem, é procurar e trocar tudo — eles estão
escritos direto no HTML, sem variável.

Ainda **falta** um: `og:url` e `og:image` no `<head>` do `index.html` e do
`planos.html` apontam pro endereço antigo do GitHub Pages
(`davigaborim.github.io/velo/`). São eles que montam a miniatura quando
alguém cola o link no WhatsApp ou no Instagram — assim que o domínio da
Hostinger estiver de pé, troque os dois pelo endereço novo.

Os números do hero (`2 sites no ar`, `24h pra responder`, `0 fidelidade`)
e os itens de cada plano estão no `index.html` em texto puro — é só editar.

## A página de erro

`404.html` reaproveita as classes do hero (`.hero`, `.hero__grid`,
`.hero__texto`, `.hero__mascote`) — mesma água, mesma grade, mesmos botões.
O que ela tem de próprio é o `.erro__num`: o "404" em ouro com uma mordida
arrancada do topo. A mordida são três círculos vazados numa máscara CSS
somados com `mask-composite:intersect`; em navegador que não suportar, as
camadas se unem, a mordida some e o número aparece inteiro — perde a piada,
não quebra a página. Os raios estão em `em` pra mordida encolher junto com o
número no celular.

Os caminhos do `404.html` começam na raiz (`/css/style.css`, `/images/...`)
de propósito: essa página aparece em qualquer endereço errado, inclusive
`seudominio.com/uma/pasta/funda/`, e caminho relativo quebraria o CSS lá.
**Isso vale para site publicado na raiz do domínio.** Se um dia ele for pra
uma subpasta, esses caminhos precisam do prefixo da subpasta.

Quem liga o arquivo ao servidor é o `ErrorDocument 404 /404.html` do
`.htaccess`. A Hostinger lê o `.htaccess` sozinha — é só o arquivo estar na
mesma pasta do `index.html`. Cuidado ao subir por FTP: arquivo que começa com
ponto costuma ficar escondido, e alguns programas não mostram por padrão.

## O rodapé é areia

O rodapé e a chamada de contato logo acima dele eram o mesmo bloco: navy com
a mesma água em WebGL e a mesma lapela de onda, um colado no outro. Agora a
página termina chegando na praia — o rodapé perdeu o `data-vivo` e virou
areia, e o mar fixo lá embaixo passou a lamber areia em vez de mais mar.

A areia é só cor e bolinha (seção 10 do CSS), sem imagem nenhuma:

1. **gradiente base** — molhada no alto (onde a onda acabou de bater) e seca
   embaixo;
2. **grãos** — três camadas de bolinha em `radial-gradient`, duas claras e
   uma escura, cada uma num ladrilho de tamanho diferente (26×22, 33×29,
   19×37). Os tamanhos não são múltiplos um do outro de propósito: assim as
   três nunca coincidem e o olho não acha a repetição. A bolinha vai da cor
   ao transparente em ~2px — com borda dura ela vira papel de parede,
   desbotada vira grão.

Como não tem imagem, dá pra mudar a cor toda mexendo nas variáveis
`--areia-*` lá no `:root`. E dá pra tirar as bolinhas inteiras: é só apagar
as três primeiras linhas do `background` e deixar só o `linear-gradient`.

> Já teve ondulação de maré aqui — linhas passadas num `feDisplacementMap`,
> com sombra e luz pra simular relevo — e ruído de textura por cima. Ficou
> com cara de textura de jogo antigo: detalhe demais numa faixa que é só
> rodapé. Se um dia bater vontade de tentar de novo, o histórico do git tem.

## O mascote no celular

No desktop o hero é grade de duas colunas: texto na esquerda, tubarão na
direita. No celular ele ficava **em cima** do texto e comia a primeira tela
inteira — o título só começava depois de 240px de tubarão.

Agora a grade vira bloco abaixo de 900px e o mascote flutua (`float:right`)
pequeno ao lado do título, com o texto contornando ele. Por isso o
`.hero__mascote` vem **antes** do `.hero__texto` no HTML: float só empurra o
que vem depois dele na marcação. No desktop o `.hero__texto{order:-1}`
devolve o texto pra primeira coluna.

Detalhe que amarra tudo: o `.grifo` ("na crista da onda") é `nowrap`, então o
título tem um tamanho menor no celular pra caber na coluna que sobra ao lado
do bicho. Se aumentar essa fonte, confira se a linha não estoura a tela.

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

Pra mudar um preço **cheio**, é texto puro no HTML: `<span class="plano__valor">`
nos cards de site e mídia e `<p class="avulso__preco">` nos avulsos. Os preços
**promocionais** não ficam no HTML — moram no calendário de campanhas, logo
abaixo.

Os cards escuros vêm em dois sabores: `.plano--mar` (site, com foto de fundo
escolhida pelo `data-fundo`) e `.plano--noite` (mídia, sem foto — é o próprio
fundo escuro da seção que aparece, com um fio no degradê do Instagram no topo).
O que os dois têm em comum está em `.plano--escuro`.

### O calendário de campanhas

Promoção, selo, oferta de upsell e horário de atendimento estão num arquivo
só: **`dados/campanhas.json`**. É ele que o dono edita; o `js/campanhas.js`
lê e aplica nas duas páginas. Quem estiver com o site aberto vê a mudança
em até 5 minutos, sem recarregar (o script relê o arquivo a cada 5 min e
sempre que a aba volta a ficar visível).

Cada campanha tem data de início e de fim **de verdade**, no fuso de Campo
Grande (`-04:00`):

```json
{
  "id": "novembro-2026",
  "inicio": "2026-11-01T00:00:00-04:00",
  "fim": "2026-11-30T23:59:59-04:00",
  "selo": "<b>{desconto}</b> em novembro, até {fim}",
  "saudacao": "",
  "precos": { "recife": 300, "alto-mar": 550, "abissal": 1500,
              "presenca": 350, "ataque": 650, "dominancia": 850 },
  "upsell": {
    "recife": { "texto": "Por mais <strong>R$ 200</strong> ...",
                "zap": "Oi, Velo! Quero o Alto mar por R$ 500 de criação." }
  }
}
```

- **`precos`** — só o valor promocional, em número (`1500`, sem "R$" nem
  ponto). O cheio é o que está no HTML. Plano que não aparece aqui fica no
  preço cheio; promocional maior ou igual ao cheio é ignorado.
- **`selo`** — o texto da tarja ao lado do título. `{desconto}` vira "50%
  off" (calculado dos preços: se os planos da seção tiverem descontos
  diferentes, vira "até X% off") e `{fim}` vira a data de fim ("30/11"). Pode
  escrever o desconto à mão com `"desconto": "R$ 300 off"`.
- **`saudacao`** — opcional, aparece antes do status de atendimento
  ("Boas festas! Respondendo agora no WhatsApp").
- **`upsell`** — a oferta que abre no "Tenho interesse" enquanto a campanha
  vale: `texto` (pode ter `<strong>` e `<b>`) e `zap` (a mensagem que já vai
  escrita no WhatsApp). Os números do upsell são texto: se mudar um preço,
  confira a oferta junto. Sem campanha, vale a oferta que está no HTML.
- **`fim`** vale até o fim daquele segundo: `23:59:59` cobre o dia todo, e
  a campanha seguinte, começando `00:00:00`, assume sem um segundo de preço
  cheio no meio. Se duas se sobrepõem, vale a que começou por último.

O que o visitante vê, tudo saído da data:

| Quando | Selo |
|---|---|
| campanha valendo | o `selo` da campanha, tarja clara |
| faltam menos de 72h | **Últimos dias** · 50% off até 30/11 (tarja amarela cheia) |
| o fim é amanhã | **Termina amanhã** · 50% off até 23h59 |
| faltam menos de 24h | **Termina hoje** · 50% off · faltam 05:12:33 (relógio de segundos) |
| nenhuma campanha | selo some, preços voltam pro cheio, upsell volta pro do HTML |

Quando uma campanha vence, a próxima do calendário assume na hora. O
relógio de segundos só bate com ele na tela e a aba visível. **Pra criar a
próxima promoção é só acrescentar outra campanha na lista** — não precisa
apagar as antigas (as vencidas são ignoradas), mas dá pra limpar de vez em
quando.

**Sem JavaScript, o HTML mostra os preços cheios e esconde os selos.** De
propósito: preço cheio vale em qualquer dia. Se o HTML trouxesse o
promocional e o script falhasse, a promoção vencida ficaria no ar — foi o
que aconteceu com a de agosto, que passou de 31/08 até novembro sem ninguém
mexer. O riscado "de R$ X" e o selo continuam ocupando o lugar mesmo
escondidos, pra nada pular quando o script liga a campanha.

Resista à ideia de fazer o relógio reiniciar a cada visita, de inventar
"visitantes online" ou "fulano acabou de comprar": contador que nunca chega
ao fim é propaganda enganosa (CDC art. 37) e queima a confiança justamente
do cliente pequeno que a Velo quer atender. Tudo que o site mostra de "vivo"
sai de um dado real.

#### Horário de atendimento

No mesmo JSON:

```json
"atendimento": {
  "seg": "00:00-24:00", "ter": "00:00-24:00", "qua": "00:00-24:00",
  "qui": "00:00-24:00", "sex": "00:00-24:00", "sab": "00:00-24:00", "dom": "00:00-24:00",
  "feriados": []
}
```

Hoje o atendimento é 24 horas, todo dia, e a linha mostra "Respondendo no
WhatsApp 24 horas por dia, todo dia". Pra voltar a ter horário, troque
cada dia por algo como `"08:00-18:00"` (e o sábado por `"08:00-12:00"`).

Dia vazio (`""`) é fechado; dia em `feriados` também. Sempre pela hora de
Campo Grande, esteja o visitante onde estiver. A linha embaixo do botão de
WhatsApp da chamada final mostra "Respondendo agora no WhatsApp, até as 18h"
ou "Fora do horário — respondemos amanhã a partir das 8h", e a boia do
WhatsApp ganha um pontinho branco no horário de atendimento.

#### Vagas do mês e "revisado em"

- `"vagas": { "ligado": false, "mes": "2026-11", "quantas": 3 }` — com
  `ligado: true`, aparece "3 vagas abertas para começar em novembro" ao lado
  do selo dos sites. Só no mês escrito em `mes`: número esquecido some
  sozinho no mês seguinte. **Só ligue com número de verdade.**
- `"atualizado_em": "2026-11-04"` — aparece no rodapé como "preços revisados
  em 04/11/2026". Troque sempre que mexer no arquivo.

#### Cuidados ao editar

- JSON não aceita vírgula sobrando no fim da lista nem comentário. Se o
  arquivo quebrar, o site não cai: usa a última versão boa que o navegador
  guardou ou a cópia de reserva (`RESERVA`, no topo do `js/campanhas.js`).
  Dá pra conferir o arquivo colando em qualquer validador de JSON.
- A `RESERVA` só entra quando o JSON não chega (servidor fora, ou a página
  aberta direto do disco, que não deixa ler arquivo). Quando der, copie o
  JSON novo pra lá também.
- Os ganchos no HTML são atributos: `data-preco="recife"` no valor,
  `data-preco-antes="recife"` no riscado, `data-selo` na tarja,
  `data-upsell="recife"` na caixa de oferta (e `data-upsell-zap` no botão),
  `data-atendimento` na linha de status, `data-vagas` e `data-atualizado`.
  Card novo precisa deles pra entrar na campanha. Os ids dos planos são
  `recife`, `alto-mar`, `abissal`, `presenca`, `ataque` e `dominancia`.
- Os títulos da home ("Site a partir de R$ 300") seguem o preço do Recife e
  da Presença pelo mesmo `data-preco`. A `<meta name="description">` do
  `index.html` não muda sozinha — ela fala em "a partir de R$ 300".

### O upsell

Cada "Tenho interesse" abre um bloco `.upsell` com a oferta do plano de cima
("por mais R$ X você leva o Y"), com desconto de ~15% do valor do plano menor.
Só uma oferta fica aberta por vez, e `Esc` fecha. O `<p class="upsell__linha">`
de cada card traz a oferta **sem campanha**; enquanto uma campanha vale, o
texto e a mensagem do botão vêm do `upsell` dela no `campanhas.json`.

### O mascote apoiado

O `mascote-apoiado.png` foi cortado exatamente na linha do braço, então ele
encosta na borda de cima do card. Quem posiciona é `.planos__mascote`
(`bottom:100%` + `margin-bottom:-10px`). Some abaixo de 760px de largura.

## Trabalhos

As miniaturas são prints de verdade (`images/trabalho-*.jpg`) dentro de
uma moldura de navegador falsa. Pra trocar, basta substituir o arquivo: o
enquadramento (`aspect-ratio: 16/11`) e o recorte já estão prontos. A foto é
desenhada em `scale:1.09` de propósito — a sobra é o que deixa a página
"rolar" dentro da janela no hover — e a `.tela__barra` sobe um `z-index` pra
a foto (e a persiana, ver "Movimento") passar por baixo dela em vez de tampar
a URL.

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
- **Sem placa de vídeo.** Se o navegador desenha o WebGL no processador
  (SwiftShader, llvmpipe, "Basic Render Driver" — aceleração desligada,
  driver bloqueado, máquina virtual), a fumaça vira um quadro parado, como no
  movimento reduzido. Animada ali, ela ocupava ~4 núcleos de CPU e travava a
  página (medido em 04/11). Pra saber se um computador cai nisso: abrir
  `chrome://gpu` e ver se "WebGL" diz "Software only".
- **Placa fraca.** Um governador no `shader.js` mede os quadros: se atrasam
  por 2 s seguidos, a fumaça desce de degrau (70% e 50% da resolução, 15
  quadros/s, parada). Nunca sobe de volta. Em máquina boa não faz nada.
- **Só nasce perto da tela.** O canvas (e o contexto WebGL) de cada faixa só
  é criado quando ela chega a uma tela de distância; o shader compila sem
  travar a página onde houver `KHR_parallel_shader_compile`.

## Movimento

Até 04/11 quase todo efeito era o mesmo gesto — alguma coisa andando no eixo
Y junto com a rolagem — e todo card tinha a mesma inclinação 3D no hover. O
dono enjoou. Agora cada parte da página mexe de um jeito próprio, e todos
falam a mesma língua: **as coisas saem da água**. Parágrafo de ler continua
parado.

| Onde | O que faz | Por quê |
|---|---|---|
| Títulos (`h1` e `h2`) | as palavras sobem uma a uma por uma linha d'água, com um gingado — o `h1` ao abrir, cada `h2` quando passa do mar fixo lá embaixo | é a assinatura do site: a marca "na crista da onda" |
| Hero (home, planos, 404) | ao abrir, o tubarão salta pra fora da água, os botões estouram como boias e o balão pipoca; rolando, o tubarão **mergulha** e a onda da seção de baixo incha por cima do hero (ressaca) | o hero chega e vai embora pela água, sem o texto fugir da tela |
| Números do hero e o 404 | rolam como **odômetro** até o valor | número que conta é número que "vale" |
| Serviços | os cards chegam **alagados** (água clara, dá pra ler por baixo) e a maré vaza; nas 3 colunas do desktop ela baixa em tempos diferentes | serviço é o raso: água que vai embora e mostra o que tem |
| Planos de site | o card **emerge** por uma superfície parada na tela (a ~24% do pé, acima do mar fixo). A crista tem a cor da profundidade — Recife azul-claro, Alto mar azul, Abissal navy — e quanto mais fundo o plano, de mais longe ele sobe. A fita "Recomendado" boia na superfície antes | Recife → Alto mar → Abissal é profundidade de verdade |
| Planos de Instagram | um reflexo de luz atravessa o vidro do card | o card de mídia é vidro escuro, não foto |
| Preços (planos e avulsos) | odômetro quando aparecem | preço é o que a pessoa veio ver |
| Trabalhos | a **persiana** da janela de navegador sobe e a foto volta do zoom ("abrir a janela") | é um site de verdade atrás de uma janela |
| Chamada final | a **barbatana** cruza a onda que separa a seção enquanto ela entra; o mascote dá um salto | é o único lugar em que o tubarão aparece inteiro de novo |
| Avulsos | a linha de maré de cada item chega rolando da esquerda | lista é lista: só a linha mexe |

**Hover, por tipo de coisa** (antes era a mesma inclinação em tudo):

- card de serviço: **alaga** — a água sobe por dentro, a crista balança de
  lado e o ícone vira boia;
- card de plano: os checks **acendem em sequência** e a fita boia;
- print de trabalho: a janela **liga** (as três bolinhas ganham cor) e a
  página desce um pouco, como quem rola o site;
- botão: uma **onda** abre de onde o ponteiro entrou (ou de onde o dedo
  tocou) e os botões grandes têm **ímã** — puxam alguns pixels pro mouse;
- link: o sublinhado vira uma onda correndo;
- avulso: a linha de maré escurece;
- logo: a barbatana dá um mergulho curto.

### Como é feito (e as regras pra não estragar a nota 98)

- **Rolagem é CSS** (`animation-timeline`, seção 12 do `style.css`): quem
  anima é o compositor, sem JS lendo layout a cada quadro.
- **Os títulos não são amarrados à rolagem**, de propósito: são 35 palavras
  só na home, e 35 animações presas à rolagem custavam ~1 quadro por segundo
  (medido em 04/11). Viraram animação de tempo, disparada uma vez quando o
  título passa do mar: cada palavra só vira camada durante 0,7 s. Bônus: o
  Safari também vê.
- **Só `translate`/`rotate`/`scale`** na rolagem. `clip-path` e `mask`
  animados repintam a cada quadro (medido em 04/11: 467 pinturas em 60
  quadros contra 2 com translate). Por isso toda "máscara" aqui é uma
  **janela parada** (`clip-path` ou `overflow:clip` fixos) com o conteúdo
  andando dentro dela: a palavra sobe dentro do `.pal`, a água desce dentro
  do `.plano__agua`, a persiana sobe dentro da moldura.
- **Sem opacidade amarrada à rolagem** (custo de GPU medido em 21/10).
- **Nada some sem a animação.** Tudo o que esconde alguma coisa (a água dos
  cards, a persiana, as palavras abaixo da linha) só existe dentro de
  `@supports (animation-timeline:view())` e de
  `prefers-reduced-motion:no-preference`. **Safari e Firefox** (que ainda não
  têm `animation-timeline`) veem a página inteira, parada e no lugar — com a
  chegada do hero, os títulos, o odômetro e os hovers, que não dependem dela.
  Com movimento reduzido, tudo parado.
- **Água pintada, não mascarada.** As camadas grandes que andam (a superfície
  dos planos, a maré dos serviços) têm a onda desenhada num SVG com cor, sem
  `mask`; a parte lisa da superfície é cor chapada, que o navegador compõe
  sem rasterizar. Com máscara, só a superfície dos planos custava ~0,5 s de
  rasterização numa rolagem da home.
- **Linha do tempo com nome** quando o pseudo-elemento mora dentro de algo
  com `overflow:hidden` (os cards de serviço): `view()` ali mediria a rolagem
  do próprio card, que nunca rola, e a maré ficaria parada no meio.
- **Comentário no CSS custa**: o `style.css` segura a primeira pintura, e
  ~3 KB de comentário a mais tiravam um ponto do Lighthouse. Explicação longa
  mora aqui.

O `js/vivo.js` faz o que o CSS não sabe:

- **Títulos em palavras.** Os `h2` são partidos em
  `<span class="pal"><span style="--i:n">palavra</span></span>` depois do
  `load`, e só os que ainda não estão na tela (senão sumiriam na sua frente);
  um `IntersectionObserver` põe `.is-emersa` quando o título passa de ~16% do
  pé da tela, e as palavras sobem. As duas coisas moram no mesmo script: sem
  ele, o título fica inteiro, como no HTML.
  Os `h1` já vêm partidos no HTML, porque estão na primeira tela. **Ao editar
  um `h1`, mantenha um `.pal` por palavra** (o `--i` é a ordem). Pontuação
  colada fica na palavra; o `<span data-preco>` do título vira uma palavra
  inteira e o `campanhas.js` continua escrevendo nele.
- **Odômetro.** Entra em `.plano__valor`, `.avulso__preco`, `.erro__num`,
  `[data-conta]` e `[data-rola]`: cada dígito vira uma fita de 0 a 9 que rola
  até o valor (`translate` numa janela parada). A largura não muda (cada
  coluna guarda o dígito final invisível), o leitor de tela lê o número
  inteiro, e no fim o elemento volta exatamente ao que era. Se o
  `campanhas.js` trocar o preço no meio, ele escreve por cima e o odômetro
  sai sem desfazer nada. O 404 (decorativo) fica com a fita parada: devolver
  o texto contava como uma pintura nova e empurrava o LCP.
- **Onda e ímã dos botões.** A onda é uma animação no `::after` do botão,
  disparada no `pointerenter` (mouse) ou `pointerdown` (toque). O ímã só liga
  com mouse de verdade (`hover:hover` + `pointer:fine`), escreve uma vez por
  quadro e lê a caixa do botão ao entrar, não a cada movimento.
- **Barra de progresso** do topo: CSS onde dá, este laço onde não dá.

Se o `vivo.js` não carregar, o site continua inteiro e legível: os títulos
ficam sem partir, os números parados, os botões sem onda.

## Fontes

Bricolage Grotesque (títulos), Instrument Sans (texto) e DM Mono (rótulos
pequenos), servidas do próprio site, da pasta `fonts/` (os `@font-face` estão
no topo do `style.css`). Saíram do Google Fonts em 04/11: o CSS deles travava a
primeira pintura e abria duas conexões a mais. A versão vai no nome do arquivo
(`-v9`, `-v4`...), por isso o `.htaccess` guarda fonte por um ano.

## Imagens em AVIF

Cada foto e mascote tem um `.avif` do lado do original (metade do peso, mesma
cara). Nos HTML o `<img>` continua apontando pro PNG/JPG, dentro de um
`<picture>` com `<source type="image/avif">` — navegador sem AVIF fica com o
original. Nos fundos dos cards é o `image-set()` do CSS. **Ao trocar uma
imagem, gere o `.avif` de novo**, senão quem tem AVIF continua vendo a velha
(ex.: `python3 -c "from PIL import Image; Image.open('x.png').save('x.avif', quality=70)"`).

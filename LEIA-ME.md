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
│   └── planos.js               (relógio da promoção e upsell)
└── images/
    ├── mascote-novo.png        (mascote atual, recortado)
    ├── mascote-apoiado.png     (mascote cortado na linha do braço, pra
    │                            apoiar na borda de cima dos cards)
    ├── mascote-velo.png        (o antigo, tubarão-leopardo — não usado)
    ├── fundo-raso.jpg          (praia    → card Raso)
    ├── fundo-correnteza.jpg    (surf     → card Correnteza)
    ├── fundo-alto-mar.jpg      (tubarão  → card Alto-mar)
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
Todo o resto — mensalidade, mídia e avulsos — mora lá, pra não afogar quem
está só passando os olhos.

O `planos.html` tem quatro blocos, com peso visual diferente de propósito:

| Bloco | Cobrança | Planos | Valores |
|---|---|---|---|
| 01 Sites | uma vez | Bote / Veleiro / Caravela | a partir de 300 / 550 / 1.500 |
| 02 Mensalidade | por mês | Ancoradouro / Doca / Estaleiro | 80 / 150 / 300 |
| 03 Mídia | por mês | Raso / Correnteza / Alto-mar | 350 / 700 / 1.450 (metade) |
| 04 Avulsos | uma vez | — | 18 a 2.200 |

Pra mudar um preço, é texto puro no HTML: `<span class="plano__valor">` nos
cards de site e mídia, `<span class="mens__valor">` na mensalidade e
`<p class="avulso__preco">` nos avulsos.

### O relógio da promoção

A data de fim está numa constante só, no topo do `js/planos.js`:

```js
var FIM_DA_PROMO = new Date(2026, 7, 31, 23, 59, 59);   // mês 7 = agosto
```

É uma data **de verdade**: quando ela passa, o relógio e a tarja somem
sozinhos, os preços de mídia voltam pro cheio (o script lê o valor do
`.plano__antes`) e as duas ofertas de upsell trocam pelo texto do atributo
`data-fim`. Pra esticar a promoção, muda a data e pronto.

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

As duas miniaturas de site são desenhadas em CSS com a paleta real de cada
cliente (`.obra__tela--clinica` e `.obra__tela--imob` no `style.css`), não são
prints. Quando quiser trocar por screenshot de verdade, substitua o conteúdo
de `.obra__tela` por um `<img>` — o enquadramento (`aspect-ratio: 16/11`) já
está pronto.

## O mar

A onda fixa no rodapé da tela e a barbatana que atravessa a página conforme
você rola estão em `js/main.js`, no bloco `1. O MAR`. Os ajustes ficam em:

- `camadas` — base, amplitude e velocidade de cada uma das 3 ondas
- `--mar-h` no `style.css` — altura do mar (104px no desktop, 78px no celular)
- `alturaFin` no `desenhar()` — tamanho da barbatana

Com `prefers-reduced-motion: reduce` ligado no sistema, a onda para de ondular
mas a barbatana continua acompanhando o scroll.

## Fontes

Bricolage Grotesque (títulos), Instrument Sans (texto) e DM Mono (rótulos
pequenos), carregadas do Google Fonts. Se precisar funcionar offline, baixe os
`.woff2` e troque o `<link>` por um `@font-face` local.

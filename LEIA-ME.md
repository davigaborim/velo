# Site da Velo

Site estático, sem build. É só subir a pasta inteira num servidor (Hostinger,
Netlify, Vercel — qualquer um serve). Para ver localmente, abra `index.html`
no navegador.

```
velo/
├── index.html
├── favicon.svg
├── css/style.css
├── js/main.js
└── images/
    ├── mascote-velo.png        (tubarão recortado, fundo transparente)
    ├── barbatana.svg           (só a barbatana, usa currentColor)
    └── velo-logo-original.svg  (arquivo que você mandou, guardado)
```

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

Os três planos (Raso / Correnteza / Alto-mar) estão com **"Sob consulta"** no
lugar do preço, como combinado. Quando os valores fecharem, troque o conteúdo
de `<span class="plano__valor">`. Se quiser mostrar preço com período, o padrão
é algo como:

```html
<p class="plano__preco">
  <span class="plano__valor">R$ 000</span> /mês
</p>
```

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

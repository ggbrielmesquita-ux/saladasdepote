# Design System — Saladas Criativas + Molhos

Esta etapa estabelece a fundação visual da landing page, preservando o conteúdo, a ordem das seções, os assets e as integrações existentes. Não inclui reformulação profunda de cada seção.

## Arquitetura e arquivos

O projeto é uma página estática em HTML, CSS e JavaScript, sem framework ou dependências de interface.

- `index.html`: conteúdo da página, componentes existentes, metadados e scripts de interação e rastreamento.
- `styles/design-system.css`: tokens de cor, tipografia, espaçamento, bordas, sombras e movimento; reset e primitivas compartilhadas, como containers, botões, cards e estados de interação.
- `styles/sections.css`: apresentação dos componentes e seções existentes, utilizando a fundação visual compartilhada.
- `scripts/dev-server.cjs`: servidor estático com módulos nativos do Node.js; iniciado por `npm run dev` em `http://127.0.0.1:5173`.
- Assets de imagem: permanecem na raiz. O banner aprovado é `poster-saladas-criativas-molhos.png`, com proporção original de 1122 × 1402.

## Mapa da página

1. Hero com banner, chamada e imagem do produto.
2. Dores e dificuldades do público.
3. Solução e benefícios.
4. Receitas apresentadas e indicação das demais receitas.
5. Informações de Marina Albuquerque.
6. Depoimentos existentes.
7. Três bônus.
8. Oferta e checkout, com identificador `pricing`.
9. Garantia de sete dias.
10. Perguntas frequentes.
11. Chamada final para compra.

O rodapé e o acesso flutuante ao WhatsApp completam a página. As imagens existentes permanecem disponíveis; não há vídeos, áudio ou iframes no HTML atual.

## Identidade visual

| Cor | Valor | Uso visual |
| --- | --- | --- |
| Verde floresta | `#153D1B` | Títulos e elementos de marca |
| Verde oliva | `#5E801B` | Acentos secundários |
| Verde vibrante | `#20864A` | Ações e destaques |
| Verde suave | `#EEF6E9` | Fundos e superfícies suaves |
| Creme natural | `#FFF9EC` | Fundo acolhedor e alternância entre seções |
| Amarelo suave | `#F4DE77` | Pequenos detalhes e destaques |
| Branco | `#FFFFFF` | Cards e seções claras |
| Verde-escuro para textos | `#183624` | Texto principal |

Headlines usam **Plus Jakarta Sans**, pesos 700 e 800. O corpo usa **Inter**, pesos 400 e 500, com 600 para hierarquia auxiliar e 700 para botões e ênfases. A escala responsiva utiliza `clamp()` onde apropriado, mantendo textos de corpo confortáveis no celular.

Containers centralizados, espaçamento consistente, cards brancos, bordas discretas e sombras suaves formam os componentes básicos. Fundos creme, branco e verde suave criam ritmo entre seções. Botões compartilham linguagem visual e estados `hover`, `focus` e `active`; transições são curtas e respeitam a preferência por movimento reduzido.

## Responsividade e escopo

A implementação parte de telas de 360 a 430 px, com padding lateral consistente, imagens responsivas, alvos de toque confortáveis e prevenção de overflow horizontal. No desktop, a largura do conteúdo permanece limitada e centralizada. Os componentes existentes recebem os novos padrões sem mudança de arquitetura.

Conteúdo editorial, receitas, preços, bônus, depoimentos, garantia e informações da responsável devem permanecer íntegros. Não acrescentar avaliações, estatísticas, certificados ou números de vendas. Não excluir imagens ou assets. A próxima etapa de reformulação individual das seções está fora deste escopo.

## Integrações preservadas

- Os dois CTAs de compra apontam para `https://pay.cakto.com.br/yqj9k4a_829932` e disparam `fbq('track','InitiateCheckout')`.
- O Meta Pixel `1809981600129982` mantém a inicialização, o evento `PageView` e o fallback `noscript`.
- Os parâmetros `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e `src` continuam sendo codificados e propagados aos links de checkout.
- A interação do FAQ mantém o comportamento de somente uma pergunta aberta por vez, agora com botões nativos, acionamento por teclado, foco visível e `aria-expanded` sincronizado.
- O link do WhatsApp, sua mensagem, o e-mail e os links de termos e privacidade são preservados.

## Verificação desta etapa

- Página verificada em 360, 390, 430, 768 e 1440 px, sem elementos ultrapassando a largura disponível; corpo entre 16 e 17 px.
- Banner exibido na proporção original; container limitado a 960 px no desktop.
- Texto, ordem das 11 seções, referências das imagens e links comparados com a versão anterior e preservados.
- Pixel e eventos de checkout preservados. Script de campanha comparado e simulado com espaços, acentos, `&` e `+`, sem enviar eventos de compra.
- FAQ verificado com Enter e Espaço, mantendo uma resposta aberta e foco visível.
- Os dois arquivos CSS carregam com HTTP 200; nenhuma mensagem de erro registrada no console durante a conferência final.

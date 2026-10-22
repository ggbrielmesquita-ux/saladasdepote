# SEO técnico — Saladas Criativas + Molhos

## Projeto e publicação

O projeto é uma landing page estática em HTML, CSS e JavaScript, sem Next.js ou dependências de produção. Existe uma única página pública: **https://saladasdepote.com.br/**. A pasta `saladasdepote/saladas no pote/` é uma cópia de trabalho e não deve virar outra URL pública.

Comandos na raiz do projeto:

```powershell
npm run dev
npm run check:seo
npm run build
npm run preview
```

Desenvolvimento abre em http://127.0.0.1:5173/; a prévia do build abre em http://127.0.0.1:4173/. O servidor de desenvolvimento envia `X-Robots-Tag: noindex, follow`; o build de produção permite indexação. Não utilize o servidor de desenvolvimento como hospedagem pública.

**Publique o conteúdo de `dist/` na raiz do domínio.** O build inclui apenas os recursos necessários, sem a cópia interna, os scripts de desenvolvimento ou as imagens originais pesadas. Nenhuma publicação externa foi realizada nesta etapa.

Na hospedagem, confirme HTTPS válido, redirecionamento permanente de HTTP e www para `https://saladasdepote.com.br/`, e redirecionamento de `/index.html` para `/` preservando os parâmetros de campanha. URLs inexistentes devem responder HTTP 404, usando `404.html`, sem fallback de todas as rotas para a home com status 200. Ative compressão e cache na hospedagem: as configurações do servidor local de prévia não configuram automaticamente o provedor.

## Configuração e arquivos

- `site.config.json`: domínio, nome, idioma e título/descrição/imagem específicos da home. Cadastre páginas reais adicionais somente quando existirem.
- `index.html`: metadados gerados, canonical absoluta, Open Graph, Twitter Card, favicon, preload responsivo do banner e JSON-LD. Conteúdo dentro de `main`, um `h1` principal e títulos `h3` nos cards, mantendo os estilos anteriores.
- `robots.txt` e `sitemap.xml`: permitem a home e informam somente sua URL canônica. A cópia interna fica fora do sitemap e bloqueada para rastreamento. `lastmod` usa a data real de alteração do HTML e não muda em builds sem alterações.
- `404.html`: título/descrição próprios e `noindex, follow`; não entra no sitemap.
- `assets/`: derivados WebP responsivos, favicon PNG/ICO, Apple Touch Icon, imagem social JPEG 1200×630 e manifesto das imagens. Originais preservados na pasta de trabalho.
- `scripts/seo.cjs`, `prepare-images.cjs`, `build.cjs` e `dev-server.cjs`: geração, validação, preparação da publicação e servidores locais.
- `styles/sections.css`: preserva a tipografia dos cards após a mudança semântica e inclui o novo card de vídeo. `styles/design-system.css` e `scripts/carousel.js` não foram alterados.

Não edite manualmente o bloco `SEO:START`/`SEO:END`: altere a configuração e execute `npm run seo` ou `npm run build`. O preço dos dados estruturados é lido do preço visível da oferta; após mudar o preço no HTML, gere o build novamente.

O JSON-LD descreve `WebSite`, `WebPage` e `Product` com `Offer` de **19.90 BRL**, sem criar avaliações, disponibilidade, certificações ou dados da empresa. Os teasers de receitas não receberam `Recipe`, pois não publicam ingredientes/instruções completos. O FAQ permanece no HTML. Não foram inventados uploadDate ou outras informações para marcar o vídeo como `VideoObject`. Referências: [Product](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), [políticas de dados estruturados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Vídeo solicitado

O card **“Assista à prévia da aula 1”** fica imediatamente antes dos bônus, depois dos depoimentos. Incorpora o vídeo fornecido `2-A2chrN41w` pelo domínio `youtube-nocookie.com`, em proporção 9:16, com carregamento lazy, controles do YouTube, fullscreen e link externo alternativo. Não usa autoplay. Carregamento e reprodução foram verificados no navegador.

## Imagens e desempenho

Os 23 arquivos de imagem únicos antes referenciados pela página somavam **24.702.577 bytes**. As referências `src` de fallback atuais somam **1.549.298 bytes**, redução de **93,7%**, sem incluir o vídeo, fontes, pixels e a imagem social. O navegador escolhe variantes adicionais por `srcset` conforme largura e densidade de tela; estes números medem arquivos, não uma pontuação de carregamento.

O banner inicial recebe prioridade/preload; as imagens têm dimensões reservadas e decodificação assíncrona, e as imagens abaixo da abertura continuam com lazy loading. O carrossel mantém sua animação automática contínua e seu comportamento anterior de carregamento. O iframe do YouTube reserva seu espaço e carrega sob demanda.

As imagens otimizadas já estão prontas e não exigem instalação para desenvolvimento/build. Para regenerá-las após trocar um original, o script opcional `npm run images` usa Sharp. Ele procura o módulo `sharp` ou o caminho indicado por `SEO_SHARP_MODULE`; não há dependência obrigatória nova no site. Refaça `npm run build` após regenerar.

Validação realizada em 21/10/2026:

- `npm run build` e `npm run check:seo` aprovados; geração idempotente.
- Home HTTP 200; `/index.html?utm_source=teste` redireciona com 301 e preserva a campanha; rota inexistente e cópia interna retornam 404.
- Robots e sitemap respondem 200 com tipos MIME corretos na prévia de produção. Todos os recursos locais referenciados pelo HTML respondem 200. HTML/XML/TXT com gzip e revalidação ETag 304 funcionando na prévia.
- JSON-LD válido, canonical única, sitemap com uma URL, imagens com alt/dimensões, um main/h1 na página principal.
- Pixel 1809981600129982, scripts de FAQ/UTM e os dois eventos/links Cakto preservados exatamente; nenhum clique de compra foi disparado no teste.
- Conteúdo textual anterior preservado integralmente, com acréscimo apenas do card de prévia. Nenhuma imagem original removida.
- Viewports 360, 390, 430, 768 e 1440 px sem rolagem horizontal. Em 390 px, as medidas das seções existentes e a tipografia dos cards permaneceram iguais à versão anterior.

A home pública foi acessível na consulta, mas não foi possível confirmar os arquivos robots/sitemap públicos por esta ferramenta. Os testes HTTP acima são do build local. Após publicar, repita-os no domínio. Não foi obtida pontuação Lighthouse/PageSpeed nem dados de campo de Core Web Vitals; não se pode garantir LCP/INP/CLS a partir do tamanho dos arquivos. Use [PageSpeed Insights](https://pagespeed.web.dev/) no domínio publicado e acompanhe [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) no Search Console.

Pendência preexistente: os links “Termos de Uso” e “Política de Privacidade” apontam para `#`. Configure páginas/documentos reais quando estiverem disponíveis; não foi inventado conteúdo jurídico.

Na conferência do endereço local, a biblioteca da Meta avisou que o pixel 1809981600129982 está indisponível nesse endereço por suas configurações de permissão de tráfego. O código está presente e preservado; a aceitação de eventos depende também da configuração externa da conta. Confira o domínio publicado em Permissões de tráfego/Testar eventos no Gerenciador de Eventos. Esse aviso local não permite concluir que o domínio de produção também esteja bloqueado; nenhuma configuração da conta foi alterada.

## Google Search Console

1. Publique `dist/` no domínio e abra o [Google Search Console](https://search.google.com/search-console/). Escolha **Adicionar propriedade → Domínio** e digite `saladasdepote.com.br`, sem protocolo nem caminho.
2. Copie o registro **TXT de verificação fornecido pelo Google**. No painel DNS do seu domínio, adicione esse valor na raiz (`@` ou campo vazio, conforme o provedor). Não substitua registros A/CNAME/MX existentes. Volte ao Search Console e clique em **Verificar**; a propagação pode exigir aguardar. Mantenha o TXT após a verificação. [Instruções oficiais de verificação DNS](https://support.google.com/webmasters/answer/9008080).
3. No relatório **Sitemaps**, envie `https://saladasdepote.com.br/sitemap.xml` e confira se a leitura foi concluída. [Ajuda oficial de sitemaps](https://support.google.com/webmasters/answer/7451001).
4. Em **Inspeção de URL**, insira `https://saladasdepote.com.br/`, execute **Testar URL publicada** e confira se o Google consegue acessar e indexar a página. Verifique que a canonical declarada é a raiz HTTPS. Se estiver elegível, use **Solicitar indexação**. [Inspeção de URL](https://support.google.com/webmasters/answer/9012289).
5. Confira os relatórios de indexação e a canonical escolhida pelo Google depois do processamento. Teste o domínio publicado também no [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results), sem adicionar avaliações fictícias para eliminar avisos opcionais. Solicitar indexação não garante inclusão ou posição, e pedidos repetidos não aceleram o rastreamento. [Orientação do Google](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

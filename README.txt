LR SONORIZAÇÃO - RASCUNHO 2.4

Mesma identidade visual da 2.0/2.1: cores, tipografia, textos e a estrutura de
seções não foram alteradas. As alturas do cabeçalho continuam as mesmas de antes
(78px no celular/tablet, 98px no desktop) e nenhuma seção mudou de tamanho.


O QUE ENTROU NA 2.4
===================

FOTO DO LUCIANO NA SEÇÃO "QUEM FAZ"
   - O placeholder cinza saiu e entrou a foto real, recortada: o fundo do
     estúdio virou transparente, então não há mais um retângulo de foto
     cortando o papel claro da página.
   - Atrás da pessoa fica só um halo dourado bem diluído (radial-gradient a
     partir de #D98A16), que some antes de chegar às bordas. É o que amarra a
     foto ao restante da página sem criar moldura nem linha dura.
   - A base da foto (o corte na cintura) dissolve aos poucos nos últimos 17%
     da altura, para o recorte não terminar em uma linha reta.
   - A imagem é servida em WebP (79 KB) com PNG de reserva (703 KB) via
     <picture>. Só um dos dois é baixado, e o PNG só vai para navegadores
     antigos sem suporte a WebP com transparência.
   - O <img> tem width/height e loading="lazy": a página não desloca o texto
     enquanto a foto carrega.
   - O recorte é feito por script, não à mão. Para refazer (por exemplo, se a
     foto original for trocada):

       python tools\build-photo-luciano.py

     Ele lê assets/fotos/luciano-original.jpg e regrava luciano.png e
     luciano.webp. Precisa de pillow, numpy e scipy:

       python -m pip install pillow numpy scipy

     O script separa fundo e pessoa por cor: o fundo do estúdio é cinza puro
     (croma perto de 4), a pele tem croma alto e a camiseta preta tem
     luminância baixa. Com essa separação ele ajusta um polinômio que descreve
     o degradê real do fundo — sombras incluídas — e só então mede o quanto
     cada pixel foge desse fundo. É por isso que as sombras do estúdio não
     ficam como manchas cinzas ao redor dos ombros.


O QUE ENTROU NA 2.3
===================

LOGOTIPO NO CABEÇALHO
   - O quadrado dourado com as letras "LR" saiu. No lugar dele entrou o
     logotipo da LR (só as letras "L" e "R"), vetorizado em SVG. O waveform
     do logotipo original foi retirado.
   - O SVG foi desenhado a partir de medições feitas pixel a pixel no logotipo
     original (tools/logo-lr-original.png), então o desenho e as proporções são
     os do logotipo: o "L" com a haste e o pé nas medidas originais e o "R"
     aberto à esquerda, como no original.
   - Cores adaptadas ao site:
       * no cabeçalho (fundo claro): "L" e "R" em #171717;
       * nos ícones e na imagem social (fundo escuro, como o logotipo
         original): "L" e "R" em branco.
   - O relevo metálico do arquivo original não foi copiado traço a traço. Em
     vez disso o SVG ganhou uma sombra bem suave (feDropShadow, luz vinda de
     cima-esquerda) para dar um pouco de volume sem pesar no cabeçalho. O
     favicon e os ícones de app ficam sem sombra, para não borrar em 16–32px.
   - A altura do logotipo é a mesma do antigo quadrado (56px no desktop, 48px
     no celular) e a largura acompanha a proporção do logotipo (1,89:1), ou
     seja, 106px e 91px. Só isso mudou de medida no cabeçalho.
   - Como o logotipo é mais largo que o quadrado, dois pontos de quebra foram
     recalculados para o cabeçalho continuar em uma linha só:
       * os links de seção passam a ficar em linha a partir de 1200px
         (antes 1141px);
       * o slogan do cabeçalho aparece a partir de 581px (antes 521px).
   - Em telas de até 380px o logotipo fica com 40px e o nome da marca com 15px,
     senão o cabeçalho não caberia em 320px.
   - O logotipo também virou favicon, ícone de app (192/512), apple-touch-icon
     e a marca da imagem social (og-image).
   - Para regerar o SVG a partir da geometria:

       node tools\build-logo-svg.js

     E depois os ícones (que leem o próprio assets/logo-lr.svg, para não haver
     duas versões da geometria):

       powershell -ExecutionPolicy Bypass -File tools\generate-assets.ps1


O QUE ENTROU NA 2.2
===================

1. MENU DE NAVEGAÇÃO
   - O cabeçalho ganhou links para as seções: Serviços, Estrutura, Detalhes,
     A LR e Orçamento.
   - Acima de 1200px de largura (1140px na 2.2, ver acima) os links aparecem na
     mesma linha da marca. Abaixo disso viram um painel aberto pelo botão de
     menu (o "hamburguer"), porque não caberiam sem quebrar o slogan.
   - O painel fecha ao clicar em um link, ao clicar fora, ao apertar Esc e ao
     voltar para a largura de desktop.
   - O link da seção que está na tela fica destacado automaticamente enquanto
     a página rola.

2. FORMULÁRIO DE ORÇAMENTO
   - A seção "Vamos conversar?" agora tem um formulário: nome, tipo de evento,
     data, local, público estimado, WhatsApp e um campo de detalhes.
   - Ao enviar, os dados são montados em uma mensagem e o WhatsApp abre já
     preenchido. Nada é enviado para servidor nenhum — não há back-end.
   - Nome e tipo de evento são obrigatórios; os demais são opcionais.
   - O que foi digitado fica salvo no próprio navegador, então quem sai da
     página e volta não perde o preenchimento.
   - O botão "Falar direto no WhatsApp" continua ali para quem não quer
     preencher nada.

3. BOTÕES FLUTUANTES
   - Botão de WhatsApp fixo no canto inferior direito, sempre visível.
   - Botão "voltar ao topo" que aparece depois de rolar a página.
   - Os dois são quadrados, sem cantos arredondados, seguindo o desenho do site.

4. ASSETS QUE FALTAVAM (os links da 2.1 apontavam para arquivos inexistentes)
   - assets/favicon.ico, assets/favicon.svg, assets/apple-touch-icon.png,
     assets/icon-192.png, assets/icon-512.png e assets/og-image.jpg.
   - Foram gerados a partir das cores oficiais (#D98A16, #171717, #FFFFFF) pelo
     script tools/generate-assets.ps1. Para regerar:

       powershell -ExecutionPolicy Bypass -File tools\generate-assets.ps1

   - Na 2.3 esses arquivos foram refeitos usando o logotipo (ver acima). As
     fotos das seções continuam sendo espaços reservados.

5. SEO E INFRAESTRUTURA
   - assets/site.webmanifest (instalação como app, ícone e cor de tema).
   - robots.txt.
   - _headers com cache e cabeçalhos de segurança para hospedagem estática.
   - Dados estruturados (JSON-LD) ampliados: serviços oferecidos, fundador e
     região atendida como dado estruturado.
   - og:image com dimensões declaradas e twitter:image.

6. ACESSIBILIDADE
   - Contorno visível de foco no teclado (:focus-visible) em toda a página.
   - Os links do menu levam a seção para baixo do cabeçalho fixo, em vez de
     escondê-la atrás dele (scroll-margin-top).
   - Botão de menu com aria-expanded / aria-controls e rótulo que muda ao abrir.
   - Erros do formulário anunciados por leitor de tela (aria-invalid + status).
   - Aviso visível para quem tem JavaScript desativado, com link do WhatsApp.
   - Todas as animações novas respeitam "prefers-reduced-motion".

7. CÓDIGO
   - script.js dividido em módulos por função: initWhatsAppLinks, initNav,
     initScrollState, initBackToTop, initQuoteForm e initScrollReveal.
   - Um único listener de scroll, com requestAnimationFrame, cuidando da sombra
     do cabeçalho, do link ativo e do botão "voltar ao topo".
   - O script agora usa "defer" e funciona mesmo se rodar antes ou depois do
     DOMContentLoaded.

AJUSTES DE LAYOUT EM TELAS PEQUENAS
===================================
O cabeçalho não tinha espaço para marca + slogan + WhatsApp + menu na mesma
linha. Sem esses dois ajustes o nome "LR SONORIZAÇÃO" quebrava em duas linhas e
o botão de menu saía da tela:

- Abaixo de 520px o slogan de 8px do cabeçalho ("SEU EVENTO • SEU SOM • SEU
  RESULTADO") deixa de aparecer. Ele já era ilegível nesse tamanho e continua
  presente no restante da página.
- Abaixo de 480px o botão de WhatsApp do cabeçalho sai. O WhatsApp continua
  acessível pelo botão flutuante (sempre na tela) e pelo item "Orçamento".

Se preferir manter o slogan ou o botão nessas larguras, é só remover essas duas
regras no fim de style.css — mas aí o cabeçalho volta a ficar apertado.

CONFIGURAÇÃO OBRIGATÓRIA ANTES DE PUBLICAR
==========================================
Trocar o número de exemplo 5511999999999 pelo número real da LR em 2 lugares:

- script.js, linha 5 (constante WHATSAPP_NUMBER)
- index.html, nos 3 href de wa.me (botão do formulário, botão flutuante e
  aviso do <noscript>) — eles são o fallback para quando o JavaScript falha

ARQUIVOS
========
index.html, style.css, script.js, robots.txt, _headers,
README.txt, assets/ (marca em assets/ e fotos em assets/fotos/) e tools/
(generate-assets.ps1, build-logo-svg.js e build-photo-luciano.py)

PRÓXIMOS PASSOS SUGERIDOS (exigem decisão sua)
==============================================
- Substituir os placeholders de foto que sobraram (capa, equipamento e os três
  da galeria) por imagens reais do trabalho da LR. Como foi feito com a foto do
  Luciano, vale trocar cada <div class="image-placeholder"> por <img
  loading="lazy"> com width/height, para não haver deslocamento de layout.
- Trocar os dois depoimentos de exemplo por depoimentos reais.
- Confirmar o número de WhatsApp.
- No desktop o título da capa quebra em 4 linhas em vez das 3 previstas pelos
  <br>, porque "MERECE UM SOM" a 78px fica alguns pixels mais largo que a
  coluna. Resolver exige mexer no tamanho do h1 ou na proporção da capa, que
  ficaram intocados nesta versão — decisão sua.
- Se quiser adicionar Content-Security-Policy no _headers, lembre que o bloco
  JSON-LD é inline: será preciso liberar o hash dele para o Google continuar
  lendo os dados estruturados.

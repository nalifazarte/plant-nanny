# Brota — direção de arte em tinta e guache

Artes criadas com a ferramenta integrada **imagegen**, usando a imagem enviada pela usuária como referência de estética. Não foi usado o modo CLI/API. A referência não é incluída no repositório. As plantas, os acessórios e os cenários distribuídos são novas imagens geradas para este aplicativo.

## Linguagem visual

Papel creme quente, contornos de tinta preta com irregularidades, preenchimentos de guache e lápis com textura, folhas verde-escuras e detalhes vivos em lilás, coral, rosa e laranja. Curvas orgânicas e expressões simples. A interface usa contornos escuros, sombras deslocadas, cantos assimétricos e tipografia arredondada de sistema, sem buscar fontes externas.

## Arquivos finais

| Arquivo | Uso |
| --- | --- |
| `dist/assets/plants-ink.webp` | 24 estágios: seis espécies × quatro níveis; fundo transparente |
| `dist/assets/props-ink.webp` | Quatro vasos e quatro grupos de acessórios; fundo transparente |
| `dist/assets/scenes-ink.webp` | Amanhecer, lago e noite |
| `dist/apple-touch-icon.png` | Ícone de 180 px para iPhone |
| `dist/icon-192.png`, `dist/icon-512.png` | Ícones da aplicação |

As folhas geradas foram preparadas tecnicamente para o jogo: recorte nas margens transparentes, alinhamento da base das plantas e redimensionamento uniforme por espécie, sem repintura das ilustrações. As fases mantêm seus tamanhos relativos. Os três atlas ocupam aproximadamente 800 KB em conjunto e estão no cache offline. Os vasos são camadas separadas das plantas.

Espécies próprias usam a família de ilustração correspondente. Máscaras de cor em SVG aplicam as cores escolhidas sobre folhas e flores/frutos, preservando textura e contornos. Os filtros são específicos por fase, para não reutilizar a máscara de um broto em uma planta adulta. IDs, plantas salvas, níveis, consumo e backups não são migrados ou apagados pela alteração visual.

## Prompts finais — especificação consolidada

### Plantas

Use case: stylized-concept. Production transparent game character sprite atlas for Brota, a virtual-plant hydration game. The attached image is only a visual style reference. Match its hand-inked botanical sticker / indie flash-art character: bold slightly wobbly near-black outlines, scratchy pencil and grainy gouache fill, rich forest and leaf greens, vivid lilac-purple, coral-pink and orange accents, understated smiling faces and curving organic poses. Draw original designs. Four equal columns and six equal rows, 24 isolated plant sprites, portrait ratio 2:3. No grid lines, labels, text, numbers or background; actual transparent alpha. Plants centered horizontally, root baseline at 88% of each cell, generous clear padding. No pots: they are composited separately. Left to right: tiny seedling, young plant, adolescent, mature plant, preserving identity and progressively increasing size. Rows: broad-leaved curly green sprout; orange-golden daisy with smiling center; twisting green cactus with pink blossoms; leafy lemon tree; purple moon flower with golden smiling center and sinuous stem; leafy red strawberry. Physical ink-and-crayon texture; avoid clean vectors, glossy 3D and pastel kawaii.

### Vasos e acessórios

Use case: stylized-concept. One transparent four-column by two-row game accessory atlas, landscape ratio 2:1. The reference is only a style reference. Original hand-drawn botanical flash-art objects with irregular black ink outlines, crayon/gouache texture, cream highlights and playful silhouettes. No text or grid. Top row: four empty frontal pots, same outline and size with dark elliptical soil openings: orange terracotta with ink scratches; ivory with a black star; electric coral-pink with orange/lilac grain and black zigzag decoration; cornflower blue with lilac grain and a black crescent. No plants in any pot. Bottom row: mossy stones; orange-purple mushrooms; white/lilac ink twinkles; yellow butterfly with purple details and dotted flight marks. Transparent backgrounds and no baked scenery.

### Cenários

Use case: illustration-story. One landscape background atlas for an indie botanical game, three equal square panels side by side, ratio 3:1. Match warm buttercream paper, irregular black ink outlines, grainy pencil/gouache fills, curving botanical shapes, forest greens and lilac/pink/orange accents. Original arched-window scenes: morning garden with an orange sun and small white clouds; mint lake and layered green hills; navy-purple starry night with an ivory crescent. Botanical silhouettes stay near the edges. Each panel has a lightly textured cream shelf at the bottom. Keep the center open for a separately overlaid potted character. No pots, characters, text, interface, logos or labels. Avoid glossy 3D and clean vector scenery.

### Ícone

Use case: logo-brand. Square mobile home-screen icon for Brota. Reference image supplies only style: textured gouache and colored-pencil grain, irregular black outlines, forest green, electric coral-pink, orange and lilac. Original friendly two-leaf sprout in a coral-pink terracotta pot with a black zigzag decorative stripe, front view. Center inside the central 68% with safe maskable margins. Buttercream paper covers the full square; one small ink twinkle is allowed. No words, lettering, device mockup, rounded-corner framing, border or extra objects. Ink-and-crayon botanical sticker aesthetic, not clean vectors or 3D.

## Movimento

A folhagem tem balanço e respiração lentos, com o ponto de apoio na terra e o vaso fixo. As espécies recebem durações diferentes; as miniaturas no jardim têm um movimento menor. As quatro fases exibidas no viveiro ficam estáticas para facilitar a comparação.

Nuvens e uma borboleta se movem nos cenários diurnos; o lago recebe reflexos discretos e a noite, estrelas e vaga-lumes. Registrar água produz uma breve saudação da planta e dois pequenos detalhes que sobem. As camadas preservam os atlas originais e não exigem novos vídeos ou imagens.

Todos os movimentos são locais, funcionam offline e podem ser pausados em Ajustes. A configuração é salva e acompanha o backup; backups antigos continuam válidos. Reduzir Movimento do sistema, segundo plano e elementos fora da tela suspendem as animações. Nenhuma animação exige que o usuário beba mais água.
# Estúdio da ficha (v0.36.6)

No construtor de sistemas autorais, **🎨 Estúdio da ficha → Abrir o estúdio** abre uma tela cheia com o editor à esquerda e a prévia ao vivo à direita (no celular, botões Editar / Prévia).

## O que dá para mudar
- **Partes**: ordem das abas (arrastar), ícone, nome e esconder (a Principal sempre fica). Em cada aba, **Montar** mostra as partes numa grade de 12 colunas: arrastar para mudar a ordem, largura (inteira, ⅔, ½, ⅓), esconder e — em algumas — trocar o nome.
- **Cores**: temas prontos (Pergaminho, Neon, Gótico, Floresta, Oceano, Terminal), destaque, bordas, cartões, texto e fundo; letra dos títulos e do texto; desenho da árvore.
- **Imagens**: logo (topo da ficha), fundo (com "escurecer") e moldura dos cartões. Só imagens enviadas pela plataforma.
- **Formatos**: cartões (sólido, vidro, contorno, pergaminho), moldura (dupla, ornamento, pergaminho, neon, imagem), cantos, brilho, formato dos atributos (círculo, hexágono, escudo, losango) e barras (fina, grossa, brilhante, em gomos).

## Como funciona
- Tudo fica em `Sistema.visual` (`VisualAutor` em `tipos.ts`). `lerVisualAutor` + `lerMontagem` conferem no servidor: listas fechadas, cores `#rrggbb`, números com limite e URLs de imagem do bucket da plataforma.
- `cssDoVisual` (`montagemFicha.ts`) gera o CSS preso a `[data-ficha-autor]`. Não existe campo de CSS livre.
- As larguras usam container query (`.ficha-conteudo`, mínimo 560 px); no celular as partes ficam uma embaixo da outra, na ordem escolhida.
- Nada é calculado: o estúdio muda só a aparência e a arrumação.

Teste de tela: `scripts/tela/estudio.cjs`.

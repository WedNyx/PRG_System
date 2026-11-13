# Ilustrações de itens do inventário D&D — Game-Icons.net

## Fonte e licença
As 21 ilustrações vetoriais adicionadas à PR #48 são derivadas de [Game-Icons.net](https://game-icons.net/), repositório original em [game-icons/icons](https://github.com/game-icons/icons), licenciadas sob **Creative Commons Attribution 3.0 — CC BY 3.0**: https://creativecommons.org/licenses/by/3.0/.

Créditos aos artistas **Lorc** (http://lorcblog.blogspot.com) e **Delapouite** (https://delapouite.com).

Alterações realizadas: remoção do fundo preto dos SVG originais, inclusão das formas vetoriais num módulo TypeScript local e aplicação de cores/raridade e efeitos visuais definidos na ficha. Não são fotografias nem ilustrações exclusivas das armas oficiais de D&D. São pictogramas genéricos usados para representar os tipos de itens.

Arquivos copiados/adaptados:

| Ícone no PRG_System | Ícone original | Autor |
|---|---|---|
| Espada | lorc/broadsword.svg | Lorc |
| Machado | lorc/axe-swing.svg | Lorc |
| Martelo de guerra | delapouite/warhammer.svg | Delapouite |
| Lança | lorc/spear-hook.svg | Lorc |
| Arco | delapouite/bow-arrow.svg | Delapouite |
| Tridente | lorc/trident.svg | Lorc |
| Chicote | lorc/whip.svg | Lorc |
| Foice | lorc/scythe.svg | Lorc |
| Armadura | lorc/armor-vest.svg | Lorc |
| Elmo | lorc/visored-helm.svg | Lorc |
| Pergaminho | lorc/scroll-unfurled.svg | Lorc |
| Chave | lorc/key.svg | Lorc |
| Pistola | delapouite/revolver.svg | Delapouite |
| Poção | lorc/potion-ball.svg | Lorc |
| Livro de magia | lorc/open-book.svg | Lorc |
| Lâminas cruzadas | lorc/crossed-swords.svg | Lorc |
| Cristal arcano | lorc/crystal-ball.svg | Lorc |
| Mapa de aventura | lorc/treasure-map.svg | Lorc |
| Grimório | lorc/book-cover.svg | Lorc |
| Ponta de flecha | lorc/arrowhead.svg | Lorc |
| Arqueiro | lorc/bowman.svg | Lorc |

O editor de item D&D também apresenta, na aba **🎨 Personalizar aparência**, o crédito e o link da biblioteca. Ao publicar em outras partes da plataforma, manter os créditos acessíveis.

## Funcionamento na ficha
1. Sem foto, sem imagem personalizada da Forja: exibe ícone de biblioteca sugerido conforme a forma.
2. Se a pessoa escolhe um ícone específico, o id validado fica salvo em `iconeBiblioteca`.
3. A Forja personalizada continua disponível; usar a Forja limpa a escolha explícita de ícone.
4. Se houver foto própria enviada para o Storage, ela aparece em primeiro plano; o ícone selecionado não é apagado.
5. Ao remover a foto, a ilustração personalizada reaparece.
6. O botão **📷 Escolher foto** fica visível diretamente no editor, fora dos detalhes da Forja. Quando o Storage não está disponível, o editor explica que não é possível enviar naquele ambiente; não cria upload fictício.
7. `normalizarItem` aceita somente ids da lista fechada; códigos SVG arbitrários do jogador não são permitidos, preservando segurança e compatibilidade de fichas antigas.

A integração gráfica é específica da ficha **D&D**. Demais sistemas seguem com desenhos tradicionais até receberem suas próprias melhorias.

## Alternativas avaliadas
- [Kenney Game Icons](https://kenney.nl/assets/game-icons): **CC0**, excelente para ícones genéricos, menor variedade específica de armas de RPG.
- [Iconify Game Icons](https://icon-sets.iconify.design/game-icons/): contém os pictogramas Game-Icons; continua sujeito à licença dos autores. Optamos por uma seleção local para evitar requisições externas em cada visualização.

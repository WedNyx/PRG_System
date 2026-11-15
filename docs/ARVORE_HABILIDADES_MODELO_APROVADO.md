# PRG System — árvore de habilidades: decisões aprovadas

Status: **Fase 2 em implementação na PR de árvores verticais; homologação pendente.**
Data: 14/11/2026. Fase 1 publicada; preservar os dados antigos da árvore durante a transição visual.

## Prioridades aprovadas

1. **Fase 1: D&D pronto para jogar (PR #50)** — criar, salvar, carregar, evoluir, rolar, usar recursos e fazer escolhas coerentes com livros 2014 ou 2024; evitar bônus duplicados e mudanças de edição sem aviso; testes de regressão e revisão mobile/desktop.
2. **Fase 2: unificar e remodelar a Árvore** — remover a duplicação visual dos hexágonos oficiais e a árvore customizável, usando um só painel por ramo; preservar dados e poderes do mestre.
3. **Fase 3: acabamento e expansão** — testes visuais, suplementos, responsividade e reutilização do componente nos demais RPGs.

## Modelo visual escolhido

- **Árvore de habilidades com cartões retangulares de cantos arredondados**, sem hexágonos e sem estilo constelação complicado.
- **Progressão vertical**, de cima para baixo, com conexões simples e sem cruzamentos confusos.
- **Quatro ramos separados**, cada um com sua própria árvore e acesso por abas: 
  - Classe + Subclasse
  - Raça / Espécie
  - Antecedente / Origem
  - Habilidades adicionais do Mestre
- Mostrar **um ramo por vez no celular**; no desktop, pode haver painel lateral de detalhes.
- Nó mostra ícone, nome, nível, e estado: recebido, pendente de escolha, bloqueado ou futuro.
- Visual de fantasia sombria atual (roxo/azul, brilho discreto), legível em dispositivos móveis e com toque mínimo confortável.
- Ao selecionar nó, mostrar livro/edição e fonte, efeito ou referência, pré-requisitos, decisões, usos/recargas e detalhes; nenhum benefício é calculado simplesmente por desenhar um nó.
- Criação de ficha **com exemplo/modelo** deve popular automaticamente as quatro árvores com as escolhas existentes, incluindo nós adquiridos e pendentes, sem gravar características oficiais como poderes comprados.
- Mestre pode criar/editar nós exclusivos do quarto ramo, controlar requisitos e liberação segundo permissões da campanha.
- A Fase 2 deverá migrar a renderização sem perder `dados.arvore`, anotações, habilidades/poderes, escolhas oficiais, fotos ou histórico; preservar compatibilidade com fichas existentes.
- Usar a estrutura como componente reaproveitável para outros sistemas com conteúdo/regra diferentes; não assumir que todos usam progressão por nível.

## Critérios de aceite da Fase 2

- Um único fluxo de árvore com quatro ramos. Nenhum cartão oficial duplicado na árvore customizável.
- Criar ficha padrão e por exemplo, reabrir, alterar nível/classe/espécie/livro e verificar a árvore sem alterar poderes ao visualizar.
- Poder do mestre nunca aplicado duas vezes, mesmo quando também aparece na árvore oficial.
- Celular e desktop com texto não truncado, rolagem acessível e seleção legível.
- A Fase 1 permanece prioridade: **não implementar esse redesenho na PR #50**.

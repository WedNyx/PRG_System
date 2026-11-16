# Mapa da mesa: medir, paredes e visão (v0.34.9 a v0.35.0)

## Partes
| Parte | Versão | Migração | O que faz |
|---|---|---|---|
| 1. Medir e mirar | 0.34.9 | 030 `areas_efeito` | Régua compartilhada, alcance do ataque, áreas de efeito (círculo, cone, linha e quadrado), decisões do mestre fora do chat e chat em 4 abas |
| 2. Paredes e portas | 0.34.10 | 031 `paredes` | Parede, porta e janela bloqueiam os tokens dos jogadores, conferido no servidor; pincel redondo; "ver como jogador" |
| 3. Visão | 0.35.0 | 032 `visao_dinamica`, `visao_alcance` | A névoa se abre pelo que os personagens enxergam; a luz para nas paredes |

## Regras
- **Parede:** bloqueia passagem, visão e luz.
- **Porta:**
  - fechada, bloqueia tudo; aberta, deixa passar e ver;
  - qualquer jogador abre e fecha;
  - trancada (só o mestre tranca), só o mestre abre.
- **Janela:** bloqueia a passagem; deixa ver e deixa a luz passar.
- **Visão dos personagens:**
  - Só os tokens de jogadores revelam (NPCs, não).
  - O grupo enxerga junto o que qualquer personagem vê.
  - A revelação é salva em `fog_revelado`, no servidor, quando um personagem anda, é colocado no mapa, uma porta muda, ou o mestre liga a opção ou usa "Esconder tudo".
  - Na tela do jogador:
    - o que nunca foi visto fica na névoa;
    - o que já foi visto aparece escurecido;
    - o que está à vista agora fica claro.
  - Tokens que não são de jogador só aparecem quando estão à vista.
- **Alcance:** 0 m significa "sem limite", que na prática vai até as paredes, com teto de 60 células.

## Código
- `src/lib/mesa/areasEfeito.ts`: geometria das áreas.
- `src/lib/mesa/paredes.ts`: segmentos e caminho livre (BFS célula a célula, considerando o tamanho do token).
- `src/lib/mesa/visao.ts`: linha de visão, células visíveis (servidor) e polígono de visão (desenho da luz e da visão).
- `src/lib/mesa/abasChat.ts`: em que aba do chat cada evento aparece.
- e2e: `v34-areas-efeito.mjs`, `v34-paredes.mjs` e `v35-visao.mjs`.

## Limites conhecidos
- A escuridão da cena continua sendo um véu visual. A visão dos personagens não leva em conta "enxergar no escuro" de cada raça ou classe: o alcance é o mesmo para todos, escolhido pelo mestre.
- Os dados das paredes chegam ao navegador de todos (o jogador não vê as linhas, mas elas estão nos dados da mesa).

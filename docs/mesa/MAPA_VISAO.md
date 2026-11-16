# Mapa da mesa: medir, paredes e visão (v0.34.9 a v0.35.4)

## Partes
| Parte | Versão | Migração | O que faz |
|---|---|---|---|
| 1. Medir e mirar | 0.34.9 | 030 `areas_efeito` | Régua compartilhada, alcance do ataque, áreas de efeito (círculo, cone, linha e quadrado), decisões do mestre fora do chat e chat em 4 abas |
| 2. Paredes e portas | 0.34.10 | 031 `paredes` | Parede, porta e janela bloqueiam os tokens dos jogadores, conferido no servidor; pincel redondo; "ver como jogador" |
| 3. Visão | 0.35.0 | 032 `visao_dinamica`, `visao_alcance` | A névoa se abre pelo que os personagens enxergam; a luz para nas paredes |
| 4. Visão por personagem | 0.35.2 | 033 `prg_tokens.visao` | Alcance próprio e visão no escuro; com a cena escura, só se vê o que a luz alcança |

## Regras
- **Parede:** bloqueia passagem, visão e luz.
- **Formas (v0.35.4):** linha, à mão livre (simplificada por Ramer–Douglas–Peucker, até 80 pedaços), retângulo, círculo (12 a 32 lados) e triângulo; pontas na grade ou soltas (centésimos de célula, grudando na ponta de parede próxima). Os pedaços de uma forma têm o mesmo `grupo`: apagam juntos e, se porta, abrem/fecham/trancam juntos. Até 1.000 pedaços por cena. Sem migração (a coluna `paredes` é jsonb).
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
- **Visão por personagem (v0.35.2):**
  - Cada token pode ter `visao: { alcance, escuro }`, em metros. Alcance 0 usa o da cena; escuro 0 é não ter visão no escuro.
  - O dono e o mestre editam, tocando no token › Visão do personagem.
  - Com escuridão da cena em 50 ou mais e a visão ligada, cada personagem só vê o que alguma luz ilumina (luz de qualquer token, até as paredes) ou o que está dentro da própria visão no escuro.
  - Na tela do jogador, a visão no escuro aparece clareada sem cor, e a luz aparece com a cor dela.

## Código
- `src/lib/mesa/areasEfeito.ts`: geometria das áreas.
- `src/lib/mesa/paredes.ts`: segmentos, formas (`segmentosDaForma`) e caminho livre.
  - Até a v0.35.3 o caminho era uma busca célula a célula: se existisse QUALQUER caminho em volta, o token passava (por isso pedaços soltos de parede não travavam), e o mestre ignorava as paredes.
  - Desde a v0.35.4 o token anda em linha reta do centro de origem ao centro de destino (`atravessaParede`). Token maior que 1 célula também confere as quinas. Encostar na ponta de uma parede não bloqueia; passar pelo encontro de duas paredes, uma de cada lado, bloqueia.
  - O mestre também é bloqueado, a não ser que mande `atravessar: true` (botão 👻 na ferramenta Paredes).
- `src/lib/mesa/visao.ts`: linha de visão, células visíveis (servidor) e polígono de visão (desenho da luz e da visão).
- `src/lib/mesa/abasChat.ts`: em que aba do chat cada evento aparece.
- e2e: `v34-areas-efeito.mjs`, `v34-paredes.mjs` e `v35-visao.mjs`. Tela: `scripts/tela/paredes.cjs`.

## Limites conhecidos
- O grupo enxerga junto: cada jogador vê o que qualquer personagem do grupo vê (não há visão separada por jogador).
- Os dados das paredes chegam ao navegador de todos (o jogador não vê as linhas, mas elas estão nos dados da mesa).

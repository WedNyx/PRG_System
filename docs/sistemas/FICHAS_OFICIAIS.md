# Fichas oficiais: como cada jogo organiza a ficha (v0.36.6)

Pesquisa feita para organizar as fichas da plataforma **sem automatizar nada**: só a ordem das partes, os nomes e a estética.
O roteiro curto de cada sistema aparece na ficha, no modo ✏️ Criação (“Ordem da ficha de papel deste jogo”), e está em
`src/lib/sistemas/fichaOficial.ts`. Tudo escrito com palavras nossas; nenhum texto de livro.

| Sistema | O que a ficha de papel traz primeiro | Onde a plataforma segue |
|---|---|---|
| D&D 2024 | Identidade e origem → atributos com salvaguardas e perícias embaixo de cada um → CA/PV/Dados de Vida → ataques/conjuração → características e equipamento; magias numa página à parte | Principal: identidade, depois vida e defesas, painel (testes contra a morte, espaços) e ações rápidas |
| Pathfinder 2e | P1: ascendência/classe, atributos, defesas e PV, perícias T/E/M/L, Golpes · P2: talentos e inventário (Volume) · P3: notas e ações · P4: magias | Mesma ordem no Principal; talentos por categoria em Poderes |
| Ordem Paranormal | Agente (origem, classe, NEX, trilha) → 5 atributos → PV/PE/SAN e Defesa → perícias → poderes e rituais → inventário | Estética da PR #68: Hexatombe, selos de treino, rituais por elemento e círculo, inventário operacional |
| Tormenta20 | Raça/origem/classe → atributos → PV/PM/Defesa → perícias → ataques → poderes e magias → equipamento | Vida e defesas logo após a identidade |
| Fate Core | Aspectos → perícias (escada) → façanhas → estresse e consequências → recarga | Pirâmide de perícias; painel de estresse/consequências |
| Blades in the Dark | Identidade → estresse/trauma → dano/armadura → ações em 3 colunas → habilidades → amigos/rivais → carga | Painel de estresse, trauma e relógios; ações com bolinhas |
| Call of Cthulhu 7ª | Frente: características, PV/PM/SAN/Sorte, perícias com ½ e ⅕, armas · Verso: história, ideologia, pessoas e lugares, posses | Dossiê com ½ e ⅕; história em Anotações |
| BRP | Personagem → características → valores → perícias em % → armas → poderes | Dossiê com marca de experiência |
| Mörk Borg | Nome/classe → 4 atributos → PV e Presságios → armas/armadura → equipamento e prata → pergaminhos → traços | Ficha sombria (preto e amarelo) |
| Assimilação | Instintos → Conhecimentos/Práticas → Saúde (6 níveis) → Determinação × Assimilação → características | Cabo de guerra Determinação × Assimilação |
| Faroeste Arcano | Pistoleiro → atributos → PV/defesa → perícias → armas → recompensa | Cartaz de PROCURADO no topo |

## Arsenal de cada sistema (src/lib/arsenalSistemas.ts)
Armas com dano e a rolagem de crítico de cada jogo. Sistemas abertos (PF2e ORC, BRP ORC, Fate CC BY, Blades CC BY) com descrições nossas; comerciais (Ordem, Tormenta20, Call of Cthulhu, MÖRK BORG) só com nomes e números. Números de Tormenta20, MÖRK BORG e PF2e foram montados sem a tabela oficial aberta: confira no livro.

| Sistema | Crítico |
|---|---|
| Pathfinder 2e | Dano dobra; Mortal/Fatal somam dados |
| Ordem / Tormenta20 | Margem de ameaça multiplica os dados (bônus fixos não) |
| Call of Cthulhu | Sucesso extremo: empalar = máximo + rolagem; demais = máximo |
| BRP | Especial: máximo + rolagem; crítico: máximo e ignora armadura |
| MÖRK BORG | 20 natural: dobro |
| Fate / Blades | Sem dado de dano (tensões / nível de consequência) |

Sugestões de campo (src/lib/sistemas/opcoesExtras.ts): origens e trilhas da Ordem, origens e divindades de Tormenta20, ocupações de CoC e BRP, antecedentes de PF2e.

## Fontes consultadas
- BRP SRD — tabelas de armas: https://rules.omnisgm.com
- Call of Cthulhu — armas (Chaosium wiki): https://callofcthulhuwiki.chaosium.com
- Fate System Toolkit — armas e armaduras: https://fate-srd.com
- Archives of Nethys — armas (PF2e): https://2e.aonprd.com
- Fate SRD — character sheet: https://fate-srd.com/fate-core/character-sheet
- Paizo — Starfinder 2e character sheet (mesma família da ficha do PF2e Remaster): https://downloads.paizo.com/StarfinderSecondEdition_CharacterSheet.pdf
- Archives of Nethys — Sample Character (Player Core): https://2e.aonprd.com/Rules.aspx?ID=2055
- Guia das fichas novas de D&D: https://www.runicdice.com/blogs/news/guide-to-the-new-2025-dnd-character-sheets
- Blades in the Dark — playbook (Roll20 Compendium): https://roll20.net/compendium/BITD/Character%20playbook
- Call of Cthulhu — Backstory (Chaosium wiki): https://callofcthulhuwiki.chaosium.com/investigators/step-four-backstory.html
- Mörk Borg — ficha no Alchemy: https://help.alchemyrpg.com/en/articles/10234184-mork-borg
- Ordem Paranormal — sistema do Foundry (barras PV/SAN/PE): https://foundryvtt.com/packages/ordemparanormal
- Tormenta20 — ficha alternativa do Foundry (abas ou layout clássico): https://foundryvtt.com/packages/tormenta20-ficha-heroica

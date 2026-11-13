# Deploy da v0.33.8 (mesa: mapa, névoa, luz, fichas e combate)

## Banco

As duas migrações novas já foram aplicadas em produção em 13/11. Elas são compatíveis com a versão anterior, porque só adicionam colunas com valor padrão e aumentam limites:

- `028_mesa_nevoa_luz.sql`: mapa até 200 × 200, partes com névoa, escuridão da cena e luz dos tokens.
- `029_tokens_copias.sql`: cópias de NPC (`ficha_modelo`).

## Passo a passo

1. Confira o check "Qualidade" verde na PR.
2. Faça o merge. A Vercel publica sozinha.
3. Rode o smoke: `node scripts/producao/smoke.mjs https://prg-system.vercel.app 0.33.8`.
4. Teste na mão, no celular, com uma campanha de teste:
   - **Mestre:**
     - Crie uma cena "Mundo" (200 × 140).
     - Ligue a névoa e marque duas partes com a ferramenta de partes com névoa. Revele uma delas com um toque.
     - Ponha escuridão em 70% e dê uma Tocha ao token de um jogador.
     - Na aba Fichas, coloque 3 cópias de um NPC.
     - Na aba Iniciativa, use "Preparar combate", depois "Entrar no combate", ↑↓, "Adiar" e "Dano em vários" com "metade".
   - **Jogador:**
     - Toque em "Ficha" no topo da mesa e role uma perícia: a rolagem aparece no meio da tela.
     - No Inventário, crie um item de "250 g".

## Se der errado

Use "Promote to Production" no deploy anterior. As migrações não precisam ser desfeitas.

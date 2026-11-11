# Testes ponta a ponta da API (Fases 1 e 2)

Simulam três aventureiros (mestre, jogador e intruso) contra um banco real.

1. Postgres local + PostgREST (ou um projeto/branch de teste do Supabase) com as migrações `005` e `006` aplicadas.
2. Cadastre os aventureiros de teste:
   ```sql
   insert into prg_public_adventurers(id, apelido) values
     ('11111111-1111-4111-8111-111111111111','Mestra Lua'),
     ('22222222-2222-4222-8222-222222222222','Jogador Sol'),
     ('33333333-3333-4333-8333-333333333333','Intruso');
   ```
3. Rode o site com `PRG_SHARED_PROFILES=true`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apontando para esse banco.
4. Execute:
   ```bash
   PRG_BASE=http://localhost:3000 KEY=<service_role> node scripts/e2e/fase1-campanhas.mjs
   PRG_BASE=http://localhost:3000 KEY=<service_role> node scripts/e2e/fase2-fichas-permissoes.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/fase3-mesa.mjs   # precisa da migração 007
   PRG_BASE=http://localhost:3000 node scripts/e2e/v06-mesa-e-mestre.mjs   # precisa da migração 008
   PRG_BASE=http://localhost:3000 node scripts/e2e/v07-musica.mjs   # precisa da migração 009
   PRG_BASE=http://localhost:3000 ADMIN_SENHA=<a mesma do PRG_ADMIN_SENHA do site> node scripts/e2e/v08-perfis.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v09-inventario.mjs   # precisa da migração 010
   PRG_BASE=http://localhost:3000 node scripts/e2e/v10-espectadores-sessao.mjs   # precisa da migração 011
   PRG_BASE=http://localhost:3000 node scripts/e2e/v11-notificacoes.mjs   # precisa da migração 012
   PRG_BASE=http://localhost:3000 node scripts/e2e/v12-sistemas-autorais.mjs   # precisa da migração 013
   PRG_BASE=http://localhost:3000 node scripts/e2e/v13-saude-backup.mjs   # migração 014; site com PRG_ADMIN_SENHA=lua-roxa-teste e CRON_SECRET=cron-teste
   PRG_BASE=http://localhost:3000 node scripts/e2e/v14-cartoes.mjs   # migração 015
   PRG_BASE=http://localhost:3000 node scripts/e2e/v15-arvore.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v16-rolagem-personalizada.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v18-combate.mjs   # migração 016
   PRG_BASE=http://localhost:3000 node scripts/e2e/v19-preparar-combate.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v20-arvore-progressao.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v21-grupos-e-escolhas.mjs   # migração 017
   PRG_BASE=http://localhost:3000 node scripts/e2e/v22-classe-progressao.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v23-condicoes-turnos.mjs   # migração 018
   PRG_BASE=http://localhost:3000 node scripts/e2e/v24-dano-por-turno.mjs   # migração 019
   PRG_BASE=http://localhost:3000 node scripts/e2e/v26-morte.mjs   # migração 020
   PRG_BASE=http://localhost:3000 node scripts/e2e/v27-forja.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v28-mundo.mjs   # migração 021
   PRG_BASE=http://localhost:3000 node scripts/e2e/v30-tabelas.mjs   # migração 022
   PRG_BASE=http://localhost:3000 ADMIN_SENHA=<senha de admin local> node scripts/e2e/v31-senha.mjs   # migração 023
   PRG_BASE=http://localhost:3000 node scripts/e2e/v32-passar-item.mjs
   PRG_BASE=http://localhost:3000 ADMIN_SENHA=<senha de admin local> node scripts/e2e/v32-mesa-cheia.mjs   # migração 024; 6 jogadores ao mesmo tempo
   PRG_BASE=http://localhost:3000 node scripts/e2e/v32-descanso.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v32-biblioteca.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v32-historico-itens.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v32-visual.mjs   # migração 025
   ```
Nunca rode contra o banco de produção: os testes criam campanhas e fichas.

Rode cada arquivo com o banco limpo (os testes compartilham os mesmos aventureiros).

## Teste pela tela (mestre, jogador e espectador)
`scripts/tela/papeis.cjs` abre a plataforma no navegador (Playwright) como mestre e jogador (celular) e espectador (computador):
portal, central, ficha, mesa, sessão, fichas na mesa, condições com dano por turno, combate, ataque tocando no mapa, fim de turno e as restrições do espectador.
```
NODE_PATH=$(npm root -g) node scripts/tela/papeis.cjs /tmp/fotos
```

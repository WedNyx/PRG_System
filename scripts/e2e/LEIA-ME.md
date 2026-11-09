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
   PRG_BASE=http://localhost:3000 node scripts/e2e/fase2-fichas-permissoes.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/fase3-mesa.mjs   # precisa da migração 007
   PRG_BASE=http://localhost:3000 node scripts/e2e/v06-mesa-e-mestre.mjs   # precisa da migração 008
   PRG_BASE=http://localhost:3000 node scripts/e2e/v07-musica.mjs   # precisa da migração 009
   PRG_BASE=http://localhost:3000 ADMIN_SENHA=<a mesma do PRG_ADMIN_SENHA do site> node scripts/e2e/v08-perfis.mjs
   PRG_BASE=http://localhost:3000 node scripts/e2e/v09-inventario.mjs   # precisa da migração 010
   PRG_BASE=http://localhost:3000 node scripts/e2e/v10-espectadores-sessao.mjs   # precisa da migração 011
   PRG_BASE=http://localhost:3000 node scripts/e2e/v11-notificacoes.mjs   # precisa da migração 012
   ```
Nunca rode contra o banco de produção: os testes criam campanhas e fichas.

Rode cada arquivo com o banco limpo (os testes compartilham os mesmos aventureiros).

# Deploy da v0.33.6 / v0.33.7 (D&D 2024 completo)

> 13/11/2026: a v0.33.6 já foi mesclada (PRs #42 e #43) e a migração 027 foi aplicada em produção. A v0.33.7 traz fontes, revisão, qualidade e a criação livre, sem migração nova. Smoke: `node scripts/producao/smoke.mjs https://prg-system.vercel.app 0.33.7`.

## O que entra

- Estabilização da PR #42 e janelas centralizadas (`NaTela`).
- Catálogo do SRD 5.2.1: 12 classes 1–20, subclasses, 9 espécies, 4 antecedentes.
- Efeitos automáticos sem bônus em dobro.
- 339 magias.
- Multiclasse.
- Árvore com exceções, histórico e desfazer.
- Guia do mestre interativo (`/mestre/dnd`).
- Livros e fontes da campanha.
- Revisão dos outros sistemas e conferência da ficha.

## Banco

Só uma migração nova: `027_progressao_dnd.sql`.

Ela adiciona a coluna `config_progressao jsonb` em `prg_campanhas`, com o valor padrão `{"modo":"hibrido"}`. As fontes da campanha (`fontes` e `fontesExtras`) moram dentro dessa mesma coluna, então não há outra migração.

O site funciona sem a migração: as campanhas ficam no modo Híbrido. O que não funciona sem ela é trocar o modo, criar exceções por ficha e salvar as fontes; nesses casos a API responde 409 com um aviso.

## Passo a passo

1. **Antes do merge**, confira o check "Qualidade — testes, tipos, lint e build" verde na PR. Ele roda os testes unitários, a checagem de tipos, o lint dos módulos novos e o build.
2. **Merge** da PR #42 na `main`. A Vercel publica sozinha.
3. **Migração 027** em produção (projeto Supabase `vzmytrafnpxvupjwlejl`). O Claude aplica pelo MCP do Supabase, sem ninguém colar chave.
4. **Smoke test**, só leitura: `node scripts/producao/smoke.mjs https://prg-system.vercel.app 0.33.6`.
5. **Teste na mão**, no celular:
   - Crie uma campanha de D&D e, em Editar campanha, troque o modo e libere o Livro do Jogador.
   - Crie uma ficha, escolha classe, espécie e antecedente, e confira a aba Árvore e a Conferência da ficha.
   - Na aba Poderes, adicione magias e use "Conjurar".
   - Abra `/mestre/dnd?campanha=<id>`, monte um encontro e dê o XP.
6. **Advisors** do Supabase (segurança e desempenho): nenhum aviso novo esperado. Não há tabela nova.

## Se der errado

- **Site com erro:** na Vercel, use "Promote to Production" no deploy anterior. A migração 027 é compatível com a versão anterior, porque só adiciona uma coluna com valor padrão; não precisa desfazer.
- **Ficha recusando escolhas que deveriam passar:** o mestre pode liberar a fonte ou fazer a escolha ele mesmo, porque o mestre não é bloqueado pelas fontes nem pelos requisitos de multiclasse.

## Testes locais (antes de mandar o patch)

- `npx vitest run`: 321 testes.
- `npx tsc --noEmit`.
- e2e com servidor e banco locais: `scripts/e2e/*.mjs`, 41 arquivos (ver `scripts/e2e/LEIA-ME.md`).
- Telas:
  - `scripts/tela/papeis.cjs`: mestre, jogador e espectador.
  - `scripts/tela/dispositivos.cjs`: 11 telas × 7 dispositivos (celular pequeno, celular, iPhone, tablet em pé e deitado, computador, tela grande). Confere rolagem lateral, erros, falhas 5xx e acessibilidade com o axe-core.

## Pendências conhecidas (não bloqueiam)

- **Lint geral:** 16 apontamentos `react-hooks` em telas antigas (carregar dados ao abrir). O CI mostra, mas não bloqueia; os módulos novos bloqueiam.
- **Faroeste Arcano:** o PV ainda é à mão (faltam os dados de vida das classes).
- **D&D:**
  - Magias sempre preparadas da subclasse entram como "extra".
  - Grimório do Mago não tratado.
  - Perícia ganha ao entrar em multiclasse fica à mão.

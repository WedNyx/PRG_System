# Homologação da Fase 1 (v0.34.7)

Integração das PRs #55 (motor de dados), #53 (D&D 2014) e #54 (Ordem Paranormal) sobre a `main`.

## Como foi conferido
- As três PRs mesclam sem conflito sobre a `main` (inclusive `FichaGenerica.tsx`).
- `tsc` limpo; vitest: 103 arquivos e 620 testes; build de produção ok; 45 testes de ponta a ponta (API) ok.
- `scripts/tela/sistemas.cjs` (novo): cria uma ficha de cada sistema visível e a do D&D 2014. Depois abre todas as seções no celular pequeno (360 px), no Pixel 7 e no computador (1280 px). Em cada seção confere rolagem lateral, erros de página, respostas 5xx e acessibilidade (axe-core, sérios e críticos). Resultado: 36 de 36 combinações sem problema.
- `scripts/tela/dispositivos.cjs`: as telas de portal, central, campanhas, fichas, mesa, mestre, guia e novidades passaram em 7 aparelhos.

## Corrigido nesta etapa
- **Ficha de campanha do jogador não abria** e aparecia “Falha de conexão”. A causa estava na `main`, vinda da PR #52: a página lia `regras.efetivas.habilidades`, mas a API já devolve as regras efetivas em `regras`. A correção também foi entregue sozinha, como hotfix para a `main`.
- Grimório do D&D 2014: o destaque aparecia com asteriscos (`**…**`); agora aparece em negrito.

## Continua pendente (não declarar 100%)
- D&D 2014:
  - efeitos condicionais automáticos;
  - magias de domínio, juramento e patrono preparadas automaticamente;
  - desconto de componentes com custo.
- Ordem Paranormal: catálogos de origens, trilhas, poderes, rituais e armas. Sistema comercial: só a mecânica entra, cadastrada pelo grupo na biblioteca da campanha, sem texto do livro.
- Motor de dados: críticos especiais por arma ou poder, resistências e imunidades.
- Teste em aparelho físico (Android e iOS) e teste autenticado em produção.

# Etapa 6 — Iniciado em Magia do Humano Versátil (D&D 2024)

**Status:** implementação na PR #45, ainda em rascunho; não mesclar sem revisão mestre/jogador e CI.

## Escopo implementado
- Novo registro `dndTalentoHumano` armazena apenas lista, atributo de conjuração e três IDs de magia do talento **Iniciado em Magia** do **Humano Versátil**. É independente de `dndAntecedente` e `dndMagias`.
- Criador nas abas **Árvore** e **Habilidades** com duas magias de nível 0, uma de nível 1, lista Clérigo/Druida/Mago e atributo INT/SAB/CAR.
- Proíbe repetir a **lista** do mesmo talento obtido pelo antecedente, inclusive quando o antecedente ainda não terminou seu cadastro. Não exige que as próprias magias sejam únicas entre talentos de listas diferentes.
- Servidor valida o registro em mudanças da ficha. O caminho de dados integra a categoria **Habilidades** e respeita permissões/solicitações da campanha.
- Grimório apresenta as magias humanas em um painel próprio, sem contaminar os limites de preparação da classe. Cada origem utiliza seu atributo para CD e ataque.
- O talento humano usa `magia_humano_gratis` (um uso por descanso longo) separado de `magia_origem_gratis` (antecedente). Pode usar os espaços de magia comuns sem descontar ambos os recursos.
- Alterar a espécie ou o talento desativa a projeção e o máximo do recurso, mas preserva as escolhas registradas para auditoria. Alterar o registro não reabastece usos gastos.
- Guia do Mestre informa pendência até que as escolhas do Humano estejam válidas e mantém a revisão final manual.

## Verificações
- Testes de domínio: escolha da lista diferente do antecedente, três magias válidas, não duplicar truques, desativação ao mudar de espécie, contadores/descanso separados, normalização e atualização do Guia.
- CI da PR: testes, checagem de tipos, lint e build devem ser conferidos antes de integrar.

## Ainda pendente (próxima subfase)
- Projeção de magias das espécies (Elfo, Gnomo e Tiferino) e seus usos por linhagem/legado e nível, separadamente dos dois talentos Iniciado em Magia.
- Integrações contextualizadas de Atacante Selvagem, Curandeiro, Brigão de Taverna, Artesão, Músico e rolagem efetiva de Sortudo.
- Teste completo na interface mestre/jogador e histórico de permissões, sem merge para `main` até homologação.

## Referências abertas
- SRD 5.2.1 (CC BY 4.0): https://www.dndbeyond.com/srd
- Magic Initiate 2024: https://www.dndbeyond.com/feats/1789162-magic-initiate

Não reproduzir texto comercial do PHB. Estes dados são mecânicos/derivados, usados somente com fontes autorizadas.

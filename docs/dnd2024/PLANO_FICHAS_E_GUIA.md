# D&D 2024 — plano de integração no PRG System

## Auditoria do código existente
- `src/lib/sistemas/tipos.ts`: opções de campos já suportam bônus e progressão por classe.
- `src/lib/sistemas/arvore.ts`: árvore atual funciona com custo, pontos e desbloqueios manuais.
- `src/components/fichas/Arvore.tsx`: interface dos hexágonos e seus efeitos.
- `src/lib/guia.ts`: guia geral da plataforma, não substitui o guia específico do sistema.

## Decisão de arquitetura
Não reutilizar a compra de nós para a progressão oficial do D&D. A visualização D&D deve ser **somente leitura** para marcos automáticos e mostrar seletores apenas nas decisões válidas. A fonte de verdade é a ficha e o catálogo verificado de regras. Nunca conceder um bônus duas vezes porque aparece na ficha e na visualização.

## Conteúdo-alvo
- Livro do Jogador 2024: 10 espécies; SRD 5.2.1: 9 espécies abertas. Aasimar e outras opções exclusivas do livro comercial: metadados e referências, sem reproduzir texto protegido.
- 12 classes, progressão de 1 a 20, escolhas por nível, subclasses, antecedentes, talentos, magias, perícias e equipamentos.
- Mestre: passo a passo de criação conjunta; o que é automático; o que exige escolha; exemplos de multiclasse, descanso, combate, magias e avanço.
- Suplementos ficam desabilitados na primeira fase; depois entram via seleção de fontes por campanha.

## Modo de progressão padrão aprovado
- **Híbrido** é o padrão para novas configurações de progressão da campanha; o mestre pode escolher Automático ou Manual e configurar exceções por ficha.
- Híbrido combina marcos oficiais sincronizados com habilidades personalizadas autorizadas pelo mestre. Não altera os dados oficiais do catálogo.
- O padrão está no módulo de regras; ainda não há seletor na UI nem persistência conectada à campanha. Não alterar fichas existentes silenciosamente ao integrar.

## Contrato desta primeira PR
Esta PR adiciona **somente a fundação de dados e testes da progressão visual**. Não integra a UI, não altera fichas existentes e não afirma que o catálogo completo do livro já foi implementado. O código usa marcos fictícios nos testes, não reproduz regras comerciais.

## Próximos passos técnicos
1. Auditar o modelo D&D já existente e mapear IDs de classe, espécie e antecedente.
2. Construir catálogo verificável de características abertas do SRD com atribuição CC BY 4.0.
3. Integrar a visualização em componente isolado e mostrar estados adquirido / escolher / futuro / pendente.
4. Sincronizar escolhas com a ficha e validar no servidor, sem alterar poderes manuais.
5. Ampliar o Guia do Mestre por etapas, com exemplos e referências oficiais.
6. Executar Vitest, lint e build em checkout completo antes do merge.

## Limitações
O Livro do Jogador de 2024 é comercial; o SRD 5.2.1 não cobre todas as opções do livro. Consultar o material original e respeitar licenças. A árvore existente de outros sistemas não deve mudar.

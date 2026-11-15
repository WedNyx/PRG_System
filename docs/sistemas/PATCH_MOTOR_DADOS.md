# Patch base — motor de dados e críticos (pré-requisito dos patches por sistema)

## Melhorias objetivas
- Detecta crítico de d20 pela face **realmente mantida** nas expressões com vantagem (`kh1`) ou desvantagem (`kl1`).
- Em testes com d20 + dados auxiliares, um 20 desses outros dados não gera crítico falso.
- Não atribui críticos genéricos a paradas sem dado mantido, sucessos contados ou dados explosivos.
- Regressão para d2, d3, d4, d6, d8, d10, d12, d20, d30, d100, Fate/Fudge (`df`), pools e casos de vantagem/desvantagem.

## Compatibilidade
- Não altera `rolarExpressao` nem o formato de histórico salvo.
- Não altera o valor final de dano, nem decide automaticamente quando uma arma tem margem ou multiplicador de crítico especial.
- Blades, BRP, Fate e Assimilação continuam usando seus próprios interpretadores de resultado. D&D 2014/2024, Ordem e outros usos de d20 ficam mais seguros.

## Pendente por sistema
- Críticos especiais de armas, talentos, poderes e rituais; imunidades e resistências.
- Interpretação condicional por regra/edição, sem aplicar uma fórmula universal incorreta.
- Testes end-to-end de rolagem na mesa, com mestre e jogador autenticados.

Este patch é independente e pode ser mesclado antes dos patches específicos, após CI.

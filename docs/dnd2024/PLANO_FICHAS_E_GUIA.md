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
- O seletor já foi incluído no formulário de campanhas e a persistência foi ligada à API; **é obrigatório aplicar e testar a migração SQL antes da implantação**. O código não altera silenciosamente fichas existentes.

## Contrato desta primeira PR
Esta PR agora inclui a fundação, um seletor de modo de progressão no formulário de campanhas na nuvem, persistência em `config_progressao`, leitura do modo pela ficha genérica de D&D, visão dos marcos e escolhas na aba Árvore e testes. Não altera fichas antigas em massa. O catálogo é **parcial**: características da progressão de Guerreiro, Ladino e Mago até o nível 20, mais uma escolha de subclasse aberta do SRD para cada uma das 12 classes. As características das outras nove classes ainda não foram catalogadas, e nada aqui concede bônus automaticamente.

## Integração pronta nesta branch (depende de migração)
- **Banco:** aplicar `supabase/migrations/027_progressao_dnd.sql` antes de subir o código. Adiciona `config_progressao jsonb` em `prg_campanhas` com padrão Híbrido.
- **API:** criação/edição de campanha valida `configProgressao`, inclui a coluna na listagem; GET da ficha de campanha D&D retorna `configProgressao` após verificar acesso.
- **UI campanha:** Editar campanha → Seletor de modo de progressão (D&D 2024). O mestre/co-mestre já autorizado salva o modo pela rota existente.
- **UI ficha:** Árvore mostra a progressão guiada conforme o modo, com a árvore personalizada ao lado apenas em Híbrido ou Manual. A árvore personalizada não é editável por jogadores na campanha D&D; as escolhas da progressão ficam sujeitas às permissões de habilidades já existentes.
- **Modelo da ficha:** `dndEscolhas` persiste apenas escolhas de progressão; o leitor sanitiza dados de entrada e a API de fichas usa as regras já existentes de aprovação. Não há aplicação automática de efeitos no cálculo da ficha nesta fase.
- **Compatibilidade:** campanhas antigas passam a usar Híbrido pelo default da coluna; habilidades e nós preexistentes não são apagados. Fichas avulsas de D&D usam o padrão Híbrido.
- **Testes:** GitHub Actions executa testes direcionados, TypeScript, lint e build. Verificar o resultado do último commit antes de mesclar. A migração SQL ainda requer teste separado em ambiente de desenvolvimento.

## Próximos passos técnicos
1. Completar progressão detalhada das outras nove classes e das nove espécies abertas no SRD 5.2.1, incluindo escolhas por nível, especializações e magias.
2. Incluir opções do Livro do Jogador comercial apenas na extensão permitida pela licença (metadados/links ou autorização).
3. Vincular cada marco de regra a efeitos concretos testados (com proteção contra bônus duplicados).
4. Ampliar a validação que já impede novas subclasses incompatíveis com a classe/nível, cobrindo futuras opções e efeitos automáticos; preservar poderes manuais e histórico.
5. Ampliar o Guia do Mestre por etapas, com exemplos e referências oficiais.
6. Executar testes, lint, typecheck e build no checkout completo **e** aplicar e testar a migração em ambiente de teste antes do merge.

## Limitações
O Livro do Jogador de 2024 é comercial; o SRD 5.2.1 não cobre todas as opções do livro. Consultar o material original e respeitar licenças. A árvore existente de outros sistemas não deve mudar.

## Incremento desta etapa — pesquisa e segurança
- Tabelas oficiais de características (não slots de magia) de Guerreiro, Ladino e Mago até o nível 20; uma opção de subclasse aberta do SRD foi registrada para cada uma das 12 classes.
- Validação de novas escolhas de subclasse no servidor: classe correta, nível mínimo e opção existente no catálogo. Escolhas históricas não editadas continuam preservadas.
- Correção da CA de armadura pesada: sem modificador de Destreza mesmo quando negativo, com testes de regressão.
- Guia de D&D expandido diretamente em `src/lib/sistemas/guias.ts` com roteiro conjunto mestre-jogador, limites atuais e dicas.
- Tarefas ainda pendentes: passar CI no último commit, concluir catálogo das nove espécies SRD e das outras nove classes, sincronizar efeitos e magias, testar a migração do banco antes de publicar.

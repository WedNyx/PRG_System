# Etapa 2 — criação e progressão de D&D 2014

## Entrega 0.34.1

- Método explícito dos atributos-base: manual (compatibilidade), conjunto padrão, compra de 27 pontos, seis grupos de 4d6 descartando o menor. Os resultados brutos ficam registrados. Distribuições incompletas são rascunhos e aparecem no checklist.
- Selecionar um método não sobrescreve atributos. Aplicar um conjunto ou rolar é ação explícita; os valores podem ser redistribuídos antes dos bônus raciais.
- Incrementos identificados por classe e nível (incluindo extras de Guerreiro e Ladino). Cada registro distribui dois pontos; não pode coexistir com mais talentos do que os marcos restantes. O talento do Humano Variante usa sua concessão separada.
- Incrementos não elevam atributos acima de 20. Campeão Primitivo do Bárbaro 20 é aplicado depois, limitado a 24, somente com atributos-base confirmados.
- PV com dado máximo no primeiro nível de personagem, médias nos demais ou resultado bruto registrado por nível de classe. Constituição se aplica retroativamente; cada nível concede no mínimo 1 PV. A classe secundária não recebe dado máximo no seu primeiro nível.
- Os máximos de PV manuais e atributos finais de fichas antigas continuam preservados. Não converte fichas antigas automaticamente.
- Novos campos sobrevivem à normalização e serialização. Métodos, rolagens e incrementos seguem permissão de atributos; resultados de Dados de Vida seguem PV. A validação existente do PUT roda antes e depois de aplicar permissões.

## Limites e próximos blocos da etapa 2

Esta entrega **não encerra toda a etapa 2**. Ainda faltam assistente de equipamentos iniciais por classe/antecedente, escolhas de ferramentas e idiomas, substituição de proficiências duplicadas e revisão exaustiva da progressão das 12 classes do nível 1 ao 20. Efeitos e pré-requisitos de talentos, subclasses e conjuração detalhada pertencem também à etapa 3; o seletor de talentos continua identificando a necessidade de conferência manual.

As rolagens são conveniência local, não prova auditável contra adulteração; o mestre define se permite novas tentativas. Comprar pontos e talentos são regras opcionais da mesa, não habilitadas obrigatoriamente pela aplicação.

O teste de reabertura desta entrega usa serialização e normalização reais do modelo, sem simular persistência HTTP: não equivale à homologação no banco conectado nem à conferência visual num celular.

## Fontes e validação

Basic Rules 2014, capítulos Step-by-Step Characters e Classes:
https://www.dndbeyond.com/sources/dnd/basic-rules-2014/step-by-step-characters

Testes de regressão: dnd2014Atributos.test.ts e dnd2014Vitalidade.test.ts, além da suíte geral e checagem TypeScript. Resultados finais de CI e build registrados na PR.


## Complemento da Etapa 2 — XP e equipamentos (14/11/2026)

- **XP de 2014:** nova tabela exata do Livro do Jogador (p. impressa 15) entre 0 e 355.000 XP; indicação de nível sugerido e pontos para próximo nível. Não muda o nível automaticamente para preservar avanço por marcos.
- **Equipamento inicial:** escolha explícita entre equipamento de classe/antecedente ou ouro inicial segundo p. impressa 145. Foram cadastradas fórmulas de riqueza das 12 classes (Monge 5d4 PO, sem ×10) e alternativas de equipamentos por classe. O jogador seleciona os grupos, registra os itens de classe e antecedente no Inventário e confirma manualmente; o programa não cria cópias nem inventa benefícios. Se optar por ouro, os d4 são guardados e a carteira só é preenchida automaticamente se estava vazia.
- **Persistência/segurança:** `dnd2014EquipamentoInicial` é opcional, preservado por `normalizarFicha`, e considerado na categoria `equipamentos` da campanha. Validação server-side na API de edição, inclusive após aplicar regras do mestre. Campos da edição 2014 não podem ser alterados dentro de fichas 2024.
- **Testes:** `dnd2014Experiencia.test.ts`, `dnd2014EquipamentoInicial.test.ts`, além da suíte anterior.

### Escopo não automatizado

A seleção de grupos de equipamentos **não verifica item por item** se o inventário corresponde ao PHB; o registro é confirmado pelo jogador/mestre para não duplicar itens em fichas preexistentes. Os kits dos antecedentes são apresentados como referências e devem ser registrados e conferidos no Inventário; escolhas de ferramentas/idiomas estão disponíveis, mas efeitos/proficiências situacionais, aplicação automática dos itens e regras avançadas de talentos ainda exigem validação ou desenvolvimento. A homologação com perfis reais em banco e dispositivo móvel também permanece pendente antes do merge.

### Complemento: antecedentes e progressão das 12 classes

- Foram catalogados os 13 antecedentes de 2014 quanto a idiomas, ferramentas fixas ou de livre escolha e resumo do kit de referência. O novo campo `dnd2014AntecedenteExtras` é opcional, validado no servidor e classificado como `pericias` nas permissões da campanha. O guia mostra ferramentas fixas sem gravá-las duas vezes.
- As árvores oficiais passaram a mostrar escolhas de Incremento no Valor de Habilidade nos níveis apropriados de todas as 12 classes, incluindo marcos extras relevantes; isso é representação visual e não concede recursos automaticamente.
- Persistem conferência manual de equipamentos físicos no inventário, opções de talentos e condições situacionais. A homologação da PR #52 com banco multiusuário e celular real não está concluída.


### Homologação adicional da Etapa 2 (2026-11-14; versão 0.34.2)

- **Prévia local validada:** rolagem do Guerreiro `2+3+2+2+3 = 12`, multiplicada por dez = `120 PO`, carteira preenchida com 120 PO. Após F5, dados, modo ouro, carteira, idioma Élfico e instrumento Flauta do Forasteiro permaneceram.
- **Banco conectado, teste sem resíduos:** criados em uma subtransação um mestre, um jogador, uma campanha e uma ficha temporária 2014. A RPC `prg_salvar_ficha` incrementou versão 1→2 e preservou os registros 2014; proprietário errado e versão defasada não escreveram. Tudo foi revertido por `ROLLBACK` controlado. A API HTTP do app com autenticação real de dois perfis não foi exercitada nesse teste.
- **Correção importante de permissões:** no momento de escolha de ouro inicial, os campos `dnd2014EquipamentoInicial` e `uso` com alteração da carteira passam juntos pela área `equipamentos`. Isso evita liberar as moedas na área normalmente livre de PV antes que o mestre aprove o equipamento. Alterações normais posteriores em `uso` mantêm a classificação habitual. Testes dos modelos A, B, C e exceção individual cobrem esse cenário.
- **Rerolagem:** após registrar resultado válido do ouro inicial para a mesma classe e antecedente, segundo clique não muda os dados; o botão fica indisponível até alteração de método e confirmação.
- **Mobile:** layout responsivo e breakpoints continuam revisados, mas a ferramenta disponível não controlou a largura da viewport; não corresponde a homologação em smartphone real.
- **Limites:** aprovação HTTP real, autenticação de perfis e layout em celular físico ainda dependem de ambiente/controle adequados; não confundir testes de SQL e funções puras com E2E autenticado.

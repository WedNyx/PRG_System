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

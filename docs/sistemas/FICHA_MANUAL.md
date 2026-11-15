# Ficha manual (v0.34.8)

A partir desta versão, toda ficha segue o modelo do seu sistema e é preenchida pelo jogador e pelo mestre. A plataforma não calcula nem confere regras.

## Como funciona
- `DadosFicha.manual` guarda o que é digitado:
  - `mods`: modificadores dos atributos, só nos sistemas que têm modificador;
  - `derivados`: CA, Defesa, iniciativa, CDs e outros valores;
  - `pericias`: o total de cada perícia no modo "treino". No modo "valor" (porcentagem), o próprio valor já é o total.
- O máximo de cada recurso (PV, PE, Sanidade…) fica em `recursos[id].max`, sempre editável.
- `calcular()` devolve exatamente esses números quando a ficha tem `manual`. Com isso, a mesa, o combate, a iniciativa, os tokens e o descanso usam o que foi digitado.
- O motor de regras antigo continua no código como `calcularRegras()`, sem ligação com a tela. Ele é usado só para a primeira "foto":
  - `tornarManual()` roda ao abrir, criar ou salvar uma ficha;
  - se a ficha ainda não tem `manual`, guarda os números que ela mostrava, para nada mudar na tela;
  - depois disso, os números só mudam quando alguém digita.
- Permissões de campanha:
  - `manual.mods` segue a área Atributos;
  - `manual.pericias` segue a área Perícias;
  - `manual.derivados` segue a área PV e recursos.
- Servidor: com `manual`, as conferências automáticas do D&D deixam de valer. Isso inclui livros e fontes, subclasses, talentos, magias, antecedente e multiclasse.

## O que saiu da ficha
- Criação guiada.
- Conferência da ficha e avisos de limite.
- Árvore de habilidades e guia de criação.
- Progressão por marcos e seletor de modo de progressão da campanha.
- Catálogos de magias e arsenal do D&D.
- Contas automáticas de arma.
- Campos que só existiam para as contas, como "CA base da armadura" e "PV da classe": os dados continuam salvos, só não aparecem.

Classe, espécie e os outros campos de escolha viraram texto livre, com sugestões ao digitar.

## O que continua
- Rolagens com o número digitado: d20 + bônus, d100 abaixo do valor, parada de dados (Ordem, Blades) e dados de símbolos do Assimilação. Na campanha, a rolagem vai para o chat.
- Inventário, poderes, anotações, descanso (enche até o máximo digitado), retrato e passar item.
- Os hexágonos de atributos da Ordem Paranormal, agora sem a conta de pontos por NEX.

O código das PRs #53 (D&D 2014) e #54 (Ordem) continua no repositório e nos testes, mas fica desligado na ficha.

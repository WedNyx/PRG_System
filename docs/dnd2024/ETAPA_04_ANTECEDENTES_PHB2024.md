# Etapa 4 — Todos os antecedentes do Livro do Jogador 2024

**PR:** #45 (rascunho) | **Sistema:** D&D 2024, `dnd5e-srd`

## Escopo

A ficha passa a oferecer criação guiada para os **16 antecedentes** do PHB 2024:
quatro com dados abertos do SRD 5.2.1 e doze adicionais do livro comercial.
**Forasteiro (Outlander) é uma opção legada do PHB 2014**, separada dos dezesseis e sujeita à liberação da fonte.

**Fontes:** SRD 5.2.1 CC BY 4.0 https://www.dndbeyond.com/srd;
visão geral oficial do PHB 2024 https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024;
índice de metadados de criação https://pages.roll20.net/dnd/2024-backgrounds;
Livro do Jogador 2024 (obra comercial) para as características, magias e ações completas.

## Referência rápida: três atributos permitidos e talentos

| Antecedente | Atributos elegíveis | Talento de origem |
| --- | --- | --- |
| Acólito (SRD) | INT, SAB, CAR | Iniciado em Magia (Clérigo) |
| Artesão | FOR, DES, INT | Artesão |
| Charlatão | DES, CON, CAR | Habilidoso |
| Criminoso (SRD) | DES, CON, INT | Alerta |
| Animador | FOR, DES, CAR | Músico |
| Fazendeiro | FOR, CON, SAB | Robusto |
| Guarda | FOR, INT, SAB | Alerta |
| Guia | DES, CON, SAB | Iniciado em Magia (Druida) |
| Eremita | CON, SAB, CAR | Curandeiro |
| Mercador | CON, INT, CAR | Sortudo |
| Nobre | FOR, INT, CAR | Habilidoso |
| Sábio (SRD) | CON, INT, SAB | Iniciado em Magia (Mago) |
| Marinheiro | FOR, DES, SAB | Brigão de Taverna |
| Escriba | DES, INT, SAB | Habilidoso |
| Soldado (SRD) | FOR, DES, CON | Atacante Selvagem |
| Viajante | DES, SAB, CAR | Sortudo |

Os metadados de cada antecedente também incluem as duas perícias, a proficiência com ferramentas, os itens do pacote inicial e a quantia de PO do pacote. São **dados factuais de seleção**, não reprodução dos parágrafos de regras comerciais.

## Comportamento implementado

1. **Atributos:** +2 e +1 em atributos diferentes da lista, ou +1 nos três. Só são aplicados com confirmação explícita; redistribuições usam diferenças em relação ao registro anterior, evitando bônus duplicados.
2. **Perícias:** as duas proficiências específicas são aplicadas como grau mínimo, sem duplicar uma proficiência que o jogador já marcou.
3. **Ferramentas:** o guia registra o tipo escolhido de kit de jogos, instrumento musical ou ferramenta de artesão quando o antecedente exige. Ferramentas fixas aparecem no resumo.
4. **Talentos com escolhas internas:** Habilidoso registra três perícias/ferramentas; Artesão e Músico registram três tipos diferentes de ferramentas/instrumentos; Iniciado em Magia registra a lista autorizada, dois truques, uma magia de 1º nível e o atributo de conjuração. O servidor valida as opções e suas fontes.
5. **Talentos numéricos seguros:** Alerta soma o bônus de proficiência à Iniciativa apenas uma vez; Robusto soma 2 PV máximos por nível, apenas uma vez; Sortudo expõe um recurso com usos iguais ao bônus de proficiência, recuperável de acordo com as regras do descanso.
6. **Equipamento:** o jogador escolhe o pacote factual com os itens e PO indicados, ou 50 PO para comprar itens. A ficha **não insere automaticamente itens ou moedas**, para não duplicar o inventário preexistente.
7. **Permissões:** antecedentes e opções comerciais exigem a fonte `phb2024` liberada na campanha. A API valida o registro e os atributos antes e depois das permissões do mestre.
8. **Guia do Mestre:** uma origem só é marcada como registrada quando os atributos e as escolhas internas necessárias estiverem preenchidos. A revisão final do mestre continua obrigatória.
9. **Legado:** Forasteiro (2014) permanece disponível sob `phb2014`, fora da contagem de 16.

## Limitações honestas

- Os textos completos dos talentos **não são copiados do PHB**; o mestre consulta a fonte licenciada.
- **Iniciado em Magia**: os três IDs e o atributo são registrados, mas a magia não é importada automaticamente para `dndMagias` nem altera a CD de conjuração da classe; isso requer integração própria com rastreamento de origem e uso.
- **Habilidoso** aplica proficiências de perícias selecionadas; tipos de ferramentas são registrados como dados para revisão, não possuem uma tabela de perícias numéricas correspondente na ficha.
- **Artesão, Músico, Curandeiro e Brigão de Taverna**: decisões e origem registradas; os demais benefícios de criação, descanso e combate ainda requerem módulo específico para aplicar sem inventar regras.
- **Sortudo**: o recurso fica disponível; o uso de pontos em cada rolagem requer interação específica na futura implementação de rolagens.
- **Equipamentos** não são inseridos automaticamente para evitar duplicação.
- **Fichas legadas** com bônus de antecedente já somados manualmente exigem revisão antes de aplicar o assistente.
- Essa etapa valida regras de **criação do antecedente**; não significa que todas as classes, espécies, magias, combate e itens estejam completos.

## Testes necessários para mesclar

- Cobrir os 16 antecedentes (cada um com lista de atributos, origem, ferramenta, talento e duas perícias).
- Testar distribuição de atributos, redistribuição, fontes e cenário de ultrapassar 20.
- Conferir escolhas adicionais: 3 proficiências, 3 instrumentos, magia de lista e nível válidos.
- Conferir bônus de Alerta, Robusto, Sortudo e ausência de duplicação por combinação com Humano.
- Verificar persistência, permissões mestre/jogador e comportamento real no navegador.
- **Não mesclar automaticamente a PR #45 nem publicar na main** sem aprovação.

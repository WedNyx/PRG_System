# Auditoria de cadastro D&D 2024 — PRG System (13/11/2026)

**Escopo:** cadastro de opções no seletor, progressão, Guia do Mestre e efeitos da ficha de D&D 2024, no branch `feat/dnd2024-guia-arvore-contextual` (PR #45). Comparação do **SRD 5.2.1** com as opções identificadas no **Player's Handbook de 2024**. Não é uma certificação de todas as regras linha por linha.

## Fontes verificadas
- Livro do Jogador 2024: https://wpn.wizards.com/pt-BR/products/2024-players-handbook — 12 classes, 48 subclasses, 10 espécies, 16 antecedentes.
- SRD 5.2.1 (Wizards of the Coast LLC, CC BY 4.0): https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf
- Atualizações oficiais de subclasses do livro: https://www.dndbeyond.com/posts/1810-updates-in-the-players-handbook-2024
- Lista e benefícios resumidos dos talentos de origem PHB: https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024
- Licença: https://creativecommons.org/licenses/by/4.0/

## Inventário de opções

| Categoria | SRD 5.2.1 | Livro do Jogador 2024 | Situação atual |
|---|---:|---:|---|
| Espécies | 9 | 10 | Nomes presentes; Aasimar é apenas metadado comercial |
| Classes | 12 | 12 | Todas cadastradas com dados/tabelas do SRD; efeitos e escolhas ainda não integralmente automatizados |
| Subclasses | 12 (uma por classe) | 48 | 48 opções, sendo 36 PHB comerciais como nomes e referências de níveis |
| Antecedentes | 4 | 16 | Quatro com detalhes abertos; doze opções comerciais só com nomes |
| Talentos de origem do Humano Versátil | 4 no SRD | 10 no PHB | Quatro SRD + seis comerciais como nomes (com validação da fonte) |

**Espécies:** Anão, Draconato, Elfo, Gnomo, Golias, Halfling, Humano, Orc, Tiferino (SRD); Aasimar (PHB comercial: metadado, sem traços automáticos).

**Linhagens e ancestrais que realmente exigem escolhas no modelo de 2024:**
- Elfo: Drow, Alto Elfo, Elfo da Floresta (**3**).
- Gnomo: Floresta, Rochas (**2**).
- Tiferino: Abissal, Ctônico, Infernal (**3**).
- Draconato: ancestral dracônico entre **10** tipos (associados ao dano).
- Golias: ancestral gigante entre **6** tipos.
- Humano e Tiferino: tamanho Pequeno ou Médio; Elfo/Gnomo/Tiferino: atributo para magias de linhagem/legado quando aplicável.

**Observação terminológica:** em D&D 2024 essas opções não são todas “sub-raças”. Há *linhagens* de Elfo e Gnomo, *legados* de Tiferino e *ancestralidades* dracônicas/gigantes. “Anão da Colina/Montanha” não é uma subdivisão mecânica exigida no livro básico de 2024.

**Antecedentes SRD com dados de regra:** Acólito, Criminoso, Sábio e Soldado. **Outros nomes do PHB:** Artesão, Charlatão, Animador, Fazendeiro, Guarda, Guia, Eremita, Mercador, Nobre, Marinheiro, Escriba, Viajante.

## Correções confirmadas nesta PR
1. **Clérigo:** o cadastro comercial trazia Domínio do Conhecimento (versão legada, fora das quatro opções de subclasses de 2024), em vez de Domínio da Guerra. Correção: Vida (SRD), Luz, Enganação e **Guerra** (PHB).
2. **Humano Versátil:** antes só havia quatro talentos do SRD. O PHB contém dez talentos de origem; cadastrados os seis nomes adicionais sob `fonte: phb2024`: Crafter, Healer, Lucky, Musician, Tavern Brawler, Tough. **Se o PHB não está liberado, as opções comerciais não podem ser escolhidas.**
3. Testes novos asseguram cobertura nominal das doze classes e suas subclasses, nove espécies do SRD + Aasimar, linhagens/ancestralidades e dezesseis antecedentes. Testar números NÃO comprova automaticamente todas as mecânicas.

## Lacunas importantes — ainda precisam de desenvolvimento
- **Aasimar:** espécie PHB está no seletor, mas seus traços, escolhas e progressão não estão implementados; requer leitura da fonte comercial autorizada.
- **Doze antecedentes PHB:** só os nomes no seletor; seus três atributos elegíveis, talento de origem, duas perícias, ferramenta e equipamento não são validados/aplicados automaticamente.
- **Quatro antecedentes SRD:** a ficha concede algumas proficiências automaticamente, mas não valida a distribuição de **+2/+1 ou +1/+1/+1** dentro dos três atributos permitidos nem registra integralmente escolha de ferramenta, equipamento e seleção detalhada de talentos.
- **Talentos de origem:** mesmo os disponíveis em texto aberto (Iniciado em Magia, Habilidoso etc.) ainda precisam de seletores completos para escolhas internas; seis talentos PHB adicionados são apenas metadados, não efeitos.
- **Espécies:** parte dos benefícios é exibida visualmente, mas não aplicada a todos os cálculos, magias, resistências, limitações, deslocamento e usos. A seleção de tamanho Humano/Tiferino ainda exige integração às demais informações da ficha.
- **Subclasses PHB:** 36 nomes disponíveis; sua progressão aparece como “consulte o livro”, sem implementação dos efeitos. É necessário conferir requisitos e benefícios pela fonte comercial.
- **Classes SRD:** todas as doze têm tabelas e marcos de níveis 1–20, mas nem toda característica, escolha de perícia, estilo de luta, invocação, talento, equipamento ou efeito especial é automaticamente calculado. Exigir revisão de conteúdo e cenários por nível.
- **Compatibilidade legada:** escolhas antigas de Domínio do Conhecimento não devem ser apagadas nem convertidas silenciosamente para Domínio da Guerra. Devem ser identificadas como legado/necessitando revisão do mestre.
- **Linguagem/termos:** traduções de nomes no cadastro são da plataforma e não necessariamente nomes de edição oficial em português.

## Critério de aprovação para a etapa seguinte
1. Criar um teste de criação para **cada espécie e suas escolhas**, incluindo níveis 1, 3 e 5.
2. Validar/registrar os aumentos e benefícios do antecedente sem aplicar bônus duas vezes.
3. Ligar magias raciais e de talentos à ficha, com atributo correto, usos e fonte.
4. Implementar seleção guiada de proficiências/equipamentos/talentos e suas condições por classe.
5. Testar **cada uma das 12 subclasses SRD** em seus marcos, e sinalizar claramente o que não existe no catálogo comercial.
6. Executar CI e simular mudanças de classe, espécie e antecedente sem perda de dados.

## Distinção necessária
A **PR #45** é rascunho. O site publicado pode usar `main` e **não** conter as últimas correções. Não mesclar sem executar testes e revisar o comportamento em um ambiente de homologação.

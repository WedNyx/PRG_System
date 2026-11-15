# Etapa 3 — Talentos, subclasses e magias de D&D 5e (2014)

**Status:** primeira entrega implementada na PR #53, versão `0.34.3`. Baseada na `main` após o merge da Etapa 2; a PR não foi mesclada automaticamente.

**Referência:** Livro do Jogador de D&D 5e (2014), tradução em português enviada pelo usuário. Capítulos 3 (classes, subclasses e evolução), 6 (talentos, pp. 165–172), 10 (regras de conjuração, pp. 201–205) e 11 (catálogo de magias, pp. 208–214). Conteúdo aberto do SRD 5.1 sob CC BY 4.0. Não reproduzir efeitos e descrições de regras comerciais.

## Talentos — primeira entrega

- Catálogo já existia com as 42 opções do PHB 2014. A nova validação verifica os pré-requisitos objetivos de atributo para Duelista Defensivo, Imobilizador, Líder Inspirador, Sorrateiro e Conjurador de Ritual.
- Requisitos de capacidade de conjuração e armadura são **avisos para conferência** quando a ficha não permite identificar inequivocamente a fonte do benefício; não bloquear racial/caso especial de maneira infundada.
- Talentos e incrementos de atributos **não podem gastar mais marcos do que existem** no nível da classe. Humano Variante preserva uma escolha extra de talento.
- **Efeitos automáticos verificados**: Alerta (+5 iniciativa em 2014), Robusto (+2 PV por nível de personagem) e Sortudo (3 pontos de sorte). Os efeitos são calculados sem replicar a regra distinta de 2024. Os outros efeitos, incluindo variantes e condicionais, ainda exigem aplicação própria e revisão do mestre.

## Subclasses — primeira entrega

- Metadados próprios para marcos de subclasses comerciais do PHB 2014 nas 12 classes. São referências por nível de **classe**, inclusive em multiclasse; não são concessões de efeitos do livro.
- As opções abertas do SRD 5.1 mantêm os marcos já conhecidos. A Árvore de Constelações agora indica a fonte correta (SRD 5.1 ou PHB comercial 2014).
- A ficha exibe marcos disponíveis, sem alterar atributos ao selecionar um cartão comercial.
- **Pendente:** escolhas internas de cada subclasse (totens, manobras, patronos, círculos etc.) e efeitos individualizados, recursos recarregáveis e bônus situacionais.

## Magias — primeira entrega

- Separação de magias **conhecidas** vs. **preparadas**. Tabelas de Bardo, Bruxo, Feiticeiro, Patrulheiro e arquétipos conjuradores Guerreiro/Ladino de 2014, sempre por nível da classe.
- Clérigo, Druida, Paladino e Mago calculam limite de preparação a partir de nível da classe e modificador apropriado de atributo. Grimório do Mago não é artificialmente limitado ao número de magias preparadas.
- Truques e magias extras (talento, item, mestre) não consomem o limite de magias de nível 1+. **Truques conhecidos** também possuem cotas por classe/subclasse (incluindo Cavaleiro Arcano e Trapaceiro Arcano).
- Rituais com descritor no catálogo de 2014 podem ser conjurados por Bardo, Clérigo, Druida ou Mago quando possuírem a magia no modo correto, com aviso de 10 minutos adicionais e sem consumir espaço. Bruxo e Feiticeiro requerem benefício adicional, portanto não são habilitados automaticamente.
- Concentração é um estado **manual e explícito**: uma magia de cada vez; trocar a concentração substitui a anterior. Mostra CD de Constituição, `max(10, piso(dano/2))`, sem inventar sucesso/falha nem duração.
- Campos novos passam pela normalização da ficha e pelo servidor, com categoria de permissão `pv` para o estado de concentração. Os registros de magias continuam na categoria `habilidades`.
- Os talentos registrados aparecem na árvore, com um cartão-resumo do grimório para evitar centenas de cartões.
- **Pendentes:** componentes materiais/verbal/somático, ritual de outras fontes especiais, proficiências especiais, magia de domínio/círculo/juramento, Arcana Mística de Bruxo, contramágica, efeitos individualizados e recuperação especializada.

## Critérios de segurança e compatibilidade

- Novos campos são **opcionais**, sem migração destrutiva de fichas antigas.
- A versão 2024 tem seu próprio motor e não recebe as regras antigas de Alerta, Sortudo ou Robusto.
- A API revalida os dados após permissões de mestre/jogador e antes de salvá-los; os casos de teste validam as regras puras. Requer homologação HTTP real em banco isolado para afirmar segurança ponta-a-ponta.
- Não efetuar merge sem ver o CI, prévia Vercel e realizar QA visual mínimo.

## Próximas entregas da Etapa 3

1. Talentos: escolhas internas, bônus restantes verificáveis, resistências e recursos por descanso.
2. Subclasses: decisões por marco (ex.: opções de Totem, Mestre de Batalha, Patronos), bibliotecas por fonte e ligação com pontos de uso.
3. Magias: requisitos de componentes, preparação de magia por especialidade, magia do patrono/domínio/círculo, custo de componentes e efeitos controlados; aprofundar conjuração ritual por talentos específicos.
4. Regressão 2014/2024 e homologação com mestre/jogador em banco isolado e viewport mobile.

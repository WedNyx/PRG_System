# Etapa 3 — Talentos, subclasses e magias de D&D 5e (2014)

**Status:** Etapa 3 ampliada na PR #53, versões `0.34.3` e `0.34.4`. Baseada na `main` após o merge da Etapa 2; a PR não foi mesclada automaticamente.

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
- **Pendentes:** automação de componentes com inventário, rituais de outras fontes especiais, magia de domínio/juramento e patronos, contramágica, efeitos individualizados e recuperação especializada.

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

## Ampliação em 15/11/2026 — versão 0.34.4

1. **Escolhas de subclasses registradas:** na ficha de 2014, Totens por níveis 3/6/14, Terreno do Círculo da Terra, manobras do Mestre de Batalha por níveis 3/7/10/15 e opções de Caçador por níveis 3/7/11/15. A validação recusa escolhas duplicadas ou antecipadas; trocar de subclasse limpa opções anteriores.
2. **Talentos com escolha e efeitos objetivos:** quando a ficha possui atributos-base confirmados, atributos de talentos que dão +1 podem ser selecionados e refletidos no total com limite 20. Resiliente concede proficiência na salvaguarda escolhida, além do atributo. Iniciado em Magia, Conjurador de Ritual e Adepto Elemental registram a lista/elemento escolhidos; a aplicação de seus benefícios mais específicos continua guiada pelo livro.
3. **Opções de classe:** Dádiva de Pacto do Bruxo a partir de nível 3; Metamagia do Feiticeiro (2 opções no nível 3, 3 no nível 10 e 4 no nível 17). Essas escolhas não são equivocadamente tratadas como subclasses.
4. **Arcana Mística:** Bruxo registra uma magia de cada nível 6, 7, 8 e 9 após alcançar níveis 11, 13, 15 e 17 da própria classe. Uso independente de espaços de magia, uma vez por descanso longo; ao descansar longamente, todos os usos são recuperados.
5. **Componentes e magias de Círculo:** o grimório agora registra V, S, M, material, valor e consumo após consulta ao PHB e avisa quando o componente merece conferência; **não** desconta dinheiro/itens automaticamente. Os oito terrenos do Círculo da Terra têm suas magias sempre preparadas indicadas e registradas como extras sem consumir cotas de preparação. O Druida da Terra ganha seu truque adicional no nível 2.
6. **Testes:** `dnd2014EscolhasSubclasse.test.ts`, `dnd2014OpcoesTalentos.test.ts`, `dnd2014ArcanaMistica.test.ts`, `dnd2014Componentes.test.ts`, `dnd2014OpcoesClasse.test.ts` e `dnd2014MagiasCirculo.test.ts`, além da suíte existente.

### Limites de conclusão

A plataforma oferece **escolhas orientadas e regras automáticas verificáveis**. Ainda não representa 100% de automação de todos os talentos, subclasses e magias: faltam execução situacional de benefícios comerciais, magias concedidas por todos os domínios/juramentos/patronos, custos de material efetivamente descontados do inventário e E2E autenticado com mestre/jogador em banco de teste. Esses limites permanecem explícitos para não dar efeitos errados ou prometer uma fidelidade não comprovada.

### Conferência da interface e projeção na árvore

- Preview da PR #53 `22f2af22`: navegador isolado criou ficha fictícia **Guerreiro nível 3** e selecionou **Mestre de Batalha**. Testou as manobras `Aparar` e `Ataque de Precisão`, contador 2/3, sem criação automática de poderes. Formulário de grimório exibiu V/S/M, tempo e concentração; não foi testada uma conjuração real nesse teste.
- Escolhas internas foram acrescentadas à projeção oficial da **Árvore de Constelações**: manobras/totens/terrenos escolhidos, Dádiva do Pacto, Metamagia e opções de talentos aparecem como nós de referência **sem atribuir efeitos não implementados**. Incluído teste específico em `dnd2014ArvoreEscolhas.test.ts`.
- Teste anterior de browser foi executado em desktop; viewport mobile de 2014 nesta PR, fluxo HTTP autenticado com mestre/jogador em banco de teste e efeitos condicionais comerciais ainda não estão homologados.

### Recursos de Mestre de Batalha e QA mobile

- **Dados de Superioridade (PHB p. 86–87):** Guerreiro 3–6 possui 4d8; 7–9, 5d8; 10–14, 5d10; 15–17, 6d10; 18–20, 6d12. Os dados gastos retornam após descanso curto ou longo. A ficha oferece botão de gasto e referência à característica Implacável do nível 15 sem automatizar ataques ou condições.
- **Mobile automatizado:** GitHub Actions [43674229523](https://github.com/WedNyx/PRG_System/actions/runs/43674229523) verificou ficha fictícia de Guerreiro 3, Mestre de Batalha e duas manobras nos tamanhos 320, 375, 390 e 768 px. Todas as seções verificadas passaram sem transbordamento horizontal. Foram enviados screenshots como artefatos.
- **Limites:** teste de navegador em desktop confirmou registro das manobras, mas não executou magia real em Mago; testes HTTP com mestre/jogador no banco isolado e aparelhos móveis físicos ainda pendentes. A implementação não garante automação completa de todas as descrições do PHB 2014.


## Complemento 0.34.5 — Metamagia e o recurso de Feitiçaria

O painel de escolhas do Feiticeiro (PHB 2014) agora permite gastar Pontos de Feitiçaria diretamente do recurso `feiticaria` já existente. Os valores de custo que o sistema calcula são factuais e verificáveis: Magia Acelerada = 2, Magia Aumentada = 3, Magia Duplicada = nível da magia (mínimo 1), as demais = 1. O botão não realiza a conjuração, não resolve alvo/alcance nem consome componentes; o jogador e o mestre confirmam o uso pela regra de 2014. Teste `dnd2014UsoMetamagia.test.ts` cobre saldo, opções válidas, níveis de magia e recuperação após descanso longo.

Restauração Mística do Feiticeiro de nível 20 devolve até 4 PF por descanso curto. A validação permanece por nível da classe em multiclasses e não afeta níveis inferiores.

Não há contador paralelo nem migração de banco necessária: o campo de recursos `feiticaria` já é parte da ficha. Continuam pendentes a homologação HTTP mestre/jogador em banco isolado e os efeitos condicionais especializados.

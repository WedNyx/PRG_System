/**
 * Guia do mestre: como criar a ficha em cada sistema, passo a passo, usando a ficha da plataforma.
 * Texto próprio (resumo de mecânicas). Para sistemas comerciais, o detalhe fica no livro oficial.
 */
export type GuiaSistema = { passos: string[]; automatico: string[]; dicas: string[] }

export const GUIAS: Record<string, GuiaSistema> = {
  lunethernnyis: {
    passos: [
      'Todos os 7 atributos começam em 1. Distribua 6 pontos a mais (máximo 3 em cada no nível 1).',
      'Se quiser, deixe UM atributo em 0: ele devolve 1 ponto extra para gastar em outro.',
      'Gaste 8 pontos em perícias: Praticante custa 1, Experiente 3 e Exímio 6 (só uma Exímia na criação).',
      'Anote técnicas, poderes e transformações nas listas da ficha.',
      'Deixe o XP em 0. O nível sobe sozinho pela tabela de XP.',
    ],
    automatico: ['PV = 25 + Tenacidade × 5', 'Defesa Passiva = 10 + Reflexo', 'Nível pela tabela de XP e limite de atributo por nível', 'Avisos quando passa dos pontos de atributo/perícia'],
    dicas: ['Regras ainda em aberto (ferimentos, Medicina, críticos e dano) ficam com você na mesa.', 'Use a aba de permissões da campanha para aprovar mudanças de atributo e perícia.'],
  },
  'dnd5e-srd': {
    passos: [
      'Antes de criar: confirme com o grupo que a campanha usa a revisão de 2024. A plataforma traz as regras abertas do SRD 5.2.1. Em Editar campanha, o mestre marca os livros que a mesa usa (Livro do Jogador, Guia do Mestre, Manual dos Monstros e outros pelo nome): com o Livro do Jogador liberado, as outras 36 subclasses, o Aasimar e mais 12 antecedentes aparecem nas escolhas (📕), só com o nome — as regras ficam no livro.',
      'Conversem sobre a ideia do personagem: qual é o papel dele na história e no grupo? Definam juntos expectativas, tom da aventura e quais fontes de regras o mestre autoriza.',
      'Escolha a classe. Veja o Dado de Vida, proficiências e atributo de conjuração na descrição. As escolhas de proficiências e equipamentos ainda precisam ser conferidas com o SRD e registradas manualmente.',
      'Escolha a espécie entre as 9 do SRD 5.2.1 (o Aasimar, do Livro do Jogador, aparece quando o mestre libera o livro). Na aba Árvore aparecem os traços dela e as escolhas: linhagem do Elfo e do Gnomo, ancestral do Draconato e do Golias, legado do Tiferino e o talento do Humano.',
      'Escolha o antecedente (Acólito, Criminoso, Sábio ou Soldado, os 4 do SRD). A aba Árvore mostra os atributos que ele melhora, o talento de origem, as perícias, a ferramenta e o equipamento inicial.',
      'Defina os seis atributos. Use o conjunto padrão (15, 14, 13, 12, 10, 8), a compra de 27 pontos ou a rolagem permitida pelo mestre (4d6, descartando o menor). Distribua os valores ANTES dos aumentos do antecedente.',
      'Aplique manualmente os aumentos de atributo do antecedente: +2/+1 em dois atributos permitidos ou +1/+1/+1 nos três atributos permitidos. Não aplique esse bônus novamente ao escolher a espécie.',
      'Marque as duas salvaguardas da classe como Proficiente. Escolha as perícias disponíveis da classe, some as do antecedente e registre as ferramentas e idiomas. Especialização dobra o bônus de proficiência onde a regra conceder.',
      'Selecione o equipamento inicial autorizado e registre arma, escudo, armadura, ferramentas, moedas e demais itens no inventário. Insira a CA base e o limite de Destreza; uma armadura pesada não adiciona modificador de Destreza.',
      'Confira PV. No nível 1, normalmente se usa o valor máximo do Dado de Vida da classe + modificador de Constituição, com os bônus da espécie quando houver. A ficha sugere PV pela média fixa, mas não substitui a conferência de regras especiais.',
      'Se houver magia, consulte a característica de Conjuração da classe: escolha truques, magias preparadas, espaços e foco conforme os níveis. A CD é 8 + proficiência + modificador do atributo de conjuração. A ficha calcula CD e ataque. Na aba Poderes, “Adicionar magias” mostra o catálogo do SRD filtrado pela lista da classe, com o limite de truques e magias preparadas e só os níveis com espaço; magias de subclasse, talento ou item entram como “extra”.',
      'Na aba Árvore, a progressão de 2024 mostra, nível a nível, as características das 12 classes, da subclasse, da espécie e do antecedente, a tabela da classe (fúrias, truques, espaços de magia…) e as escolhas pendentes. No modo Híbrido a árvore personalizada do mestre aparece junto.',
      'A partir do nível 3, confira a escolha de subclasse quando aplicável. Não basta marcar um nó: a ficha deve registrar a opção escolhida e o mestre deve revisar suas características, limites e fontes.',
      'Ao subir de nível, confira características, talentos, PV, espaços de magia e usos de recursos. Características automáticas da classe não custam pontos da árvore personalizada. Não duplique bônus ao registrar recursos manualmente.',
      'Antes de liberar a ficha, mestre e jogador devem fazer juntos a revisão: proficiências, atributo de conjuração, CA, PV, ataques, magias, talentos, habilidades de espécie e escolhas pendentes.',
    ],
    automatico: [
      'Modificadores de atributos: arredonda para baixo (atributo − 10) ÷ 2.',
      'Bônus de proficiência determinado pelo nível informado.',
      'Cálculo das perícias e salvaguardas marcadas como treinadas na ficha; o jogador ainda precisa escolher as proficiências corretas.',
      'Sugestão de PV por progressão simples de uma classe, conforme o Dado de Vida selecionado; regras especiais e multiclasse exigem conferência.',
      'CA calculada com base da armadura, Destreza até seu limite e bônus registrado; armaduras especiais podem exigir ajustes manuais.',
      'Iniciativa e Percepção passiva, com base nos valores registrados.',
      'CD de resistência das magias e bônus de ataque mágico conforme a classe selecionada.',
      'Progressão das 12 classes do SRD 5.2.1 (1–20), subclasses, espécies e antecedentes, com a tabela da classe no nível atual e o aviso de escolhas pendentes.', 'Proficiência automática nas salvaguardas da classe e nas perícias do antecedente e das escolhas (sem somar de novo se você também marcar).', 'Recursos da classe pela tabela: Fúrias, Inspiração de Bardo, Canalizar Divindade, Forma Selvagem, Retomar o Fôlego, Surto de Ação, Indomável, Pontos de Foco e de Feitiçaria, Cura pelas Mãos, Marca do Caçador e espaços de magia (o descanso curto enche Surto, Foco e Magia de Pacto).', 'Magias: as 339 do SRD 5.2.1 com resumo em português, limite da tabela da classe, dano e cura que crescem com o espaço e com o nível (truques), e “Conjurar” que gasta o espaço de magia.', 'Defesa sem Armadura (Bárbaro e Monge) e Resiliência Dracônica na CA e nos PV, Alerta na Iniciativa, Pau para Toda Obra e o deslocamento com Movimento Rápido, Movimento sem Armadura, Andarilho e Elfo da Floresta.',
    ],
    dicas: [
      'Regra de mesa: escolha entre Híbrido, Automático e Manual nas configurações da campanha. O modo Híbrido é o padrão e preserva a árvore autoral do mestre.',
      'A árvore oficial é uma linha do tempo, NÃO uma árvore de compra por pontos. Um Guerreiro recebe Ataque Extra no nível indicado sem gastar pontos da árvore.',
      'Todas as 12 classes do SRD estão catalogadas, com uma subclasse aberta cada. As outras subclasses, o Aasimar e os outros antecedentes do Livro do Jogador entram pelo seletor de fontes da campanha, só com o nome: nesses casos a ficha não calcula nada sozinha, marque à mão o que o livro der.',
      'Os marcos de subclasse e de talentos não aplicam efeitos automaticamente neste estágio. Consulte o livro e mantenha o histórico das escolhas.',
      'Exemplo: Guerreiro nível 3 tem a escolha de subclasse aberta no SRD. Se o jogador tentar selecioná-la no nível 2, a API rejeita a nova escolha.',
      'Multiclasse: na aba Árvore, “Classes” sobe o nível em cada classe e pega o 1º nível de uma classe nova (13 no atributo principal da nova e das atuais; o mestre pode liberar sem). A ficha soma os PV pela média do dado de cada classe, usa a tabela de Conjurador Multiclasse para os espaços e deixa cada classe preparar as próprias magias. Ganhos de proficiência ao entrar (perícia do Bardo, Ladino e Patrulheiro) ficam à mão.',
      'Exemplo de CA: uma cota de malha pesada não usa o modificador de Destreza, mesmo se negativo. Armaduras médias têm limite de Destreza; armaduras leves normalmente não têm limite.',
      'O que fica à mão: aumentos de atributo (Aumento no Valor de Atributo, Campeão Primal, Corpo e Mente), Especialização e equipamento. A ficha não soma esses valores sozinha para não contar duas vezes.', 'No modo Manual da campanha os efeitos automáticos ficam desligados: o mestre controla tudo.',
      'Use a aprovação de habilidades da campanha para revisar alterações feitas por jogadores. As escolhas novas são verificadas contra classe e nível no servidor.',
      'Em caso de dúvida, abra o SRD oficial: https://www.dndbeyond.com/srd — licença CC BY 4.0. Os conteúdos comerciais não são reproduzidos integralmente neste guia.',
    ],
  },
  pf2e: {
    passos: [
      'Escolha ancestralidade e classe na lista (a descrição mostra PV, atributo-chave e os graus iniciais) e escreva o antecedente.',
      'Atributos são modificadores: todos começam em 0. Aplique os aumentos (+1) e falhas (−1) da ancestralidade, do antecedente, da classe e os 4 aumentos livres. Na criação, nenhum passa de +4.',
      'Escolha o atributo-chave. Marque os graus de Percepção e salvamentos pela classe e as perícias treinadas pela classe, antecedente e Inteligência.',
      'Se lança magias, escolha o atributo das magias e o grau (Treinado = 2).',
      'Coloque o grau em armadura (normalmente Treinado = 2), o bônus de item e o limite de Destreza da armadura.',
    ],
    automatico: ['PV = ancestralidade + (classe + CON) × nível', 'Proficiência = grau + nível (Treinado +2, Especialista +4, Mestre +6, Lendário +8)', 'Perícias, salvamentos e Percepção', 'CA com limite de Destreza', 'CD de classe, CD de magia e ataque mágico'],
    dicas: ['Comece cada sessão com 1 Ponto de Heroísmo (máximo 3).', 'Morrendo = 1 + Ferido ao cair a 0 PV; Morrendo 4 é a morte.'],
  },
  'fate-core': {
    passos: [
      'Escreva o Conceito (aspecto principal) e a Dificuldade. Depois, mais três aspectos: a sua aventura e dois caminhos cruzados com outros personagens.',
      'Monte a pirâmide de perícias: 1 Ótima (+4), 2 Boas (+3), 3 Razoáveis (+2) e 4 Regulares (+1). O resto fica Medíocre (+0).',
      'Escolha 3 façanhas grátis. Quer mais? Anote em “Façanhas além das 3 grátis”: cada uma tira 1 da recarga (mínimo 1).',
      'Comece a sessão com Pontos de Destino iguais à recarga.',
    ],
    automatico: ['Rolagem 4dF + perícia tocando no valor', 'Caixas de estresse físico (Vigor) e mental (Vontade), começando vazias', 'Recarga com as façanhas extras e consequência suave extra com perícia Excepcional', 'Avisos se a pirâmide passar do limite'],
    dicas: ['Consequências: suave absorve 2, moderada 4, severa 6.', 'As caixas de estresse se limpam no fim do conflito (ou no descanso da ficha).'],
  },
  blades: {
    passos: [
      'Escolha a cartilha (a descrição mostra as ações que ela dá), a herança e o antecedente; escreva apelido, bando, vício e aparência.',
      'Distribua 7 pontos de ação: 3 vêm da cartilha, 4 são livres. Nenhuma ação passa de 2 pontos na criação.',
      'Escolha uma habilidade especial da cartilha e anote amigos e rivais.',
      'Antes de cada golpe, escolha a carga (Leve 3, Normal 5, Pesada 6).',
    ],
    automatico: ['Ação: toque no número de dados; a ficha rola, fica com o maior e diz se foi sucesso total, com custo, falha ou crítico', 'Resistência por Perspicácia, Proeza e Determinação, com o custo de estresse', 'Estresse, trauma, armadura, XP, cura e moedas começam vazios', 'Avisos de pontos de ação na criação'],
    dicas: ['Sem pontos na ação: role 2d6 e fique com o MENOR (a ficha já faz).', 'Estresse passa de 9? Ganhe 1 trauma e o estresse zera.'],
  },
  brp: {
    passos: [
      'Role as características: FOR, CON, POD, DES e CAR com 3d6; TAM e INT com 2d6+6 (EDU com 2d6+6, se a campanha usar). Dá para trocar até 3 pontos entre elas.',
      'Escolha o nível de poder da campanha (Normal, Heroico, Épico ou Super-humano) e a ocupação.',
      'As perícias já começam no valor-base. Some os pontos da ocupação (250 no nível Normal) e os pessoais (INT × 10).',
      'Anote armas (porcentagem, dano e alcance) e equipamento.',
    ],
    automatico: ['PV = (CON + TAM) ÷ 2 e ferimento grave (metade dos PV)', 'Pontos de Poder = POD', 'Esforço, Vigor, Ideia, Sorte, Agilidade, Charme e Saber (×5)', 'FOR + TAM com a tabela de modificador de dano', 'Teste com crítico (1/20), especial (1/5) e desastre', 'Aviso de perícia acima do máximo do nível de poder'],
    dicas: ['Sanidade é opcional; use em campanhas de horror.', 'Fichas antigas com APA (Aparência) passam a usar CAR (Carisma) com o mesmo valor.'],
  },
  'faroeste-arcano': {
    passos: [
      'Escolha raça e estigma (do livro) e escreva nos campos.',
      'Gere os atributos (ex.: 4d6, descarta o menor) e aplique os ajustes da raça.',
      'Coloque 1 nível na classe inicial (Desgarrado, Pistoleiro ou Rastreador). Em multiclasse, preencha o nível em cada uma.',
      'Distribua as graduações de perícia: máximo de nível + 3 em perícias de classe (metade nas outras).',
      'Preencha armadura, deflexão e bônus de tamanho; anote armas, talentos, magias e equipamentos.',
    ],
    automatico: ['Bônus base de ataque, CA de classe, iniciativa e resistências pelas tabelas (somando multiclasse)', 'Ataques corpo a corpo, à distância e agarrar', 'CA normal, de toque e surpresa', 'Perícias com o melhor atributo quando há dois'],
    dicas: ['Reputação dá bônus em Conversar e Intimidação (veja as observações no fim da ficha).', 'PV: anote o máximo manualmente (dado de vida da classe + CON por nível).', 'A ficha mostra o XP necessário para o próximo nível; dano contusivo some no descanso.'],
  },
  'ordem-paranormal': {
    passos: [
      'Escolha a classe (Combatente, Especialista ou Ocultista) e escreva a origem. Comece com NEX 5%; a trilha vem no NEX 10%.',
      'Atributos começam em 1: distribua 4 pontos (máximo 3 em cada). Pode baixar um para 0 e ganhar 1 ponto a mais.',
      'Marque como Treinado as perícias da classe e da origem, mais tantas quanto o seu Intelecto.',
      'Preencha as proteções (bônus de Defesa). PV, PE e Sanidade saem sozinhos da classe e do NEX.',
      'Anote rituais, habilidades e inventário.',
    ],
    automatico: ['PV, PE e Sanidade pela classe e pelo NEX', 'Nível de NEX, limite de PE por turno e DT dos rituais', 'Defesa = 10 + Agilidade + proteções (e com Esquiva)', 'Testes: um d20 por ponto do atributo, fica o maior, + treino (+5/+10/+15)', 'Espaços de carga = Força × 5', 'Avisos de pontos de atributo e de perícias treinadas'],
    dicas: ['A cada NEX 20%, 50%, 80% e 95% ganhe +1 ponto de atributo: a ficha aceita sem avisar.', 'Na mesa, ataques e iniciativa também rolam a parada de d20 do atributo.', 'Poderes, rituais e textos ficam no livro oficial.'],
  },
  'mork-borg': {
    passos: [
      'Escolha a classe (ou jogue sem classe). A descrição mostra o dado de PV, os Presságios, a prata e o que muda nas habilidades.',
      'Role 3d6 para cada habilidade (Agilidade, Presença, Força, Resistência) e anote o valor da tabela do livro, de −3 a +3, já com o ajuste da classe.',
      'Role os PV (Resistência + o dado da classe, no mínimo 1), os Presságios e a prata, e preencha os máximos nas barras.',
      'Role arma, armadura e equipamento nas tabelas do livro. Marque a armadura na ficha e anote armas e pergaminhos nas listas.',
      'Dê um nome, se quiser. Isso não vai te salvar.',
    ],
    automatico: ['Teste: d20 + habilidade, mostrado ao tocar no valor', 'CD da defesa e dos testes de Agilidade pela armadura (e pelo Desertor feroz)', 'Itens que dá para carregar = Força + 8', 'Lembretes do dado de PV, dos Presságios e dos usos de Poderes'],
    dicas: ['Na mesa, quem rola é o jogador: ataque e defesa. Os inimigos não rolam.', 'Ao progredir, role 6d10 para mais PV e um d6 contra cada habilidade, como no livro.', 'Tabelas, pergaminhos, classes completas e o cenário ficam no livro oficial.'],
  },
  assimilacao: {
    passos: [
      'Dê um nome e escreva as Origens: um Evento Marcante (passado) e uma Ocupação (atual). Escolha a Geração.',
      'Escreva dois Propósitos Pessoais. Com o grupo, cada um sugere um Propósito Coletivo e cada Infectado fica com dois.',
      'Instintos começam em 1: distribua mais 3 pontos (máximo 3 em cada). A ficha avisa se passar.',
      'Distribua 7 pontos entre Conhecimentos e Práticas (máximo 2 em cada; podem ficar em 0).',
      'Cabo de guerra: Assimilação 1 (Determinação 9), a menos que o Assimilador diga outro valor.',
      'Gaste os 7 de Experiência em Características (anote na lista com o custo) e escolha o pacote de equipamentos.',
    ],
    automatico: ['Pontos de Saúde por nível = 1 + Potência + Resolução, nos seis níveis', 'Recuperação = Potência + 1', 'Nível de Determinação = 10 − Assimilação, e as barras de pontos de cada um', 'Avisos dos pontos de Instinto, Conhecimentos e Práticas na criação', 'Teste com os dados de símbolos (gasta a Determinação e a Assimilação usadas), Teste de Assimilação que anota as Pressões e rolagem de dano'],
    dicas: ['Para testar, escolha o Instinto e a aptidão na aba de atributos: a ficha rola os d6 e d10, mostra os símbolos e sugere o dado a manter. Determinação, Origens e Agir por Instinto mantêm mais dados (até 4).', 'Marque as Pressões guardadas a cada Teste de Assimilação: com 10, o Infectado passa para o Assimilador.', 'Características, Assimilações (cartas), equipamentos e o cenário ficam no livro oficial.'],
  },
  tormenta20: {
    passos: [
      'Escolha raça e classe na lista (a descrição mostra os modificadores da raça e o que a classe dá). Escreva origem e divindade.',
      'Defina os atributos (compra de pontos ou rolagem, conforme o livro) e some os modificadores da raça.',
      'Se a classe lança magias, escolha o “Atributo das magias” (Arcanista: Inteligência ou Carisma; Bardo: Carisma; Clérigo e Druida: Sabedoria).',
      'Marque as perícias treinadas pela classe, pela origem e pela Inteligência: a ficha avisa se passar.',
      'Escolha o tipo de armadura e preencha os bônus de armadura e escudo. Anote ataques, poderes e magias.',
    ],
    automatico: ['PV e PM pela classe e pelo nível (com Constituição e atributo das magias)', 'Perícias = metade do nível + atributo + treino (+2, +4 no 7º, +6 no 15º)', 'Defesa = 10 + Destreza (não com armadura pesada) + armadura, escudo e outros', 'CD das magias = 10 + metade do nível + atributo', 'Espaços de carga = 10 + 2 × Força'],
    dicas: ['Digitou outro máximo de PV ou PM na barra? Ele passa a valer (para poderes que dão PV extra).', 'Poderes, magias e textos ficam no livro oficial.'],
  },
  livre: {
    passos: [
      'Escreva o nome do sistema e o conceito do personagem.',
      'Liste atributos e perícias nos campos de texto do jeito que o seu livro pede.',
      'Use os recursos (Vida, Energia, Mente) e as listas para o resto.',
    ],
    automatico: ['Nada é calculado: é uma ficha em branco organizada.'],
    dicas: ['Ideal para sistemas que ainda não estão na plataforma, como Assimilação.'],
  },
}

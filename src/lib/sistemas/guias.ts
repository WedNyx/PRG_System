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
      'Escolha classe, espécie e antecedente na lista: a descrição mostra o Dado de Vida, as salvaguardas e o que o antecedente dá.',
      'Gere os atributos: conjunto padrão (15, 14, 13, 12, 10, 8), compra de 27 pontos ou rolagem (4d6, descarta o menor). Some os bônus do antecedente (+2/+1 ou +1/+1/+1).',
      'Marque como Proficiente as duas salvaguardas da classe e as perícias da classe e do antecedente. Especialista dobra a proficiência.',
      'Preencha a armadura: CA base (couro 11, cota de malha 16…), limite de Destreza (média 2, pesada 0) e escudo (+2).',
      'Anote ataques, magias, talentos, proficiências e equipamento nas listas.',
    ],
    automatico: ['Modificadores (valor − 10) ÷ 2', 'Bônus de proficiência pelo nível', 'PV pela média fixa com o Dado de Vida da classe (anão: +1 por nível)', 'Perícias e salvaguardas', 'CA com limite de Destreza', 'Iniciativa e Percepção passiva', 'CD e ataque de magia pelo atributo da classe'],
    dicas: ['Atributos acima de 20 só com itens mágicos ou efeitos especiais: a ficha avisa.', 'Exaustão: cada nível tira 2 dos testes de d20; no 6º, o personagem morre.'],
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

/**
 * Como a ficha de papel de cada jogo é organizada (pesquisa v0.36.6, em palavras nossas).
 * Serve de roteiro no modo ✏️ Criação: a ordem em que o grupo costuma preencher. Não muda regra nem calcula nada.
 * Fontes: fichas e guias públicos de cada editora (D&D Beyond/Wizards, Paizo, Evil Hat, One Seven/Evil Hat,
 * Chaosium, Free League/Stockholm Kartell, Jambô, Cellbit, editoras dos demais) — ver docs/sistemas/FICHAS_OFICIAIS.md.
 */
export const FICHA_OFICIAL: Record<string, { ordem: string[]; dica: string }> = {
  'dnd5e-srd': { ordem: ['Identidade e origem', 'Atributos, salvaguardas e perícias', 'CA, PV, Dados de Vida e testes contra a morte', 'Ataques e conjuração', 'Características, talentos e equipamento', 'Magias (página própria)'], dica: 'Na ficha de 2024, cada perícia e salvaguarda fica embaixo do atributo dela.' },
  pf2e: { ordem: ['Ascendência, herança, antecedente e classe', 'Atributos', 'Defesas (CA, salvamentos) e PV', 'Percepção e perícias (T/E/M/L)', 'Golpes', 'Talentos e inventário (Volume)', 'Ações, notas e magias'], dica: 'Página 1 é o combate; página 2, talentos e inventário; as magias têm página própria.' },
  'ordem-paranormal': { ordem: ['Agente: nome, origem, classe, NEX e trilha', 'Atributos (AGI, FOR, INT, PRE, VIG)', 'PV, PE e Sanidade; Defesa', 'Perícias e treinamento', 'Poderes e rituais (elemento e círculo)', 'Inventário e patente'], dica: 'Os rituais ficam agrupados por elemento: Sangue, Morte, Conhecimento, Energia e Medo.' },
  tormenta20: { ordem: ['Raça, origem, classe e nível', 'Atributos', 'PV, PM e Defesa', 'Perícias', 'Ataques', 'Poderes e magias', 'Equipamento e tibares'], dica: 'Poderes de raça, origem e classe costumam ficar juntos numa lista.' },
  'fate-core': { ordem: ['Aspectos (conceito, dificuldade e outros)', 'Perícias na escada', 'Façanhas', 'Estresse e consequências', 'Recarga e pontos de destino'], dica: 'A ficha é curta: o coração dela são os aspectos.' },
  blades: { ordem: ['Nome, alcunha, origem e herança', 'Estresse e trauma', 'Dano e armadura', 'Ações (Discernir, Destreza, Determinação)', 'Habilidades especiais', 'Amigos e rivais', 'Carga e itens'], dica: 'No cartaz do personagem, as ações ficam em três colunas de atributos.' },
  'call-of-cthulhu': { ordem: ['Investigador: ocupação, idade, residência', 'Características (FOR, CON, TAM, DES, APA, INT, POD, EDU)', 'PV, PM, Sanidade e Sorte', 'Perícias com ½ e ⅕', 'Armas e combate', 'Verso: história, ideologia, pessoas e lugares significativos, posses'], dica: 'A história do investigador fica no verso da ficha.' },
  brp: { ordem: ['Personagem e cultura', 'Características', 'PV, PP e outros valores', 'Perícias em porcentagem', 'Armas e armadura', 'Poderes e notas'], dica: 'Marque a experiência nas perícias usadas com sucesso.' },
  'faroeste-arcano': { ordem: ['Pistoleiro: nome, origem e classe', 'Atributos e modificadores', 'PV, defesa e recursos', 'Perícias e truques', 'Armas e munição', 'Recompensa e crimes'], dica: 'O cartaz de PROCURADO fica no topo da ficha.' },
  'mork-borg': { ordem: ['Nome e classe', 'Força, Agilidade, Presença e Resistência', 'PV e Presságios', 'Armas, armadura e escudo', 'Equipamento e prata', 'Pergaminhos e poderes do dia', 'Traços terríveis, corpo quebrado, maus hábitos'], dica: 'Ficha de uma página, pesada e torta como o jogo.' },
  assimilacao: { ordem: ['Infectado: nome, ocupação e origem', 'Instintos', 'Conhecimentos e Práticas', 'Saúde (6 níveis)', 'Determinação e Assimilação', 'Características e mutações', 'Equipamento e pressões'], dica: 'Determinação e Assimilação puxam uma contra a outra.' },
  opositores: { ordem: ['Identidade sob a lua', 'Sete atributos', 'Perícias por grupo e grau', 'Defesa, PV, esquivas e guarda', 'Poderes e legado', 'Relíquias e anotações'], dica: 'Sistema autoral do Wed (Lunethernnyis).' },
  nova: { ordem: ['Perfil do agente N.O.V.A', 'Físico, Psicológico, Alma e Clarividência (graus de dado)', 'Vivências', 'Vida, Horror e Clareza', 'Rede de habilidades', 'Equipamento e registro'], dica: 'Sistema autoral do godgamer.' },
  marcas: { ordem: ['Portador', 'Atributos e perícias', 'Marcas e níveis', 'Transformações e invocações', 'Efeitos ativos', 'Pertences e orbes'], dica: 'Sistema autoral do JOJO.' },
}

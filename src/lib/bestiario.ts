export type Monstro = {
  id: string
  nome: string
  hp: number
  ca: number
  cor: string
  ataques: string
  descricao: string
}

/**
 * Bestiário básico com criaturas clássicas de fantasia.
 * O mestre adiciona qualquer uma como NPC com um clique.
 */
export const bestiario: Monstro[] = [
  { id: 'goblin', nome: 'Goblin', hp: 7, ca: 15, cor: '#84cc16', ataques: 'Cimitarra +4 (1d6+2)\nArco curto +4 (1d6+2)', descricao: 'Pequeno, covarde e traiçoeiro. Ataca em bandos.' },
  { id: 'goblin-chefe', nome: 'Goblin Chefe', hp: 21, ca: 17, cor: '#65a30d', ataques: 'Cimitarra +4 (1d6+2), 2 ataques', descricao: 'Líder brutal de um bando de goblins.' },
  { id: 'orc', nome: 'Orc', hp: 15, ca: 13, cor: '#16a34a', ataques: 'Machadão +5 (1d12+3)\nAzagaia +5 (1d6+3)', descricao: 'Guerreiro selvagem e agressivo.' },
  { id: 'lobo', nome: 'Lobo', hp: 11, ca: 13, cor: '#94a3b8', ataques: 'Mordida +4 (2d4+2, derruba CD 11)', descricao: 'Caça em matilha, derruba as presas.' },
  { id: 'lobo-atroz', nome: 'Lobo Atroz', hp: 37, ca: 14, cor: '#64748b', ataques: 'Mordida +5 (2d6+3, derruba CD 13)', descricao: 'Lobo gigante das florestas antigas.' },
  { id: 'esqueleto', nome: 'Esqueleto', hp: 13, ca: 13, cor: '#e2e8f0', ataques: 'Espada curta +4 (1d6+2)\nArco +4 (1d6+2)', descricao: 'Morto-vivo obediente. Vulnerável a dano de concussão.' },
  { id: 'zumbi', nome: 'Zumbi', hp: 22, ca: 8, cor: '#a3e635', ataques: 'Pancada +3 (1d6+1)', descricao: 'Lento, mas difícil de derrubar (Fortitude de Morto-Vivo).' },
  { id: 'kobold', nome: 'Kobold', hp: 5, ca: 12, cor: '#f87171', ataques: 'Adaga +4 (1d4+2)\nFunda +4 (1d4+2)', descricao: 'Fraco sozinho, perigoso em números (Táticas de Matilha).' },
  { id: 'bandido', nome: 'Bandido', hp: 11, ca: 12, cor: '#a16207', ataques: 'Cimitarra +3 (1d6+1)\nBesta leve +3 (1d8+1)', descricao: 'Fora da lei em busca de ouro fácil.' },
  { id: 'cultista', nome: 'Cultista', hp: 9, ca: 12, cor: '#7c3aed', ataques: 'Cimitarra +3 (1d6+1)', descricao: 'Devoto fanático de poderes sombrios.' },
  { id: 'ogro', nome: 'Ogro', hp: 59, ca: 11, cor: '#ca8a04', ataques: 'Clava grande +6 (2d8+4)', descricao: 'Bruto enorme, estúpido e faminto.' },
  { id: 'troll', nome: 'Troll', hp: 84, ca: 15, cor: '#059669', ataques: 'Mordida +7 (1d6+4) e 2 garras +7 (2d6+4)', descricao: 'Regenera 10 HP por turno (exceto fogo/ácido).' },
  { id: 'urso-coruja', nome: 'Urso-Coruja', hp: 59, ca: 13, cor: '#92400e', ataques: 'Bico +7 (1d10+5) e garras +7 (2d8+5)', descricao: 'Híbrido feroz e territorial.' },
  { id: 'dragao-jovem', nome: 'Dragão Vermelho Jovem', hp: 178, ca: 18, cor: '#dc2626', ataques: 'Mordida +10 (2d10+6 + 1d6 fogo)\nSopro de Fogo CD 17 (16d6)', descricao: 'Arrogante, ganancioso e letal. O clímax de qualquer aventura.' },
  { id: 'lich', nome: 'Lich', hp: 135, ca: 17, cor: '#4c1d95', ataques: 'Toque paralisante +12 (3d6 gélido)\nMagias de 9º círculo', descricao: 'Arquimago morto-vivo. Guarda sua alma em uma filactéria.' },
]

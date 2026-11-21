/**
 * Arsenal da Ordem (v0.36.6, vindo da PR #68): armas e munições de Ordem Paranormal.
 * Só as estatísticas de jogo (dano, crítico, categoria, tipo, alcance e espaços); as descrições são nossas,
 * sem texto do livro. O "peso" aqui são espaços de inventário. Nada é calculado na ficha: é só um modelo para copiar.
 */
import type { ItemArsenal } from './arsenal'

type Arma = [nome: string, icone: string, espacos: number, dano: string, categoria: string, critico: string, tipo: string, alcance: number, descricao: string]
const ARMAS: Arma[] = [
  ['Faca', 'gi:lorc/plain-dagger', 1, '1d4', '0', '19/x2', 'Corte', 9, 'Lâmina curta, fácil de esconder; também pode ser arremessada.'],
  ['Martelo', 'gi:delapouite/warhammer', 1, '1d6', '0', '20/x2', 'Impacto', 0, 'Ferramenta que vira arma num aperto.'],
  ['Punhal', 'gi:lorc/broad-dagger', 1, '1d4', '0', '20/x3', 'Perfuração', 0, 'Lâmina fina para golpes precisos.'],
  ['Machete', 'gi:lorc/machete', 1, '1d6', '0', '19/x2', 'Corte', 0, 'Lâmina larga de mato.'],
  ['Lança', 'gi:lorc/barbed-spear', 1, '1d6', '0', '20/x2', 'Perfuração', 9, 'Haste com ponta; dá para arremessar.'],
  ['Machadinha', 'gi:delapouite/hatchet', 1, '1d6', '0', '20/x3', 'Corte', 9, 'Machado pequeno, de uma mão.'],
  ['Arco', 'gi:delapouite/bow-arrow', 2, '1d6', '0', '20/x3', 'Perfuração', 18, 'Arma de disparo silenciosa; usa flechas.'],
  ['Besta', 'gi:carl-olsen/crossbow', 2, '1d8', '0', '19/x2', 'Perfuração', 18, 'Dispara virotes com força; recarga lenta.'],
  ['Pistola', 'gi:john-colburn/pistol-gun', 1, '1d12', 'I', '18/x2', 'Balístico', 9, 'Arma de fogo leve; usa balas curtas.'],
  ['Revólver', 'gi:delapouite/revolver', 1, '2d6', 'I', '19/x3', 'Balístico', 9, 'Tambor de seis tiros; usa balas curtas.'],
]
/** Rolagem do crítico: o dano com os dados multiplicados (ex.: 1d6 com x3 → 3d6). */
const critico = (dano: string, mult: string) => dano.replace(/^(\d+)d/, (_, n) => (Number(n) * Number(mult.split('x')[1] || 2)) + 'd')

export const ARSENAL_ORDEM: ItemArsenal[] = [
  ...ARMAS.map(([nome, icone, peso, dano, cat, crit, tipo, alcance, texto]): ItemArsenal => ({
    nome, icone, peso, dano, categoria: 'arma', ...(alcance ? { alcance } : {}),
    descricao: `Categoria ${cat} · Crítico ${crit} · ${tipo} · ${texto}`,
    rolagens: [{ nome: 'Crítico', expr: critico(dano, crit) }],
  })),
  ...([['Balas curtas', '0', 'Para pistolas e revólveres.'], ['Balas longas', 'I', 'Para fuzis e espingardas.'], ['Flechas', '0', 'Para arcos.']] as const)
    .map(([nome, cat, texto]): ItemArsenal => ({ nome, categoria: 'equipamento', icone: 'gi:sbed/ammo-box', peso: 1, descricao: `Munição · Categoria ${cat} · ${texto}` })),
]

/**
 * Arsenal de cada sistema (v0.36.6): armas com o dano do jogo e a rolagem de crítico do jeito daquele sistema.
 * Sistemas de licença aberta (Pathfinder ORC, BRP ORC, Fate CC BY, Blades CC BY) trazem descrições nossas;
 * os comerciais (Ordem, Tormenta20, Call of Cthulhu, MÖRK BORG) trazem só nomes e números — o efeito fica no livro.
 * Tudo é modelo para copiar: depois de adicionar, a pessoa edita o que quiser. Nada é aplicado sozinho na ficha.
 */
import type { ItemArsenal } from './arsenal'
import { ARSENAL_ORDEM } from './arsenalOrdem'

export type ArsenalSistema = {
  titulo: string
  /** Como o crítico funciona neste jogo (frase nossa). */
  critico: string
  /** De onde vêm os números. */
  fonte: string
  /** Nome do que o "peso" significa neste sistema (kg, Volume, espaços, carga). */
  peso: string
  itens: ItemArsenal[]
}

// ---------------------------------------------------------------- rolagens de crítico

type Termos = { dados: { n: number; f: number }[]; k: number }
function ler(dano: string): Termos | null {
  const t = dano.toLowerCase().replace(/\s+/g, '').match(/[+-]?[^+-]+/g)
  if (!t) return null
  const r: Termos = { dados: [], k: 0 }
  for (const x of t) {
    const m = x.match(/^([+-]?)(\d*)d(\d+)$/)
    if (m) { r.dados.push({ n: (m[1] === '-' ? -1 : 1) * Number(m[2] || 1), f: Number(m[3]) }); continue }
    if (/^[+-]?\d+$/.test(x)) { r.k += Number(x); continue }
    return null
  }
  return r
}
const montar = (t: Termos) => [...t.dados.map(d => `${d.n}d${d.f}`), ...(t.k ? [String(t.k)] : [])].join('+').replace(/\+-/g, '-')
/** Multiplica os dados (e, se pedir, os números fixos): 1d8 ×3 → 3d8. */
export function multiplicarDano(dano: string, vezes: number, constantes = false): string {
  const t = ler(dano); if (!t) return dano
  return montar({ dados: t.dados.map(d => ({ n: d.n * vezes, f: d.f })), k: constantes ? t.k * vezes : t.k })
}
/** Dano máximo (todos os dados no máximo). */
export function danoMaximo(dano: string): number {
  const t = ler(dano); if (!t) return 0
  return t.dados.reduce((s, d) => s + d.n * d.f, 0) + t.k
}
/** Máximo + rolagem de novo (empalar no CoC; sucesso especial no BRP): 1d8+1 → 9+1d8+1. */
export const maximoMaisRolagem = (dano: string) => `${danoMaximo(dano)}+${dano}`

// ---------------------------------------------------------------- Pathfinder 2e (ORC)

const PF_TRACOS: Record<string, string> = {
  'ágil': 'Ágil: o segundo e o terceiro ataque do turno sofrem −4 e −8 (em vez de −5 e −10).',
  'acuidade': 'Acuidade: pode usar Destreza no ataque.',
  'arremesso': 'Arremesso: pode ser jogada; o número é o incremento de distância.',
  'versátil': 'Versátil: pode causar o outro tipo de dano indicado.',
  'mortal': 'Mortal: no acerto crítico, soma mais um dado do tamanho indicado.',
  'fatal': 'Fatal: no acerto crítico, os dados viram do tamanho indicado e soma mais um.',
  'alcance': 'Alcance: ataca até 3 m de distância.',
  'empurrar': 'Empurrar: pode usar a arma para empurrar.', 'derrubar': 'Derrubar: pode usar a arma para derrubar.', 'desarmar': 'Desarmar: pode usar a arma para desarmar.',
  'varrer': 'Varredura: +1 no ataque contra um alvo diferente do que já atacou no turno.',
  'contundente': 'Forçosa: a partir do segundo ataque do turno, soma dano por dado.',
  'retorno': 'Volta: +1 no ataque depois de já ter atacado no turno.',
  'duas mãos': 'Duas mãos: usada com as duas mãos, o dado de dano aumenta.',
  'mão livre': 'Mão livre: deixa a mão livre para segurar outras coisas.',
  'não letal': 'Não letal: os golpes deixam inconsciente em vez de matar.',
  'recarga': 'Recarga: quantas ações para recarregar depois de cada disparo.',
  'rajada': 'Rajada: −2 no ataque contra alvos a menos de 9 m.',
  'propulsora': 'Propulsora: soma metade da Força no dano.',
  'abertura': 'Arma de cavalaria (justa): melhor montado.',
}
type Pf = [nome: string, icone: string, volume: number, dano: string, tipo: 'P' | 'S' | 'B', grupo: 'Simples' | 'Marcial', tracos: string[], alcance?: number]
const PF: Pf[] = [
  ['Adaga', 'lorc/plain-dagger', 0.1, '1d4', 'P', 'Simples', ['ágil', 'acuidade', 'arremesso 3 m', 'versátil S']],
  ['Clava', 'delapouite/bone-mace', 1, '1d6', 'B', 'Simples', ['arremesso 3 m']],
  ['Lança', 'lorc/barbed-spear', 1, '1d6', 'P', 'Simples', ['arremesso 6 m']],
  ['Lança longa', 'delapouite/sharp-halberd', 2, '1d8', 'P', 'Simples', ['alcance']],
  ['Maça', 'delapouite/flanged-mace', 1, '1d6', 'B', 'Simples', ['empurrar']],
  ['Maça leve', 'lorc/mace-head', 0.1, '1d4', 'B', 'Simples', ['ágil', 'acuidade', 'empurrar']],
  ['Estrela-d\'alva', 'lorc/spiked-mace', 1, '1d6', 'B', 'Simples', ['versátil P']],
  ['Foice', 'delapouite/sickle', 0.1, '1d4', 'S', 'Simples', ['ágil', 'acuidade', 'derrubar']],
  ['Bordão', 'lorc/wizard-staff', 1, '1d4', 'B', 'Simples', ['duas mãos d8', 'mão livre']],
  ['Manopla', 'delapouite/gauntlet', 0.1, '1d4', 'B', 'Simples', ['ágil', 'mão livre']],
  ['Besta', 'carl-olsen/crossbow', 1, '1d8', 'P', 'Simples', ['recarga 1'], 36],
  ['Besta pesada', 'carl-olsen/crossbow', 2, '1d10', 'P', 'Simples', ['recarga 2'], 36],
  ['Azagaia', 'lorc/thrown-spear', 0.1, '1d6', 'P', 'Simples', ['arremesso'], 9],
  ['Funda', 'delapouite/sling', 0.1, '1d6', 'B', 'Simples', ['propulsora', 'recarga 1'], 15],
  ['Dardo', 'delapouite/dart', 0.1, '1d4', 'P', 'Simples', ['ágil', 'arremesso'], 6],
  ['Espada bastarda', 'lorc/broadsword', 1, '1d8', 'S', 'Marcial', ['duas mãos d12']],
  ['Machado de batalha', 'lorc/battle-axe', 1, '1d8', 'S', 'Marcial', ['varrer']],
  ['Falcione', 'delapouite/two-handed-sword', 2, '1d10', 'S', 'Marcial', ['contundente', 'varrer']],
  ['Glaive', 'delapouite/glaive', 2, '1d8', 'S', 'Marcial', ['mortal d8', 'contundente', 'alcance']],
  ['Machado grande', 'delapouite/war-axe', 2, '1d12', 'S', 'Marcial', ['varrer']],
  ['Clava grande', 'delapouite/baseball-bat', 2, '1d10', 'B', 'Marcial', ['retorno', 'empurrar']],
  ['Espada grande', 'delapouite/two-handed-sword', 2, '1d12', 'S', 'Marcial', ['versátil P']],
  ['Alabarda', 'lorc/halberd', 2, '1d10', 'P', 'Marcial', ['alcance', 'versátil S']],
  ['Martelo leve', 'delapouite/warhammer', 0.1, '1d6', 'B', 'Marcial', ['ágil', 'arremesso 6 m']],
  ['Espada longa', 'lorc/broadsword', 1, '1d8', 'S', 'Marcial', ['versátil P']],
  ['Malho', 'delapouite/warhammer', 2, '1d12', 'B', 'Marcial', ['empurrar']],
  ['Picareta de guerra', 'delapouite/war-pick', 1, '1d6', 'P', 'Marcial', ['fatal d10']],
  ['Rapieira', 'lorc/stiletto', 1, '1d6', 'P', 'Marcial', ['mortal d8', 'desarmar', 'acuidade']],
  ['Cimitarra', 'delapouite/katana', 1, '1d6', 'S', 'Marcial', ['contundente', 'varrer']],
  ['Espada curta', 'lorc/broad-dagger', 0.1, '1d6', 'P', 'Marcial', ['ágil', 'acuidade', 'versátil S']],
  ['Tridente', 'lorc/harpoon-trident', 1, '1d8', 'P', 'Marcial', ['arremesso 6 m']],
  ['Martelo de guerra', 'delapouite/warhammer', 1, '1d8', 'B', 'Marcial', ['empurrar']],
  ['Chicote', 'lorc/whip', 1, '1d4', 'S', 'Marcial', ['desarmar', 'acuidade', 'não letal', 'alcance', 'derrubar']],
  ['Mangual', 'delapouite/flail', 1, '1d6', 'B', 'Marcial', ['desarmar', 'varrer', 'derrubar']],
  ['Gadanho', 'lorc/scythe', 2, '1d10', 'S', 'Marcial', ['mortal d10', 'derrubar']],
  ['Arco longo', 'delapouite/bow-arrow', 2, '1d8', 'P', 'Marcial', ['mortal d10', 'rajada'], 30],
  ['Arco curto', 'delapouite/bow-arrow', 1, '1d6', 'P', 'Marcial', ['mortal d10'], 18],
]
const TIPO_PF = { P: 'perfuração', S: 'corte', B: 'concussão' }
function itemPf([nome, icone, peso, dano, tipo, grupo, tracos, alcance]: Pf): ItemArsenal {
  const mortal = tracos.find(t => t.startsWith('mortal'))?.split(' ')[1], fatal = tracos.find(t => t.startsWith('fatal'))?.split(' ')[1]
  const base = fatal ? dano.replace(/d\d+/, fatal) : dano
  const critico = multiplicarDano(base, 2, true) + (mortal ? '+1' + mortal : '') + (fatal ? '+1' + fatal : '')
  const explica = [...new Set(tracos.map(t => PF_TRACOS[t.replace(/ .*$/, '')] ?? PF_TRACOS[t]).filter(Boolean))]
  return { nome, icone: 'gi:' + icone, peso, dano, categoria: 'arma', ...(alcance ? { alcance } : {}),
    descricao: `${grupo} · ${dano} ${TIPO_PF[tipo]} · ${tracos.join(', ') || 'sem traços'}. ${explica.join(' ')}`.trim(),
    rolagens: [{ nome: 'Crítico (dobro)', expr: critico }] }
}

// ---------------------------------------------------------------- Tormenta20 (comercial: só números)

type T20 = [nome: string, icone: string, espacos: number, dano: string, critico: string, tipo: string, grupo: string, alcance?: number]
const T20: T20[] = [
  ['Adaga', 'lorc/plain-dagger', 1, '1d4', '19', 'Perfuração', 'Simples', 9], ['Espada curta', 'lorc/broad-dagger', 1, '1d6', '19', 'Perfuração', 'Simples'],
  ['Clava', 'delapouite/bone-mace', 1, '1d6', 'x2', 'Impacto', 'Simples'], ['Foice', 'delapouite/sickle', 1, '1d6', 'x3', 'Corte', 'Simples'],
  ['Lança', 'lorc/barbed-spear', 1, '1d6', 'x2', 'Perfuração', 'Simples', 9], ['Maça', 'delapouite/flanged-mace', 1, '1d8', 'x2', 'Impacto', 'Simples'],
  ['Bordão', 'lorc/wizard-staff', 2, '1d6', 'x2', 'Impacto', 'Simples'], ['Pique', 'delapouite/sharp-halberd', 2, '1d8', 'x2', 'Perfuração', 'Simples'],
  ['Azagaia', 'lorc/thrown-spear', 1, '1d6', 'x2', 'Perfuração', 'Simples', 9], ['Arco curto', 'delapouite/bow-arrow', 1, '1d6', 'x3', 'Perfuração', 'Simples', 30],
  ['Besta leve', 'carl-olsen/crossbow', 1, '1d8', '19', 'Perfuração', 'Simples', 30], ['Funda', 'delapouite/sling', 1, '1d4', 'x2', 'Impacto', 'Simples', 9],
  ['Cimitarra', 'delapouite/katana', 1, '1d6', '18', 'Corte', 'Marcial'], ['Espada longa', 'lorc/broadsword', 1, '1d8', '19', 'Corte', 'Marcial'],
  ['Florete', 'lorc/stiletto', 1, '1d6', '18', 'Perfuração', 'Marcial'], ['Machado de batalha', 'lorc/battle-axe', 1, '1d8', 'x3', 'Corte', 'Marcial'],
  ['Mangual', 'delapouite/flail', 1, '1d8', 'x2', 'Impacto', 'Marcial'], ['Martelo de guerra', 'delapouite/warhammer', 1, '1d8', 'x3', 'Impacto', 'Marcial'],
  ['Picareta', 'delapouite/war-pick', 1, '1d6', 'x4', 'Perfuração', 'Marcial'], ['Tridente', 'lorc/harpoon-trident', 1, '1d8', 'x2', 'Perfuração', 'Marcial', 9],
  ['Alabarda', 'lorc/halberd', 2, '1d10', 'x3', 'Corte', 'Marcial'], ['Alfange', 'delapouite/two-handed-sword', 2, '2d4', '18', 'Corte', 'Marcial'],
  ['Gadanho', 'lorc/scythe', 2, '2d4', 'x4', 'Corte', 'Marcial'], ['Machado de guerra', 'delapouite/war-axe', 2, '1d12', 'x3', 'Corte', 'Marcial'],
  ['Marreta', 'delapouite/warhammer', 2, '3d4', 'x2', 'Impacto', 'Marcial'], ['Montante', 'delapouite/two-handed-sword', 2, '2d6', '19', 'Corte', 'Marcial'],
  ['Arco longo', 'delapouite/bow-arrow', 2, '1d8', 'x3', 'Perfuração', 'Marcial', 30], ['Besta pesada', 'carl-olsen/crossbow', 2, '1d12', '19', 'Perfuração', 'Marcial', 30],
]
function itemT20([nome, icone, peso, dano, crit, tipo, grupo, alcance]: T20): ItemArsenal {
  const margem = /^\d+$/.test(crit) ? crit : '20', mult = crit.startsWith('x') ? Number(crit.slice(1)) : 2
  return { nome, icone: 'gi:' + icone, peso, dano, categoria: 'arma', ...(alcance ? { alcance } : {}),
    descricao: `${grupo} · Crítico ${margem === '20' ? '' : margem + '/'}x${mult} · ${tipo}`,
    rolagens: [{ nome: `Crítico (x${mult})`, expr: multiplicarDano(dano, mult) }] }
}

// ---------------------------------------------------------------- Call of Cthulhu (comercial: só números)

type Coc = [nome: string, icone: string, dano: string, pericia: string, empala: boolean, alcance?: number, extra?: string]
const COC: Coc[] = [
  ['Soco-inglês', 'delapouite/brass-knuckles', '1d3+1', 'Lutar (Briga)', false], ['Cassetete', 'delapouite/baseball-bat', '1d8', 'Lutar (Briga)', false],
  ['Porrete pequeno', 'delapouite/bone-mace', '1d6', 'Lutar (Briga)', false], ['Faca pequena', 'lorc/plain-dagger', '1d4', 'Lutar (Briga)', true],
  ['Faca média', 'lorc/bowie-knife', '1d4+2', 'Lutar (Briga)', true], ['Faca grande', 'delapouite/cleaver', '1d8', 'Lutar (Briga)', true],
  ['Machadinha / foice', 'delapouite/hatchet', '1d6+1', 'Lutar (Machado)', true], ['Chicote', 'lorc/whip', '1d3', 'Lutar (Chicote)', false],
  ['Tocha acesa', 'delapouite/torch', '1d6', 'Lutar (Briga)', false, undefined, 'mais queimadura'],
  ['Arco e flechas', 'delapouite/bow-arrow', '1d6', 'Armas de Fogo (Arco)', false, 27], ['Besta', 'carl-olsen/crossbow', '1d8+2', 'Armas de Fogo (Arco)', true, 45, 'atira a cada 2 rodadas'],
  ['Revólver .32', 'skoll/revolver', '1d8', 'Armas de Fogo (Pistola)', true, 14, '6 balas'], ['Pistola .32', 'john-colburn/pistol-gun', '1d8', 'Armas de Fogo (Pistola)', true, 14, '8 balas'],
  ['Revólver .45', 'delapouite/revolver', '1d10+2', 'Armas de Fogo (Pistola)', true, 14, '6 balas'], ['Pistola .45', 'john-colburn/pistol-gun', '1d10+2', 'Armas de Fogo (Pistola)', true, 14, '7 balas'],
  ['Rifle .22', 'sbed/rifle', '1d6+1', 'Armas de Fogo (Rifle/Espingarda)', true, 27], ['Carabina .30 de alavanca', 'skoll/winchester-rifle', '2d6', 'Armas de Fogo (Rifle/Espingarda)', true, 45],
  ['Rifle .303', 'skoll/lee-enfield', '2d6+4', 'Armas de Fogo (Rifle/Espingarda)', true, 100], ['Arma para elefante', 'sbed/rifle', '3d6+4', 'Armas de Fogo (Rifle/Espingarda)', true, 90],
  ['Espingarda calibre 12', 'sbed/shotgun', '4d6', 'Armas de Fogo (Rifle/Espingarda)', false, 9, 'a 18 m: 2d6; a 45 m: 1d6'],
  ['Espingarda de cano serrado', 'delapouite/sawed-off-shotgun', '4d6', 'Armas de Fogo (Rifle/Espingarda)', false, 4, 'a 9 m: 1d6'],
  ['Submetralhadora Thompson', 'skoll/m3-grease-gun', '1d10+2', 'Armas de Fogo (Submetralhadora)', true, 18, 'rajada'],
]
function itemCoc([nome, icone, dano, pericia, empala, alcance, extra]: Coc): ItemArsenal {
  return { nome, icone: 'gi:' + icone, peso: 1, dano, categoria: 'arma', ...(alcance ? { alcance } : {}),
    descricao: `${pericia} · ${dano}${pericia.startsWith('Lutar') ? ' + bônus de dano' : ''}${empala ? ' · empala' : ''}${extra ? ' · ' + extra : ''}`,
    rolagens: [{ nome: empala ? 'Sucesso extremo (empalar)' : 'Sucesso extremo (dano máximo)', expr: empala ? maximoMaisRolagem(dano) : String(danoMaximo(dano)) }] }
}

// ---------------------------------------------------------------- Basic Roleplaying (ORC)

type Brp = [nome: string, icone: string, dano: string, pericia: string, alcance?: number, extra?: string]
const BRP: Brp[] = [
  ['Soco-inglês', 'delapouite/brass-knuckles', '1d3+1', 'Briga'], ['Clava leve', 'delapouite/bone-mace', '1d6', 'Arma Corpo a Corpo'], ['Clava pesada', 'delapouite/baseball-bat', '1d8', 'Arma Corpo a Corpo', undefined, 'duas mãos'],
  ['Adaga / faca', 'lorc/plain-dagger', '1d4+2', 'Arma Corpo a Corpo'], ['Machadinha', 'delapouite/hatchet', '1d6+1', 'Arma Corpo a Corpo'], ['Machado de batalha', 'lorc/battle-axe', '1d8+2', 'Arma Corpo a Corpo'],
  ['Machado grande', 'delapouite/war-axe', '2d6+2', 'Arma Corpo a Corpo', undefined, 'duas mãos'], ['Maça', 'delapouite/flanged-mace', '1d8', 'Arma Corpo a Corpo'], ['Martelo de guerra', 'delapouite/warhammer', '1d8+1', 'Arma Corpo a Corpo'],
  ['Mangual', 'delapouite/flail', '1d8', 'Arma Corpo a Corpo'], ['Bordão', 'lorc/wizard-staff', '1d8', 'Arma Corpo a Corpo', undefined, 'duas mãos'], ['Rapieira', 'lorc/stiletto', '1d6+1', 'Arma Corpo a Corpo'],
  ['Espada curta', 'lorc/broad-dagger', '1d6+1', 'Arma Corpo a Corpo'], ['Espada larga', 'lorc/broadsword', '1d8+1', 'Arma Corpo a Corpo'], ['Espada bastarda', 'lorc/broadsword', '1d10+1', 'Arma Corpo a Corpo'],
  ['Espada de duas mãos', 'delapouite/two-handed-sword', '2d8', 'Arma Corpo a Corpo', undefined, 'duas mãos'], ['Lança', 'lorc/barbed-spear', '1d6+1', 'Arma Corpo a Corpo'], ['Alabarda', 'lorc/halberd', '1d10+2', 'Arma Corpo a Corpo', undefined, 'duas mãos'],
  ['Chicote', 'lorc/whip', '1d4', 'Arma Corpo a Corpo', undefined, 'sem bônus de dano'],
  ['Funda', 'delapouite/sling', '1d8', 'Arma de Disparo', 80], ['Arco simples', 'delapouite/bow-arrow', '1d6+1', 'Arma de Disparo', 80], ['Arco longo', 'delapouite/bow-arrow', '1d8+1', 'Arma de Disparo', 100],
  ['Besta leve', 'carl-olsen/crossbow', '1d6+2', 'Arma de Disparo', 60, '1 disparo a cada 2 rodadas'], ['Besta pesada', 'carl-olsen/crossbow', '2d6+2', 'Arma de Disparo', 90, '1 disparo a cada 3 rodadas'],
  ['Derringer', 'john-colburn/pistol-gun', '1d6', 'Arma de Fogo (Pistola)', 5], ['Revólver leve', 'skoll/revolver', '1d8', 'Arma de Fogo (Pistola)', 15], ['Revólver pesado', 'delapouite/revolver', '1d10+2', 'Arma de Fogo (Pistola)', 20],
  ['Pistola semiautomática', 'john-colburn/pistol-gun', '1d8', 'Arma de Fogo (Pistola)', 20, '2 disparos por rodada'], ['Rifle de ferrolho', 'skoll/lee-enfield', '2d6', 'Arma de Fogo (Rifle)', 90],
  ['Fuzil de assalto', 'skoll/ak47', '2d6+2', 'Arma de Fogo (Rifle)', 100, 'rajada'], ['Espingarda', 'sbed/shotgun', '4d6', 'Arma de Fogo (Espingarda)', 10, 'a 20 m: 2d6; a 50 m: 1d6'],
  ['Submetralhadora', 'skoll/m3-grease-gun', '1d8', 'Arma de Fogo (Submetralhadora)', 30, 'rajada'],
]
function itemBrp([nome, icone, dano, pericia, alcance, extra]: Brp): ItemArsenal {
  const corpo = !alcance
  return { nome, icone: 'gi:' + icone, peso: 1, dano, categoria: 'arma', ...(alcance ? { alcance } : {}),
    descricao: `${pericia} · ${dano}${corpo && !/sem bônus/.test(extra ?? '') ? ' + bônus de dano' : ''}${extra ? ' · ' + extra : ''}. Sucesso especial: dano máximo mais a rolagem; crítico: dano máximo, ignorando a armadura.`,
    rolagens: [{ nome: 'Sucesso especial', expr: maximoMaisRolagem(dano) }, { nome: 'Crítico (máximo, ignora armadura)', expr: String(danoMaximo(dano)) }] }
}

// ---------------------------------------------------------------- MÖRK BORG (comercial: só números)

const MB: [string, string, string, string?][] = [
  ['Fêmur', 'delapouite/bone-mace', '1d4'], ['Cajado', 'lorc/wizard-staff', '1d4'], ['Espada curta', 'lorc/broad-dagger', '1d4'], ['Faca', 'lorc/bone-knife', '1d4'],
  ['Martelo de guerra', 'delapouite/warhammer', '1d6'], ['Espada', 'lorc/broadsword', '1d6'], ['Arco', 'delapouite/bow-arrow', '1d6', 'precisa de flechas'],
  ['Mangual', 'delapouite/flail', '1d8'], ['Besta', 'carl-olsen/crossbow', '1d8', 'precisa de virotes'], ['Montante', 'delapouite/two-handed-sword', '1d10', 'duas mãos'],
]

// ---------------------------------------------------------------- Fate (CC BY) e Blades in the Dark (CC BY)

const FATE: [string, string, number, string][] = [
  ['Faca', 'lorc/plain-dagger', 1, 'Arma leve: soma 1 tensão quando acerta.'], ['Espada', 'lorc/broadsword', 2, 'Arma comum: soma 2 tensões quando acerta.'],
  ['Espada longa', 'delapouite/two-handed-sword', 3, 'Arma pesada: soma 3 tensões quando acerta.'], ['Pistola', 'john-colburn/pistol-gun', 2, 'Arma de fogo leve: soma 2 tensões quando acerta.'],
  ['Rifle', 'sbed/rifle', 3, 'Arma de fogo pesada: soma 3 tensões quando acerta.'], ['Explosivo', 'lorc/grenade', 4, 'Muito perigoso: soma 4 tensões quando acerta.'],
]
const BLADES: [string, string, number, string][] = [
  ['Uma lâmina ou duas', 'lorc/broadsword', 1, 'Espadas, facas e afins.'], ['Facas de arremesso', 'lorc/thrown-daggers', 1, 'Um jogo de facas para atirar.'],
  ['Uma pistola', 'john-colburn/pistol-gun', 1, 'Pistola de pederneira; um tiro antes de recarregar.'], ['Uma segunda pistola', 'delapouite/revolver', 1, 'Para não precisar recarregar no meio da briga.'],
  ['Uma arma grande', 'delapouite/war-axe', 2, 'Machado, martelo ou rifle: ocupa as duas mãos.'], ['Uma arma incomum', 'darkzaitzev/kusarigama', 1, 'Chicote, corrente, besta pequena…'],
  ['Armadura', 'delapouite/leather-armor', 2, 'Marque para reduzir as consequências de um dano.'], ['Equipamento de arrombamento', 'delapouite/lockpicks', 1, 'Gazuas, pé de cabra, ferramentas.'],
  ['Equipamento de escalada', 'delapouite/rope-coil', 2, 'Corda, ganchos, grampos.'], ['Lanterna escura', 'lorc/lantern', 1, 'Lanterna que só ilumina onde você quer.'],
]

// ---------------------------------------------------------------- todos

export const ARSENAIS: Record<string, ArsenalSistema> = {
  pf2e: { titulo: 'Arsenal de Pathfinder 2e', critico: 'Acerto crítico: acerta por 10 ou mais (ou um 20 que vira grau acima). O dano todo dobra; Mortal e Fatal somam dados.', fonte: 'Pathfinder Player Core (Paizo), mecânicas sob a ORC License. Descrições nossas.', peso: 'Volume (0,1 = L)', itens: PF.map(itemPf) },
  'ordem-paranormal': { titulo: 'Arsenal da Ordem', critico: 'Crítico: tirar na margem da arma (ex.: 19) multiplica os dados de dano pelo multiplicador (x2, x3…).', fonte: 'Ordem Paranormal RPG (Jambô/Cellbit): só os números; o resto, no livro.', peso: 'espaços', itens: ARSENAL_ORDEM },
  tormenta20: { titulo: 'Arsenal de Tormenta20', critico: 'Crítico: rolar na margem de ameaça da arma (20, 19 ou 18) multiplica os dados de dano (x2, x3, x4). Bônus fixos não multiplicam.', fonte: 'Tormenta20 (Jambô): só os números; descrições e regras completas no livro.', peso: 'espaços', itens: T20.map(itemT20) },
  'call-of-cthulhu': { titulo: 'Armas de Call of Cthulhu', critico: 'Sucesso extremo: armas que empalam causam o dano máximo mais uma nova rolagem; as outras, o dano máximo (mais o bônus de dano máximo, se houver).', fonte: 'Números da wiki oficial da Chaosium (callofcthulhuwiki.chaosium.com). Regras completas no livro.', peso: 'itens', itens: COC.map(itemCoc) },
  brp: { titulo: 'Armas de Basic Roleplaying', critico: 'Sucesso especial (⅕ da perícia): dano máximo mais a rolagem. Crítico (1/20): dano máximo e ignora a armadura.', fonte: 'Basic Roleplaying SRD (Chaosium), sob a ORC License. Descrições nossas.', peso: 'itens', itens: BRP.map(itemBrp) },
  'mork-borg': { titulo: 'Armas de MÖRK BORG', critico: '20 natural no ataque: dano em dobro. 1 natural: a arma quebra ou escapa da mão.', fonte: 'MÖRK BORG (Ockult Örtmästare & Stockholm Kartell): só os números.', peso: 'itens',
    itens: MB.map(([nome, icone, dano, extra]) => ({ nome, icone: 'gi:' + icone, peso: 1, dano, categoria: 'arma', descricao: `Dano ${dano}${extra ? ' · ' + extra : ''}`, rolagens: [{ nome: 'Crítico (dobro)', expr: multiplicarDano(dano, 2) }] })) },
  'fate-core': { titulo: 'Armas e armaduras de Fate', critico: 'Não há dado de dano: a arma soma tensões ao acertar. Sucesso com estilo pode virar um impulso em vez de tensões extras.', fonte: 'Fate System Toolkit (Evil Hat), CC BY 3.0. Descrições nossas.', peso: 'itens',
    itens: [...FATE.map(([nome, icone, arma, texto]): ItemArsenal => ({ nome: `${nome} (Arma:${arma})`, icone: 'gi:' + icone, peso: 0, categoria: 'arma', descricao: texto, rolagens: [{ nome: 'Ataque (4dF)', expr: '4df' }] })),
      { nome: 'Armadura leve (Armadura:1)', icone: 'gi:delapouite/leather-armor', peso: 0, categoria: 'armadura', descricao: 'Tira 1 tensão de cada acerto recebido.' },
      { nome: 'Armadura pesada (Armadura:2)', icone: 'gi:delapouite/chest-armor', peso: 0, categoria: 'armadura', descricao: 'Tira 2 tensões de cada acerto recebido.' }] },
  blades: { titulo: 'Itens de Blades in the Dark', critico: 'Crítico: dois ou mais 6 na rolagem de ação — efeito aumentado. O dano é o nível da consequência, sem dado de dano.', fonte: 'Blades in the Dark SRD (One Seven Design), CC BY 3.0. Descrições nossas.', peso: 'carga',
    itens: BLADES.map(([nome, icone, carga, texto]): ItemArsenal => ({ nome, icone: 'gi:' + icone, peso: carga, categoria: /Armadura/.test(nome) ? 'armadura' : /Equipamento|Lanterna/.test(nome) ? 'equipamento' : 'arma', descricao: `Carga ${carga}. ${texto}` })) },
}

export const arsenalDoSistema = (identidade: string): ArsenalSistema | null => ARSENAIS[identidade] ?? null

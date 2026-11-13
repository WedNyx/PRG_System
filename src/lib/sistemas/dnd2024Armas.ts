/**
 * 38 armas da tabela principal do SRD 5.2.1 (D&D 2024).
 * Material adaptado de System Reference Document 5.2.1, Wizards of the Coast LLC
 * https://www.dndbeyond.com/srd — CC BY 4.0.
 * Armas mágicas específicas, armas improvisadas e ataques desarmados não são
 * linhas da tabela principal; podem continuar como itens manuais da ficha.
 */
export type GrupoArmaDnd = 'simples-corpo' | 'simples-distancia' | 'marcial-corpo' | 'marcial-distancia'
export type TipoDanoArmaDnd = 'Cortante' | 'Perfurante' | 'Contundente'
export type ArmaDnd2024 = {
  id: string; nome: string; grupo: GrupoArmaDnd; dano: string; tipo: TipoDanoArmaDnd
  propriedades: string[]; maestria: string; pesoLb: number; preco: string
  /** Distâncias normal e longa em pés, quando a arma possui Arremesso/Munição. */
  alcancePes?: [number, number]
  versatil?: string
}
const prop = (s: string) => s ? s.split(',') : []
const arma = (id: string, nome: string, grupo: GrupoArmaDnd, dano: string, tipo: TipoDanoArmaDnd,
  propriedades: string, maestria: string, pesoLb: number, preco: string, alcancePes?: [number, number], versatil?: string): ArmaDnd2024 =>
  ({ id, nome, grupo, dano, tipo, propriedades: prop(propriedades), maestria, pesoLb, preco,
    ...(alcancePes ? { alcancePes } : {}), ...(versatil ? { versatil } : {}) })

export const ARMAS_DND_2024: ArmaDnd2024[] = [
  // Simples: corpo a corpo (10)
  arma('clava','Clava','simples-corpo','1d4','Contundente','Leve','Slow',2,'1 PP'),
  arma('adaga','Adaga','simples-corpo','1d4','Perfurante','Acuidade,Leve,Arremesso','Nick',1,'2 PO',[20,60]),
  arma('clava-grande','Clava grande','simples-corpo','1d8','Contundente','Duas mãos','Push',10,'2 PP'),
  arma('machadinha','Machadinha','simples-corpo','1d6','Cortante','Leve,Arremesso','Vex',2,'5 PO',[20,60]),
  arma('azagaia','Azagaia','simples-corpo','1d6','Perfurante','Arremesso','Slow',2,'5 PP',[30,120]),
  arma('martelo-leve','Martelo leve','simples-corpo','1d4','Contundente','Leve,Arremesso','Nick',2,'2 PO',[20,60]),
  arma('maca','Maça','simples-corpo','1d6','Contundente','','Sap',4,'5 PO'),
  arma('bordao','Bordão','simples-corpo','1d6','Contundente','Versátil','Topple',4,'2 PP',undefined,'1d8'),
  arma('foice','Foice','simples-corpo','1d4','Cortante','Leve','Nick',2,'1 PO'),
  arma('lanca','Lança','simples-corpo','1d6','Perfurante','Arremesso,Versátil','Sap',3,'1 PO',[20,60],'1d8'),
  // Simples: à distância (4)
  arma('dardo','Dardo','simples-distancia','1d4','Perfurante','Acuidade,Arremesso','Vex',0.25,'5 PC',[20,60]),
  arma('besta-leve','Besta leve','simples-distancia','1d8','Perfurante','Munição,Recarga,Duas mãos','Slow',5,'25 PO',[80,320]),
  arma('arco-curto','Arco curto','simples-distancia','1d6','Perfurante','Munição,Duas mãos','Vex',2,'25 PO',[80,320]),
  arma('funda','Funda','simples-distancia','1d4','Contundente','Munição','Slow',0,'1 PP',[30,120]),
  // Marciais: corpo a corpo (18)
  arma('machado-batalha','Machado de batalha','marcial-corpo','1d8','Cortante','Versátil','Topple',4,'10 PO',undefined,'1d10'),
  arma('mangual','Mangual','marcial-corpo','1d8','Contundente','','Sap',2,'10 PO'),
  arma('glaive','Glaive','marcial-corpo','1d10','Cortante','Pesada,Alcance,Duas mãos','Graze',6,'20 PO'),
  arma('machado-grande','Machado grande','marcial-corpo','1d12','Cortante','Pesada,Duas mãos','Cleave',7,'30 PO'),
  arma('espada-grande','Espada grande','marcial-corpo','2d6','Cortante','Pesada,Duas mãos','Graze',6,'50 PO'),
  arma('alabarda','Alabarda','marcial-corpo','1d10','Cortante','Pesada,Alcance,Duas mãos','Cleave',6,'20 PO'),
  arma('lanca-cavalaria','Lança de cavalaria','marcial-corpo','1d10','Perfurante','Pesada,Alcance,Duas mãos (exceto montado)','Topple',6,'10 PO'),
  arma('espada-longa','Espada longa','marcial-corpo','1d8','Cortante','Versátil','Sap',3,'15 PO',undefined,'1d10'),
  arma('malho','Malho','marcial-corpo','2d6','Contundente','Pesada,Duas mãos','Topple',10,'10 PO'),
  arma('maca-estrela','Maça-estrela','marcial-corpo','1d8','Perfurante','','Sap',4,'15 PO'),
  arma('pique','Pique','marcial-corpo','1d10','Perfurante','Pesada,Alcance,Duas mãos','Push',18,'5 PO'),
  arma('rapieira','Rapieira','marcial-corpo','1d8','Perfurante','Acuidade','Vex',2,'25 PO'),
  arma('cimitarra','Cimitarra','marcial-corpo','1d6','Cortante','Acuidade,Leve','Nick',3,'25 PO'),
  arma('espada-curta','Espada curta','marcial-corpo','1d6','Perfurante','Acuidade,Leve','Vex',2,'10 PO'),
  arma('tridente','Tridente','marcial-corpo','1d8','Perfurante','Arremesso,Versátil','Topple',4,'5 PO',[20,60],'1d10'),
  arma('martelo-guerra','Martelo de guerra','marcial-corpo','1d8','Contundente','Versátil','Push',5,'15 PO',undefined,'1d10'),
  arma('picareta-guerra','Picareta de guerra','marcial-corpo','1d8','Perfurante','Versátil','Sap',2,'5 PO',undefined,'1d10'),
  arma('chicote','Chicote','marcial-corpo','1d4','Cortante','Acuidade,Alcance','Slow',3,'2 PO'),
  // Marciais: à distância (6)
  arma('zarabatana','Zarabatana','marcial-distancia','1','Perfurante','Munição,Recarga','Vex',1,'10 PO',[25,100]),
  arma('besta-mao','Besta de mão','marcial-distancia','1d6','Perfurante','Munição,Leve,Recarga','Vex',3,'75 PO',[30,120]),
  arma('besta-pesada','Besta pesada','marcial-distancia','1d10','Perfurante','Munição,Pesada,Recarga,Duas mãos','Push',18,'50 PO',[100,400]),
  arma('arco-longo','Arco longo','marcial-distancia','1d8','Perfurante','Munição,Pesada,Duas mãos','Slow',2,'50 PO',[150,600]),
  arma('mosquete','Mosquete','marcial-distancia','1d12','Perfurante','Munição,Recarga,Duas mãos','Slow',10,'500 PO',[40,120]),
  arma('pistola','Pistola','marcial-distancia','1d10','Perfurante','Munição,Recarga','Vex',3,'250 PO',[30,90]),
]

export const armaDndPorId = (v: unknown): ArmaDnd2024 | null =>
  typeof v === 'string' ? ARMAS_DND_2024.find(a => a.id === v) ?? null : null

export const pesoEmKgArmaDnd = (a: ArmaDnd2024): number =>
  Math.round(a.pesoLb * 0.45359237 * 1000) / 1000

export const alcanceEmMetrosArmaDnd = (a: ArmaDnd2024): number =>
  Math.round((a.alcancePes?.[0] ?? (a.propriedades.includes('Alcance') ? 10 : 5)) * 0.3048 * 100) / 100

export function atributoParaArmaDnd(
  a: ArmaDnd2024, mods: Record<string, number>, preferido?: 'FOR' | 'DES',
): { atributo: 'FOR' | 'DES'; mod: number } {
  const acuidade = a.propriedades.includes('Acuidade')
  const atributo = acuidade
    ? (preferido === 'FOR' || preferido === 'DES' ? preferido : (Number(mods.DES) || 0) > (Number(mods.FOR) || 0) ? 'DES' : 'FOR')
    : a.grupo.endsWith('distancia') ? 'DES' : 'FOR'
  return { atributo, mod: Number(mods[atributo]) || 0 }
}

/** Somente dados dobram em um acerto crítico; atributo e bônus mágico ficam intactos.
 * Dano fixo da Zarabatana = 1, inclusive no crítico (sem dados para dobrar).
 */
export function expressaoDanoArmaDnd(a: ArmaDnd2024, mod: number, critico = false,
  duasMaos = false, bonusMagico = 0, ataqueAdicionalLeve = false): string {
  const base = duasMaos && a.versatil ? a.versatil : a.dano
  const m = /^(\d+)d(\d+)$/.exec(base)
  const dados = m ? `${Number(m[1]) * (critico ? 2 : 1)}d${m[2]}` : base
  const atributo = ataqueAdicionalLeve && a.propriedades.includes('Leve') ? Math.min(0, mod) : mod
  const extra = atributo + Math.max(0, Math.min(3, Math.floor(bonusMagico)))
  return dados + (extra > 0 ? '+' + extra : extra < 0 ? String(extra) : '')
}
/** Expressão de dano de arma de suplemento ou de item personalizado.
 * Não supõe efeitos mágicos; só dobra o número de dados quando crítico.
 * `mod` deve ser 0 para expressões que o jogador já montou com bônus.
 */
export function expressaoDanoLivreDnd(base: string, critico = false, mod = 0): string | null {
  const limpa = base.toLowerCase().replace(/\s+/g, '')
  if (!limpa || limpa.length > 40 || !/^[0-9d+\-]+$/.test(limpa)) return null
  const termos = limpa.match(/[+-]?[^+-]+/g)
  if (!termos?.length || termos.some(x => !/^[+-]?(?:(?:\d*)d(?:\d+)|\d+)$/.test(x))) return null
  const expressao = limpa.replace(/(\d*)d(\d+)/g, (_dado, quantidade: string, faces: string) =>
    `${Number(quantidade || 1) * (critico ? 2 : 1)}d${faces}`)
  const acrescimo = Number.isFinite(mod) ? Math.max(-30, Math.min(30, Math.trunc(mod))) : 0
  return expressao + (acrescimo > 0 ? '+' + acrescimo : acrescimo < 0 ? String(acrescimo) : '')
}

export const descricaoArmaDnd = (a: ArmaDnd2024) =>
  `D&D 2024 SRD · ${a.tipo} · ${a.propriedades.join(', ') || 'Sem propriedades'} · Maestria: ${a.maestria}${a.alcancePes ? ` · Alcance ${a.alcancePes.join('/') } pés` : ''}${a.versatil ? ` · Versátil ${a.versatil}` : ''} · ${a.preco}`

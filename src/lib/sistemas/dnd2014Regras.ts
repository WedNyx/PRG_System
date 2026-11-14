/**
 * Regras abertas do D&D 5e original (2014), SRD 5.1 — CC BY 4.0.
 * https://www.dndbeyond.com/srd
 *
 * NÃO usa tabelas de características, subclasses, talentos ou magias 2024.
 * Esta camada automatiza somente o que está verificado abaixo:
 * - aumentos de atributo de raças/sub-raças do PHB 2014;
 * - perícias e salvaguardas de classe inicial e perícias dos antecedentes;
 * - recursos básicos da classe, proficiência, deslocamento e espaços de magia.
 * Efeitos situacionais, subclasses e suplementos comerciais: leitura no livro.
 */
import type { DadosFicha } from './tipos'
import type { EfeitosDnd } from './dnd2024Efeitos'
import { CLASSES_SRD } from './dnd2024Srd'
import { idDe } from './dnd2024Classes'
import { VARS_DND } from './dnd2024Efeitos'

export const ATRIBUTOS_DND = ['FOR','DES','CON','INT','SAB','CAR'] as const
export type AtributoDnd = typeof ATRIBUTOS_DND[number]
const salvaguardas: Record<string, string> = {FOR:'resist_forca', DES:'resist_destreza', CON:'resist_constituicao',
 INT:'resist_inteligencia', SAB:'resist_sabedoria', CAR:'resist_carisma' }
const backgrounds: Record<string, string[]> = {
  'Acólito': ['intuicao','religiao'],
  'Charlatão': ['enganacao','prestidigitacao'],
  'Criminoso': ['enganacao','furtividade'],
  'Artista': ['acrobacia','atuacao'],
  'Herói do Povo': ['adestrar_animais','sobrevivencia'],
  'Artesão de Guilda': ['intuicao','persuasao'],
  'Eremita': ['medicina','religiao'],
  'Nobre': ['historia','persuasao'],
  'Forasteiro': ['atletismo','sobrevivencia'],
  'Sábio': ['arcanismo','historia'],
  'Marinheiro': ['atletismo','percepcao'],
  'Soldado': ['atletismo','intimidacao'],
  'Órfão': ['prestidigitacao','furtividade'],
}
export const periciasAntecedente2014 = (nome: unknown): string[] => backgrounds[String(nome)] ?? []

export const periciasClasse2014 = (nome: unknown): { qtd: number; opcoes: string[] } | null => {
  const classe = CLASSES_SRD.find(x => x.nome === nome)
  if (!classe) return null
  const opcoes = classe.pericias.opcoes.filter(x => !(classe.id === 'guerreiro' && x === 'persuasao'))
  if (classe.id === 'ladino' && !opcoes.includes('atuacao')) opcoes.push('atuacao')
  return { qtd: classe.pericias.qtd, opcoes }
}
const integer = (x: unknown): number | null => typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 20 ? x : null
export function lerAtributosBase2014(valor: unknown): Record<AtributoDnd, number> | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  const v = valor as Record<string, unknown>
  if (ATRIBUTOS_DND.some(a => integer(v[a]) === null)) return null
  return Object.fromEntries(ATRIBUTOS_DND.map(a => [a, v[a]])) as Record<AtributoDnd, number>
}
export function aumentosRaciais2014(
  raca: unknown, subraca: unknown, extras: unknown,
): { bonus: Record<AtributoDnd, number>; pendencias: string[] } {
  const out = Object.fromEntries(ATRIBUTOS_DND.map(a => [a, 0])) as Record<AtributoDnd, number>
  const pendencias: string[] = []
  const adicionar = (a: AtributoDnd, n: number) => { out[a] += n }
  const r = String(raca), sub = String(subraca)
  const pares: [string, AtributoDnd, number][] = [
    ['Anão','CON',2],['Elfo','DES',2],['Halfling','DES',2],['Draconato','FOR',2],
    ['Draconato','CAR',1],['Gnomo','INT',2],['Meio-Elfo','CAR',2],
    ['Meio-Orc','FOR',2],['Meio-Orc','CON',1],['Tiferino','INT',1],['Tiferino','CAR',2],
  ]
  for (const [nome,a,n] of pares) if (nome === r) adicionar(a,n)
  const subracas: Record<string, [AtributoDnd, number]> = {
    'Anão da Colina':['SAB',1], 'Anão da Montanha':['FOR',2],
    'Alto Elfo':['INT',1], 'Elfo da Floresta':['SAB',1], 'Drow':['CAR',1],
    'Pés-Leves':['CAR',1], 'Robusto':['CON',1],
    'Gnomo da Floresta':['DES',1], 'Gnomo das Rochas':['CON',1],
  }
  const valido: Record<string, string[]> = {
    'Anão':['Anão da Colina','Anão da Montanha'],
    'Elfo':['Alto Elfo','Elfo da Floresta','Drow'],
    'Halfling':['Pés-Leves','Robusto'],
    'Gnomo':['Gnomo da Floresta','Gnomo das Rochas'],
    'Humano':['Humano padrão','Humano Variante'],
  }
  if (valido[r] && !valido[r].includes(sub)) pendencias.push('Escolher sub-raça ou variante de '+r)
  if (valido[r]?.includes(sub) && subracas[sub]) { const [a,n] = subracas[sub]; adicionar(a,n) }
  if (r === 'Humano' && sub === 'Humano padrão') for (const a of ATRIBUTOS_DND) adicionar(a,1)
  const variavel = r === 'Meio-Elfo' ? 2 : r === 'Humano' && sub === 'Humano Variante' ? 2 : 0
  if (variavel) {
    const lista = Array.isArray(extras) ? extras.filter((a): a is AtributoDnd =>
      typeof a === 'string' && (ATRIBUTOS_DND as readonly string[]).includes(a)) : []
    const semRep = [...new Set(lista)].filter(a => r !== 'Meio-Elfo' || a !== 'CAR').slice(0,2)
    if (semRep.length !== variavel) pendencias.push('Escolher dois atributos diferentes para os bônus variáveis')
    for (const a of semRep) adicionar(a,1)
  }
  return { bonus: out, pendencias }
}
export function atributosEfetivos2014(d: Pick<DadosFicha,'campos' | 'dnd2014AtributosBase' | 'dnd2014AtributosExtras'>): Record<AtributoDnd,number> | null {
  const base = lerAtributosBase2014(d.dnd2014AtributosBase)
  if (!base) return null // ficha antiga: os atributos registrados JÁ são o valor final
  const x = aumentosRaciais2014(d.campos.especie,d.campos.subraca2014,d.dnd2014AtributosExtras)
  return Object.fromEntries(ATRIBUTOS_DND.map(a => [a,Math.min(30,base[a] + x.bonus[a])])) as Record<AtributoDnd,number>
}

/** Regras abertas de 2014. A característica de classe particular e subclasse continuam manuais. */
export function efeitosDnd2014(
  d: Pick<DadosFicha,'campos' | 'dnd2014PericiasClasse'>,
  vars: Record<string,number>,
): EfeitosDnd {
  const v: Record<string,number> = Object.fromEntries(VARS_DND.map(x=>[x,0]))
  const treino: EfeitosDnd['treino'] = {}
  const n = Math.min(20,Math.max(1,Math.floor(Number(d.campos.nivel)||1)))
  const classe = CLASSES_SRD.find(x => x.nome === d.campos.classe)
  const cls = classe?.id ?? ''
  const prof = 2 + Math.floor((n-1)/4)
  v.dnd_nivel=n;v.dnd_prof=prof
  const dar = (id:string,fonte:string) => {if (!treino[id]) treino[id]={treino:'proficiente',fonte}}
  if (classe) {
    for (const a of classe.salvaguardas) if (salvaguardas[a]) dar(salvaguardas[a],classe.nome+' (2014)')
    const escolhas = Array.isArray(d.dnd2014PericiasClasse) ? [...new Set(d.dnd2014PericiasClasse)] : []
    const permitidas = periciasClasse2014(classe.nome)
    for (const x of escolhas.filter(x=>permitidas?.opcoes.includes(x)).slice(0,permitidas?.qtd ?? 0))
      dar(x,classe.nome+' (2014)')
  }
  for (const x of periciasAntecedente2014(d.campos.antecedente)) dar(x,String(d.campos.antecedente)+' (2014)')
  if (d.campos.especie === 'Elfo') dar('percepcao','Sentidos Aguçados (2014)')
  if (d.campos.especie === 'Meio-Orc') dar('intimidacao','Ameaçador (2014)')
  if (cls === 'barbaro') {
    v.dnd_furias = n >= 20 ? 6 : n >= 17 ? 6 : n >= 12 ? 5 : n >= 6 ? 4 : n >= 3 ? 3 : 2
    v.dnd_dano_furia = n >= 16 ? 4 : n >= 9 ? 3 : 2
    if (n >= 5 && Number(vars.des_max)!==0) v.dnd_desl_extra += 3
  }
  if (cls === 'guerreiro') {
    v.dnd_retomar=1
    v.dnd_surto=n>=17?2:n>=2?1:0
    v.dnd_indomavel=n>=17?3:n>=13?2:n>=9?1:0
  }
  if (cls === 'monge') {
    v.dnd_foco=n>=2?n:0
    if(n>=2 && Number(vars.ca_base)<=10 && !(Number(vars.armadura)>0))
      v.dnd_desl_extra+= n>=18?9:n>=14?7.5:n>=10?6:n>=6?4.5:3
    if(Number(vars.ca_base)<=10 && !(Number(vars.armadura)>0)) v.dnd_ca_extra=Math.max(0,Number(vars.mod_SAB)||0)
  }
  if (cls === 'barbaro' && Number(vars.ca_base)<=10)
    v.dnd_ca_extra=Math.max(0,Number(vars.mod_CON)||0)
  if (cls === 'paladino') v.dnd_cura_maos=5*n
  if (cls === 'bardo') {
    v.dnd_inspiracao=Math.max(1,Number(vars.mod_CAR)||0)
  }
  if (cls === 'ladino') v.dnd_furtivo=1+Math.floor((n-1)/2)
  if (cls === 'feiticeiro') v.dnd_feiticaria=n>=2?n:0
  if (cls === 'druida') v.dnd_forma_selvagem=n>=2?2:0
  if (cls === 'clerigo') v.dnd_canalizar=n>=18?3:n>=6?2:n>=2?1:0
  // Espaços básicos da tabela padrão SRD 5.1. Pact Magic e a combinação
  // multiclasse exigem tratamento específico, não extrapolamos essas tabelas.
  const cheio=['bardo','clerigo','druida','feiticeiro','mago'].includes(cls)
  const meio=['paladino','patrulheiro'].includes(cls)
  const nl=cheio?n:meio?Math.floor(n/2):0
  const tabela: number[][] = [
    [0,0,0,0,0,0,0,0,0],
    [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
    [4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
    [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
    [4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
    [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],
    [4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
    [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],
    [4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
    [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
    [4,3,3,3,3,2,2,1,1],[4,3,3,3,3,2,2,1,1],
  ]
  const slots=tabela[Math.max(0,Math.min(20,nl))]??tabela[0]
  for(let i=1;i<=9;i++)v['dnd_espacos_'+i]=slots[i-1]??0
  if (cls === 'bruxo') {
    v.dnd_pacto=n>=17?4:n>=11?3:n>=2?2:1
    v.dnd_pacto_nivel=n>=9?5:n>=7?4:n>=5?3:n>=3?2:1
  }
  const raca=String(d.campos.especie),sub=String(d.campos.subraca2014)
  if (raca==='Anão'&&sub==='Anão da Colina')v.dnd_pv_extra+=n
  if (raca==='Elfo'&&sub==='Elfo da Floresta')v.dnd_desl_extra+=1.5
  if (raca==='Anão'||raca==='Halfling'||raca==='Gnomo')v.dnd_desl_extra-=1.5
  return { vars:v,treino,bonus:{},meiaProficiencia: cls==='bardo'&&n>=2?Math.floor(prof/2):0 }
}


/** Validação pura usada tanto antes quanto depois das permissões do mestre.
 * Dados históricos não são alterados nem rejeitados se o campo não mudou.
 */
export function validarAlteracoes2014(
  antes: Partial<DadosFicha>, depois: Partial<DadosFicha>, edicao: 'phb2014' | 'phb2024',
): string[] {
  const erros: string[]=[]
  const alterou=(k: 'dnd2014AtributosBase'|'dnd2014AtributosExtras'|'dnd2014PericiasClasse') =>
    JSON.stringify(antes[k]??null)!==JSON.stringify(depois[k]??null)
  const chaves=['dnd2014AtributosBase','dnd2014AtributosExtras','dnd2014PericiasClasse'] as const
  if (edicao !== 'phb2014') {
    if(chaves.some(alterou)) erros.push('As escolhas de criação 2014 não podem ser alteradas numa ficha com livro-base 2024.')
    return erros
  }
  if (alterou('dnd2014AtributosBase') && depois.dnd2014AtributosBase !== undefined && !lerAtributosBase2014(depois.dnd2014AtributosBase))
    erros.push('Os seis atributos-base de 2014 devem ser números inteiros de 1 a 20.')
  if (alterou('dnd2014AtributosExtras')) {
    const extras=depois.dnd2014AtributosExtras
    if(!Array.isArray(extras) || extras.length>2 || extras.some(x=>typeof x!=='string'||!(ATRIBUTOS_DND as readonly string[]).includes(x)) || new Set(extras).size!==extras.length)
      erros.push('Aumentos variáveis de atributos 2014 inválidos ou repetidos.')
    else {
      const r=String(depois.campos?.especie??'')
      const v=String(depois.campos?.subraca2014??'')
      if(extras.length && r!=='Meio-Elfo' && !(r==='Humano'&&v==='Humano Variante'))
        erros.push('Esta raça não permite aumentos de atributo variáveis no PHB 2014.')
      if(r==='Meio-Elfo'&&extras.includes('CAR'))
        erros.push('Meio-Elfo 2014 deve escolher dois atributos diferentes de Carisma.')
    }
  }
  if(alterou('dnd2014PericiasClasse')) {
    const lista=depois.dnd2014PericiasClasse
    const cls=periciasClasse2014(depois.campos?.classe)
    const fundo=periciasAntecedente2014(depois.campos?.antecedente)
    if(!Array.isArray(lista) || !cls || lista.length>cls.qtd ||
       lista.some(x=>typeof x!=='string'||(x!==''&&!cls.opcoes.includes(x))) ||
       new Set(lista.filter(Boolean)).size!==lista.filter(Boolean).length ||
       lista.some(x=>x!==''&&fundo.includes(x)))
      erros.push('Perícias da classe 2014: escolha sem repetições, somente da classe e diferentes das concedidas pelo antecedente.')
  }
  return erros
}

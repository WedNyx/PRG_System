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
import { RACAS_2014, ANTECEDENTES_2014, SUBRACAS_2014 } from './dnd2014Criacao'
import { validarSubclasseDnd2014 } from './dnd2014Subclasses'
import { classesDaFicha2014, espacosDeMagia2014 } from './dnd2014Multiclasse'
import { lerMulticlasseDnd, requisitosMulticlasse } from './dnd2024Classes'

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

// Listas explícitas de perícias de classe: em 2014 não são idênticas às de 2024
// (por exemplo Mago 2014 não seleciona Natureza; Ladino seleciona Atuação).
const SKILLS_2014: Record<string, string[]> = {
  'Bárbaro':['adestrar_animais','atletismo','intimidacao','natureza','percepcao','sobrevivencia'],
  'Bardo':['acrobacia','adestrar_animais','arcanismo','atletismo','atuacao','enganacao','furtividade','historia','intimidacao','intuicao','investigacao','medicina','natureza','percepcao','persuasao','prestidigitacao','religiao','sobrevivencia'],
  'Clérigo':['historia','intuicao','medicina','persuasao','religiao'],
  'Druida':['adestrar_animais','arcanismo','intuicao','medicina','natureza','percepcao','religiao','sobrevivencia'],
  'Guerreiro':['acrobacia','adestrar_animais','atletismo','historia','intuicao','intimidacao','percepcao','sobrevivencia'],
  'Monge':['acrobacia','atletismo','historia','intuicao','religiao','furtividade'],
  'Paladino':['atletismo','intuicao','intimidacao','medicina','persuasao','religiao'],
  'Patrulheiro':['adestrar_animais','atletismo','intuicao','investigacao','natureza','percepcao','furtividade','sobrevivencia'],
  'Ladino':['acrobacia','atletismo','enganacao','intuicao','intimidacao','investigacao','percepcao','atuacao','persuasao','prestidigitacao','furtividade'],
  'Feiticeiro':['arcanismo','enganacao','intuicao','intimidacao','persuasao','religiao'],
  'Bruxo':['arcanismo','enganacao','historia','intimidacao','investigacao','natureza','religiao'],
  'Mago':['arcanismo','historia','intuicao','investigacao','medicina','religiao'],
}
export const periciasClasse2014 = (nome: unknown): { qtd: number; opcoes: string[] } | null => {
  const classe = CLASSES_SRD.find(x => x.nome === nome)
  const opcoes = SKILLS_2014[String(nome)]
  return classe && opcoes ? { qtd: classe.pericias.qtd, opcoes } : null
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
  d: Pick<DadosFicha,'campos' | 'dnd2014PericiasClasse' | 'dnd2014PericiasRaciais' | 'dnd2014Multiclasse' | 'dnd2014Subclasse'>,
  vars: Record<string,number>,
): EfeitosDnd {
  const v: Record<string,number> = Object.fromEntries(VARS_DND.map(x=>[x,0]))
  const treino: EfeitosDnd['treino'] = {}
  const n = Math.min(20,Math.max(1,Math.floor(Number(d.campos.nivel)||1)))
  const classe = CLASSES_SRD.find(x => x.nome === d.campos.classe)
  const cls = classe?.id ?? ''
  const {lista:classes}=classesDaFicha2014(d)
  const em=(id:string)=>classes.find(c=>c.cls.id===id)?.nivel??0
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
  const escolhasRaciais = Array.isArray(d.dnd2014PericiasRaciais) ? d.dnd2014PericiasRaciais : []
  const limiteRacial = d.campos.especie === 'Meio-Elfo' ? 2 : d.campos.especie === 'Humano' && d.campos.subraca2014 === 'Humano Variante' ? 1 : 0
  for (const x of [...new Set(escolhasRaciais)].filter(x => periciasClasse2014('Bardo')?.opcoes.includes(x)).slice(0,limiteRacial)) dar(x,'Perícia racial 2014')
  if (d.campos.especie === 'Elfo') dar('percepcao','Sentidos Aguçados (2014)')
  if (d.campos.especie === 'Meio-Orc') dar('intimidacao','Ameaçador (2014)')
  if (em('barbaro')>0) { const n=em('barbaro')
    v.dnd_furias = n >= 20 ? 0 /* 20: ilimitado, mostrar como característica */ : n >= 17 ? 6 : n >= 12 ? 5 : n >= 6 ? 4 : n >= 3 ? 3 : 2
    v.dnd_dano_furia = n >= 16 ? 4 : n >= 9 ? 3 : 2
    if (n >= 5 && Number(vars.des_max)!==0) v.dnd_desl_extra += 3
  }
  if (em('guerreiro')>0) { const n=em('guerreiro')
    v.dnd_retomar=1
    v.dnd_surto=n>=17?2:n>=2?1:0
    v.dnd_indomavel=n>=17?3:n>=13?2:n>=9?1:0
  }
  if (em('monge')>0) { const n=em('monge')
    v.dnd_foco=n>=2?n:0
    if(n>=2 && Number(vars.ca_base)<=10 && !(Number(vars.armadura)>0))
      v.dnd_desl_extra+= n>=18?9:n>=14?7.5:n>=10?6:n>=6?4.5:3
  }
  // Cap. 6 (PHB 2014): Defesa sem Armadura não é adquirida duas vezes.
  // Se a classe inicial for Monge/Bárbaro, mantém sua fórmula original.
  // Com duas classes secundárias e nenhuma delas inicial, a ordem em que
  // foram adquiridas não está armazenada: não presumir uma CA incorreta.
  const temMonge = em('monge') > 0, temBarbaro = em('barbaro') > 0
  const origemDaDefesa = temMonge && temBarbaro
    ? (cls === 'monge' ? 'monge' : cls === 'barbaro' ? 'barbaro' : null)
    : temMonge ? 'monge' : temBarbaro ? 'barbaro' : null
  if (Number(vars.ca_base) <= 10 && !(Number(vars.armadura) > 0)) {
    if (origemDaDefesa === 'monge')
      v.dnd_ca_extra = Math.max(0, Number(vars.mod_SAB) || 0)
    if (origemDaDefesa === 'barbaro')
      v.dnd_ca_extra = Math.max(0, Number(vars.mod_CON) || 0)
  }
  if (em('paladino')>0) v.dnd_cura_maos=5*em('paladino')
  if (em('bardo')>0) {
    v.dnd_inspiracao=Math.max(1,Number(vars.mod_CAR)||0)
  }
  if (em('ladino')>0) v.dnd_furtivo=1+Math.floor((em('ladino')-1)/2)
  if (em('feiticeiro')>0) v.dnd_feiticaria=em('feiticeiro')>=2?em('feiticeiro'):0
  if (em('druida')>0) v.dnd_forma_selvagem=em('druida')>=2?2:0
  // Multiclasse: adquirir Canalizar Divindade por Paladino e Clérigo
  // oferece os efeitos de ambos, mas NÃO soma os usos (PHB 2014, cap. 6).
  const clerigoN = em('clerigo'), paladinoN = em('paladino')
  const usosClerigo = clerigoN >= 18 ? 3 : clerigoN >= 6 ? 2 : clerigoN >= 2 ? 1 : 0
  v.dnd_canalizar = Math.max(usosClerigo, paladinoN >= 3 ? 1 : 0)
  // No 2014, Paladino/Patrulheiro contam metade PARA BAIXO na multiclasse;
  // como classe única usam a tabela própria e passam a conjurar no nível 2.
  const slots=espacosDeMagia2014(classes,d.dnd2014Subclasse)
  for(let i=1;i<=9;i++) v['dnd_espacos_'+i]=slots.espacos[i]??0
  v.dnd_pacto=slots.pacto
  v.dnd_pacto_nivel=slots.pactoNivel
  const raca=String(d.campos.especie),sub=String(d.campos.subraca2014)
  if (raca==='Anão'&&sub==='Anão da Colina')v.dnd_pv_extra+=n
  // O campo deslocamento já pode conter o valor racial em fichas antigas.
  // Só sugerir deslocamento racial quando ele ainda está no padrão neutro de 9 m.
  if (Number(vars.deslocamento) === 9) {
    if (raca==='Elfo'&&sub==='Elfo da Floresta')v.dnd_desl_extra+=1.5
    if (raca==='Anão'||raca==='Halfling'||raca==='Gnomo')v.dnd_desl_extra-=1.5
  }
  return { vars:v,treino,bonus:{},meiaProficiencia: em('bardo')>=2?Math.floor(prof/2):0 }
}


/** Validação pura usada tanto antes quanto depois das permissões do mestre.
 * Dados históricos não são alterados nem rejeitados se o campo não mudou.
 */
export function validarAlteracoes2014(
  antes: Partial<DadosFicha>, depois: Partial<DadosFicha>, edicao: 'phb2014' | 'phb2024',
  ignorarRequisitos=false,
): string[] {
  const erros: string[]=[]
  const alterou=(k: 'dnd2014AtributosBase'|'dnd2014AtributosExtras'|'dnd2014PericiasClasse'|'dnd2014PericiasRaciais') =>
    JSON.stringify(antes[k]??null)!==JSON.stringify(depois[k]??null)
  const chaves=['dnd2014AtributosBase','dnd2014AtributosExtras','dnd2014PericiasClasse','dnd2014PericiasRaciais','dnd2014Subclasse','dnd2014Multiclasse'] as const
  if (edicao === 'phb2014') {
    // Rejeita novas escolhas de 2024 na versão legada; não apaga fichas
    // históricas que já continham valores próprios.
    for (const [id,lista] of [
      ['classe',CLASSES_SRD.map(x=>x.nome)],
      ['especie',RACAS_2014.map(x=>x.nome)],
      ['antecedente',ANTECEDENTES_2014.map(x=>x.nome)],
    ] as const) {
      if (antes.campos?.[id] !== depois.campos?.[id] &&
        depois.campos?.[id] && !lista.includes(String(depois.campos[id])))
        erros.push('Opção de ' + id + ' indisponível no Livro do Jogador 2014: ' + depois.campos[id])
    }
    const raca=String(depois.campos?.especie??'')
    const sub=String(depois.campos?.subraca2014??'')
    if (antes.campos?.subraca2014 !== depois.campos?.subraca2014 &&
      sub && !(SUBRACAS_2014[raca]??[]).some(x=>x.nome===sub))
      erros.push('Sub-raça incompatível com a raça do Livro do Jogador 2014.')
  }
  if (edicao === 'phb2014') erros.push(...validarSubclasseDnd2014(antes, depois))
  if (edicao !== 'phb2014') {
    if(chaves.some(k => k==='dnd2014Subclasse' ? antes.dnd2014Subclasse !== depois.dnd2014Subclasse
      : k==='dnd2014Multiclasse' ? JSON.stringify(antes.dnd2014Multiclasse??{})!==JSON.stringify(depois.dnd2014Multiclasse??{})
      : alterou(k)))
      erros.push('As escolhas de criação 2014 não podem ser alteradas numa ficha com livro-base 2024.')
    return erros
  }
  // Subir nível de outra classe é independente de dndMulticlasse (motor 2024).
  const outras=depois.dnd2014Multiclasse
  const mudouMulti=JSON.stringify(antes.dnd2014Multiclasse??{})!==JSON.stringify(outras??{}) ||
    (outras && (antes.campos?.nivel!==depois.campos?.nivel || antes.campos?.classe!==depois.campos?.classe))
  if(mudouMulti && outras!==undefined) {
    if(!outras || typeof outras!=='object' || Array.isArray(outras))
      erros.push('Multiclasse 2014 deve ser um objeto de classe e níveis.')
    else {
      const principal=idDe(depois.campos?.classe)
      const lido=lerMulticlasseDnd(outras,principal)
      if(Object.keys(outras).some(k=>!Object.hasOwn(lido,k)))
        erros.push('Multiclasse 2014 contém classe ou nível inválido.')
      const total=Number(depois.campos?.nivel)
      const soma=Object.values(lido).reduce((a,b)=>a+b,0)
      if(!Number.isInteger(total)||total<1||total>20||soma>=total)
        erros.push('A classe inicial precisa ter pelo menos um nível, com total máximo 20.')
      const velhas=lerMulticlasseDnd(antes.dnd2014Multiclasse,idDe(antes.campos?.classe))
      const entrou=Object.keys(lido).some(k=>!velhas[k])
      if(entrou&&!ignorarRequisitos) {
        const efetivos=atributosEfetivos2014(depois as DadosFicha) ?? depois.atributos ?? {}
        const faltas=requisitosMulticlasse(efetivos,[principal,...Object.keys(lido)])
        if(faltas.length) erros.push('Multiclasse 2014: '+faltas.join('; '))
      }
    }
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
  if(alterou('dnd2014PericiasRaciais')) {
    const x=depois.dnd2014PericiasRaciais
    const r=String(depois.campos?.especie??'')
    const v=String(depois.campos?.subraca2014??'')
    const max=r==='Meio-Elfo'?2:r==='Humano'&&v==='Humano Variante'?1:0
    const validas=periciasClasse2014('Bardo')?.opcoes??[]
    const outras=[...(Array.isArray(depois.dnd2014PericiasClasse)?depois.dnd2014PericiasClasse:[]),
      ...periciasAntecedente2014(depois.campos?.antecedente)]
    if(!Array.isArray(x) || x.length>max || x.some(y=>typeof y!=='string'||(y!==''&&!validas.includes(y))||outras.includes(y)) ||
      new Set(x.filter(Boolean)).size!==x.filter(Boolean).length)
      erros.push('Perícias raciais 2014: escolha apenas as permitidas e sem repetições.')
  }
  return erros
}

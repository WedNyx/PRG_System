/**
 * Grimório D&D 2014 — registro de magias escolhidas a partir do exemplar do
 * jogador. Não usa o catálogo de efeitos revisados do SRD 5.2.1 (2024).
 *
 * O SRD 5.1 é CC BY 4.0. Obras comerciais só podem ser identificadas pela fonte;
 * seus efeitos devem ser consultados no livro, nunca copiados/inventados aqui.
 */
import type { DadosFicha } from './tipos'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
import { lerLivrosDnd } from './dndLivros'
import { idDe } from './dnd2024Classes'

export type RegistroMagiaDnd2014 = {
  id: string; nome: string; nivel: number; classe: string; fonte: string
  modo: 'conhecida' | 'preparada' | 'extra'
  notas?: string; expressao?: string
}
const classesConjuradoras = new Set(['bardo','clerigo','druida','feiticeiro','mago','paladino','patrulheiro','bruxo','guerreiro','ladino'])
const formatoExpr = /^(?:\d{1,2}d(?:4|6|8|10|12|20|100)(?:[+-]\d{1,3})?)$/
const nomeSeguro = (v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=100
export const expressaoMagia2014Valida=(v:unknown):boolean=>typeof v==='string'&&v.length<=25&&formatoExpr.test(v.trim())
export function maximoNivelMagiaClasse2014(
  classe:string,nivel:number,subclasse:string|undefined,
):number {
  const id=idDe(classe)
  if (!classesConjuradoras.has(id)||nivel<1||nivel>20)return 0
  if((id==='guerreiro'&&subclasse!=='cavaleiro-arcano')||(id==='ladino'&&subclasse!=='trapaceiro-arcano'))return 0
  if((id==='paladino'||id==='patrulheiro')&&nivel<2)return 0
  if((id==='guerreiro'||id==='ladino')&&nivel<3)return 0
  if(id==='bruxo')return Math.min(5,Math.ceil(nivel/2))
  const total=id==='paladino'||id==='patrulheiro'?Math.ceil(nivel/2):
    id==='guerreiro'||id==='ladino'?Math.ceil(nivel/3):nivel
  return Math.min(9,Math.max(0,Math.ceil(total/2)))
}
export function lerMagias2014(raw:unknown):RegistroMagiaDnd2014[] {
  if(!Array.isArray(raw))return []
  const saida:RegistroMagiaDnd2014[]=[]
  const vistos=new Set<string>()
  for(const item of raw.slice(0,150)){
    if(!item||typeof item!=='object'||Array.isArray(item))continue
    const x=item as Record<string,unknown>
    if(!nomeSeguro(x.nome)||typeof x.classe!=='string'||!classesConjuradoras.has(x.classe)||
      !Number.isInteger(x.nivel)||Number(x.nivel)<0||Number(x.nivel)>9||
      typeof x.fonte!=='string'||x.fonte.length>70||
      !['conhecida','preparada','extra'].includes(String(x.modo)))continue
    const id=idDe(x.nome).slice(0,75)+'-'+x.nivel+'-'+x.classe
    if(vistos.has(id))continue
    vistos.add(id)
    saida.push({
      id,nome:x.nome.trim(),nivel:Number(x.nivel),classe:x.classe,fonte:x.fonte,
      modo:x.modo as RegistroMagiaDnd2014['modo'],
      ...(typeof x.notas==='string'?{notas:x.notas.slice(0,500)}:{}),
      ...(expressaoMagia2014Valida(x.expressao)?{expressao:String(x.expressao).trim()}:{}),
    })
  }
  return saida
}
export function livrosPermitidosMagias2014(d:Pick<DadosFicha,'dndLivros'>):string[] {
  const livros=lerLivrosDnd(d.dndLivros,'phb2014')
  return [livros.base,...livros.suplementos]
}
export function validarAlteracoesMagias2014(
  antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024',
):string[] {
  if(JSON.stringify(antes.dnd2014Magias??[])===JSON.stringify(depois.dnd2014Magias??[]) &&
    antes.campos?.classe===depois.campos?.classe && antes.campos?.nivel===depois.campos?.nivel &&
    JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{}) &&
    antes.dnd2014Subclasse===depois.dnd2014Subclasse &&
    JSON.stringify(antes.dndLivros??{})===JSON.stringify(depois.dndLivros??{}))return []
  if(edicao!=='phb2014')return ['O grimório de 2014 só pode ser editado em fichas do Livro do Jogador (2014).']
  const raw=depois.dnd2014Magias
  if(!Array.isArray(raw)||raw.length>120||lerMagias2014(raw).length!==raw.length)
    return ['Magias de 2014 inválidas, repetidas ou acima do limite de registros.']
  const d=depois as DadosFicha
  const {lista}=classesDaFicha2014(d)
  const classes=new Map(lista.map(c=>[c.cls.id,c.nivel]))
  const livros=new Set(livrosPermitidosMagias2014(d))
  const erros:string[]=[]
  for(const m of lerMagias2014(raw)){
    if(!livros.has(m.fonte))erros.push('Fonte de magia não selecionada para esta ficha: '+m.fonte)
    const nivel=classes.get(m.classe)
    if(m.modo!=='extra'&&!nivel)erros.push('Classe da magia não pertence ao personagem: '+m.classe)
    const max=maximoNivelMagiaClasse2014(m.classe,nivel??0,d.dnd2014Subclasse)
    if(m.modo!=='extra' && m.nivel>max)
      erros.push('Nível da magia acima do permitido na classe de 2014: '+m.nome)
    // Paladino e Patrulheiro da edição 2014 não recebem truques pela classe.
    if(m.modo!=='extra' && m.nivel===0 &&
      (max===0 || m.classe==='paladino' || m.classe==='patrulheiro'))
      erros.push('Esta classe não recebe este truque por sua progressão normal em 2014: '+m.nome)
  }
  return erros
}

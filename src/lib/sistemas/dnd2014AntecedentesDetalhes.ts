/** Metadados de proficiências e escolhas de antecedentes do Livro do Jogador 2014.
 * Capítulo 4, pp. impressas 125–144; identifica fatos sem transcrever regras comerciais.
 * Perícias permanecem no motor dnd2014Regras. O campo opcional registra apenas
 * escolhas VARIÁVEIS: ferramentas fixas não são selecionadas de novo.
 */
import type { DadosFicha } from './tipos'
export type DetalhesAntecedente2014={
  nome:string
  idiomas:number
  ferramentasFixas:readonly string[]
  ferramentasLivres:number
  tipoFerramenta?:string
  equipamentos:string
}
const def=(nome:string,idiomas:number,ferramentasFixas:string[],ferramentasLivres:number,
  tipoFerramenta:string|undefined,equipamentos:string):DetalhesAntecedente2014=>({
  nome,idiomas,ferramentasFixas,ferramentasLivres,tipoFerramenta,equipamentos,
})
export const ANTECEDENTES_DETALHES_2014:readonly DetalhesAntecedente2014[]=[
  def('Acólito',2,[],0,undefined,'Símbolo sagrado, livro de preces ou contas de oração, incenso, vestes e moedas'),
  def('Charlatão',0,['Kit de disfarce','Kit de falsificação'],0,undefined,'Roupas finas, kit de disfarce, acessórios de trapaça e moedas'),
  def('Criminoso',0,['Ferramentas de ladrão'],1,'Kit de jogo','Pé de cabra, roupas escuras com capuz e moedas'),
  def('Artista',0,['Kit de disfarce'],1,'Instrumento musical','Instrumento, lembrança de admirador, traje e moedas'),
  def('Herói do Povo',0,['Veículos terrestres'],1,'Ferramenta de artesão','Ferramenta de artesão, pá, panela, roupas e moedas'),
  def('Artesão de Guilda',1,[],1,'Ferramenta de artesão','Ferramentas, carta da guilda, roupas e moedas'),
  def('Eremita',1,['Kit de herbalismo'],0,undefined,'Notas de estudos, cobertor, roupas, kit de herbalismo e moedas'),
  def('Nobre',1,[],1,'Kit de jogo','Trajes finos, anel de sinete, linhagem e moedas'),
  def('Forasteiro',1,[],1,'Instrumento musical','Bordão, armadilha de caça, lembrança animal, roupas de viajante e moedas'),
  def('Sábio',2,[],0,undefined,'Tinta, pena, faca, carta, roupas e moedas'),
  def('Marinheiro',0,['Ferramentas de navegador','Veículos aquáticos'],0,undefined,'Clava, corda, amuleto da sorte, roupas e moedas'),
  def('Soldado',0,['Veículos terrestres'],1,'Kit de jogo','Insígnia, troféu, dados ou baralho, roupas e moedas'),
  def('Órfão',0,['Kit de disfarce','Ferramentas de ladrão'],0,undefined,'Faca pequena, mapa local, animal de estimação, lembrança, roupas e moedas'),
]
export const detalhesAntecedente2014=(nome:unknown):DetalhesAntecedente2014|null=>
  ANTECEDENTES_DETALHES_2014.find(x=>x.nome===nome)??null

export type EscolhasAntecedente2014={
  antecedente:string
  idiomas:string[]
  ferramentas:string[]
}
const validos=(itens:unknown,limite:number):itens is string[]=>
  Array.isArray(itens)&&itens.length<=limite&&itens.every(x=>typeof x==='string'&&
    x.length<=80&&(!x||x.trim().length>=2))&&
  new Set(itens.filter(Boolean).map(x=>x.trim().toLowerCase())).size===itens.filter(Boolean).length

export function diagnosticarEscolhasAntecedente2014(d:Partial<DadosFicha>):string[] {
  const ref=detalhesAntecedente2014(d.campos?.antecedente)
  if(!ref)return []
  const x=d.dnd2014AntecedenteExtras
  if(!x)return ['Registre os idiomas e ferramentas do antecedente, quando houver, e confira o equipamento inicial.']
  if(x.antecedente!==ref.nome ||!validos(x.idiomas,ref.idiomas)||
    !validos(x.ferramentas,ref.ferramentasLivres))
    return ['Reveja os idiomas e ferramentas variáveis do antecedente selecionado.']
  if(x.idiomas.filter(Boolean).length<ref.idiomas || x.ferramentas.filter(Boolean).length<ref.ferramentasLivres)
    return ['Escolhas de idioma ou ferramenta ainda não preenchidas.']
  return []
}
export function validarEscolhasAntecedente2014(
  antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024',
):string[]{
  const mudou=JSON.stringify(antes.dnd2014AntecedenteExtras)!==JSON.stringify(depois.dnd2014AntecedenteExtras)
  if(!mudou)return []
  if(edicao!=='phb2014')return ['Escolhas de antecedentes 2014 não podem ser alteradas em fichas 2024.']
  const x=depois.dnd2014AntecedenteExtras
  if(x===undefined)return []
  const ref=detalhesAntecedente2014(depois.campos?.antecedente)
  if(!ref ||!x||typeof x!=='object'||x.antecedente!==ref.nome||
    !validos(x.idiomas,ref.idiomas)||!validos(x.ferramentas,ref.ferramentasLivres))
    return ['Idiomas e ferramentas devem respeitar o antecedente 2014, sem escolhas duplicadas.']
  return []
}

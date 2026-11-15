/** Índice de nomes de talentos (cap. 6, pp. 167–173) do Livro do Jogador 2014.
 * Nomes e níveis são metadados bibliográficos; os efeitos e condições do livro
 * devem ser consultados antes de aplicar qualquer bônus. Esta lista NÃO é 2024.
 */
import type { DadosFicha } from './tipos'
import { classesDaFicha2014 } from './dnd2014Multiclasse'

export const TALENTOS_PHB_2014 = ["ADEPTO ELEMENTAL","ADEPTO MARCIAL","ALERTA","AMBIDESTRO","ATACANTE BESTIAL","ATIRADOR AGUÇADO","ATIRADOR DE MAGIA","ATLETA","ATOR","COMBATENTE MONTADO","CONJURADOR DE GUERRA","CONJURADOR DE RITUAL","CURANDEIRO","DUELISTA DEFENSIVO","ESPECIALISTA EM BESTA","ESPECIALISTA EM BRIGA","EXPLORADOR DE CAVERNAS","IMOBILIZADOR","INICIADO EM MAGIA","INVESTIDA PODEROSA","LÍDER INSPIRADOR","MAESTRIA EM ARMA DE HASTE","MAESTRIA EM ARMADURA MÉDIA","MAESTRIA EM ARMADURA PESADA","MATADOR DE CONJURADORES","MENTE AFIADA","MESTRE DE ARMAS","MESTRE DE ARMAS GRANDES","MESTRE DE ESCUDO","MOBILIDADE","OBSERVADOR","PERITO","POLIGLOTA","PROTEÇÃO LEVE","PROTEÇÃO MODERADA","PROTEÇÃO PESADA","RESILIENTE","RESISTENTE","ROBUSTO","SENTINELA","SORRATEIRO","SORTUDO"] as readonly string[]
/**
 * Pré-requisitos de talentos do PHB 2014 (cap. 6, páginas impressas 167–172).
 * Requisitos verificáveis são bloqueados; treinamento em armadura e magia racial
 * podem exigir confirmação manual quando os dados da ficha não são suficientes.
 * Os efeitos do talento não são copiados nem concedidos por esta tabela.
 */
export const REQUISITOS_TALENTOS_2014:Record<string,{
  atributo?:string;minimo?:number;alternativa?:string;
  conjurar?:boolean;proficienciaArmadura?:'leve'|'media'|'pesada';
}> = {
  'ADEPTO ELEMENTAL':{conjurar:true},
  'ATIRADOR DE MAGIA':{conjurar:true},
  'CONJURADOR DE GUERRA':{conjurar:true},
  'CONJURADOR DE RITUAL':{atributo:'INT',alternativa:'SAB',minimo:13},
  'DUELISTA DEFENSIVO':{atributo:'DES',minimo:13},
  'IMOBILIZADOR':{atributo:'FOR',minimo:13},
  'LÍDER INSPIRADOR':{atributo:'CAR',minimo:13},
  'MAESTRIA EM ARMADURA MÉDIA':{proficienciaArmadura:'media'},
  'MAESTRIA EM ARMADURA PESADA':{proficienciaArmadura:'pesada'},
  'PROTEÇÃO MODERADA':{proficienciaArmadura:'leve'},
  'PROTEÇÃO PESADA':{proficienciaArmadura:'media'},
  'SORRATEIRO':{atributo:'DES',minimo:13},
}

export type EstadoRequisitoTalento2014 = 'apto'|'inapto'|'conferir'
export function avaliarRequisitoTalento2014(
  talento:string,
  dados:{atributos?:Record<string,number>|null;conjurador?:boolean|null;armaduras?:readonly string[]|null},
): {estado:EstadoRequisitoTalento2014;motivo:string} {
  const r=REQUISITOS_TALENTOS_2014[talento]
  if(!r)return {estado:'apto',motivo:'Sem pré-requisito geral de atributo ou proficiência.'}
  if(r.atributo&&r.minimo){
    const scores=[r.atributo,...(r.alternativa?[r.alternativa]:[])]
    const conhecidos=scores.map(a=>dados.atributos?.[a]).filter((x):x is number=>Number.isFinite(x))
    if(conhecidos.length!==scores.length)
      return {estado:'conferir',motivo:'Confirme os valores finais de '+scores.join(' ou ')+'.'}
    if(!conhecidos.some(x=>x>=r.minimo!))
      return {estado:'inapto',motivo:'Exige '+scores.join(' ou ')+' '+r.minimo+' ou maior.'}
    return {estado:'apto',motivo:'Requisito de atributo alcançado.'}
  }
  if(r.conjurar)
    return dados.conjurador===true
      ? {estado:'apto',motivo:'Personagem possui conjuração de classe.'}
      : {estado:'conferir',motivo:'Verifique capacidade de conjurar ao menos uma magia, inclusive por raça, item ou talento.'}
  if(r.proficienciaArmadura){
    if(!dados.armaduras)return {estado:'conferir',motivo:'O mestre deve conferir proficiência com armadura '+r.proficienciaArmadura+'.'}
    return dados.armaduras.includes(r.proficienciaArmadura)
      ? {estado:'apto',motivo:'Proficiência com armadura '+r.proficienciaArmadura+' confirmada.'}
      : {estado:'inapto',motivo:'Exige proficiência com armadura '+r.proficienciaArmadura+'.'}
  }
  return {estado:'conferir',motivo:'Conferir pré-requisito no livro.'}
}

const AUMENTOS_PADRAO = [4,8,12,16,19] as const
const AUMENTOS_EXTRAS: Record<string,readonly number[]> = {
  guerreiro:[4,6,8,12,14,16,19],
  ladino:[4,8,10,12,16,19],
}
export function limitesTalentos2014(d:Pick<DadosFicha,'campos'|'dnd2014Multiclasse'>) {
  const {lista}=classesDaFicha2014(d)
  const aumentos=lista.reduce((total,classe)=>{
    const niveis=AUMENTOS_EXTRAS[classe.cls.id]??AUMENTOS_PADRAO
    return total+niveis.filter(n=>classe.nivel>=n).length
  },0)
  const variante=d.campos.especie==='Humano'&&d.campos.subraca2014==='Humano Variante'?1:0
  return {aumentos,variante,total:aumentos+variante}
}
export function validarTalentos2014(antes:Partial<DadosFicha>,depois:Partial<DadosFicha>,edicao:'phb2014'|'phb2024',mestre=false):string[] {
  const antigo=JSON.stringify(antes.dnd2014Talentos??[])
  const novo=JSON.stringify(depois.dnd2014Talentos??[])
  if(antigo===novo&&antes.campos?.classe===depois.campos?.classe&&antes.campos?.nivel===depois.campos?.nivel&&
     antes.campos?.especie===depois.campos?.especie&&antes.campos?.subraca2014===depois.campos?.subraca2014&&
     JSON.stringify(antes.dnd2014Multiclasse??{})===JSON.stringify(depois.dnd2014Multiclasse??{}))return []
  if(edicao!=='phb2014')
    return antigo===novo ? [] : ['Talentos do Livro do Jogador 2014 não podem ser alterados numa ficha 2024.']
  if(depois.dnd2014Talentos===undefined)return []
  if(!Array.isArray(depois.dnd2014Talentos)||depois.dnd2014Talentos.length>25||
    depois.dnd2014Talentos.some(x=>typeof x!=='string'||!TALENTOS_PHB_2014.includes(x))||
    new Set(depois.dnd2014Talentos).size!==depois.dnd2014Talentos.length)
    return ['Escolha somente talentos do Livro do Jogador 2014, sem repetições.']
  // Cada talento, exceto o do Humano Variante, consome um marco de atributo.
  // A ausência do mapa de incrementos nunca deve permitir um talento extra.
  const limite=limitesTalentos2014(depois as DadosFicha)
  const incrementos=Object.keys(depois.dnd2014Incrementos??{}).length
  if(!mestre && depois.dnd2014Talentos.length+incrementos>limite.total)
    return ['Talentos e Incrementos de Atributo ultrapassam os marcos da classe; cada marco permite uma única escolha.']
  if(!mestre&&depois.dnd2014Talentos.length>limite.total)
    return ['Há mais talentos que opções de Incremento de Atributo disponíveis no nível da classe (mais o Humano Variante).']
  return []
}

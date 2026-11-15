/**
 * Hexágonos oficiais de D&D são projeções de regras/decisões existentes.
 * NUNCA são inseridos em dados.arvore nem geram bônus automaticamente:
 * os efeitos vêm do motor da edição, e hexágonos extras do mestre permanecem
 * separados para não conceder proficiências/recursos duas vezes.
 */
import type { DadosFicha } from './tipos'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressoDaFichaDnd } from './dnd2024Ficha'
import { progressaoVisivel } from './dnd2024Progressao'
import { ANTECEDENTES_2014, RACAS_2014, SUBRACAS_2014 } from './dnd2014Criacao'
import { marcosDaClasse2014 } from './dnd2014Marcos'
import { subclasseDaFicha2014 } from './dnd2014Subclasses'
import {ESCOLHAS_SUBCLASSES_2014} from './dnd2014EscolhasSubclasse'
import {limiteMetamagia2014} from './dnd2014OpcoesClasse'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
import { lerLivrosDnd, type LivroBaseDnd } from './dndLivros'
import { fontePermitida, FONTE_LEGADO_2014, FONTE_PHB } from './dnd2024Fontes'

export type RamoHexDnd = 'classe' | 'especie' | 'antecedente' | 'mestre'
export type EstadoHexDnd = 'recebido' | 'pendente' | 'referencia' | 'futuro'
export type HexagonoDnd = {
  id: string; titulo: string; descricao: string
  nivel: number; ramo: RamoHexDnd; estado: EstadoHexDnd
  livro: string; escolha?: string
}
export const RAMOS_HEX_DND: { id: RamoHexDnd; titulo: string; icone: string; cor: string }[] = [
  { id: 'classe', titulo: 'Classe e subclasse', icone: '⚔️', cor: '#73c5f6' },
  { id: 'especie', titulo: 'Espécie / raça', icone: '🧬', cor: '#c4a0fc' },
  { id: 'antecedente', titulo: 'Origem e antecedente', icone: '📜', cor: '#f2bf69' },
  { id: 'mestre', titulo: 'Habilidades adicionais do mestre', icone: '🌠', cor: '#7edac0' },
]
const s = (v: unknown): string => typeof v === 'string' ? v : ''
const fonteComercial = (f: string): boolean => !f.startsWith('SRD')
const fonteVisivel = (f: string, permitidas: Set<string> | null): boolean =>
  !fonteComercial(f) ||
  (f.includes('2014') && fontePermitida(FONTE_LEGADO_2014, permitidas)) ||
  (f.includes('2024') && fontePermitida(FONTE_PHB, permitidas))

/** O mestre libera publicações na campanha, mas só publicações escolhidas na ficha
 * devem alimentar os hexágonos próprios do personagem.
 */
export function hexagonosOficiaisDnd(
  d: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMulticlasse' | 'dndLivros' | 'dnd2014Subclasse' | 'dnd2014Subclasses' | 'dnd2014Multiclasse'> & Partial<Pick<DadosFicha,'dnd2014Talentos'|'dnd2014Magias'|'dnd2014EscolhasSubclasse'|'dnd2014OpcoesTalentos'|'dnd2014OpcoesClasse'>>,
  edicao: LivroBaseDnd = lerLivrosDnd(d.dndLivros).base,
  fontes: Set<string> | null = null,
  mostrarFuturos = false,
): HexagonoDnd[] {
  if (edicao === 'phb2014') {
    const raca = s(d.campos.especie)
    const antecedente = s(d.campos.antecedente), subraca = s(d.campos.subraca2014)
    const racaMeta = RACAS_2014.find(x => x.nome === raca)
    const antMeta = ANTECEDENTES_2014.find(x => x.nome === antecedente)
    const subs = SUBRACAS_2014[raca] ?? []
    const sub = subs.find(x => x.nome === subraca)
    const { lista } = classesDaFicha2014(d)
    const subclassesDaFicha: HexagonoDnd[] = lista.flatMap(c => {
      const subclasse = subclasseDaFicha2014(d,c.cls.id)
      if(!subclasse)return []
      return [{
        id:c.principal?'2014-subclasse':'2014-subclasse-'+c.cls.id,
        titulo:subclasse.nome,
        descricao:subclasse.fonte==='srd51'
          ? c.cls.nome+' · arquétipo do SRD 5.1, progressão pelo nível desta classe.'
          : 'Subclasse do Livro do Jogador 2014; benefícios exigem conferência.',
        nivel:subclasse.nivel, ramo:'classe' as const, estado:'referencia' as const,
        livro:subclasse.fonte==='srd51'?'SRD 5.1 (2014)':'Player’s Handbook (2014)',
      },...(subclasse.marcos??[]).filter(m=>mostrarFuturos||m.nivel<=c.nivel).map(m=>({
        id:c.principal?'2014-subclasse-'+m.nivel+'-'+m.nome:
          '2014-subclasse-'+c.cls.id+'-'+m.nivel+'-'+m.nome,
        titulo:m.nome, descricao:c.cls.nome+' · característica pelo nível da classe, não pelo nível total.',
        nivel:m.nivel, ramo:'classe' as const,
        estado:m.nivel>c.nivel?'futuro' as const:'referencia' as const,
        livro:subclasse.fonte==='srd51'?'SRD 5.1 (2014)':'Player’s Handbook (2014)',
      }))]
    })
    const escolhasArquetipo:HexagonoDnd[] = lista.flatMap(c=>{
      const sub=subclasseDaFicha2014(d,c.cls.id)
      const registro=d.dnd2014EscolhasSubclasse?.[c.cls.id]
      if(!sub||!registro||registro.subclasse!==sub.id)return []
      return (ESCOLHAS_SUBCLASSES_2014[sub.id]??[])
        .filter(grupo=>grupo.nivel<=c.nivel)
        .flatMap(grupo=>(registro.grupos[grupo.id]??[])
          .filter(nome=>grupo.opcoes.includes(nome))
          .map((nome,i)=>({
            id:'2014-escolha-sub-'+c.cls.id+'-'+grupo.id+'-'+i,
            titulo:nome,
            descricao:sub.nome+' · '+grupo.titulo+'; escolha registrada no nível da classe '+grupo.nivel+'. Efeito conforme o livro e o mestre.',
            nivel:grupo.nivel,ramo:'classe' as const,estado:'referencia' as const,
            livro:'Player’s Handbook (2014)',
          })))
    })
    const bruxoNivel=lista.find(x=>x.cls.id==='bruxo')?.nivel??0
    const feiticeiroNivel=lista.find(x=>x.cls.id==='feiticeiro')?.nivel??0
    const escolhasClasse:HexagonoDnd[]=[
      ...(bruxoNivel>=3&&d.dnd2014OpcoesClasse?.pactoBruxo?[{
        id:'2014-pacto-bruxo',titulo:d.dnd2014OpcoesClasse.pactoBruxo,
        descricao:'Dádiva do Pacto do Bruxo (2014). Benefícios e condições conforme o livro.',
        nivel:3,ramo:'classe' as const,estado:'referencia' as const,
        livro:'Player’s Handbook (2014)',
      }]:[]),
      ...(feiticeiroNivel>=3?(d.dnd2014OpcoesClasse?.metamagicas??[]).slice(0,limiteMetamagia2014(feiticeiroNivel)):[]).map((nome,i)=>({
        id:'2014-metamagia-'+i,titulo:nome,
        descricao:'Metamagia de Feiticeiro 2014. Custo e efeito devem seguir o livro.',
        nivel:3,ramo:'classe' as const,estado:'referencia' as const,
        livro:'Player’s Handbook (2014)',
      })),
    ]
    // PHB 2014 cap. 6: habilidades são recebidas pelo nível EM CADA CLASSE,
    // nunca pelo nível total do personagem multiclasse.
    return [
      ...lista.flatMap(c => [
        {
          id: '2014-classe-' + c.cls.id, titulo: c.cls.nome,
          descricao: c.principal
            ? 'Classe inicial: fornece proficiências e salvaguardas iniciais do Livro do Jogador 2014.'
            : 'Multiclasse 2014: nível próprio de classe. Novas proficiências são limitadas conforme o capítulo 6.',
          nivel: 1, ramo: 'classe' as const, estado: 'recebido' as const,
          livro: 'SRD 5.1 (2014)',
        },
        ...marcosDaClasse2014(c.cls.nome)
          .filter(m => mostrarFuturos || m.nivel <= c.nivel)
          .map((m, i) => ({
            id: '2014-' + c.cls.id + '-' + m.nivel + '-' + i,
            titulo: m.nome, descricao: m.automatico
              ? c.cls.nome + ' · nível de classe ' + m.nivel + '. Recurso-base disponível somente quando esta classe atingir o nível indicado.'
              : c.cls.nome + ' · nível de classe ' + m.nivel + '. Característica 2014; decisão ou efeito específico deve ser confirmado no livro.',
            escolha: c.cls.nome,
            nivel: m.nivel, ramo: 'classe' as const,
            estado: m.nivel > c.nivel ? 'futuro' as const : m.automatico ? 'recebido' as const : 'referencia' as const,
            livro: 'SRD 5.1 (2014)',
          })),
      ]),
      ...subclassesDaFicha,
      ...escolhasArquetipo,
      ...escolhasClasse,
      ...(d.dnd2014Talentos??[]).map((nome,i)=>({
        id:'2014-talento-'+i+'-'+nome,
        titulo:'Talento: '+nome,
        descricao:'Talento opcional escolhido no Livro do Jogador 2014. '+(d.dnd2014OpcoesTalentos?.[nome] ? 'Escolha registrada: '+d.dnd2014OpcoesTalentos[nome]+'. ' : '')+'Efeitos condicionais exigem leitura do livro e validação do mestre.',
        nivel:1,ramo:'classe' as const,estado:'referencia' as const,
        livro:'Player’s Handbook (2014)',
      })),
      ...((d.dnd2014Magias?.length??0)>0?[{
        id:'2014-grimorio',
        titulo:'Grimório 2014 · '+d.dnd2014Magias!.length+' magia(s)',
        descricao:'Conhecidas, preparadas e extras estão no grimório, com limites por classe e concentração ativa.',
        nivel:1,ramo:'classe' as const,estado:'referencia' as const,
        livro:'Player’s Handbook (2014)',
      }]:[]),
      ...(racaMeta ? [{ id: '2014-raca', titulo: 'Raça: ' + raca, descricao: racaMeta.descricao ?? '',
        nivel: 1, ramo: 'especie' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
      ...(sub ? [{ id: '2014-subraca', titulo: sub.nome, descricao: sub.detalhe,
        nivel: 1, ramo: 'especie' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
      ...(antMeta ? [{ id: '2014-antecedente', titulo: 'Antecedente: ' + antecedente, descricao: antMeta.descricao ?? '',
        nivel: 1, ramo: 'antecedente' as const, estado: 'referencia' as const, livro: 'Player’s Handbook (2014)' }] : []),
    ]
  }

  return progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(d))
    .filter(m => (mostrarFuturos || m.estado !== 'futuro') && fonteVisivel(m.fonte, fontes))
    .map(m => {
      const pendente = m.estado === 'escolher' || m.estado === 'pendente'
      const nomeEscolha = m.opcoes?.find(o => o.id === m.escolha)?.nome
      const fonteEscolha = m.opcoes?.find(o => o.id === m.escolha)?.fonte
      const comercial = fonteComercial(m.fonte) || !!fonteEscolha
      const estado: EstadoHexDnd = m.estado === 'futuro' ? 'futuro'
        : pendente ? 'pendente' : comercial ? 'referencia' : 'recebido'
      const ramo = m.origem === 'subclasse' ? 'classe' : m.origem
      return { id: m.id, titulo: m.nome,
        descricao: m.descricao ?? 'Característica da origem ou da classe indicada no livro.',
        nivel: m.nivel, ramo, estado, livro: fonteEscolha ? 'Livro do Jogador (2024) — opção comercial' : m.fonte,
        ...(nomeEscolha ? { escolha: nomeEscolha } : {}) }
    })
}

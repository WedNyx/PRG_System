/**
 * Checklist de preparação para jogar D&D. É diagnóstico não destrutivo:
 * não grava características, não concede bônus, não bloqueia rascunhos.
 * A etapa "conferir" identifica regras/valores que o mestre deve verificar;
 * "pendente" registra uma decisão de criação ainda necessária.
 */
import type { DadosFicha } from './tipos'
import { lerLivrosDnd, type LivroBaseDnd } from './dndLivros'
import { RACAS_2014, SUBRACAS_2014, ANTECEDENTES_2014 } from './dnd2014Criacao'
import { aumentosRaciais2014, periciasAntecedente2014, periciasClasse2014 } from './dnd2014Regras'
import { subclasseAtivaDnd2014, subclassesDaClasse2014 } from './dnd2014Subclasses'
import { classesDaFicha2014 } from './dnd2014Multiclasse'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressoDaFichaDnd } from './dnd2024Ficha'
import { progressaoVisivel } from './dnd2024Progressao'

export type ProntidaoTipo = 'pendente' | 'conferir'
export type PendenciaDnd = { id: string; titulo: string; detalhe: string; tipo: ProntidaoTipo; secao: 'principal' | 'atributos' | 'habilidades' | 'arvore' }
export type ProntidaoDnd = { edicao: LivroBaseDnd; pendencias: PendenciaDnd[]; prontoParaConferir: boolean }

export function avaliarProntidaoDnd(d: DadosFicha, edicao: LivroBaseDnd = lerLivrosDnd(d.dndLivros).base): ProntidaoDnd {
  const pendencias: PendenciaDnd[] = []
  const incluir = (id: string, titulo: string, detalhe: string, tipo: ProntidaoTipo, secao: PendenciaDnd['secao']) => {
    if (!pendencias.some(x => x.id === id)) pendencias.push({ id, titulo, detalhe, tipo, secao })
  }
  const classe = String(d.campos.classe ?? '')
  const especie = String(d.campos.especie ?? '')
  const antecedente = String(d.campos.antecedente ?? '')
  const nivel = Number(d.campos.nivel)
  if (!d.nome?.trim()) incluir('nome', 'Nome do personagem', 'Dê um nome à ficha.', 'pendente', 'principal')
  if (!classe) incluir('classe', 'Classe', 'Escolha uma classe do livro-base.', 'pendente', 'principal')
  if (!especie) incluir('especie', edicao === 'phb2014' ? 'Raça' : 'Espécie', 'Escolha sua raça/espécie.', 'pendente', 'principal')
  if (!antecedente) incluir('antecedente', 'Antecedente', 'Escolha um antecedente do livro-base.', 'pendente', 'principal')
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 20)
    incluir('nivel', 'Nível', 'Informe um nível inteiro de 1 a 20.', 'pendente', 'principal')

  if (edicao === 'phb2014') {
    if (especie && !RACAS_2014.some(x => x.nome === especie))
      incluir('raca2014', 'Raça incompatível', 'Esta raça não consta no Livro do Jogador 2014 selecionado.', 'pendente', 'principal')
    if (antecedente && !ANTECEDENTES_2014.some(x => x.nome === antecedente))
      incluir('antecedente2014', 'Antecedente incompatível', 'Revise o antecedente conforme o livro de 2014.', 'pendente', 'principal')
    const subracas = SUBRACAS_2014[especie] ?? []
    if (subracas.length && !subracas.some(x => x.nome === d.campos.subraca2014))
      incluir('subraca2014', 'Sub-raça ou variante', 'Escolha a opção racial na criação guiada.', 'pendente', 'principal')
    const aumentos = aumentosRaciais2014(especie, d.campos.subraca2014, d.dnd2014AtributosExtras)
    if (aumentos.pendencias.some(x => x.includes('dois atributos')))
      incluir('atributosRaciais2014', 'Aumentos raciais variáveis', 'Escolha dois atributos diferentes no guia de criação.', 'pendente', 'principal')
    if (!d.dnd2014AtributosBase)
      incluir('atributosBase2014', 'Conferir atributos já salvos', 'Sem valores-base confirmados, a ficha considera os números existentes como valores finais para não somar bônus raciais duas vezes.', 'conferir', 'atributos')
    const habilidades = periciasClasse2014(classe)
    const escolhidas = [...new Set((d.dnd2014PericiasClasse ?? []).filter(Boolean))]
    if (habilidades && escolhidas.filter(x => habilidades.opcoes.includes(x) && !periciasAntecedente2014(antecedente).includes(x)).length < habilidades.qtd)
      incluir('pericias2014', 'Perícias da classe', 'Escolha todas as perícias iniciais da classe no guia de criação.', 'pendente', 'principal')
    const raciaisNecessarias = especie === 'Meio-Elfo' ? 2 : especie === 'Humano' && d.campos.subraca2014 === 'Humano Variante' ? 1 : 0
    if (raciaisNecessarias > 0 && new Set((d.dnd2014PericiasRaciais ?? []).filter(Boolean)).size < raciaisNecessarias)
      incluir('periciasRaciais2014', 'Perícias raciais', 'Complete as perícias livres da raça/variante.', 'pendente', 'principal')
    if (especie === 'Humano' && d.campos.subraca2014 === 'Humano Variante' &&
      !(d.dnd2014Talentos ?? []).length)
      incluir('talentoHumanoVariante2014', 'Talento inicial do Humano Variante',
        'Escolha o talento do nível 1 no guia de criação e confirme os pré-requisitos com o mestre.', 'pendente', 'principal')
    const principal = classesDaFicha2014(d).lista.find(c => c.principal)
    if (principal && subclassesDaClasse2014(principal.cls.nome).some(x => principal.nivel >= x.nivel) &&
      !subclasseAtivaDnd2014(principal.cls.nome, d.dnd2014Subclasse, principal.nivel))
      incluir('subclasse2014', 'Subclasse', 'Selecione um arquétipo disponível para o nível da classe inicial.', 'pendente', 'principal')
    if (d.dnd2014Subclasse && principal && subclasseAtivaDnd2014(principal.cls.nome, d.dnd2014Subclasse, principal.nivel)?.fonte === 'phb2014')
      incluir('efeitosSubclasse2014', 'Regras da subclasse', 'Esta subclasse do livro comercial requer conferência dos efeitos com o mestre.', 'conferir', 'habilidades')
    if ((d.dnd2014Talentos ?? []).length)
      incluir('talentos2014', 'Pré-requisitos dos talentos', 'Confirme os efeitos e pré-requisitos dos talentos escolhidos no Livro do Jogador 2014.', 'conferir', 'habilidades')
  } else {
    const marcos = progressaoVisivel(MARCOS_DND_2024, progressoDaFichaDnd(d))
      .filter(m => m.estado === 'escolher' || m.estado === 'pendente')
    for (const m of marcos) incluir('marco2024-'+m.id,m.nome,
      m.estado === 'pendente' ? 'A escolha atual precisa de revisão.' : 'Registre a opção correspondente à característica de D&D 2024.',
      'pendente','arvore')
  }
  return { edicao, pendencias, prontoParaConferir: !pendencias.some(x => x.tipo === 'pendente') }
}

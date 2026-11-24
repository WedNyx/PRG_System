/**
 * Árvore de cada sistema (v0.36.2): os ramos e marcos de progressão do jogo, para o jogador ver o que já tem,
 * o que vem a seguir e anotar o que escolheu em cada marco. É só um mapa: nada é aplicado na ficha.
 * Sistemas comerciais: só a estrutura (em que nível vem cada escolha), com palavras nossas e sem texto dos livros.
 * D&D tem a árvore própria (arvoreDndOficial.ts). A escolha anotada fica em `marcas['arv_<id do marco>']`.
 */
import type { DadosFicha, Sistema } from './tipos'
import { identidadeVisual } from './visualIdentidade'
import { escolhasDeClassePendentes, progressaoAtiva } from './calculo'
import { arvoreVazia, disponiveis, lerArvore, mesclarArvore, podeLiberar, type Arvore } from './arvore'

export type EstadoMarco = 'recebido' | 'proximo' | 'futuro' | 'referencia'
export type Marco = { id: string; quando: number; titulo: string; texto: string; escolha?: boolean; estado: EstadoMarco
  /** Texto curto no lugar de “Nível N” (ex.: “Camada 2 · 1 ponto”). */
  rotulo?: string
  /** Marco que é um hexágono da árvore do autor: dá para liberar e devolver (com pontos). */
  no?: { id: string; custo: number; liberado: boolean; concedido: boolean; motivo?: string; /** Espaço em aberto: o jogador escreve a habilidade. */ aberto?: { recurso?: string } } }
export type RamoSistema = { id: string; titulo: string; icone: string; cor: string; marcos: Marco[]; vazio?: string }
/** `medida`: o que conta a progressão (Nível, NEX…). Sem medida, os marcos são só referência. */
export type ArvoreDoSistema = { medida?: { nome: string; atual: number; unidade?: string; max: number }; dica: string; ramos: RamoSistema[]
  /** Árvore que o autor do sistema montou no construtor, já juntada à da ficha (v0.36.3). */
  autor?: { arvore: Arvore; livres: number; extra: number; nivel: number | null
    /** Pontos que entram ao subir para o próximo nível (pela tabela do autor). */ ganhoProximo: number
    /** Campo de escolha (ex.: Destaque) que falta para a tabela de níveis dar pontos. */ pendente?: string } }

type MarcoDef = Omit<Marco, 'estado'>
const n = (v: unknown) => Math.max(0, Number(v) || 0)
const t = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const rotulo = (quando: number, unidade?: string) => unidade === '%' ? quando + '%' : (unidade ? unidade + ' ' : 'Nível ') + quando
const serie = (de: number, ate: number, passo: number) => Array.from({ length: Math.floor((ate - de) / passo) + 1 }, (_, i) => de + i * passo)
const marcos = (pref: string, niveis: number[], titulo: string, texto: string, escolha = true): MarcoDef[] =>
  niveis.map(q => ({ id: `${pref}${q}`, quando: q, titulo, texto, escolha }))

/** Estado de cada marco: recebido (já chegou), o próximo, ou futuro. */
function comEstados(ramos: { id: string; titulo: string; icone: string; cor: string; marcos: MarcoDef[]; vazio?: string }[], atual: number | null): RamoSistema[] {
  const proximo = atual === null ? null : Math.min(...ramos.flatMap(r => r.marcos.map(m => m.quando)).filter(q => q > atual))
  return ramos.map(r => ({ ...r, marcos: [...r.marcos].sort((a, b) => a.quando - b.quando).map(m => ({ ...m,
    estado: atual === null ? 'referencia' : m.quando <= atual ? 'recebido' : m.quando === proximo ? 'proximo' : 'futuro' })) }))
}

function ordem(d: DadosFicha): ArvoreDoSistema {
  const nex = Math.min(99, n(String(d.campos.nex ?? '').replace('%', '')))
  const classe = t(d.campos.classe) || 'sua classe', trilha = t(d.campos.trilha), origem = t(d.campos.origem)
  return { medida: { nome: 'NEX', atual: nex, unidade: '%', max: 99 }, dica: 'Os marcos seguem o NEX escrito na aba Principal. Anote em cada um o que você escolheu.',
    ramos: comEstados([
      { id: 'classe', titulo: 'Classe: ' + classe, icone: '⚔️', cor: '#ff8f9c', marcos: [
        { id: 'op-cl5', quando: 5, titulo: 'Habilidades iniciais da classe', texto: 'O que ' + classe + ' sabe fazer desde o começo.' },
        ...marcos('op-pc', [15, 30, 45, 60, 75, 90], 'Poder de classe', 'Escolha um poder da sua classe (ou Transcender, se a mesa usar).'),
        ...marcos('op-gt', [35, 70], 'Grau de treinamento', 'Suba o treinamento de algumas perícias.'),
      ] },
      { id: 'trilha', titulo: 'Trilha' + (trilha ? ': ' + trilha : ''), icone: '🧭', cor: '#ffc27a', vazio: 'A trilha é escolhida no NEX 10%.',
        marcos: marcos('op-tr', [10, 40, 65, 99], 'Habilidade de trilha', 'A próxima habilidade da sua trilha.') },
      { id: 'atributos', titulo: 'Atributos e paranormal', icone: '🔺', cor: '#c792ff', marcos: [
        ...marcos('op-at', [20, 50, 80, 95], 'Aumento de atributo', 'Some 1 em um atributo.'),
        { id: 'op-af50', quando: 50, titulo: 'Afinidade', texto: 'Afinidade com um elemento do Outro Lado.' },
      ] },
      { id: 'origem', titulo: 'Origem' + (origem ? ': ' + origem : ''), icone: '📜', cor: '#9bd3ff', marcos: [
        { id: 'op-or5', quando: 5, titulo: 'Poder de origem e perícias', texto: 'O poder da sua origem e as perícias treinadas que ela dá.', escolha: false },
      ] },
    ], nex) }
}

function pf2e(d: DadosFicha): ArvoreDoSistema {
  const nivel = Math.min(20, Math.max(1, n(d.campos.nivel) || 1))
  return { medida: { nome: 'Nível', atual: nivel, max: 20 }, dica: 'Os marcos seguem o nível. Os recursos próprios de cada classe estão na tabela da classe.',
    ramos: comEstados([
      { id: 'ancestralidade', titulo: 'Ancestralidade' + (t(d.campos.ancestralidade) ? ': ' + t(d.campos.ancestralidade) : ''), icone: '🧬', cor: '#c4a0fc',
        marcos: [{ id: 'pf-an0', quando: 1, titulo: 'Herança e traços', texto: 'Traços, PV e herança da ancestralidade.', escolha: true }, ...marcos('pf-ta', [1, 5, 9, 13, 17], 'Talento de ancestralidade', 'Escolha um talento da sua ancestralidade.')] },
      { id: 'classe', titulo: 'Classe' + (t(d.campos.classe) ? ': ' + t(d.campos.classe) : ''), icone: '⚔️', cor: '#9ecaff',
        marcos: [{ id: 'pf-cl1', quando: 1, titulo: 'Recursos iniciais da classe', texto: 'O que a classe dá no 1º nível (alguns ganham um talento de classe já aqui).' }, ...marcos('pf-tc', serie(2, 20, 2), 'Talento de classe', 'Escolha um talento de classe.')] },
      { id: 'pericias', titulo: 'Perícias', icone: '🎯', cor: '#7edac0',
        marcos: [...marcos('pf-tp', serie(2, 20, 2), 'Talento de perícia', 'Escolha um talento de perícia.'), ...marcos('pf-ap', serie(3, 19, 2), 'Aumento de perícia', 'Suba o grau de uma perícia.')] },
      { id: 'gerais', titulo: 'Talentos gerais e atributos', icone: '⭐', cor: '#e8b84a',
        marcos: [...marcos('pf-tg', [3, 7, 11, 15, 19], 'Talento geral', 'Escolha um talento geral.'), ...marcos('pf-im', [5, 10, 15, 20], 'Impulsos de atributo', 'Quatro impulsos em atributos diferentes.')] },
      { id: 'antecedente', titulo: 'Antecedente' + (t(d.campos.antecedente) ? ': ' + t(d.campos.antecedente) : ''), icone: '📜', cor: '#f2bf69',
        marcos: [{ id: 'pf-at1', quando: 1, titulo: 'Impulsos, perícia e talento', texto: 'Dois impulsos de atributo, uma perícia treinada e um talento de perícia.', escolha: false }] },
    ], nivel) }
}

function tormenta(d: DadosFicha): ArvoreDoSistema {
  const nivel = Math.min(20, Math.max(1, n(d.campos.nivel) || 1)), classe = t(d.campos.classe) || 'sua classe'
  return { medida: { nome: 'Nível', atual: nivel, max: 20 }, dica: 'Os marcos seguem o nível. Confira na tabela da sua classe o que cada nível dá.',
    ramos: comEstados([
      { id: 'classe', titulo: 'Classe: ' + classe, icone: '⚔️', cor: '#a9d1ff', marcos: [
        { id: 't20-cl1', quando: 1, titulo: 'Habilidades de 1º nível', texto: 'O que ' + classe + ' dá no começo.' },
        ...marcos('t20-pc', serie(2, 20, 1), 'Poder de classe', 'Um poder da sua classe (ou um poder geral no lugar), conforme a tabela.'),
      ] },
      { id: 'raca', titulo: 'Raça' + (t(d.campos.raca) ? ': ' + t(d.campos.raca) : ''), icone: '🧬', cor: '#c4a0fc', marcos: [{ id: 't20-ra1', quando: 1, titulo: 'Habilidades de raça', texto: 'Atributos e habilidades da sua raça.', escolha: false }] },
      { id: 'origem', titulo: 'Origem' + (t(d.campos.origem) ? ': ' + t(d.campos.origem) : ''), icone: '📜', cor: '#f2bf69', marcos: [{ id: 't20-or1', quando: 1, titulo: 'Benefícios da origem', texto: 'Dois benefícios da sua origem (perícias ou poderes).' }] },
      { id: 'divindade', titulo: 'Divindade' + (t(d.campos.divindade) ? ': ' + t(d.campos.divindade) : ''), icone: '✨', cor: '#ffd98a', vazio: 'Só para devotos.',
        marcos: t(d.campos.divindade) ? [{ id: 't20-dv1', quando: 1, titulo: 'Poder concedido', texto: 'Devoto: um poder concedido pela sua divindade (e as obrigações dela).' }] : [] },
    ], nivel) }
}

function faroeste(d: DadosFicha): ArvoreDoSistema {
  const niveis = { Desgarrado: n(d.campos.nivel_desgarrado), Pistoleiro: n(d.campos.nivel_pistoleiro), Rastreador: n(d.campos.nivel_rastreador) }
  const total = Math.min(20, Math.max(1, Object.values(niveis).reduce((a, b) => a + b, 0)))
  return { medida: { nome: 'Nível total', atual: total, max: 20 }, dica: 'O nível total soma as três classes. As habilidades de cada classe estão na tabela dela.',
    ramos: comEstados([
      { id: 'geral', titulo: 'Personagem', icone: '🤠', cor: '#f1c184', marcos: [...marcos('fa-ta', [1, 3, 6, 9, 12, 15, 18], 'Talento', 'Escolha um talento.'), ...marcos('fa-at', [4, 8, 12, 16, 20], 'Aumento de atributo', '+1 em um atributo.')] },
      ...Object.entries(niveis).filter(([, v]) => v > 0).map(([cl, v]) => ({ id: cl.toLowerCase(), titulo: `${cl} (nível ${v})`, icone: '🔫', cor: '#e0a46b',
        marcos: marcos('fa-' + cl.slice(0, 3).toLowerCase(), serie(1, Math.min(20, v + 2), 1), 'Nível de ' + cl, 'O que a tabela de ' + cl + ' dá neste nível.') })),
    ], total) }
}

function fate(): ArvoreDoSistema {
  return { dica: 'Fate não tem níveis: o personagem muda nos marcos. Use como guia e anote o que mudou.', ramos: comEstados([
    { id: 'aspectos', titulo: 'Aspectos', icone: '✦', cor: '#c5b0ff', marcos: [
      { id: 'fa-c', quando: 1, titulo: 'Conceito', texto: 'Quem o personagem é, numa frase.' }, { id: 'fa-d', quando: 2, titulo: 'Dificuldade', texto: 'O que sempre complica a vida dele.' },
      { id: 'fa-o', quando: 3, titulo: 'Outros aspectos', texto: 'Até três, das fases da criação.' }] },
    { id: 'pericias', titulo: 'Pirâmide de perícias', icone: '🔺', cor: '#6cc4ff', marcos: [
      { id: 'fa-p4', quando: 1, titulo: 'Ótimo (+4)', texto: 'Uma perícia.' }, { id: 'fa-p3', quando: 2, titulo: 'Bom (+3)', texto: 'Duas perícias.' },
      { id: 'fa-p2', quando: 3, titulo: 'Razoável (+2)', texto: 'Três perícias.' }, { id: 'fa-p1', quando: 4, titulo: 'Regular (+1)', texto: 'Quatro perícias.' }] },
    { id: 'facanhas', titulo: 'Façanhas e recarga', icone: '⚡', cor: '#ffd36c', marcos: [
      { id: 'fa-f', quando: 1, titulo: 'Três façanhas', texto: 'Começa com três, e recarga 3.' }, { id: 'fa-fx', quando: 2, titulo: 'Façanhas a mais', texto: 'Cada uma a mais custa 1 de recarga (a recarga não fica abaixo de 1).' }] },
    { id: 'marcos', titulo: 'Marcos', icone: '🏁', cor: '#7edac0', marcos: [
      { id: 'fa-mm', quando: 1, titulo: 'Marco menor', texto: 'Fim de sessão: trocar duas perícias de lugar, uma façanha ou reescrever um aspecto (menos o conceito).' },
      { id: 'fa-ms', quando: 2, titulo: 'Marco significativo', texto: 'Fim de cenário: +1 ponto de perícia e pode renomear o aspecto de uma consequência moderada ou pior.' },
      { id: 'fa-mg', quando: 3, titulo: 'Marco maior', texto: 'Fim de arco: +1 recarga (ou uma façanha), recuperar consequências severas e pode reescrever o conceito.' }] },
  ], null) }
}

function blades(d: DadosFicha): ArvoreDoSistema {
  const cartilha = t(d.campos.cartilha)
  return { dica: 'Em Blades você marca XP: quando uma trilha enche, ganha um avanço. Anote em cada marco o que pegou.', ramos: comEstados([
    { id: 'cartilha', titulo: 'Cartilha' + (cartilha ? ': ' + cartilha : ''), icone: '🗡️', cor: '#9fdccb', marcos: [
      { id: 'bl-c0', quando: 1, titulo: 'Habilidade especial inicial', texto: 'Uma habilidade especial da cartilha.' },
      ...marcos('bl-c', [2, 3, 4, 5, 6], 'Avanço da cartilha', 'Trilha de XP da cartilha cheia: uma nova habilidade especial.')] },
    ...[['perspicacia', 'Perspicácia', '#c4c8ef'], ['proeza', 'Proeza', '#f0a68a'], ['determinacao', 'Determinação', '#e8d07a']].map(([id, nome, cor]) => ({ id, titulo: nome, icone: '◆', cor,
      marcos: marcos('bl-' + id.slice(0, 3), [1, 2, 3], 'Avanço de ' + nome, 'Trilha de XP de ' + nome + ' cheia: +1 ponto numa ação dela.') })),
  ], null) }
}

function percentual(coc: boolean): ArvoreDoSistema {
  return { dica: 'Sem níveis: o personagem melhora as perícias que usou com sucesso. Anote as melhorias de cada sessão.', ramos: comEstados([
    { id: 'criacao', titulo: 'Criação', icone: '📋', cor: '#a6e0d2', marcos: [
      { id: 'pc-oc', quando: 1, titulo: 'Perícias da ocupação', texto: coc ? 'Pontos da ocupação (pela fórmula dela, quase sempre com EDU) nas perícias da ocupação.' : 'Pontos da profissão nas perícias dela.' },
      { id: 'pc-pi', quando: 2, titulo: 'Interesses pessoais', texto: coc ? 'INT × 2 pontos em qualquer perícia (menos Mythos de Cthulhu).' : 'Pontos livres em qualquer perícia.' }] },
    { id: 'melhoria', titulo: 'Fase de melhoria', icone: '📈', cor: '#7edac0', marcos: [
      { id: 'pc-me', quando: 1, titulo: 'Perícias marcadas', texto: 'Para cada perícia com a marca de experiência: role 1d100; se passar do valor, ela sobe' + (coc ? ' 1d10.' : '.') }] },
    ...(coc ? [{ id: 'mythos', titulo: 'Mythos e Sanidade', icone: '🐙', cor: '#9b8cff', marcos: [
      { id: 'pc-my', quando: 1, titulo: 'Sanidade máxima', texto: 'A Sanidade máxima é 99 menos Mythos de Cthulhu.', escolha: false }] }] : []),
  ], null) }
}

function morkBorg(d: DadosFicha): ArvoreDoSistema {
  return { dica: 'Mörk Borg não tem níveis: quando o mestre disser, o personagem melhora (ou piora). Anote o que mudou.', ramos: comEstados([
    { id: 'classe', titulo: 'Classe' + (t(d.campos.classe) ? ': ' + t(d.campos.classe) : ''), icone: '💀', cor: '#ffe600', marcos: [{ id: 'mb-cl', quando: 1, titulo: 'Habilidades da classe', texto: 'Se usar classe: o que ela dá no começo.' }] },
    { id: 'melhorar', titulo: 'Ficar melhor', icone: '🕯️', cor: '#ff5e5e', marcos: [
      { id: 'mb-pv', quando: 1, titulo: 'Vida', texto: 'Role para ver se a vida máxima sobe.' },
      { id: 'mb-at', quando: 2, titulo: 'Atributos', texto: 'Role para cada atributo: pode subir ou cair.' },
      { id: 'mb-sp', quando: 3, titulo: 'Achados', texto: 'Chance de prata, relíquia ou pergaminho.' }] },
  ], null) }
}

function opositores(d: DadosFicha): ArvoreDoSistema {
  const nivel = Math.min(10, Math.max(1, n(d.campos.nivel) || 1))
  const xp = [0, 300, 750, 1350, 2100, 3000, 4050, 5250, 6600, 8100]
  return { medida: { nome: 'Nível', atual: nivel, max: 10 }, dica: 'Os marcos seguem o nível (XP acumulado, não é gasto).', ramos: comEstados([
    { id: 'niveis', titulo: 'Níveis', icone: '🌙', cor: '#ddc58d', marcos: xp.map((x, i) => ({ id: 'opo-n' + (i + 1), quando: i + 1, titulo: 'Nível ' + (i + 1) + ' · ' + x.toLocaleString('pt-BR') + ' XP',
      texto: i === 0 ? 'Começo: atributos até 3.' : i === 3 ? 'Limite de atributo passa a 4.' : i === 7 ? 'Limite de atributo passa a 5.' : 'Anote o que o personagem ganhou.' })) },
  ], nivel) }
}

/** Marcas (v0.36.0): cada marca é um ramo, e o nível dela libera as habilidades. */
function deMarcas(d: DadosFicha): RamoSistema[] {
  return (d.marcasPoder ?? []).map(m => ({ id: 'marca-' + m.id, titulo: `${m.nome} (nível ${m.nivel})`, icone: '🐾', cor: '#9fe0ff',
    marcos: m.habilidades.map(h => ({ id: 'mc-' + h.id, quando: h.nivel, titulo: h.nome, texto: h.texto ?? '', escolha: false,
      estado: (h.nivel <= m.nivel ? 'recebido' : h.nivel === Math.min(...m.habilidades.map(x => x.nivel).filter(x => x > m.nivel)) ? 'proximo' : 'futuro') as EstadoMarco })) }))
}

/** A árvore que o autor montou no construtor, juntada à da ficha (hexágonos novos do autor entram sem apagar o que foi liberado). */
export function arvoreDoAutor(s: Sistema, d: DadosFicha): Arvore | null {
  if (!s.arvore?.nos?.length) return null
  const ficha = d.arvore !== undefined ? lerArvore(d.arvore) : { ...arvoreVazia(), pontos: Math.max(0, Number(s.arvore.pontos) || 0) }
  return mesclarArvore(ficha, s.arvore)
}
/** Camada de cada hexágono pelos requisitos (a raiz é 1). */
function camadas(a: Arvore): Map<string, number> {
  const memo = new Map<string, number>()
  const de = (id: string, visitando: Set<string>): number => {
    if (memo.has(id)) return memo.get(id)!
    if (visitando.has(id)) return 1
    visitando.add(id)
    const n = a.nos.find(x => x.id === id)
    const v = 1 + Math.max(0, ...(n?.requer ?? []).map(r => de(r, visitando)))
    memo.set(id, v); return v
  }
  for (const n of a.nos) de(n.id, new Set())
  return memo
}
/** Quanto a árvore ganha no próximo nível e se falta uma escolha (classe, destaque…) para a tabela valer (v0.36.7). */
export function ganhoDeNivel(s: Sistema, d: DadosFicha, extra = pontosExtrasDaArvore(s, d)): { ganhoProximo: number; pendente?: string } {
  const comArvore = s.progressoes?.classes.filter(c => 'arvore' in c.tabela) ?? []
  if (!comArvore.length) return { ganhoProximo: 0 }
  const campoNivel = comArvore[0].campoNivel, nivel = Math.max(0, Number(d.campos[campoNivel]) || 0)
  const ligadas = new Set(comArvore.map(c => c.id))
  const falta = escolhasDeClassePendentes(s, d).find(c => c.opcoes?.some(o => o.progressao && ligadas.has(o.progressao)))
  const proximo = nivel < 20 ? pontosExtrasDaArvore(s, { ...d, campos: { ...d.campos, [campoNivel]: nivel + 1 } }) : extra
  return { ganhoProximo: Math.max(0, proximo - extra), ...(falta ? { pendente: falta.nome } : {}) }
}
/** Pontos extras da árvore pela tabela de níveis do autor (coluna “arvore” → prog_arvore). */
export function pontosExtrasDaArvore(s: Sistema, d: DadosFicha): number {
  if (!s.progressoes?.classes.some(c => 'arvore' in c.tabela)) return 0
  // Direto da tabela (v0.36.7): a ficha manual não passa pelas fórmulas, então os pontos do nível não podem depender delas.
  let total = 0
  for (const { cl, campoNivel } of progressaoAtiva(s, d)) {
    const n = Math.max(0, Math.min(20, Math.floor(Number(d.campos?.[campoNivel]) || 0)))
    if (n > 0) total += Number(cl.tabela.arvore?.[n - 1]) || 0
  }
  return Math.max(0, total)
}
function ramoDoAutor(s: Sistema, d: DadosFicha, a: Arvore, extra: number): RamoSistema {
  const nivel = s.campos.some(c => c.id === 'nivel') ? Math.max(1, Number(d.campos.nivel) || 1) : null
  const prof = camadas(a), ids = new Set(s.arvore!.nos.map(n => (n as { id?: string }).id))
  const nos = a.nos.filter(n => ids.has(n.id)).sort((x, y) => (prof.get(x.id)! - prof.get(y.id)!) || x.x - y.x)
  return { id: 'autor', titulo: 'Árvore de ' + s.nome, icone: '⬡', cor: '#ffc18f', marcos: nos.map(n => {
    const liberado = a.liberados.includes(n.id), pode = podeLiberar(a, n.id, extra, nivel, d)
    const requer = n.requer.map(r => a.nos.find(x => x.id === r)?.nome).filter(Boolean)
    const escrito = n.aberto ? a.preenchidas?.[n.id] : undefined
    return { id: 'au-' + n.id, quando: prof.get(n.id)!, titulo: escrito?.nome || n.nome, escolha: false,
      texto: [n.descricao, requer.length ? 'Precisa antes: ' + requer.join(', ') + '.' : '', n.nivel ? 'A partir do nível ' + n.nivel + '.' : ''].filter(Boolean).join('\n'),
      rotulo: n.custo ? `${n.custo} ${n.custo === 1 ? 'ponto' : 'pontos'}` : n.aberto ? 'Espaço em aberto' : 'Sem custo',
      estado: (liberado ? 'recebido' : pode.ok ? 'proximo' : 'futuro') as EstadoMarco,
      no: { id: n.id, custo: n.custo, liberado, concedido: !!a.concedidos?.includes(n.id), ...(pode.ok || liberado ? {} : { motivo: pode.motivo }), ...(n.aberto ? { aberto: n.aberto } : {}) } }
  }) }
}

/** A árvore do sistema desta ficha, ou null quando ele não tem (aí fica só a árvore de habilidades do mestre). */
export function arvoreDoSistema(s: Sistema, d: DadosFicha): ArvoreDoSistema | null {
  const id = identidadeVisual(s)
  const base = id === 'ordem-paranormal' ? ordem(d) : id === 'pf2e' ? pf2e(d) : id === 'tormenta20' ? tormenta(d) : id === 'faroeste-arcano' ? faroeste(d)
    : id === 'fate-core' ? fate() : id === 'blades' ? blades(d) : id === 'call-of-cthulhu' ? percentual(true) : id === 'brp' ? percentual(false)
    : id === 'mork-borg' ? morkBorg(d) : id === 'opositores' ? opositores(d) : null
  const marcas = s.extras?.includes('marcas') ? deMarcas(d) : []
  const doAutor = arvoreDoAutor(s, d)
  const extra = doAutor ? pontosExtrasDaArvore(s, d) : 0
  const autor = doAutor ? { arvore: doAutor, livres: disponiveis(doAutor, extra), extra, nivel: s.campos.some(c => c.id === 'nivel') ? Math.max(1, Number(d.campos.nivel) || 1) : null, ...ganhoDeNivel(s, d, extra) } : undefined
  const ramosAutor = doAutor ? [ramoDoAutor(s, d, doAutor, extra)] : []
  if (!base && !marcas.length && !ramosAutor.length) return s.extras?.includes('marcas') ? { dica: 'Cada marca vira um ramo: crie as marcas na aba Marcas.', ramos: [] } : null
  const dica = base?.dica ?? (ramosAutor.length ? (doAutor?.nos.some(n => n.custo > 0) || extra > 0 ? 'A árvore que o autor do sistema montou: gaste os pontos para liberar as habilidades.' : 'A árvore que o autor do sistema montou: libere as habilidades em ordem, do centro para fora.') : 'Cada marca é um ramo: o nível dela libera as habilidades.')
  return { ...(base ?? {}), dica, ramos: [...ramosAutor, ...marcas, ...(base?.ramos ?? [])], ...(autor ? { autor } : {}) }
}
export const chaveEscolha = (marcoId: string) => ('arv_' + marcoId).slice(0, 40)
export const rotuloMarco = rotulo

/** Distâncias do centro agrupadas (anéis). */
export function aneisDaArvore(pontos: { x: number; y: number }[], centro: { x: number; y: number }): number[] {
  const ds = pontos.map(p => Math.hypot(p.x - centro.x, p.y - centro.y)).filter(d => d > 20).sort((a, b) => a - b)
  const out: number[] = []
  for (const d of ds) { if (!out.length || d - out[out.length - 1] > 40) out.push(d); else out[out.length - 1] = (out[out.length - 1] + d) / 2 }
  return out.map(Math.round)
}

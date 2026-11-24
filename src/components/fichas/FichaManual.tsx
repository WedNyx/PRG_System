'use client'
import { tituloSistemaNaFicha, edicaoEfetivaDaFicha } from '@/lib/sistemas/edicaoFichaDnd'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dice5, Info, Heart, Plus, Shield, Sparkles, Trash2 } from 'lucide-react'
import { classesDaFicha } from '@/lib/sistemas/dnd2024Classes'
import { classesDaFicha2014 } from '@/lib/sistemas/dnd2014Multiclasse'
import { calcular } from '@/lib/sistemas/calculo'
import type { DadosFicha, FichaManual as Manual, Sistema } from '@/lib/sistemas/tipos'
import { montarRolagem, rolarExpressao } from '@/lib/dice'
import AcoesRapidas from './AcoesRapidas'
import { ResumoExtras, SecaoEfeitos, SecaoFormas, SecaoInvocacoes, SecaoMarcas } from './ExtrasFicha'
import { temExtra } from '@/lib/sistemas/extrasFicha'
import { FICHA_OFICIAL } from '@/lib/sistemas/fichaOficial'
import PainelDoSistema, { FaixaDoSistema, RECURSOS_NO_PAINEL } from './PaineisSistema'
import AtributosLua from './AtributosLua'
import { AtributosGraus, PericiasGraus, RegrasDoSistema, TabelasDoSistema } from './FichaGraus'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import BotaoRolarFlutuante from './BotaoRolarFlutuante'
import { InventarioFicha, PoderesFicha } from './Inventario'
import ArvoreHabilidades from './Arvore'
import ArvoreDndOficial from './ArvoreDndOficial'
import ArvoreSistema from './ArvoreSistema'
import { FONTES_AUTOR } from '@/lib/sistemas/visualAutor'
import { cssDoVisual, ordenarAbas, tituloDoBloco } from '@/lib/sistemas/montagemFicha'
import { itemDoMenu } from './menuSistema'
import JanelaDescanso from './Descanso'
import type { Item } from '@/lib/sistemas/inventario'
import BarraRecurso, { corDoRecurso, MiniBarra } from './BarraRecurso'
import { expressaoParada, leituraBlades, leituraCoc, leituraD100 } from '@/lib/sistemas/combate'
import TesteAssimilacao from './TesteAssimilacao'
import AtributosOrdem, { SimboloElementoOrdem } from './AtributosOrdem'
import { Retrato } from './FichaGenerica'
import { AcoesBlades, AtributoComMod, AtributoDnd, AtributoModificador, estiloDoSistema, estiloTema, GrauPericia, SeloPericiaOrdem, identidadeVisual, PiramideFate, ResumoOrdem, temaDoSistema } from './VisualSistema'

const card = 'ficha-painel rounded-2xl border border-(--ficha-borda) bg-(--ficha-cartao) p-4 sm:p-5'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white disabled:opacity-70'
const sinal = (n: number | null | undefined) => n === null || n === undefined ? '—' : n >= 0 ? '+' + n : String(n)
/** Campos que só existiam para as contas automáticas (a CA, a Defesa e os PV agora são digitados direto). Os dados continuam salvos. */
const SO_CALCULO: Record<string, string[]> = {
  'dnd5e-srd': ['dado_vida', 'ca_base', 'des_max', 'armadura'],
  pf2e: ['grau_classe', 'grau_magia', 'pv_ancestralidade', 'pv_classe', 'armadura', 'des_max', 'grau_armadura'],
  'fate-core': ['facanhas_extras'],
  'faroeste-arcano': ['tamanho', 'armadura', 'deflexao', 'outros_ca', 'outros_ini'],
  'ordem-paranormal': ['protecao', 'defesa_outros'],
  tormenta20: ['defesa_bonus', 'defesa_outros'],
  'mork-borg': ['escudo'],
  brp: ['nivel_poder'],
}
/** PF2e: talentos separados como na ficha do jogo. */
const TALENTOS_PF2E: [string, string][] = [['talentos_ancestralidade', 'Ancestralidade'], ['talentos_classe', 'Classe'], ['talentos_pericia', 'Perícia'], ['talentos_gerais', 'Gerais']]
const numero = (v: string) => v.trim() === '' || v.trim() === '-' ? null : Math.max(-9999, Math.min(9999, Math.round(Number(v)) || 0))

/**
 * Ficha manual (v0.34.8): o modelo de cada sistema, com tudo para preencher.
 * Nada é calculado nem conferido: o jogador e o mestre digitam atributos, modificadores, valores,
 * perícias e máximos. Os dados rolam com os números digitados.
 */
type ModoFicha = 'jogo' | 'criacao' | 'consulta'
const CHAVE_MODO = 'prg-ficha-modo-v1'
const MODOS: { id: ModoFicha; icone: string; nome: string; dica: string }[] = [
  { id: 'jogo', icone: '🎲', nome: 'Jogo', dica: 'Ações rápidas e recursos primeiro; a identidade fica resumida.' },
  { id: 'criacao', icone: '✏️', nome: 'Criação', dica: 'Passo a passo com as orientações de cada parte.' },
  { id: 'consulta', icone: '📖', nome: 'Consulta', dica: 'Só leitura: consulte sem mudar nada sem querer.' },
]
/** Ficha sem nome começa em Criação; as outras, no último modo usado neste aparelho (Criação = o jeito de sempre). */
function modoInicial(d: DadosFicha): ModoFicha {
  if (!d.nome?.trim()) return 'criacao'
  try { const x = localStorage.getItem(CHAVE_MODO); if (x === 'jogo' || x === 'criacao' || x === 'consulta') return x } catch { /* servidor ou sem acesso */ }
  return 'criacao'
}
/** Parte da ficha já tem algo escrito? (só para marcar ✓ nos passos da criação; não confere regras). */
function preenchida(id: string, s: Sistema, d: DadosFicha): boolean {
  const temTexto = (sec: RegExp) => s.listas.some(l => sec.test(l.id) && (d.listas[l.id] ?? '').trim().length > 0)
  if (id === 'principal') return !!d.nome?.trim() && Object.values(d.campos).some(v => String(v ?? '').trim() !== '' && v !== 0)
  if (id === 'atributos') return s.atributos.some(a => Number(d.atributos[a.id] ?? a.padrao) !== Number(a.padrao)) || Object.values(d.pericias).some(v => String(v ?? '').trim() !== '' && v !== 0)
  if (id === 'habilidades') return (d.poderes?.length ?? 0) > 0 || temTexto(/habilidade|tecnica|talento|magia|poder|facanha|transforma|rituais|tracos/)
  if (id === 'equipamentos') return (d.itens?.length ?? 0) > 0
  if (id === 'anotacoes') return temTexto(/hist|anota|aliad|objetiv|apar|person|idioma|profici/)
  return false
}

export default function FichaManual({ sistema: s, dados: d, onChange, somenteLeitura: bloqueada = false, rolarNaCampanha, passarItem, mestre = false, secaoForcada }: {
  sistema: Sistema; dados: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean
  /** Quem abre é o mestre (ou o dono de uma ficha avulsa): pode conceder e montar habilidades na árvore. */
  mestre?: boolean
  /** Se a ficha é de campanha: rola no servidor e publica no chat da mesa. */
  rolarNaCampanha?: (expressao: string, rotulo: string, extra?: { estilo: 'assimilacao'; manter?: number; todos?: boolean }) => Promise<{ resultados: number[]; total: number } | null>
  /** Ficha de campanha: passar um item para outro personagem. */
  passarItem?: (it: Item, tem: number) => void
  /** Estúdio do construtor: abre a aba que o autor está montando. */
  secaoForcada?: string
}) {
  const m: Manual = d.manual ?? { mods: {}, derivados: {}, pericias: {} }
  // Modos da ficha (v0.36.5): Jogo (o que se usa na sessão primeiro), Criação (passo a passo) e Consulta (só leitura).
  // Nada é calculado em nenhum modo: muda só a ordem e o que aparece primeiro.
  const [modo, setModoBruto] = useState<ModoFicha>(() => modoInicial(d))
  const setModo = (x: ModoFicha) => { setModoBruto(x); try { localStorage.setItem(CHAVE_MODO, x) } catch { /* sem espaço */ } }
  const somenteLeitura = bloqueada || modo === 'consulta'
  const [detalhes, setDetalhes] = useState(false)
  const [novaPericia, setNovaPericia] = useState('')
  // Visual do sistema (v0.35.1): cores, letra dos títulos e o jeito de mostrar atributos e perícias.
  const identidade = identidadeVisual(s)
  const AtributoComposto = s.id === 'dnd5e-srd' ? AtributoDnd : AtributoComMod
  const simbolos: Record<string, string> = {
    'dnd5e-srd': 'M12 3L20 6V13Q20 18 12 22Q4 18 4 13V6Z M12 7V17 M9 10H15',
    pf2e: 'M12 2L22 12L12 22L2 12Z M12 6L18 12L12 18L6 12Z M12 2V6 M22 12H18 M12 18V22 M2 12H6',
    'fate-core': 'M3 8H11V4H21V12H13V16H3Z M3 20H21 M7 16V20 M17 12V20',
    blades: 'M9 2H15V6L18 7L21 5L23 9L20 12L21 15L23 17L20 21L16 19L15 22H9L8 19L4 21L1 17L4 14V10L1 7L4 3L8 5Z M12 8A4 4 0 1 0 12 16A4 4 0 1 0 12 8',
    brp: 'M4 20L20 4 M7 4A3 3 0 1 0 7 10A3 3 0 1 0 7 4 M17 14A3 3 0 1 0 17 20A3 3 0 1 0 17 14',
    'call-of-cthulhu': 'M2 12Q12 0 22 12Q12 24 2 12Z M12 7A5 5 0 1 0 12 17A5 5 0 1 0 12 7 M12 9V15 M3 20L5 17 M21 20L19 17',
    'faroeste-arcano': 'M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8Z M12 8L15 12L12 16L9 12Z',
    'ordem-paranormal': 'M12 2L22 19H2Z M12 6L18 17H6Z M12 10V15 M2 5L5 8 M22 5L19 8 M12 19V23',
    tormenta20: 'M12 2L14 7L19 5L18 11L22 12L18 15L19 20L14 18L12 22L10 18L5 20L6 15L2 12L6 11L5 5L10 7Z M12 8V16 M8 12H16',
    'mork-borg': 'M4 10A8 8 0 0 1 20 10V15L16 17V22H8V17L4 15Z M7 10L10 13M10 10L7 13M14 10L17 13M17 10L14 13M12 15V18M10 19V22M14 19V22',
    assimilacao: 'M12 3Q22 3 20 12Q18 22 10 20Q1 18 4 9Q6 5 12 3Z M12 3Q8 12 16 19 M4 9Q12 8 20 12 M10 12L14 9M10 12L9 17',
    opositores: 'M16 2A10 10 0 1 0 21 17A9 9 0 0 1 16 2Z M18 4V10 M15 7H21 M20 11V15 M18 13H22',
    'two-piece': 'M12 3C8 3 6 5.5 6 8.5C6 10.5 7 11.8 8.5 12.5V15H15.5V12.5C17 11.8 18 10.5 18 8.5C18 5.5 16 3 12 3Z M9.5 8.5A1 1 0 1 0 9.5 8.51 M14.5 8.5A1 1 0 1 0 14.5 8.51 M10 15V17 M12 15V17 M14 15V17 M3 18L21 22 M21 18L3 22',
    nova: 'M12 2L22 8V16L12 22L2 16V8Z M7 8H12V12H17V16 M7 6V10 M17 14V18 M12 2V5 M12 19V22',
    marcas: 'M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18 M12 17c-2.5 0-4-1.4-4-3s1.8-3 4-3s4 1.4 4 3s-1.5 3-4 3 M7.5 10.5a1.3 1.6 0 1 0 0.01 0 M10.3 7.8a1.3 1.6 0 1 0 0.01 0 M13.7 7.8a1.3 1.6 0 1 0 0.01 0 M16.5 10.5a1.3 1.6 0 1 0 0.01 0',
  }

  // Aparência escolhida pelo autor (sistemas autorais) vale por cima da do visual do sistema (v0.36.3).
  const tema = { ...temaDoSistema(identidade), ...(s.visual?.acento ? { acento: s.visual.acento } : {}), ...(s.visual?.borda ? { borda: s.visual.borda } : {}),
    ...(s.visual?.cartao ? { cartao: s.visual.cartao } : {}), ...(s.visual?.fonte ? { fonte: FONTES_AUTOR[s.visual.fonte] } : {}) }, visual = estiloDoSistema(s.id)
  const c = useMemo(() => calcular(s, d), [s, d])
  // Inventário e poderes no modo genérico: sem catálogo nem conta automática de arma do D&D.
  const sInv = useMemo<Sistema>(() => s.id === 'dnd5e-srd' ? { ...s, id: 'dnd5e-manual' } : s, [s])
  const central = useRef<RolagemCentralHandle>(null)
  const naMesa = rolarNaCampanha ? 'Também foi para o chat da mesa' : null
  const regra = s.rolagem === 'personalizada' ? s.regraRolagem : undefined
  const d20 = !regra && (s.rolagem ? s.rolagem === 'd20' : s.dados.startsWith('d20'))
  const d100 = s.id === 'brp' || s.rolagem === 'd100'
  const parada = s.rolagem === 'parada' ? s.parada?.lados ?? 20 : null
  // Graus de dado (v0.35.6): atributos e perícias valem d4, d6, d8…
  const graus = s.rolagem === 'graus' && !!s.graus
  // Investigação em d100 (v0.35.9): perícias num “dossiê”, com as frações do valor e a marca de experiência.
  const dossie = s.id === 'brp' || s.leituraD100 === 'coc'
  const marcas = d.marcas ?? {}
  const marcar = (k: string, v: boolean) => { const n = { ...marcas }; if (v) n[k] = true; else delete n[k]; onChange({ ...d, marcas: n }) }
  const podeRolar = d20 || d100 || !!regra || !!parada
  const comMod = !!s.formulaModificador
  // Lua minguante (v0.35.8): só até 9 atributos cabem no desenho; além disso, cai no grid padrão.
  const lua = s.visualAtributos === 'lua' && s.atributos.length <= 9
  const dadosDe = (atributo?: string) => Math.max(0, ...(atributo ? atributo.split('/') : []).map(a => Number(d.atributos[a]) || 0))
  const set = <K extends keyof DadosFicha>(k: K, v: DadosFicha[K]) => onChange({ ...d, [k]: v })
  const setManual = (k: keyof Manual, id: string, v: number | null) => onChange({ ...d, manual: { ...m, [k]: { ...m[k], [id]: k === 'mods' ? v ?? 0 : v } } })

  async function mostrar(expr: string, rotulo: string, nota?: (r: { resultados: number[]; total: number }) => string | null) {
    const r = rolarNaCampanha ? await rolarNaCampanha(expr, rotulo) : rolarExpressao(expr)
    if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expr); return }
    central.current?.mostrar({ rotulo, expressao: expr, resultados: r.resultados, total: r.total, nota: [nota?.(r), naMesa].filter(Boolean).join(' · ') || null })
  }
  async function rolar(nome: string, bonus: number | null, dados?: number, resistencia = false) {
    const b = bonus ?? 0
    if (parada) {
      const n = Math.max(0, dados ?? 1)
      return mostrar(expressaoParada(parada, n, b), `${nome} (${n > 0 ? n + 'd' + parada + ', o maior' : '2d' + parada + ', o menor'}${b ? ' ' + sinal(b) : ''})`,
        r => s.parada?.leitura === 'blades' ? leituraBlades(n, r.resultados, resistencia) : null)
    }
    if (regra) return mostrar(montarRolagem(regra.formula, b), `${nome} · ${regra.nome}`)
    if (d100) return mostrar('1d100', `${nome} (${b}%)`, r => s.leituraD100 === 'coc' ? leituraCoc(b, r.total) : leituraD100(b, r.total))
    return mostrar('1d20' + (b >= 0 ? '+' + b : String(b)), `${nome} (d20 ${sinal(b)})`)
  }
  const rolarExpr = async (expressao: string, rotulo: string) => { await mostrar(expressao, rotulo) }
  async function rolarTotal(expressao: string, rotulo: string): Promise<number | null> {
    const r = rolarNaCampanha ? await rolarNaCampanha(expressao, rotulo) : rolarExpressao(expressao)
    if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expressao); return null }
    central.current?.mostrar({ rotulo, expressao, resultados: r.resultados, total: r.total, nota: naMesa })
    return r.total
  }
  const [descansando, setDescansando] = useState(false)
  const propsInv = { edicaoDnd: edicaoEfetivaDaFicha(s, d) ?? undefined, s: sInv, d, c, onChange, somenteLeitura, rolar: rolarExpr, abrirDescanso: somenteLeitura ? undefined : () => setDescansando(true) }

  // Perícias livres (v0.35.6): além das do sistema, as que o próprio jogador criou.
  const periciasExtras = s.pericias?.livres ? (d.periciasExtras ?? []) : []
  const minhaPericia = new Set(periciasExtras.map(x => x.id))
  const grupos = new Map<string, NonNullable<Sistema['pericias']>['lista']>()
  for (const p of s.pericias?.lista ?? []) grupos.set(p.grupo ?? '', [...(grupos.get(p.grupo ?? '') ?? []), p])
  if (periciasExtras.length) grupos.set('', [...(grupos.get('') ?? []), ...periciasExtras])
  function criarPericia() {
    const nome = novaPericia.trim().slice(0, 60); if (!nome) return
    const id = 'x_' + Math.random().toString(36).slice(2, 10)
    onChange({ ...d, periciasExtras: [...periciasExtras, { id, nome }] }); setNovaPericia('')
  }
  function tirarPericia(id: string) {
    const { [id]: _f, ...resto } = d.pericias; void _f
    onChange({ ...d, periciasExtras: periciasExtras.filter(x => x.id !== id), pericias: resto })
  }
  const secaoDeLista = (id: string) => /inventario|equipamento|armas|protecao|ataques|dinheiro/.test(id) ? 'equipamentos'
    : /habilidade|tecnica|talento|magia|poder|facanha|transforma|rituais|tracos/.test(id) ? 'habilidades' : 'anotacoes'
  const listasDe = (sec: string) => s.listas.filter(l => secaoDeLista(l.id) === sec)
  const tituloAtr = s.tituloAtributos?.trim() || 'Atributos', tituloPer = s.pericias?.titulo?.trim() || 'Perícias'
  const SECOES = ([
    { id: 'principal', icone: '❤️', nome: 'Principal', sub: 'Identidade, valores e recursos', ajuda: 'Preencha os dados do personagem, os valores (CA, Defesa…) e o máximo de cada recurso. Nada é calculado: o que você digita é o que vale. Embaixo ficam as ações rápidas: armas equipadas e poderes, para rolar com um toque.', ok: true },
    { id: 'atributos', icone: '✨', nome: s.pericias ? (s.atributos.length ? `${tituloAtr} e ${tituloPer[0].toLowerCase()}${tituloPer.slice(1)}` : tituloPer) : tituloAtr, sub: 'Testes e rolagens', ajuda: graus ? `Escolha o dado de cada atributo${s.pericias ? ' e de cada ' + (s.pericias.titulo?.trim() || 'perícia').toLowerCase().replace(/s$/, '') : ''}. Em “Teste”, os dois dados rolam juntos e somam.` : `Digite os valores${comMod ? ', os modificadores' : ''}${s.pericias ? ' e o total de cada perícia' : ''}. Toque no botão ao lado para rolar com o número digitado.`, ok: s.atributos.length > 0 || !!s.pericias },
    { id: 'marcas', icone: '🐾', nome: 'Marcas', sub: 'Níveis, habilidades e custos', ajuda: 'Cada marca tem o próprio nível. As habilidades até esse nível ficam liberadas: role o dado e toque em Usar para marcar o uso e tirar o custo. Em Editar, escreva o que cada nível dá.', ok: temExtra(s, 'marcas') },
    { id: 'formas', icone: '🐺', nome: 'Transformações', sub: 'Formas com vida e golpes próprios', ajuda: 'Cada forma tem vida, essência, atributos e golpes próprios. Transformar não muda a ficha normal: ela fica guardada para quando voltar.', ok: temExtra(s, 'formas') },
    { id: 'invocacoes', icone: '🐻', nome: 'Invocações', sub: 'Criaturas, vida e ataques', ajuda: 'Criaturas que o personagem chama. Invocar tira o custo e começa com a vida cheia; a duração desce em Passar 1 turno.', ok: temExtra(s, 'invocacoes') },
    { id: 'efeitos', icone: '⏳', nome: 'Efeitos', sub: 'Condições e turnos', ajuda: 'O que está valendo agora e por quantos turnos. Nada é aplicado sozinho: é só para não esquecer.', ok: temExtra(s, 'efeitos') },
    { id: 'habilidades', icone: '🌌', nome: 'Poderes e habilidades', sub: 'Magias, técnicas, usos e custos', ajuda: 'Consulte e gerencie as habilidades do personagem. Registre informações complementares nas anotações.', ok: true },
    { id: 'arvore', icone: '🌠', nome: 'Árvore de habilidades', sub: 'Caminhos, poderes e progressão', ajuda: 'Visualize e gerencie a árvore de habilidades. Os nós oficiais de D&D são informativos; habilidades extras ficam em um ramo separado.', ok: true },
    { id: 'equipamentos', icone: '🎒', nome: 'Inventário', sub: 'Itens, carga e moedas', ajuda: 'Adicione itens com foto ou ícone, ou pegue prontos no 📦 Arsenal. Itens equipados com rolagem aparecem nas ações rápidas.', ok: true },
    { id: 'anotacoes', icone: '📜', nome: 'Anotações e regras', sub: 'História, lembretes, créditos', ajuda: 'Espaço livre para a história do personagem, aliados, segredos e lembretes.', ok: true },
  ] as const).filter(x => x.ok).map(x => x.id !== 'arvore' && s.nomesSecoes?.[x.id] ? { ...x, nome: s.nomesSecoes[x.id]! } : x)
  // Estúdio do autor (v0.36.6): ordem, ícones e abas escondidas; partes e aparência viram CSS conferido.
  const montagem = s.visual?.montagem
  const ABAS = ordenarAbas(SECOES, montagem)
  const cssAutor = useMemo(() => cssDoVisual(s.visual), [s.visual])
  const tit = (chave: string, padrao: string) => tituloDoBloco(montagem, chave, padrao)
  // Vocabulário editorial: subtítulos temáticos sem substituir os nomes definidos pelo autor.
  const capitulos: Record<string, readonly string[]> = {
    'dnd5e-srd': ['Crônica do herói', 'Provas e talentos', 'Grimório e técnicas', 'Equipamento de viagem', 'Diário de aventuras'],
    pf2e: ['Registro do aventureiro', 'Maestria e proficiência', 'Tradições e talentos', 'Arsenal de Golarion', 'Crônicas'],
    'fate-core': ['Conceito e identidade', 'Escada de competências', 'Façanhas e extras', 'Pertences narrativos', 'História compartilhada'],
    blades: ['Registro do canalha', 'Ações e resistência', 'Truques e capacidades', 'Carga da operação', 'Diário de golpes'],
    brp: ['Registro do personagem', 'Competências percentuais', 'Capacidades especiais', 'Pertences', 'Registro de jornada'],
    'call-of-cthulhu': ['Arquivo do investigador', 'Competências e investigação', 'Conhecimentos e capacidades', 'Evidências e pertences', 'Caderno de ocorrências'],
    'faroeste-arcano': ['Registro da fronteira', 'Provas de coragem', 'Truques e artes arcanas', 'Alforjes e arsenal', 'Relatos da fronteira'],
    'ordem-paranormal': ['Dossiê do agente', 'Avaliação operacional', 'Protocolos e rituais', 'Material de missão', 'Arquivo confidencial'],
    tormenta20: ['Crônica de Arton', 'Aptidões heroicas', 'Poderes e magias', 'Arsenal do herói', 'Memórias de aventura'],
    'mork-borg': ['O condenado', 'Provas do fim', 'Dons e maldições', 'Despojos', 'Crônica da ruína'],
    assimilacao: ['Registro do sobrevivente', 'Adaptações e competências', 'Mutações e capacidades', 'Suprimentos', 'Diário de sobrevivência'],
    opositores: ['Identidade lunar', 'Constelação de atributos', 'Legado e poderes', 'Relíquias e pertences', 'Memórias sob a lua'],
    'two-piece': ['Ficha do tripulante', 'Atributos e perícias', 'Frutas, Haki e técnicas', 'Baú do navio', 'Diário de bordo'],
    nova: ['Perfil N.O.V.A', 'Matriz de competências', 'Protocolos e capacidades', 'Módulos e suprimentos', 'Registro de operações'],
    marcas: ['Portador da marca', 'Atributos e perícias', 'Poderes e técnicas', 'Pertences e orbes', 'Crônica e objetivos'],
  }
  const rubrica = capitulos[identidade]
  const indiceCapitulo = (id: string) => ['principal','atributos','habilidades','equipamentos','anotacoes'].indexOf(id)
  const [secao, setSecao] = useState<string>(secaoForcada ?? 'principal')
  // Compacta apenas a apresentação da barra fixa no celular; não altera recursos.
  const [resumoCompacto, setResumoCompacto] = useState(false)
  useEffect(() => {
    const atualizarResumo = () => setResumoCompacto(window.scrollY > 180)
    atualizarResumo()
    window.addEventListener('scroll', atualizarResumo, { passive: true })
    return () => window.removeEventListener('scroll', atualizarResumo)
  }, [])

  const ir = (id: string) => { setSecao(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => { menu.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }) }, [secao])
  const [forcadaVista, setForcadaVista] = useState(secaoForcada)
  if (secaoForcada !== forcadaVista) { setForcadaVista(secaoForcada); if (secaoForcada && ABAS.some(x => x.id === secaoForcada)) setSecao(secaoForcada) }
  const iAtual = Math.max(0, ABAS.findIndex(x => x.id === secao))
  const atual = ABAS[iAtual], proxima = ABAS[iAtual + 1]
  if (ABAS[iAtual]?.id !== secao && secao !== 'principal' && !ABAS.some(x => x.id === secao)) setSecao('principal')
  const maxDe = (id: string) => { const x = d.recursos[id]?.max; return x === undefined || x === null ? null : Number(x) || 0 }
  const [mostrarTodosRecursos, setMostrarTodosRecursos] = useState(false)
  const edicao2014 = edicaoEfetivaDaFicha(s, d) === 'phb2014'
  const classesDnd = s.id === 'dnd5e-srd' ? (edicao2014 ? classesDaFicha2014(d) : classesDaFicha(d)).lista : []
  const nivelClasse = (id: string) => classesDnd.find(c => c.cls.id === id)?.nivel ?? 0
  const recursosDeClasse: Record<string, boolean> = {
    furias: nivelClasse('barbaro') >= 1,
    inspiracao_bardo: nivelClasse('bardo') >= 1,
    canalizar: nivelClasse('clerigo') >= 2 || nivelClasse('paladino') >= 3,
    forma_selvagem: nivelClasse('druida') >= 2,
    retomar_folego: nivelClasse('guerreiro') >= 1,
    surto_acao: nivelClasse('guerreiro') >= 2,
    indomavel: nivelClasse('guerreiro') >= 9,
    foco: nivelClasse('monge') >= 2,
    feiticaria: nivelClasse('feiticeiro') >= 2,
    cura_maos: nivelClasse('paladino') >= 1,
    marca_cacador: !edicao2014 && nivelClasse('patrulheiro') >= 1,
    pacto: nivelClasse('bruxo') >= 1,
  }
  const recursosDisponiveis = s.recursos.filter(r => !RECURSOS_NO_PAINEL[s.id]?.includes(r.id))
  const recursoVisivel = (r: Sistema['recursos'][number]) => s.id !== 'dnd5e-srd' || !r.ocultarSemMax || (maxDe(r.id) ?? 0) > 0 || Number(d.recursos[r.id]?.atual ?? 0) !== 0 || recursosDeClasse[r.id] === true
  const ocultos = recursosDisponiveis.filter(r => !recursoVisivel(r)).length
  const recursoPrincipal = s.recursos.find(r => /^(pv|vida)$/.test(r.id)) ?? s.recursos.find(r => maxDe(r.id))
  const defesa = s.derivados.find(x => /^(defesa|ca)$/.test(x.id))
  // Ordem Paranormal: rituais em destaque.
  const destaque = (id: string) => s.id === 'ordem-paranormal' && id === 'rituais'
  const lista = (l: { id: string; nome: string }, linhas = 6) => <label key={l.id} className={card + ' block' + (destaque(l.id) ? ' !border-2 !border-(--ficha-acento) shadow-[0_0_20px_#a855f733]' : '')}>
    <span className="font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{destaque(l.id) ? '🔮 ' : ''}{l.nome}</span>
    <textarea rows={linhas} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
  </label>

  const passos = ABAS.filter(x => ['principal', 'atributos', 'habilidades', 'equipamentos', 'anotacoes'].includes(x.id))
  const feitos = passos.filter(x => preenchida(x.id, s, d)).length
  return <div style={estiloTema(tema)} data-visual={identidade} data-modo={bloqueada ? 'consulta' : modo} data-ficha-autor={s.visual ? '' : undefined} className={tema.sombrio ? 'ficha-sombria' : undefined}>
    {cssAutor && <style>{cssAutor}</style>}
    <div className="ficha-fundo" aria-hidden="true" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {s.visual?.logo && <img src={s.visual.logo} alt={'Logo de ' + s.nome} data-logo-sistema className="ficha-logo mx-auto mb-3 block max-h-28 w-auto max-w-full object-contain drop-shadow-[0_4px_18px_#000a]" />}
    <RolagemCentral ref={central} />
    {s.rolagem !== 'assimilacao' && <BotaoRolarFlutuante rolar={rolarExpr} />}
    {descansando && <JanelaDescanso s={s} d={d} onChange={onChange} rolarTotal={rolarTotal} fechar={() => setDescansando(false)} />}
    {!bloqueada && <div className="ficha-modos mb-3 flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Modo da ficha" className="flex gap-1 rounded-2xl border border-(--a-55456e) bg-(--s-171325)/90 p-1">
        {MODOS.map(x => <button key={x.id} type="button" role="radio" aria-checked={modo === x.id} onClick={() => setModo(x.id)} title={x.dica}
          className={'rounded-xl px-3 py-1.5 text-sm font-semibold transition ' + (modo === x.id ? 'bg-(--a-5b4380) text-white shadow-[inset_0_-2px_0_var(--ouro)]' : 'text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>{x.icone} {x.nome}</button>)}
      </div>
      <p className="hidden min-w-0 flex-1 text-xs text-(--a-a99bbb) sm:block">{MODOS.find(x => x.id === modo)?.dica}</p>
    </div>}
    {!bloqueada && modo === 'criacao' && <nav aria-label="Passos da criação" className="mb-3 rounded-2xl border border-(--a-55456e) bg-(--s-171325)/90 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs"><span className="font-semibold uppercase tracking-wider text-(--a-c4b6d4)">Passos da criação</span><span className="ml-auto tabular-nums text-(--a-cfc0df)">{feitos}/{passos.length}</span></div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-(--ouro) transition-[width]" style={{ width: (passos.length ? feitos / passos.length * 100 : 0) + '%' }} /></div>
      <ol className="relative flex gap-1.5 overflow-x-auto pb-1">
        {passos.map((x, i) => { const ok = preenchida(x.id, s, d)
          return <li key={x.id} className="shrink-0"><button type="button" onClick={() => ir(x.id)} aria-current={secao === x.id ? 'step' : undefined}
            className={'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ' + (secao === x.id ? 'border-(--a-e4d3ff) bg-(--s-3a2c58) text-white' : 'border-(--a-55456e) text-(--a-cfc0df) hover:bg-(--s-2b2140)')}>
            <span aria-hidden="true" className={'flex size-4 items-center justify-center rounded-full text-[10px] ' + (ok ? 'bg-emerald-500/80 text-white' : 'bg-black/40')}>{ok ? '✓' : i + 1}</span>{x.nome}<span className="sr-only">{ok ? ' (já tem algo)' : ' (vazio)'}</span></button></li> })}
      </ol>
      {FICHA_OFICIAL[identidade] && <details className="ficha-oficial mt-2 text-xs text-(--a-cfc0df)"><summary className="cursor-pointer select-none text-(--ficha-acento)">📄 Ordem da ficha de papel deste jogo</summary>
        <ol className="mt-2 list-decimal space-y-0.5 pl-5">{FICHA_OFICIAL[identidade].ordem.map(x => <li key={x}>{x}</li>)}</ol>
        <p className="mt-1.5 text-(--a-a99bbb)">{FICHA_OFICIAL[identidade].dica}</p></details>}
    </nav>}
    <div className={`ficha-resumo sticky top-[57px] z-10 max-sm:[&_.dnd-resumo-celula]:min-h-0 max-sm:[&_.dnd-resumo-celula]:py-1 ${resumoCompacto ? 'max-sm:!py-1 max-sm:[&_.dnd-resumo-celula]:!py-0 max-sm:[&_.dnd-resumo-celula_span]:hidden max-sm:[&_.dnd-resumo-celula_svg]:size-3.5' : ''} -mx-3 mb-4 border-b border-(--a-373251) bg-(--s-100d1c)/95 px-3 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4`} aria-label="Resumo do personagem">
      {identidade === 'dnd5e-srd' ? <div className="dnd-resumo-compacto" aria-label="Recursos principais">
        {recursoPrincipal && [recursoPrincipal, ...s.recursos.filter(r => r !== recursoPrincipal && maxDe(r.id))].slice(0, 3).map((r,i) => {
          const Icone = i === 0 ? Heart : /dado/i.test(r.nome) ? Dice5 : Sparkles
          return <div key={r.id} className="dnd-resumo-celula" title={r.nome}><Icone size={16} aria-hidden="true"/><strong>{Number(d.recursos[r.id]?.atual ?? 0) || 0}/{maxDe(r.id) ?? '—'}</strong><span>{i === 0 ? 'Vida' : /dado/i.test(r.nome) ? 'Dados' : /inspira/i.test(r.nome) ? 'Inspiração' : r.nome}</span></div>
        })}
        {defesa && <div className="dnd-resumo-celula" title={defesa.nome}><Shield size={16} aria-hidden="true"/><strong>{m.derivados[defesa.id] ?? '—'}</strong><span>Defesa</span></div>}
      </div> : <div className="flex items-center gap-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Vida e recursos (role para o lado)">
        {recursoPrincipal && [recursoPrincipal, ...s.recursos.filter(r => r !== recursoPrincipal && maxDe(r.id))].slice(0, 3).map(r =>
          <MiniBarra key={r.id} nome={/^pv$/.test(r.id) ? 'PV' : r.nome.split(' (')[0]} cor={corDoRecurso(r.id, r.nome)} atual={Number(d.recursos[r.id]?.atual ?? 0) || 0} max={maxDe(r.id)} />)}
        {defesa && <span className="ficha-defesa-resumo shrink-0 whitespace-nowrap rounded-lg border border-(--a-62527e) bg-(--s-201a32) px-3 py-1 text-sm" title={defesa.nome}>🛡️ {/^classe de armadura/i.test(defesa.nome) ? 'CA' : defesa.nome.split(' (')[0]} <strong>{m.derivados[defesa.id] ?? '—'}</strong></span>}
      </div>}
    </div>
    <div className="lg:flex lg:gap-6">
      <nav aria-label="Seções da ficha" className="ficha-menu mb-4 lg:mb-0 lg:w-60 lg:shrink-0">
        <div ref={menu} className="grid grid-cols-3 gap-1.5 pb-1 sm:grid-cols-3 sm:gap-2 lg:flex lg:sticky lg:top-[120px] lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-(--a-55456e) lg:bg-(--s-201a32) lg:p-3">
          <p className="hidden px-2 pb-1 text-xs font-bold uppercase tracking-widest text-(--a-ed9cd8) lg:block">🌙 Menu da ficha</p>
          {ABAS.map(x => <button key={x.id} type="button" onClick={() => ir(x.id)} aria-label={x.nome} aria-current={secao === x.id ? 'page' : undefined}
            className={'min-w-0 min-h-12 rounded-xl px-1.5 py-2 text-center text-xs transition sm:px-3 sm:text-sm lg:w-full lg:text-left ' + (secao === x.id ? 'bg-(--a-5b4380) text-white' : 'bg-(--s-201a32) text-(--a-d6c8e8) hover:bg-(--s-2b2140) lg:bg-transparent')}>
            {(() => { const [Icone, curto] = itemDoMenu(identidade, x.id), proprio = montagem?.secoes?.find(m => m.id === x.id)?.icone
              return <span className="dnd-menu-label ficha-menu-label">{proprio ? <span aria-hidden="true" className="text-lg leading-none">{proprio}</span> : <Icone size={19} aria-hidden="true" />}<span className="dnd-menu-curto">{x.id !== 'arvore' && s.nomesSecoes?.[x.id as keyof typeof s.nomesSecoes] ? x.nome : curto}</span><span className="dnd-menu-longo">{x.nome}</span></span> })()}
            <span className="hidden text-xs text-(--a-c4b6d4) lg:block">{rubrica?.[indiceCapitulo(x.id)] ?? x.sub}</span>
          </button>)}
        </div>
      </nav>
      <div className="ficha-conteudo min-w-0 flex-1 space-y-4">
        {atual && rubrica && <header className="ficha-capitulo"><span aria-hidden="true" className="ficha-capitulo-selo">{simbolos[identidade] ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" className="ficha-simbolo"><path d={simbolos[identidade]} /></svg> : String(iAtual + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="ficha-capitulo-universo">{tituloSistemaNaFicha(s, d)}</p><h2>{rubrica[indiceCapitulo(atual.id)] ?? atual.nome}</h2></div></header>}
        {atual && modo !== 'jogo' && <aside aria-label="Orientações da seção" className="ficha-orientacao flex items-start gap-2 rounded-xl border border-(--a-3d3152) bg-(--s-171325)/90 px-3 py-3 text-xs leading-relaxed text-(--a-cfc0df)"><span aria-hidden="true" className="shrink-0 text-base">{atual.icone}</span><span><strong className="text-(--a-e4d3ff)">{atual.nome}:</strong> {atual.ajuda}</span></aside>}

        {secao === 'marcas' && <SecaoMarcas s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolarExpr} />}
        {secao === 'formas' && <SecaoFormas s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolarExpr} />}
        {secao === 'invocacoes' && <SecaoInvocacoes s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolarExpr} />}
        {secao === 'efeitos' && <SecaoEfeitos s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolarExpr} />}
        {secao === 'principal' && <div className="ficha-composicao ficha-blocos" data-secao="principal">
          {s.id !== 'faroeste-arcano' && <div data-bloco="faixa"><FaixaDoSistema s={s} nome={d.nome} /></div>}
          {s.id === 'faroeste-arcano' && <div data-painel-sistema><PainelDoSistema s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} /></div>}
          <div data-bloco="extras" className="empty:hidden"><ResumoExtras s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolar={rolarExpr} ir={ir} /></div>
          {s.id === 'ordem-paranormal' && <ResumoOrdem nex={Number(d.campos.nex ?? 0) || 0} classe={String(d.campos.classe ?? '')} trilha={String(d.campos.trilha ?? '')} origem={String(d.campos.origem ?? '')}
            pe={{ atual: Number(d.recursos.pe?.atual ?? 0) || 0, max: maxDe('pe') }} san={{ atual: Number(d.recursos.san?.atual ?? 0) || 0, max: maxDe('san') }} />}
          <section className={card + " ficha-identidade"} data-bloco="identidade">
            <div className="ficha-identidade-retrato flex items-start gap-4">
              <Retrato url={d.retrato} nome={d.nome} somenteLeitura={somenteLeitura} onChange={u => onChange({ ...d, retrato: u ?? undefined })} />
              <label className="block min-w-0 flex-1 text-sm font-semibold">Nome do personagem
                <input value={d.nome} maxLength={90} disabled={somenteLeitura} onChange={e => set('nome', e.target.value)} className={input + ' mt-1 text-lg font-bold'} placeholder="Ex.: Lyra Nyx" /></label>
            </div>
            {modo === 'jogo' && !detalhes && <button type="button" onClick={() => setDetalhes(true)} className="mt-3 text-xs text-(--a-b99bff) hover:underline">Mostrar os detalhes da identidade ({s.campos.filter(f => !SO_CALCULO[s.id]?.includes(f.id)).length})</button>}
            {(modo !== 'jogo' || detalhes) && <div className="ficha-identidade-campos mt-3 grid grid-cols-2 gap-x-3 gap-y-3 lg:grid-cols-3">
              {s.campos.filter(f => !SO_CALCULO[s.id]?.includes(f.id)).map(f => <label key={f.id} className={'flex flex-col justify-end text-sm text-(--a-d6c8e8) ' + (f.tipo === 'area' ? 'col-span-2 lg:col-span-3' : f.tipo === 'numero' ? '' : 'col-span-2 sm:col-span-1')}>{f.nome}
                {f.tipo === 'area'
                  ? <textarea rows={3} value={String(d.campos[f.id] ?? '')} disabled={somenteLeitura} onChange={e => set('campos', { ...d.campos, [f.id]: e.target.value.slice(0, 4000) })} className={input + ' mt-1'} />
                  : <input type={f.tipo === 'numero' ? 'number' : 'text'} value={d.campos[f.id] ?? ''} disabled={somenteLeitura} maxLength={120}
                    list={f.tipo === 'escolha' && f.opcoes?.length ? 'sugestoes-' + f.id : undefined}
                    onChange={e => set('campos', { ...d.campos, [f.id]: f.tipo === 'numero' ? Number(e.target.value) : e.target.value })} className={input + ' mt-1'} />}
                {f.tipo === 'escolha' && !!f.opcoes?.length && <datalist id={'sugestoes-' + f.id}>{f.opcoes.map(o => <option key={o.nome} value={o.nome} label={o.descricao} />)}</datalist>}
                {f.tipo === 'escolha' && (() => { const o = f.opcoes?.find(x => x.nome === d.campos[f.id]); return o?.descricao ? <span data-descricao-opcao className="mt-1 text-[11px] leading-snug text-(--a-b99bff)">{o.descricao}</span> : null })()}
                {f.dica && <span className="mt-1 text-[11px] leading-snug text-(--a-a998bd)">{f.dica}</span>}
              </label>)}
            </div>}
          </section>
          {s.id !== 'faroeste-arcano' && <div data-painel-sistema data-bloco="paineis" className="ficha-paineis-especiais space-y-4 empty:hidden"><PainelDoSistema s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} /></div>}
          {(s.derivados.length > 0 || s.recursos.length > 0) && <section className={card + " ficha-recursos-gerais"} data-bloco="recursos">
            <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="flex-1 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{tit('principal.recursos', 'Valores e recursos')}</h2>
              {!somenteLeitura && s.recursos.length > 0 && <button type="button" onClick={() => setDescansando(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a23a]/70 px-3 py-1.5 text-sm text-amber-100 hover:bg-[#3a2a14]">🌙 Descanso</button>}</div>
            {s.derivados.length > 0 && <div className="ficha-valores-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {s.derivados.map(x => <label key={x.id} className="ficha-valor rounded-xl bg-(--s-171325) p-3" data-defesa={x.id === defesa?.id ? "sim" : undefined}>
                {s.id === "dnd5e-srd" && x.id === defesa?.id && <svg aria-hidden="true" viewBox="0 0 80 92" className="dnd-defesa-escudo"><path d="M3 3H77V51Q77 72 40 89Q3 72 3 51Z" fill="#352129" stroke="#bc9764" strokeWidth="2"/><path d="M9 10H71V51Q71 68 40 81Q9 68 9 51Z" fill="none" stroke="#bc9764" strokeOpacity=".45"/></svg>}
                <span className="block text-xs text-(--a-c4b6d4)">{x.nome}</span>
                <input type="number" value={m.derivados[x.id] ?? ''} disabled={somenteLeitura} placeholder="—" aria-label={x.nome}
                  onChange={e => setManual('derivados', x.id, numero(e.target.value))} className="mt-1 w-full bg-transparent text-2xl font-black text-white outline-none disabled:opacity-70" />
              </label>)}
            </div>}
            {s.id === 'dnd5e-srd' && ocultos > 0 && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-(--a-c4b6d4)">Recursos da classe e recursos preenchidos. Os limites continuam manuais.</span><button type="button" aria-pressed={mostrarTodosRecursos} onClick={() => setMostrarTodosRecursos(v => !v)} className="rounded-lg border border-[#bc9764] px-3 py-2 text-amber-100">{mostrarTodosRecursos ? 'Mostrar só os relevantes' : 'Mostrar todos os recursos (' + ocultos + ' ocultos)'}</button></div>}
            {s.recursos.length > 0 && <div className="ficha-recursos-grid mt-3 grid gap-3 lg:grid-cols-2">
              {recursosDisponiveis.filter(r => mostrarTodosRecursos || recursoVisivel(r)).map(r => {
                const atual = Number(d.recursos[r.id]?.atual ?? 0) || 0
                return <div key={r.id} data-recurso-principal={r === recursoPrincipal ? "sim" : undefined} data-espaco-magia={s.id === "dnd5e-srd" && /^espacos_\d+$/.test(r.id) ? "sim" : undefined}>{s.id === "dnd5e-srd" && /^espacos_\d+$/.test(r.id) && (maxDe(r.id) ?? 0) > 0 && <div className="dnd-cristais" aria-hidden="true">{Array.from({ length: Math.min(20, Math.max(0, Math.floor(maxDe(r.id) ?? 0))) }, (_, i) => <svg key={i} viewBox="0 0 22 30" data-disponivel={i < atual ? "sim" : "nao"}><path d="M11 1L21 11L11 29L1 11Z"/><path d="M11 1L7 11L11 29L15 11Z M1 11H21" fill="none"/></svg>)}</div>}{s.id === 'dnd5e-srd' && r.id === 'dados_vida' && <div className="dnd-dados-vida">
                    <div className="dnd-dados-vida-tipos">{classesDnd.length ? classesDnd.map(c => <span key={c.cls.id}>{c.nivel}d{c.cls.dv} · {c.cls.nome}</span>) : <span>Defina a classe para identificar o dado de vida.</span>}</div>
                    <div className="dnd-dados-vida-grade" role="img" aria-label={`${atual} de ${maxDe(r.id) ?? 'máximo não definido'} dados de vida disponíveis`}>
                      {Array.from({length: Math.min(20, Math.max(0, Math.floor(maxDe(r.id) ?? 0)))}, (_, i) => {
                        const dv = classesDnd.length && classesDnd.every(c => c.cls.dv === classesDnd[0].cls.dv) ? classesDnd[0].cls.dv : 0
                        const forma = dv === 6 ? 'M8 8H40V40H8Z M8 8L15 2H46V34L40 40 M40 8L46 2' : dv === 8 ? 'M24 2L44 24L24 46L4 24Z M4 24H44 M24 2L16 24L24 46L32 24Z' : dv === 10 ? 'M24 2L44 18L39 34L24 46L9 34L4 18Z M4 18L24 30L44 18 M24 2V30L24 46' : dv === 12 ? 'M24 2L43 15L43 34L24 46L5 34V15Z M24 10L37 20L32 35H16L11 20Z' : 'M24 3L45 15V35L24 46L3 35V15Z'
                        return <svg key={i} viewBox="0 0 48 48" data-disponivel={i < atual ? 'sim' : 'nao'} aria-hidden="true"><path d={forma}/><text x="24" y="27" textAnchor="middle">{dv ? 'd'+dv : 'DV'}</text></svg>
                      })}
                    </div>
                    <p>{classesDnd.some(c => c.cls.dv !== classesDnd[0]?.cls.dv) ? 'Multiclasse: a ficha guarda apenas o total disponível, não o gasto por tipo de dado.' : 'Dados iluminados estão disponíveis; dados escuros foram utilizados.'}</p>
                  </div>}<BarraRecurso nome={edicao2014 && r.id === 'foco' ? 'Pontos de Ki' : edicao2014 && r.id === 'inspiracao' ? 'Inspiração' : edicao2014 && r.id === 'exaustao' ? 'Exaustão' : r.nome} cor={corDoRecurso(r.id, r.nome)} atual={atual} max={maxDe(r.id)} maxEditavel somenteLeitura={somenteLeitura} contador={!!r.contador}
                  mudar={v => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual: v } })}
                  mudarMax={v => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual, max: v } })} />
                  {r.dica && <p className="mt-1 px-1 text-[11px] leading-snug text-(--a-a998bd)">{r.dica}</p>}</div>
              })}
            </div>}
          </section>}
          <div className="ficha-acoes-rapidas empty:hidden" data-bloco="acoes"><AcoesRapidas d={d} rolar={rolarExpr} irInventario={() => ir('equipamentos')} /></div>
        </div>}

        {secao === 'atributos' && <div className="ficha-blocos space-y-4" data-secao="atributos">
          {graus && s.atributos.length > 0 && <section className={card} data-bloco="atributos">
            <h2 className="mb-3 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{tituloAtr}</h2>
            <AtributosGraus s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} mostrar={mostrar} />
          </section>}
          {graus && s.pericias && <div data-bloco="pericias"><PericiasGraus s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} mostrar={mostrar} /></div>}
          {!graus && s.atributos.length > 0 && <section className={card} data-bloco="atributos">
            <h2 className="mb-3 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{tituloAtr}</h2>
            {lua ? <>
              <AtributosLua atributos={s.atributos} valores={d.atributos} somenteLeitura={somenteLeitura}
                mudar={(id, v) => set('atributos', { ...d.atributos, [id]: v })}
                rolar={d20 || parada || regra ? (a, v) => void (parada ? rolar(a.nome, 0, v) : rolar(a.nome, comMod ? m.mods[a.id] ?? 0 : v)) : undefined}
                {...(comMod ? { mods: m.mods, mudarMod: (id: string, v: number) => setManual('mods', id, v) } : {})} />
              {s.atributos.some(a => a.dica) && <details className="mt-4 rounded-xl bg-(--s-171325) px-3 py-2 text-sm"><summary className="cursor-pointer font-semibold">O que cada atributo faz</summary>
                <ul className="mt-2 space-y-1.5 text-xs text-(--a-d6c9e4)">{s.atributos.filter(a => a.dica).map(a => <li key={a.id}><strong className="text-(--ficha-acento)">{a.nome} ({a.id}):</strong> {a.dica}</li>)}</ul></details>}
            </>
            : s.id === 'ordem-paranormal'
              ? <AtributosOrdem atributos={s.atributos} valores={d.atributos} nex={Number(d.campos.nex ?? 5)} somenteLeitura={somenteLeitura} semLimite
                onChange={(id, valor) => set('atributos', { ...d.atributos, [id]: valor })} />
              : visual.atributos === 'com-mod' ? <div className={s.id === 'dnd5e-srd' ? 'dnd-brasoes' : 'grid grid-cols-3 gap-x-2 gap-y-5 pb-3 sm:grid-cols-6 sm:gap-3'}>
                {s.atributos.map(a => <AtributoComposto key={a.id} id={a.id} nome={a.nome} valor={Number(d.atributos[a.id] ?? a.padrao)} mod={m.mods[a.id] ?? 0} somenteLeitura={somenteLeitura}
                  mudarValor={v => set('atributos', { ...d.atributos, [a.id]: v })} mudarMod={v => setManual('mods', a.id, v)} rolar={d20 ? () => void rolar(a.nome, m.mods[a.id] ?? 0) : undefined} />)}
              </div>
              : visual.atributos === 'modificador' ? <div className={'grid gap-2 sm:gap-3 ' + (s.atributos.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-6')}>
                {s.atributos.map(a => <AtributoModificador key={a.id} id={a.id} nome={a.nome} valor={Number(d.atributos[a.id] ?? a.padrao)} somenteLeitura={somenteLeitura} sombrio={tema.sombrio}
                  mudar={v => set('atributos', { ...d.atributos, [a.id]: v })} rolar={d20 ? () => void rolar(a.nome, Number(d.atributos[a.id] ?? a.padrao)) : undefined} />)}
              </div>
              : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
                {s.atributos.map(a => <div key={a.id} className="ficha-atributo-percentual rounded-xl border border-(--ficha-borda) bg-(--s-171325) p-2 text-center sm:p-3">
                  <p className="text-xs uppercase tracking-wider text-(--a-c4b6d4)" title={a.nome}>{a.id}</p>
                  <input type="number" aria-label={a.nome} value={d.atributos[a.id] ?? a.padrao} disabled={somenteLeitura}
                    onChange={e => set('atributos', { ...d.atributos, [a.id]: numero(e.target.value) ?? 0 })}
                    className="mt-1 w-full bg-transparent text-center text-2xl font-black text-white outline-none disabled:opacity-70" />
                  {comMod && <label className="mt-1 flex items-center justify-center gap-1 text-[10px] text-(--a-c4b6d4)">mod
                    <input type="number" aria-label={'Modificador de ' + a.nome} value={m.mods[a.id] ?? 0} disabled={somenteLeitura}
                      onChange={e => setManual('mods', a.id, numero(e.target.value))}
                      className="w-12 rounded border border-(--a-5e4b78) bg-(--s-151123) px-1 text-center text-sm font-bold text-(--a-d4baff) disabled:opacity-70" /></label>}
                  <p className="mt-1 truncate text-[10px] text-(--a-a998bd)">{a.nome}</p>
                  {s.leituraD100 === 'coc' && (() => { const v = Number(d.atributos[a.id] ?? a.padrao) || 0; return <p className="mt-0.5 text-[10px] text-(--ficha-acento)">½ {Math.floor(v / 2)} · ⅕ {Math.floor(v / 5)}</p> })()}
                </div>)}
              </div>}
          </section>}
          {s.rolagem === 'assimilacao' && <TesteAssimilacao s={s} d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolarNaCampanha={rolarNaCampanha} />}
          {(d20 || parada || regra) && s.atributos.length > 0 && !lua && (visual.atributos === 'padrao' || visual.atributos === 'hexagonos' || !d20) && <section className={card + (s.id === 'ordem-paranormal' ? ' ordem-testes' : '')} data-bloco="teste">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]"><Dice5 size={18} /> {tit('atributos.teste', 'Teste de atributo')}</h2>
            {parada && <p className="mb-2 text-xs text-(--a-a998bd)">Rola um d{parada} para cada ponto do atributo e fica com o maior. Com 0, rola dois e fica com o menor.</p>}
            <div className={s.id === 'ordem-paranormal' ? 'ordem-testes-grid' : 'flex flex-wrap gap-2'}>{s.atributos.map(a => { const v = Number(d.atributos[a.id]) || 0, b = comMod ? m.mods[a.id] ?? 0 : v
              return <button key={a.id} type="button" onClick={() => parada ? rolar(a.nome, 0, v) : rolar(a.nome, b)}
                className="rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm hover:bg-(--s-34294f)">{s.id === 'ordem-paranormal' ? <><SimboloElementoOrdem atributo={a.id} tamanho={52}/><strong>{a.id}</strong><span>{Math.max(0,v)||2}d{parada}{v===0 ? ' · menor' : ''}</span></> : <>{a.id} {parada ? `(${Math.max(0, v) || 2}d${parada})` : sinal(b)}</>}</button> })}</div>
          </section>}
          {parada && !!s.resistencias?.length && visual.pericias !== 'acoes' && <section className={card} data-bloco="resistencia">
            <h2 className="mb-1 flex items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]"><Dice5 size={18} /> {tit('atributos.resistencia', 'Resistência')}</h2>
            <p className="mb-2 text-xs text-(--a-a998bd)">Rola um d{parada} por ponto (o número digitado em Valores) e fica com o maior.</p>
            <div className="flex flex-wrap gap-2">{s.resistencias.map(id => { const x = s.derivados.find(y => y.id === id); if (!x) return null; const n = Number(m.derivados[id]) || 0
              return <button key={id} type="button" onClick={() => rolar(x.nome.split(' (')[0], 0, n, true)} className="rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm hover:bg-(--s-34294f)">{x.nome.split(' (')[0]} ({n || 2}d{parada})</button> })}</div>
          </section>}
          {!graus && s.pericias && <section data-bloco="pericias" className={card + (s.id === 'dnd5e-srd' ? ' dnd-testes' : s.id === 'ordem-paranormal' ? ' ordem-pericias' : '')}>
            <h2 className="mb-1 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">{tituloPer}</h2>
            {visual.pericias === 'piramide' ? <>
              <p className="mb-3 text-xs text-(--a-a998bd)">Cada degrau mostra as perícias daquele nível. Toque numa perícia para rolar 4dF + o nível.</p>
              <PiramideFate pericias={s.pericias.lista} valores={m.pericias} somenteLeitura={somenteLeitura}
                mudar={(id, v) => onChange({ ...d, manual: { ...m, pericias: { ...m.pericias, [id]: v } }, pericias: { ...d.pericias, [id]: s.pericias!.treinos?.[v]?.id ?? d.pericias[id] } })}
                rolar={(nome, v) => void rolar(nome, v)} />
            </> : visual.pericias === 'acoes' ? <>
              <p className="mb-3 text-xs text-(--a-a998bd)">Toque nas bolinhas para marcar os pontos de cada ação; toque no nome para rolar. 🛡️ rola a resistência do grupo (o número digitado em Valores).</p>
              <AcoesBlades grupos={[...grupos].map(([g, itens]) => [g, itens])} valores={m.pericias} somenteLeitura={somenteLeitura}
                resistencias={Object.fromEntries([...grupos].map(([g]) => { const id = (s.resistencias ?? []).find(x => x === g.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()); return [g, id ? { id, valor: Number(m.derivados[id]) || 0 } : undefined] }))}
                mudar={(id, v) => onChange({ ...d, manual: { ...m, pericias: { ...m.pericias, [id]: v } }, pericias: { ...d.pericias, [id]: 'd' + v } })}
                rolar={(nome, n) => void rolar(nome, 0, n)} rolarResistencia={(nome, n) => void rolar(nome, 0, n, true)} />
            </> : <>
            {dossie && <p className="mb-2 text-xs text-(--a-a998bd)">☑ marca de experiência: marque a perícia usada com sucesso na sessão (para a fase de melhoria). {s.leituraD100 === 'coc' ? 'Embaixo de cada uma: a metade (sucesso difícil) e o quinto (extremo).' : 'Embaixo de cada uma: o sucesso especial (⅕) e o crítico (1/20).'}</p>}
            <p className="mb-3 text-xs text-(--a-a998bd)">{s.pericias.modo === 'valor' ? 'Digite o valor de cada uma.' : visual.pericias === 'graus' ? 'Toque no indicador para marcar o grau de treino e digite o total (bônus) de cada uma.' : 'Digite o total (bônus) de cada uma.'}{podeRolar ? ' Toque no dado para rolar.' : ''}</p>
            {s.id === "ordem-paranormal" && <div className="ordem-pericias-cabecalho" aria-hidden="true"><span>Treino</span><span>Competência</span><span>Bônus</span><span>Teste</span></div>}
            {[...grupos].map(([g, itens]) => <div key={g} className={s.id === 'dnd5e-srd' ? "dnd-registro-grupo mb-4" : "mb-4"}>
              {g && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">{g}</h3>}
              <div className={s.id === 'dnd5e-srd' ? "dnd-registro-lista" : s.id === 'ordem-paranormal' ? "ordem-pericias-lista" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
                {itens.map(p => { const valor = s.pericias!.modo === 'valor'
                  const tot = valor ? Number(d.pericias[p.id]) || 0 : m.pericias[p.id] ?? 0
                  return <div key={p.id} className={'ficha-pericia flex items-center gap-2 rounded-lg px-3 py-2 ' + (dossie ? 'border border-[#b9a77e] bg-[#ece2c8] text-[#2a1f14] [font-family:ui-monospace,Courier,monospace]' : 'bg-(--s-171325)')}>
                    {dossie && <input type="checkbox" checked={marcas['exp_' + p.id] === true} disabled={somenteLeitura} onChange={e => marcar('exp_' + p.id, e.target.checked)} aria-label={'Marca de experiência em ' + p.nome} title="Marca de experiência (usou com sucesso nesta sessão)" className="h-4 w-4 shrink-0 accent-[#5f4f35]" />}
                    {s.id === "ordem-paranormal" && <SeloPericiaOrdem marca grau={Math.max(0, s.pericias?.treinos?.findIndex(t => t.id === String(d.pericias[p.id] ?? "")) ?? 0)}/>}
                    {visual.pericias === 'graus' && <GrauPericia s={s} valor={String(d.pericias[p.id] ?? '')} nome={p.nome} somenteLeitura={somenteLeitura} mudar={v => set('pericias', { ...d.pericias, [p.id]: v })} />}
                    <span className="min-w-0 flex-1"><span className={s.id === 'dnd5e-srd' ? "block text-sm dnd-pericia-nome" : s.id === 'ordem-paranormal' ? "block text-sm break-words" : "block truncate text-sm"}>{p.nome}{p.atributo && (s.id === "ordem-paranormal" ? <span className="ordem-pericia-elemento">{p.atributo.toUpperCase()}</span> : <span className="ml-1 text-[10px] text-(--a-a998bd)">({p.atributo})</span>)}</span>
                      {dossie && <span className="block text-[11px] text-[#5f4f35]">{s.leituraD100 === 'coc' ? `½ ${Math.floor(tot / 2)} · ⅕ ${Math.floor(tot / 5)}` : `especial ${Math.max(1, Math.round(tot / 5))} · crítico ${Math.max(1, Math.round(tot / 20))}`}</span>}</span>
                    <input type="number" aria-label={(valor ? 'Valor de ' : 'Total de ') + p.nome} value={valor ? d.pericias[p.id] ?? 0 : m.pericias[p.id] ?? ''} placeholder="0" disabled={somenteLeitura}
                      onChange={e => valor ? set('pericias', { ...d.pericias, [p.id]: numero(e.target.value) ?? 0 }) : setManual('pericias', p.id, numero(e.target.value))}
                      className={input + ' !w-16 shrink-0 text-center' + (dossie ? ' !border-[#8a7a55] !bg-[#f6efdc] !font-bold !text-[#2a1f14]' : s.id === 'dnd5e-srd' ? ' dnd-bonus' : '')} />
                    {s.rolagem !== 'assimilacao' && podeRolar && <button type="button" onClick={() => p.atributo || !parada ? rolar(p.nome, tot, dadosDe(p.atributo)) : rolar(p.nome, 0, tot)} aria-label={'Rolar ' + p.nome}
                      className={'shrink-0 rounded-lg px-2 py-1.5 ' + (dossie ? 'bg-[#5f4f35] text-[#f6efdc] hover:bg-[#7a6646]' : 'bg-(--s-34294f) hover:bg-(--s-4b3a6e)')}><Dice5 size={16} aria-hidden="true" /></button>}
                    {minhaPericia.has(p.id) && !somenteLeitura && <button type="button" onClick={() => tirarPericia(p.id)} aria-label={'Tirar ' + p.nome} className="shrink-0 rounded-lg p-1.5 text-red-200 hover:bg-(--s-34294f)"><Trash2 size={14} /></button>}
                  </div> })}
              </div>
            </div>)}
            {s.pericias.livres && !somenteLeitura && <form onSubmit={e => { e.preventDefault(); criarPericia() }} className="mt-3 flex gap-2">
              <input value={novaPericia} maxLength={60} onChange={e => setNovaPericia(e.target.value)} aria-label={'Nova ' + tituloPer.toLowerCase()} placeholder="Ex.: Investigação, Medicina, Rua…" className={input + ' min-w-0 flex-1'} />
              <button type="submit" disabled={!novaPericia.trim() || periciasExtras.length >= 40} className="inline-flex items-center gap-1 rounded-lg border border-(--a-5e4b78) px-3 text-sm hover:bg-(--s-34294f) disabled:opacity-40"><Plus size={14} /> Nova perícia</button>
            </form>}
            </>}
          </section>}
        </div>}

        {secao === 'habilidades' && <div className="ficha-blocos space-y-4" data-secao="habilidades">
          
          {s.id === 'pf2e' && <section className={card} data-bloco="talentos">
            <h2 className="mb-1 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]">Talentos por categoria</h2>
            <p className="mb-3 text-xs text-(--a-a998bd)">Um talento por linha, com o nível em que foi escolhido (ex.: “1 · Golpe Duplo”).</p>
            <div className="grid gap-3 sm:grid-cols-2">{TALENTOS_PF2E.map(([id, nome]) => <label key={id} className="block rounded-xl border border-(--ficha-borda) bg-(--s-171325) p-2 text-sm font-semibold">{nome}
              <textarea rows={4} value={d.listas[id] ?? ''} disabled={somenteLeitura} maxLength={8000} onChange={e => set('listas', { ...d.listas, [id]: e.target.value })} className={input + ' mt-1 font-normal'} /></label>)}</div>
          </section>}
          <div className="ficha-acervo ficha-acervo-poderes" data-bloco="poderes"><PoderesFicha {...propsInv} /></div>
          {listasDe('habilidades').filter(l => destaque(l.id) && (d.listas[l.id] ?? '').trim()).map(l => lista(l))}
          {listasDe('habilidades').some(l=>!destaque(l.id)) && <details className={card} data-bloco="notas"><summary className="cursor-pointer font-semibold">Anotações complementares de habilidades</summary><section className="mt-3 grid gap-4">{listasDe('habilidades').filter(l => !destaque(l.id) && !(s.id === 'pf2e' && l.id === 'talentos' && !d.listas.talentos?.trim())).map(l => lista(s.id === 'pf2e' && l.id === 'talentos' ? { ...l, nome: 'Outros talentos' } : l))}</section></details>}
        </div>}
        {secao === 'arvore' && <div className="space-y-4">
          {s.id === 'dnd5e-srd' || s.id === 'dnd5e-manual' ? <ArvoreDndOficial d={d} edicao={edicaoEfetivaDaFicha(s, d) === 'phb2014' ? 'phb2014' : 'phb2024'} fontes={null}>
            <ArvoreHabilidades s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura}
              rolar={(expressao, rotulo) => void rolarExpr(expressao, rotulo)} mestre={mestre && !somenteLeitura}
              nivel={Math.max(1, Number(d.campos.nivel) || 1)} visualizacao="cartoes" />
          </ArvoreDndOficial> : <ArvoreSistema s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura}>
            <ArvoreHabilidades s={s} d={d} onChange={onChange}
              somenteLeitura={somenteLeitura} rolar={(expressao, rotulo) => void rolarExpr(expressao, rotulo)}
              mestre={mestre && !somenteLeitura} nivel={s.campos.some(x=>x.id==='nivel') ? Math.max(1,Number(d.campos.nivel)||1) : null} />
          </ArvoreSistema>}
        </div>}
        {secao === 'equipamentos' && <div className="ficha-blocos space-y-4" data-secao="equipamentos">
          <div className="ficha-acervo ficha-acervo-inventario" data-bloco="inventario"><InventarioFicha {...propsInv} passarItem={passarItem} /></div>
          {listasDe('equipamentos').length > 0 && <details className={card} data-bloco="notas"><summary className="cursor-pointer font-semibold">Anotações complementares do inventário</summary><section className="mt-3 grid gap-4">{listasDe('equipamentos').map(l => lista(l))}</section></details>}
        </div>}
        {secao === 'anotacoes' && <div className="ficha-blocos space-y-4" data-secao="anotacoes">
          {s.id === 'dnd5e-srd' ? <section className="dnd-diario" aria-label="Páginas do diário" data-bloco="textos">
            <header className="dnd-diario-capa"><span aria-hidden="true">✦</span><div><h3>Memórias do aventureiro</h3><p>Registre conhecimentos, histórias e lembranças da jornada.</p></div><span aria-hidden="true">✦</span></header>
            {listasDe('anotacoes').map((l,i) => <label key={l.id} className="dnd-diario-pagina">
              <span className="dnd-diario-capitulo">Capítulo {String(i+1).padStart(2,'0')}</span>
              <span className="dnd-diario-titulo">{l.nome}</span>
              <textarea rows={/hist.ria|anota/i.test(l.nome)?10:6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e=>set('listas',{...d.listas,[l.id]:e.target.value})} placeholder={/profici|idioma/i.test(l.nome)?'Registre armas, armaduras, ferramentas e idiomas…':'Escreva as memórias da sua jornada…'} className="dnd-diario-texto"/>
              <span className="dnd-diario-rodape"><span aria-hidden="true">◇ ─ ◇</span><span>{(d.listas[l.id]??'').length.toLocaleString('pt-BR')} / 20.000</span></span>
            </label>)}
          </section> : <section className="grid gap-4 empty:hidden" data-bloco="textos">{listasDe('anotacoes').map(l => lista(l))}</section>}
          <div data-bloco="tabelas" className="empty:hidden"><TabelasDoSistema s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} rolarNaCampanha={rolarNaCampanha} /></div>
          <div data-bloco="regras" className="empty:hidden"><RegrasDoSistema s={s} /></div>
          {s.autor && <section className={card + ' text-sm'} data-bloco="autor"><p>✍️ <strong className="text-(--a-ed9cd8)">{s.nome}</strong> é um sistema autoral criado por <strong className="text-(--a-e4d3ff)">{s.autor}</strong>.</p></section>}
          {(s.observacoes?.length || s.creditos) && <section className={card + ' text-xs text-(--a-bfb2cf)'} data-bloco="creditos">
            {s.observacoes?.map(o => <p key={o} className="mb-2 flex gap-2"><Info size={14} className="mt-0.5 shrink-0" /> {o}</p>)}
            {s.creditos && <p className="mt-2 border-t border-(--a-3d3152) pt-2 text-[11px] leading-relaxed text-(--a-9d8db0)">{s.creditos}</p>}
          </section>}
        </div>}
        {proxima && <button type="button" onClick={() => ir(proxima.id)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-(--a-62527e) bg-(--s-171325)/80 p-3 text-left text-sm transition hover:border-(--a-b99bff) hover:bg-(--s-201a32)">
          <span className="text-xl" aria-hidden="true">{proxima.icone}</span><span className="min-w-0 flex-1"><span className="block text-xs text-(--a-a99bbb)">Próxima parte</span><span className="block font-semibold">{proxima.nome}</span></span><span aria-hidden="true">→</span></button>}
      </div>
    </div>
  </div>
}

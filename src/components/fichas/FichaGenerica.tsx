'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Dice5, Info } from 'lucide-react'
import { calcular, opcaoEscolhida } from '@/lib/sistemas/calculo'
import { alvosDeBonus } from '@/lib/sistemas/inventario'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { montarRolagem, rolarExpressao } from '@/lib/dice'
import { enviarImagemNuvem, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import GuiaSistema from '@/components/sistemas/GuiaSistema'
import RolagemCentral, { type RolagemCentralHandle } from '@/components/dados/RolagemCentral'
import { InventarioFicha, PoderesFicha } from './Inventario'
import JanelaDescanso from './Descanso'
import type { Item } from '@/lib/sistemas/inventario'
import ArvoreHabilidades from './Arvore'
import ArvoreDndOficial from './ArvoreDndOficial'
import ProgressaoDnd2024 from './ProgressaoDnd2024'
import { MARCOS_DND_2024 } from '@/lib/sistemas/dnd2024Marcos'
import { progressoDaFichaDnd } from '@/lib/sistemas/dnd2024Ficha'
import type { ModoProgressao } from '@/lib/sistemas/modoProgressao'
import Progressao from './Progressao'
import BarraRecurso, { corDoRecurso, MiniBarra } from './BarraRecurso'
import { GUIAS } from '@/lib/sistemas/guias'
import { expressaoParada, leituraBlades, leituraD100 } from '@/lib/sistemas/combate'
import TesteAssimilacao from './TesteAssimilacao'
import MagiasDnd2024 from './MagiasDnd2024'
import MagiasDnd2014 from './MagiasDnd2014'
import MagiasEspecieDnd2024 from './MagiasEspecieDnd2024'
import MagiasOrigemDnd2024 from './MagiasOrigemDnd2024'
import TalentosOrigemDnd2024 from './TalentosOrigemDnd2024'
import MulticlasseDnd2024 from './MulticlasseDnd2024'
import MulticlasseDnd2014 from './MulticlasseDnd2014'
import ExcecaoModo from './ExcecaoModo'
import ConferenciaFicha from './ConferenciaFicha'
import GuiaAntecedenteDnd from './GuiaAntecedenteDnd'
import GuiaMagiaHumanoDnd2024 from './GuiaMagiaHumanoDnd2024'
import ResumoEscolhasDnd2024 from './ResumoEscolhasDnd2024'
import ProntidaoDnd from './ProntidaoDnd'
import TracosEspecieDnd2024 from './TracosEspecieDnd2024'
import { idDe } from '@/lib/sistemas/dnd2024Classes'
import { fontePermitida, FONTE_PHB, FONTE_SRD, FONTE_LEGADO_2014 } from '@/lib/sistemas/dnd2024Fontes'
import { lerLivrosDnd, type LivroBaseDnd } from '@/lib/sistemas/dndLivros'
import { esquemaFichaPorLivro } from '@/lib/sistemas/dnd2014Criacao'
import LivrosPersonagemDnd from './LivrosPersonagemDnd'
import GuiaCriacaoLegadaDnd from './GuiaCriacaoLegadaDnd'
import { lerArvore, sincronizarPoderes } from '@/lib/sistemas/arvore'
import { lerPoderes } from '@/lib/sistemas/inventario'

const card = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32) p-4 sm:p-5'
const input = 'w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white disabled:opacity-70'
const sinal = (n: number | null | undefined) => n === null || n === undefined ? '—' : n >= 0 ? '+' + n : String(n)

/** Ficha que se monta sozinha a partir do modelo do sistema. */
export default function FichaGenerica({ sistema: sistemaOriginal, dados: d, onChange, somenteLeitura = false, modoProgressao = 'hibrido', podeEditarArvore = true, excecaoModo, fontesDnd = null, livroBaseCampanha = null, edicaoDefinidaPeloMestre = false, rolarNaCampanha, passarItem }: {
  sistema: Sistema; dados: DadosFicha; onChange: (d: DadosFicha) => void; somenteLeitura?: boolean; modoProgressao?: ModoProgressao; podeEditarArvore?: boolean
  /** Mestre de campanha de D&D: troca o modo só desta ficha (exceção). */
  excecaoModo?: { campanha: ModoProgressao; atual: ModoProgressao | null; mudar: (m: ModoProgressao | null) => void | Promise<void> }
  /** D&D em campanha: fontes que o mestre liberou (null = todas: ficha avulsa ou mestre). */
  fontesDnd?: Set<string> | null
  /** Edição obrigatória do Livro do Jogador definida pelo mestre da campanha. */
  livroBaseCampanha?: LivroBaseDnd | null
  /** Distingue campanha antiga com padrão 2024 de campanha que habilitou explicitamente o PHB completo. */
  edicaoDefinidaPeloMestre?: boolean
  /** Se a ficha é de campanha: rola no servidor e publica no chat da mesa. */
  rolarNaCampanha?: (expressao: string, rotulo: string, extra?: { estilo: 'assimilacao'; manter?: number; todos?: boolean }) => Promise<{ resultados: number[]; total: number } | null>
  /** Ficha de campanha: passar um item para outro personagem. */
  passarItem?: (it: Item, tem: number) => void
}) {
  const edicaoDnd = livroBaseCampanha ?? lerLivrosDnd(d.dndLivros).base
  const legado2014 = sistemaOriginal.id === 'dnd5e-srd' && edicaoDnd === 'phb2014'
  const s = useMemo(() => esquemaFichaPorLivro(sistemaOriginal, d, livroBaseCampanha),
    [sistemaOriginal, d.dndLivros, livroBaseCampanha])
  const efeitosDnd = modoProgressao !== 'manual'
  const fontesFicha = useMemo(() => {
    if (s.id !== 'dnd5e-srd' || !d.dndLivros) return fontesDnd // fichas antigas preservam suas seleções
    const escolhido = lerLivrosDnd(d.dndLivros)
    const lista = [FONTE_SRD, escolhido.base === 'phb2024' ? FONTE_PHB : FONTE_LEGADO_2014,
      ...escolhido.suplementos]
    return new Set(lista.filter(id => id === FONTE_SRD || !fontesDnd || fontesDnd.has(id) ||
      (edicaoDefinidaPeloMestre && id === (escolhido.base === 'phb2024' ? FONTE_PHB : FONTE_LEGADO_2014))))
  }, [s.id, d.dndLivros, fontesDnd, edicaoDefinidaPeloMestre])
  const c = useMemo(() => calcular(s, d, { efeitosDnd }), [s, d, efeitosDnd])
  const central = useRef<RolagemCentralHandle>(null)
  const naMesa = rolarNaCampanha ? 'Também foi para o chat da mesa' : null
  const regra = s.rolagem === 'personalizada' ? s.regraRolagem : undefined
  const d20 = !regra && (s.rolagem ? s.rolagem === 'd20' : s.dados.startsWith('d20'))
  const d100 = s.id === 'brp' || s.rolagem === 'd100'
  const parada = s.rolagem === 'parada' ? s.parada?.lados ?? 20 : null
  /** Parada: quantos dados a perícia rola (o maior dos atributos dela). */
  const dadosDe = (atributo?: string) => Math.max(0, ...(atributo ? atributo.split('/') : []).map(a => Number(c.vars[a]) || 0))
  const set = <K extends keyof DadosFicha>(k: K, v: DadosFicha[K]) => {
    const novo = { ...d, [k]: v }
    // Escolheu a classe (ou mudou o nível) e a vida/mana ganhou um máximo agora? Começa cheia, se estava zerada.
    if (k === 'campos') {
      const depois = calcular(s, novo, { efeitosDnd })
      for (const r of s.recursos) {
        if (r.contador) continue
        const antes = c.recursosMax[r.id], max = depois.recursosMax[r.id]
        if (!(antes && antes > 0) && max && max > 0 && !(Number(novo.recursos[r.id]?.atual) > 0)) novo.recursos = { ...novo.recursos, [r.id]: { ...novo.recursos[r.id], atual: max } }
      }
    }
    if (s.id === 'dnd5e-srd' && k === 'campos' && novo.arvore !== undefined) {
      novo.poderes = sincronizarPoderes(lerPoderes(novo.poderes), lerArvore(novo.arvore), novo)
    }
    onChange(novo)
  }

  async function rolar(nome: string, bonus: number | null, dados?: number, resistencia = false) {
    const b = bonus ?? 0
    if (parada) {
      const n = Math.max(0, dados ?? 1), expr = expressaoParada(parada, n, b)
      const r = rolarNaCampanha ? await rolarNaCampanha(expr, nome) : rolarExpressao(expr)
      if (!r) return
      const leitura = s.parada?.leitura === 'blades' ? leituraBlades(n, r.resultados, resistencia) : null
      central.current?.mostrar({ rotulo: `${nome} (${n > 0 ? n + 'd' + parada + ', o maior' : '2d' + parada + ', o menor'}${b ? ' ' + sinal(b) : ''})`, expressao: expr, resultados: r.resultados, total: r.total,
        nota: [leitura, naMesa].filter(Boolean).join(' · ') || null })
      return
    }
    if (regra) {
      // Regra do sistema autoral: VALOR vira o número em que a pessoa tocou.
      const expr = montarRolagem(regra.formula, b)
      const r = rolarNaCampanha ? await rolarNaCampanha(expr, `${nome} (${regra.nome})`) : rolarExpressao(expr)
      if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expr); return }
      central.current?.mostrar({ rotulo: `${nome} · ${regra.nome}`, expressao: expr, resultados: r.resultados, total: r.total, nota: /s\d/.test(expr) ? `${r.total} sucesso${r.total === 1 ? '' : 's'}` : naMesa })
      return
    }
    if (d100) {
      const alvo = bonus ?? 0
      const r = rolarNaCampanha ? await rolarNaCampanha('1d100', nome + ' (' + alvo + '%)') : rolarExpressao('1d100')
      if (!r) return
      central.current?.mostrar({ rotulo: `${nome} (${alvo}%)`, expressao: '1d100', resultados: r.resultados, total: r.total, nota: leituraD100(alvo, r.total) })
      return
    }
    const expr = '1d20' + (b >= 0 ? '+' + b : String(b))
    const r = rolarNaCampanha ? await rolarNaCampanha(expr, nome) : rolarExpressao(expr)
    if (!r) return
    central.current?.mostrar({ rotulo: `${nome} (d20 ${sinal(b)})`, expressao: expr, resultados: r.resultados, total: r.total, nota: naMesa })
  }
  const podeRolar = d20 || d100 || !!regra || !!parada
  /** Rolagem livre (dano, poder, item). Em campanha, vai para o chat da mesa. */
  async function rolarExpr(expressao: string, rotulo: string) {
    const r = rolarNaCampanha ? await rolarNaCampanha(expressao, rotulo) : rolarExpressao(expressao)
    if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expressao); return }
    central.current?.mostrar({ rotulo, expressao, resultados: r.resultados, total: r.total, nota: naMesa })
  }
  /** Rola e devolve o total (para a cura do descanso curto). */
  async function rolarTotal(expressao: string, rotulo: string): Promise<number | null> {
    const r = rolarNaCampanha ? await rolarNaCampanha(expressao, rotulo) : rolarExpressao(expressao)
    if (!r) { if (!rolarNaCampanha) toast.error('Rolagem inválida: ' + expressao); return null }
    central.current?.mostrar({ rotulo, expressao, resultados: r.resultados, total: r.total, nota: naMesa })
    return r.total
  }
  const [descansando, setDescansando] = useState(false)
  const propsInv = { s, d, c, onChange, somenteLeitura, rolar: rolarExpr, abrirDescanso: somenteLeitura || legado2014 ? undefined : () => setDescansando(true) }

  const grupos = new Map<string, NonNullable<Sistema['pericias']>['lista']>()
  for (const p of s.pericias?.lista ?? []) grupos.set(p.grupo ?? '', [...(grupos.get(p.grupo ?? '') ?? []), p])

  const secaoDeLista = (id: string) => /inventario|equipamento|armas|protecao|ataques|dinheiro/.test(id) ? 'equipamentos'
    : /habilidade|tecnica|talento|magia|poder|facanha|transforma|rituais|tracos/.test(id) ? 'habilidades' : 'anotacoes'
  const listasDe = (sec: string) => s.listas.filter(l => secaoDeLista(l.id) === sec)
  // Nomes das partes (sistemas autorais podem chamar de outro jeito, v0.33.8).
  const tituloAtr = s.tituloAtributos?.trim() || 'Atributos', tituloPer = s.pericias?.titulo?.trim() || 'Perícias'
  const SECOES = ([
    { id: 'principal', icone: '❤️', nome: 'Principal', sub: 'Identidade e recursos', ajuda: 'Nome, imagem e os dados básicos do personagem. Mais abaixo ficam os valores calculados e as barras de vida e recursos (use − e +).', ok: true },
    { id: 'atributos', icone: '✨', nome: s.pericias ? (s.atributos.length ? `${tituloAtr} e ${tituloPer[0].toLowerCase()}${tituloPer.slice(1)}` : tituloPer) : tituloAtr, sub: 'Testes e rolagens', ajuda: s.atributos.length ? (s.formulaModificador ? 'Digite os valores dos atributos; os bônus se calculam sozinhos. Toque no bônus de um teste ou perícia para rolar.' : s.rolagem === 'assimilacao' ? 'Digite os pontos de cada Instinto. Use o Teste logo abaixo para rolar os dados de símbolos.' : s.rolagem === 'parada' || s.id === 'ordem-paranormal' ? 'Digite os pontos de cada atributo. Toque num teste ou perícia para rolar a parada de dados.' : 'Digite o valor de cada atributo (ele já é o bônus). Toque num teste ou perícia para rolar.') : s.pericias?.modo === 'valor' ? 'Digite a porcentagem de cada perícia e toque nela para rolar.' : 'Escolha o grau de cada uma e toque no valor para rolar.', ok: s.atributos.length > 0 || !!s.pericias },
    { id: 'habilidades', icone: '🌌', nome: s.id === 'dnd5e-srd' ? 'Poderes e habilidades extras' : 'Poderes e habilidades', sub: s.id === 'dnd5e-srd' ? 'Novos poderes e magias escolhidas' : 'Magias, técnicas, usos e custos', ajuda: s.id === 'dnd5e-srd' ? 'Aqui ficam poderes personalizados, opções adicionais e escolhas de magias. Os benefícios naturais de classe, espécie e antecedente aparecem na Árvore de habilidades, sem duplicação.' : 'Adicione poderes com custo, usos e dano. Toque no dado do poder para rolar; os usos gastos voltam no descanso.', ok: true },
    { id: 'arvore', icone: '🌠', nome: 'Árvore de habilidades', sub: s.id === 'dnd5e-srd' ? 'Hexágonos oficiais + extras do mestre' : 'Hexágonos, pontos e caminhos', ajuda: s.id === 'dnd5e-srd' ? 'A árvore gera automaticamente hexágonos de classe, espécie/raça, origem e antecedente conforme o livro e o nível. Logo abaixo o mestre cria hexágonos extras sem alterar nem duplicar os benefícios naturais.' : 'Gaste pontos para liberar habilidades. Uma habilidade só abre quando a anterior do caminho já foi liberada.', ok: true },
    { id: 'equipamentos', icone: '🎒', nome: 'Inventário', sub: 'Itens, carga e moedas', ajuda: 'Adicione itens com foto ou desenho, separados em abas por tipo. Itens equipados contam nos bônus; os mágicos ficam numa ala própria.', ok: true },
    { id: 'anotacoes', icone: '📜', nome: 'Anotações e regras', sub: 'História, lembretes, créditos', ajuda: 'Espaço livre para a história do personagem, aliados, segredos e lembretes. Embaixo ficam as regras e os créditos do sistema.', ok: true },
    { id: 'guia', icone: '📖', nome: 'Guia de criação', sub: 'Passo a passo deste sistema', ajuda: 'Siga os passos para criar o personagem do jeito que as regras pedem.', ok: !!GUIAS[s.id] },
  ] as const).filter(x => x.ok)
  const [secao, setSecao] = useState<string>('principal')
  const ir = (id: string) => { setSecao(id); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const menu = useRef<HTMLDivElement>(null)
  // No celular, o botão da seção escolhida fica visível na fileira.
  useEffect(() => { menu.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }) }, [secao])
  const iAtual = SECOES.findIndex(x => x.id === secao)
  const atual = SECOES[iAtual], proxima = SECOES[iAtual + 1]
  // PV primeiro (mesmo com máximo digitado); senão, o primeiro recurso com máximo.
  const recursoPrincipal = s.recursos.find(r => /^(pv|vida)$/.test(r.id)) ?? s.recursos.find(r => c.recursosMax[r.id])
  const defesa = s.derivados.find(x => /^(defesa|ca)$/.test(x.id))

  return <div>
    <RolagemCentral ref={central} />
    {descansando && !legado2014 && <JanelaDescanso s={s} d={d} onChange={onChange} rolarTotal={rolarTotal} fechar={() => setDescansando(false)} />}
    <div className="sticky top-[57px] z-10 -mx-3 mb-4 border-b border-(--a-373251) bg-(--s-100d1c)/95 px-3 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4" aria-label="Resumo do personagem">
      <div className="flex items-center gap-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Vida e recursos (role para o lado)">
      {recursoPrincipal && [recursoPrincipal, ...s.recursos.filter(r => r !== recursoPrincipal && (c.recursosMax[r.id] || d.recursos[r.id]?.max))].slice(0, 3).map(r => {
        const calc = !!r.formula || r.maxFixo !== undefined
        const max = c.recursosMax[r.id] ?? (calc ? null : (d.recursos[r.id]?.max ?? null)) ?? (/^(pv|vida|hp)$/.test(r.id) ? (c.derivados.pv_max ?? c.derivados.pv_sugerido ?? null) : null)
        return <MiniBarra key={r.id} nome={/^pv$/.test(r.id) ? 'PV' : r.nome.split(' (')[0]} cor={corDoRecurso(r.id, r.nome)} atual={Number(d.recursos[r.id]?.atual ?? 0) || 0} max={max} />
      })}
      {defesa && <span className="shrink-0 whitespace-nowrap rounded-lg border border-(--a-62527e) bg-(--s-201a32) px-3 py-1 text-sm" title={defesa.nome}>🛡️ {/^classe de armadura/i.test(defesa.nome) ? 'CA' : defesa.nome.split(' (')[0]} <strong>{c.derivados[defesa.id] ?? '—'}</strong></span>}
      </div>
    </div>
    <div className="lg:flex lg:gap-6">
      <nav aria-label="Seções da ficha" className="mb-4 lg:mb-0 lg:w-60 lg:shrink-0">
        <div ref={menu} className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-[120px] lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-(--a-55456e) lg:bg-(--s-201a32) lg:p-3">
          <p className="hidden px-2 pb-1 text-xs font-bold uppercase tracking-widest text-(--a-ed9cd8) lg:block">🌙 Menu da ficha</p>
          {SECOES.map(x => <button key={x.id} type="button" onClick={() => ir(x.id)} aria-current={secao === x.id ? 'page' : undefined}
            className={'shrink-0 rounded-xl px-3 py-2 text-left text-sm transition lg:w-full ' + (secao === x.id ? 'bg-(--a-5b4380) text-white' : 'bg-(--s-201a32) text-(--a-d6c8e8) hover:bg-(--s-2b2140) lg:bg-transparent')}>
            <span className="whitespace-nowrap">{x.icone} {x.nome}</span>
            <span className="hidden text-xs text-(--a-c4b6d4) lg:block">{x.sub}</span>
          </button>)}
        </div>
      </nav>
      <div className="min-w-0 flex-1 space-y-4">
        {atual && <p className="flex gap-2 rounded-xl border border-(--a-3d3152) bg-(--s-171325)/90 px-3 py-2 text-xs text-(--a-cfc0df)"><span aria-hidden="true">{atual.icone}</span><span><strong className="text-(--a-e4d3ff)">{atual.nome}:</strong> {atual.ajuda}</span></p>}
        {secao === 'principal' && <>
    {s.id !== 'livre' && s.tipo !== 'autoral' && !legado2014 && <ConferenciaFicha s={s} d={d} c={c} efeitos={efeitosDnd} ir={ir} />}
    {s.id === 'dnd5e-srd' && <LivrosPersonagemDnd d={d} onChange={onChange} somenteLeitura={somenteLeitura}
      baseCampanha={livroBaseCampanha} fontesCampanha={fontesDnd} />}
    <section className={card}>
      <div className="flex items-start gap-4">
        <Retrato url={d.retrato} nome={d.nome} somenteLeitura={somenteLeitura} onChange={u => onChange({ ...d, retrato: u ?? undefined })} />
        <label className="block min-w-0 flex-1 text-sm font-semibold">Nome do personagem
          <input value={d.nome} maxLength={90} disabled={somenteLeitura} onChange={e => set('nome', e.target.value)} className={input + ' mt-1 text-lg font-bold'} placeholder="Ex.: Lyra Nyx" /></label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 lg:grid-cols-3">
        {s.campos.map(f => f.tipo === 'escolha' ? <div key={f.id} className="col-span-2 sm:col-span-1"><CampoEscolha s={s} f={f} valor={d.campos[f.id]} somenteLeitura={somenteLeitura} fontes={s.id === 'dnd5e-srd' ? fontesFicha : null} mudar={v => legado2014 && (f.id === 'especie' || f.id === 'classe')
          ? onChange({ ...d, campos: { ...d.campos, [f.id]: v,
              ...(f.id === 'especie' ? { subraca2014: '' } : {}) },
              ...(f.id === 'especie' ? { dnd2014AtributosExtras: [] } : {}),
              ...(f.id === 'classe' ? { dnd2014PericiasClasse: [], dnd2014Subclasse: undefined } : {}) })
          : set('campos', { ...d.campos, [f.id]: v })} /></div> : <label key={f.id} className={'flex flex-col justify-end text-sm text-(--a-d6c8e8) ' + (f.tipo === 'area' ? 'col-span-2 lg:col-span-3' : f.tipo === 'numero' ? '' : 'col-span-2 sm:col-span-1')}>{f.nome}
          {f.tipo === 'area'
            ? <textarea rows={3} value={String(d.campos[f.id] ?? '')} disabled={somenteLeitura} onChange={e => set('campos', { ...d.campos, [f.id]: e.target.value.slice(0, 4000) })} className={input + ' mt-1'} />
            : <input type={f.tipo === 'numero' ? 'number' : 'text'} value={d.campos[f.id] ?? ''} disabled={somenteLeitura} maxLength={120}
              onChange={e => set('campos', { ...d.campos, [f.id]: f.tipo === 'numero' ? Number(e.target.value) : e.target.value })} className={input + ' mt-1'} />}
        </label>)}
      </div>
    </section>
    {s.id === 'dnd5e-srd' && <ProntidaoDnd d={d} edicao={edicaoDnd} irPara={ir} />}
    {s.id === 'dnd5e-srd' && !legado2014 && <ResumoEscolhasDnd2024 d={d} irPara={ir} modoManual={modoProgressao === 'manual'} />}
    {legado2014 && <GuiaCriacaoLegadaDnd d={d} onChange={onChange} somenteLeitura={somenteLeitura} />}
    <Progressao s={s} d={d} onChange={onChange} somenteLeitura={somenteLeitura} pontosAtributo={Number(c.vars.prog_atributos) || 0} irPara={ir} />
    {c.limites.some(l => l.excedido) && <section role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14] p-4 text-sm text-[#f6dca8]">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Acima do limite das regras</p>
      <ul className="mt-2 list-disc pl-5">{c.limites.filter(l => l.excedido).map(l => <li key={l.nome}>{l.nome}: {l.uso} de {l.max}</li>)}</ul>
    </section>}
    {(s.derivados.length > 0 || s.recursos.length > 0) && <section className={card}>
      <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="flex-1 font-bold text-(--a-ed9cd8)">Valores e recursos</h2>
        {!somenteLeitura && !legado2014 && s.recursos.length > 0 && <button type="button" onClick={() => setDescansando(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a23a]/70 px-3 py-1.5 text-sm text-amber-100 hover:bg-[#3a2a14]">🌙 Descansar</button>}</div>
      {s.derivados.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {s.derivados.map(x => <div key={x.id} className="rounded-xl bg-(--s-171325) p-3" title={x.dica}>
          <p className="text-xs text-(--a-c4b6d4)">{x.nome}</p><p className="text-2xl font-black">{c.derivados[x.id] ?? '—'}</p>
          {x.dica && <p className="text-[10px] text-(--a-a998bd)">{x.dica}</p>}</div>)}
      </div>}
      {s.recursos.length > 0 && <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {s.recursos.filter(r => !(r.ocultarSemMax && !(c.recursosMax[r.id] ?? 0))).map(r => {
          const calc = !!r.formula || r.maxFixo !== undefined
          const max = c.recursosMax[r.id] ?? (calc ? null : (d.recursos[r.id]?.max ?? null)) ?? (/^(pv|vida|hp)$/.test(r.id) ? (c.derivados.pv_max ?? c.derivados.pv_sugerido ?? null) : null)
          const atual = Number(d.recursos[r.id]?.atual ?? 0) || 0
          return <BarraRecurso key={r.id} nome={r.nome} cor={corDoRecurso(r.id, r.nome)} atual={atual} max={max} maxEditavel={!calc} somenteLeitura={somenteLeitura} contador={!!r.contador}
            mudar={v => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual: v } })}
            mudarMax={v => set('recursos', { ...d.recursos, [r.id]: { ...d.recursos[r.id], atual, max: v } })} />
        })}
      </div>}
    </section>}
        </>}
        {secao === 'atributos' && <>
    {legado2014 && <GuiaCriacaoLegadaDnd d={d} onChange={onChange} somenteLeitura={somenteLeitura} />}
    {s.id === 'dnd5e-srd' && !legado2014 && <GuiaAntecedenteDnd key={idDe(d.campos.antecedente)} d={d} onChange={onChange} somenteLeitura={somenteLeitura} fontes={fontesFicha} />}
    {c.limites.some(l => l.excedido) && <section role="alert" className="rounded-2xl border border-[#c98b3a] bg-[#3a2a14] p-4 text-sm text-[#f6dca8]">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> Acima do limite das regras</p>
      <ul className="mt-2 list-disc pl-5">{c.limites.filter(l => l.excedido).map(l => <li key={l.nome}>{l.nome}: {l.uso} de {l.max}</li>)}</ul>
    </section>}
    {s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-3 font-bold text-(--a-ed9cd8)">{tituloAtr}</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
        {s.atributos.map(a => <div key={a.id} className="rounded-xl border border-(--a-5e4b78) bg-(--s-171325) p-2 text-center sm:p-3">
          <p className="text-xs uppercase tracking-wider text-(--a-c4b6d4)" title={a.nome}>{a.id}</p>
          <input type="number" aria-label={a.nome} min={a.min} max={a.max} value={legado2014 && d.dnd2014AtributosBase ? c.vars[a.id] ?? a.padrao : d.atributos[a.id] ?? a.padrao} disabled={somenteLeitura || (legado2014 && !!d.dnd2014AtributosBase)}
            onChange={e => set('atributos', { ...d.atributos, [a.id]: Math.max(a.min, Math.min(a.max, Number(e.target.value) || 0)) })}
            className="mt-1 w-full bg-transparent text-center text-2xl font-black text-white outline-none" />
          {legado2014 && d.dnd2014AtributosBase && <p className="mt-1 text-[10px] text-(--a-a998bd)">Total SRD 5.1 · editar a base no guia acima</p>}
          {s.formulaModificador && <p className="text-sm text-(--a-d4baff)">{sinal(c.mods[a.id])}</p>}
          <p className="mt-1 truncate text-[10px] text-(--a-a998bd)">{a.nome}</p>
        </div>)}
      </div>
    </section>}
    {s.rolagem === 'assimilacao' && <TesteAssimilacao s={s} d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolarNaCampanha={rolarNaCampanha} />}
    {(d20 || parada) && s.atributos.length > 0 && <section className={card}>
      <h2 className="mb-2 flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Dice5 size={18} /> Teste de atributo</h2>
      {parada && <p className="mb-2 text-xs text-(--a-a998bd)">Rola um d{parada} para cada ponto do atributo e fica com o maior. Com 0, rola dois e fica com o menor.</p>}
      <div className="flex flex-wrap gap-2">{s.atributos.map(a => <button key={a.id} type="button" onClick={() => parada ? rolar(a.nome, 0, Number(c.vars[a.id]) || 0) : rolar(a.nome, s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}
        className="rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm hover:bg-(--s-34294f)">{a.id} {parada ? `(${Math.max(0, Number(c.vars[a.id]) || 0) || 2}d${parada})` : sinal(s.formulaModificador ? c.mods[a.id] : c.vars[a.id])}</button>)}</div>
    </section>}
    {parada && !!s.resistencias?.length && <section className={card}>
      <h2 className="mb-1 flex items-center gap-2 font-bold text-(--a-ed9cd8)"><Dice5 size={18} /> Resistência</h2>
      <p className="mb-2 text-xs text-(--a-a998bd)">Para evitar ou reduzir uma consequência: rola um d{parada} por ponto e o estresse custa 6 − o maior dado.</p>
      <div className="flex flex-wrap gap-2">{s.resistencias.map(id => { const x = s.derivados.find(y => y.id === id); if (!x) return null; const n = Number(c.derivados[id]) || 0
        return <button key={id} type="button" disabled={somenteLeitura} onClick={() => rolar(x.nome.split(' (')[0], 0, n, true)} className="rounded-lg border border-(--a-5e4b78) px-3 py-2 text-sm hover:bg-(--s-34294f)">{x.nome.split(' (')[0]} ({n || 2}d{parada})</button> })}</div>
    </section>}
    {s.pericias && <section className={card}>
      <h2 className="mb-1 font-bold text-(--a-ed9cd8)">{s.pericias.titulo ?? 'Perícias'}</h2>
      {podeRolar && <p className="mb-3 text-xs text-(--a-a998bd)">Toque no valor para rolar.{parada && (s.atributos.length ? ' Rola um dado por ponto do atributo da perícia e soma o bônus.' : ' Rola um dado por ponto e fica com o maior (0 pontos: dois dados, o menor).')}{regra && (s.tipo === 'autoral' ? <> Regra: <strong className="text-(--a-e4d3ff)">{regra.nome}</strong> (<span className="font-mono">{regra.formula}</span>, VALOR = o número tocado).</> : <> Rola <strong className="text-(--a-e4d3ff)">{regra.nome}</strong> + o valor.</>)}</p>}
      {[...grupos].map(([g, lista]) => <div key={g} className="mb-4">
        {g && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">{g}</h3>}
        <div className="grid gap-2 sm:grid-cols-2">
          {lista.map(p => <div key={p.id} className="flex items-center gap-2 rounded-lg bg-(--s-171325) px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{p.nome}{p.atributo && <span className="ml-1 text-[10px] text-(--a-a998bd)">({p.atributo})</span>}
              {c.automaticos?.[p.id] && <span className="block truncate text-[10px] text-emerald-300" title="Vem da regra: não precisa marcar">✔ {c.automaticos[p.id]}</span>}</span>
            {s.pericias!.modo === 'valor'
              ? <input type="number" aria-label={p.nome} min={0} max={200} value={d.pericias[p.id] ?? 0} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: Number(e.target.value) || 0 })} className={input + ' !w-16 shrink-0 text-center'} />
              : <select aria-label={'Treino em ' + p.nome} value={String(d.pericias[p.id] ?? '')} disabled={somenteLeitura} onChange={e => set('pericias', { ...d.pericias, [p.id]: e.target.value })} className="max-w-[9.5rem] rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1 text-xs text-white">
                {s.pericias!.treinos!.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>}
            {s.rolagem !== 'assimilacao' && <button type="button" disabled={!podeRolar} onClick={() => p.atributo || !parada ? rolar(p.nome, c.pericias[p.id], dadosDe(p.atributo)) : rolar(p.nome, 0, Number(c.pericias[p.id]) || 0)} aria-label={'Rolar ' + p.nome} title={parada && p.atributo ? `${dadosDe(p.atributo) || 2}d${parada} ${dadosDe(p.atributo) ? '(o maior)' : '(o menor)'} ${sinal(c.pericias[p.id])}` : undefined}
              className="w-14 shrink-0 rounded-lg bg-(--s-34294f) py-1 text-center font-bold tabular-nums hover:bg-(--s-4b3a6e) disabled:cursor-default disabled:hover:bg-(--s-34294f)">
              {s.pericias!.modo === 'valor' ? (c.pericias[p.id] ?? 0) + '%' : parada && !p.atributo ? (Number(c.pericias[p.id]) || 0) + 'd' + parada : sinal(c.pericias[p.id])}</button>}
          </div>)}
        </div>
      </div>)}
    </section>}
        </>}
        {secao === 'arvore' && <div className="space-y-4">
          {s.id === 'dnd5e-srd' && <ArvoreDndOficial d={d} edicao={edicaoDnd} fontes={fontesFicha} />}
          {s.id === 'dnd5e-srd' && !legado2014 && <details className={card}>
            <summary className="cursor-pointer font-semibold text-(--a-ed9cd8)">🧬 Habilidades raciais com usos e recargas</summary>
            <div className="mt-3"><TracosEspecieDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x, r) => void rolarExpr(x, r)} irPara={ir} /></div>
          </details>}
          {s.id === 'dnd5e-srd' && !legado2014 && <details className={card}>
            <summary className="cursor-pointer font-semibold text-(--a-ed9cd8)">✨ Magias inatas da espécie e do antecedente</summary>
            <p className="my-2 text-xs text-(--a-c4b6d4)">Magias naturalmente recebidas. Use e acompanhe aqui os recursos, sem confundir com magias preparadas ou aprendidas.</p>
            <div className="space-y-3">
              <MagiasEspecieDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x,r) => void rolarExpr(x,r)} />
              <MagiasOrigemDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x,r) => void rolarExpr(x,r)} />
              <MagiasOrigemDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x,r) => void rolarExpr(x,r)} origemHumana />
            </div>
          </details>}
          {excecaoModo && <ExcecaoModo {...excecaoModo} />}
          {legado2014 && <MulticlasseDnd2014 d={d} onChange={onChange} somenteLeitura={somenteLeitura} />}
          {s.id === 'dnd5e-srd' && !legado2014 && <MulticlasseDnd2024 d={d} onChange={nova => onChange(nova.arvore === undefined ? nova : {
            ...nova, poderes: sincronizarPoderes(lerPoderes(nova.poderes), lerArvore(nova.arvore), nova),
          })} somenteLeitura={somenteLeitura} />}
          {s.id === 'dnd5e-srd' && !legado2014 && <TalentosOrigemDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} compacto />}
          {s.id === 'dnd5e-srd' && !legado2014 && <GuiaMagiaHumanoDnd2024 key={idDe(d.campos.especie)} d={d} onChange={onChange} somenteLeitura={somenteLeitura} />}
                {s.id === 'dnd5e-srd' && !legado2014 && modoProgressao !== 'manual' && <>
            <ProgressaoDnd2024
              marcos={MARCOS_DND_2024}
              ficha={progressoDaFichaDnd(d)}
              modo={modoProgressao}
              fontes={fontesFicha}
              somenteLeitura={somenteLeitura}
              onEscolha={(marcoId, opcaoId) => {
                const escolhas = { ...d.dndEscolhas }
                if (opcaoId) escolhas[marcoId] = opcaoId
                else delete escolhas[marcoId]
                const nova = { ...d, dndEscolhas: escolhas }
                // Uma linhagem recém-confirmada pode conceder recursos que antes tinham máximo 0.
                // Mesmo critério já usado ao escolher classe/nível na ficha: não reabastece usos ativos.
                const depois = calcular(s, nova, { efeitosDnd })
                for (const r of s.recursos) {
                  if (r.contador) continue
                  const anterior = c.recursosMax[r.id], max = depois.recursosMax[r.id]
                  if (!(anterior && anterior > 0) && max && max > 0 && !(Number(nova.recursos[r.id]?.atual) > 0)) {
                    nova.recursos = { ...nova.recursos, [r.id]: { ...nova.recursos[r.id], atual: max } }
                  }
                }
                onChange(nova.arvore === undefined ? nova : {
                  ...nova, poderes: sincronizarPoderes(lerPoderes(nova.poderes), lerArvore(nova.arvore), nova),
                })
              }}
            />
          </>}
          <>
            {s.id === 'dnd5e-srd' && <p className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3 text-xs text-(--a-c4b6d4)">🌠 <strong>Hexágonos adicionais do mestre:</strong> habilidades caseiras, talentos extras e recompensas especiais. Esta parte continua editável pelo mestre e não substitui os hexágonos oficiais acima.</p>}
            <ArvoreHabilidades s={s} d={d} onChange={onChange}
              somenteLeitura={somenteLeitura || (s.id === 'dnd5e-srd' && !podeEditarArvore)}
              rolar={(x, r) => void rolarExpr(x, r)} extra={Number(c.vars.prog_arvore) || 0}
              mestre={podeEditarArvore} nivel={s.campos.some(x => x.id === 'nivel') ? Math.max(1, Number(d.campos.nivel) || 1) : null} />
          </>
        </div>}
        {secao === 'habilidades' && <>
    {s.id === 'dnd5e-srd' && <p className="rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3 text-sm text-(--a-cfc0df)">✨ <strong>Escolhas adicionais:</strong> aqui você registra magias preparadas e poderes que escolher, aprender ou ganhar do mestre. Traços automáticos de raça, classe e antecedente já aparecem na Árvore de habilidades e não precisam ser criados novamente.</p>}

    {s.id === 'dnd5e-srd' && !legado2014 && <MagiasDnd2024 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} semLimites={modoProgressao === 'manual'} ocultarInatas rolar={(x, r) => void rolarExpr(x, r)} />}
    {legado2014 && <MagiasDnd2014 d={d} c={c} onChange={onChange} somenteLeitura={somenteLeitura} rolar={(x,r)=>void rolarExpr(x,r)}/>}
    <PoderesFicha {...propsInv} />
    {listasDe('habilidades').length > 0 && <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">Anotações livres</h3>}
    <section className="grid gap-4">
      {listasDe('habilidades').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-(--a-ed9cd8)">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
        </>}
        {secao === 'equipamentos' && <>
    <InventarioFicha {...propsInv} passarItem={passarItem} edicaoDnd={edicaoDnd} />
    {listasDe('equipamentos').length > 0 && <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-(--a-d3adf0)">Anotações livres</h3>}
    <section className="grid gap-4">
      {listasDe('equipamentos').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-(--a-ed9cd8)">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
        </>}
        {secao === 'anotacoes' && <>
    <section className="grid gap-4">
      {listasDe('anotacoes').map(l => <label key={l.id} className={card + ' block'}>
        <span className="font-bold text-(--a-ed9cd8)">{l.nome}</span>
        <textarea rows={6} value={d.listas[l.id] ?? ''} disabled={somenteLeitura} maxLength={20000} onChange={e => set('listas', { ...d.listas, [l.id]: e.target.value })} className={input + ' mt-2'} />
      </label>)}
    </section>
    {s.autor && <section className={card + ' text-sm'}><p>✍️ <strong className="text-(--a-ed9cd8)">{s.nome}</strong> é um sistema autoral criado por <strong className="text-(--a-e4d3ff)">{s.autor}</strong>.</p></section>}
    {(s.observacoes?.length || s.creditos) && <section className={card + ' text-xs text-(--a-bfb2cf)'}>
      {s.observacoes?.map(o => <p key={o} className="mb-2 flex gap-2"><Info size={14} className="mt-0.5 shrink-0" /> {o}</p>)}
      {s.creditos && <p className="mt-2 border-t border-(--a-3d3152) pt-2 text-[11px] leading-relaxed text-(--a-9d8db0)">{s.creditos}</p>}
    </section>}
        </>}
        {secao === 'guia' && (legado2014 ? <GuiaCriacaoLegadaDnd d={d} onChange={onChange} somenteLeitura={somenteLeitura} /> : <GuiaSistema sistemaId={s.id} dados={d} irPara={ir} />)}
        {proxima && <button type="button" onClick={() => ir(proxima.id)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-(--a-62527e) bg-(--s-171325)/80 p-3 text-left text-sm transition hover:border-(--a-b99bff) hover:bg-(--s-2b2140)">
          <span className="text-xl" aria-hidden="true">{proxima.icone}</span><span className="min-w-0 flex-1"><span className="block text-xs text-(--a-a99bbb)">Próxima parte</span><span className="block font-semibold">{proxima.nome}</span></span><span aria-hidden="true" className="text-(--a-b99bff)">→</span></button>}
      </div>
    </div>
  </div>
}

/** Imagem do personagem: aparece aqui e no cartão da ficha. */
function Retrato({ url, nome, somenteLeitura, onChange }: { url?: string; nome: string; somenteLeitura: boolean; onChange: (u: string | null) => void }) {
  const [enviando, setEnviando] = useState(false)
  const podeEnviar = !somenteLeitura && NUVEM_ATIVA
  async function escolher(f: File) {
    setEnviando(true)
    try { onChange(await enviarImagemNuvem('imagens', f, 900)) } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao enviar a imagem.') } finally { setEnviando(false) }
  }
  return <div className="w-24 shrink-0 text-center sm:w-28">
    <label className={'group relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border-2 border-(--a-62527e) bg-gradient-to-br from-(--s-3b2470) to-(--s-1b1530) text-4xl font-black text-(--a-b99bff) ' + (podeEnviar ? 'cursor-pointer hover:border-(--a-b99bff)' : '')}>
      {url ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }} aria-hidden /> : (nome.trim()[0] ?? '?').toUpperCase()}
      {podeEnviar && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[11px] font-semibold text-white opacity-90 group-hover:opacity-100">{enviando ? 'Enviando…' : url ? '🖼️ Trocar' : '🖼️ Imagem'}</span>}
      {podeEnviar && <input type="file" accept="image/png,image/jpeg,image/webp" disabled={enviando} className="sr-only" aria-label="Imagem do personagem" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void escolher(f) }} />}
    </label>
    {url && podeEnviar && <button type="button" onClick={() => onChange(null)} className="mt-1 text-[11px] text-(--a-c4b6d4) hover:underline">Remover</button>}
  </div>
}

/** Campo de escolha (classe, espécie…): lista de opções com descrição e os bônus que a opção dá, ou um nome digitado fora da lista. */
function CampoEscolha({ s, f, valor, mudar, somenteLeitura, fontes = null }: { s: Sistema; f: Sistema['campos'][number]; valor: unknown; mudar: (v: string) => void; somenteLeitura: boolean; fontes?: Set<string> | null }) {
  const op = opcaoEscolhida(f, valor)
  const nomes = useMemo(() => Object.fromEntries(alvosDeBonus(s).map(a => [a.id, a.nome])), [s])
  const texto = typeof valor === 'string' ? valor : ''
  const [forcarOutro, setForcarOutro] = useState(false)
  const outro = !op && (!!texto || forcarOutro)
  return <div className="block text-sm">
    <label className="block">{f.nome}
      <select value={op ? op.nome : outro ? '__outro' : ''} disabled={somenteLeitura}
        onChange={e => { if (e.target.value === '__outro') { setForcarOutro(true); mudar('') } else { setForcarOutro(false); mudar(e.target.value) } }} className={input + ' mt-1'}>
        <option value="">Escolha…</option>
        {f.opcoes?.filter(o => fontePermitida(o.fonte, fontes) || o.nome === op?.nome).map(o => <option key={o.nome} value={o.nome}>{o.nome}{o.fonte ? ' 📕' : ''}</option>)}
        <option value="__outro">✍️ Outro (fora da lista)</option>
      </select></label>
    {outro && <input value={texto} disabled={somenteLeitura} maxLength={90} onChange={e => mudar(e.target.value)} className={input + ' mt-1.5'} placeholder={`Nome de ${f.nome.toLowerCase()} fora da lista`} autoFocus={forcarOutro} />}
    {op && (op.descricao || op.bonus?.length) && <div className="mt-1.5 rounded-lg bg-(--s-171325) p-2 text-xs text-(--a-d6c8e8)">
      {op.descricao && <p className="whitespace-pre-line">{op.descricao}</p>}
      {!!op.bonus?.length && <p className="mt-1 flex flex-wrap gap-1">{op.bonus.map(b => <span key={b.alvo} className="rounded-full bg-(--s-2f2547) px-2 py-0.5 text-[#c9f5d8]">{b.valor > 0 ? '+' : ''}{b.valor} {nomes[b.alvo] ?? b.alvo}</span>)}</p>}
    </div>}
  </div>
}

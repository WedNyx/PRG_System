'use client'

/**
 * Ferramentas do mestre para D&D 2024 (v0.33.6): montar encontro pelo orçamento de XP, CDs e testes,
 * XP e níveis, condições/ações/descansos e conferência das fichas da campanha. Tabelas do SRD 5.2.1 (CC BY 4.0).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Check, ClipboardCheck, Gauge, HeartPulse, Minus, Plus, Swords, Target, Trash2, TriangleAlert, X } from 'lucide-react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { sistemaDaCampanha, sistemaPorId } from '@/lib/sistemas/catalogo'
import { calcular, normalizarFicha } from '@/lib/sistemas/calculo'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { lerConfiguracaoProgressao, modoDaFicha } from '@/lib/sistemas/modoProgressao'
import {
  ACOES_DND, CDS_TIPICAS, CONDICOES_DND, conferirFichaDnd, DESCANSOS, montarEncontro, NOME_DIFICULDADE, nivelPeloXp, PATAMAR, proficienciaDoNd, proficienciaDoNivel, XP_DO_NIVEL, XP_POR_ND,
  type Criatura, type Dificuldade, type ItemConferencia,
} from '@/lib/sistemas/dnd2024Mestre'

type Campanha = { id: string; nome: string; sistema: string; meuPapel: string; config_progressao?: unknown }
type FichaLista = { id: string; nome: string; npc: boolean; status: string; nivel?: string | null; classe?: string | null; dono?: { apelido: string } | null }
type Aba = 'encontro' | 'testes' | 'xp' | 'regras' | 'conferir'

const card = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/95 p-4 sm:p-5'
const input = 'rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white'
const btn = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-(--a-5e4b78) px-3 py-1.5 text-sm hover:bg-(--s-34294f) disabled:opacity-40'
const mil = (n: number) => n.toLocaleString('pt-BR')
const ABAS: { id: Aba; nome: string; icone: typeof Swords }[] = [
  { id: 'encontro', nome: 'Encontro', icone: Swords }, { id: 'testes', nome: 'Testes e CDs', icone: Target }, { id: 'xp', nome: 'XP e níveis', icone: Gauge },
  { id: 'regras', nome: 'Condições e ações', icone: HeartPulse }, { id: 'conferir', nome: 'Conferir fichas', icone: ClipboardCheck },
]
const ler = <T,>(k: string, padrao: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : padrao } catch { return padrao } }
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export default function FerramentasDnd({ campanhaInicial }: { campanhaInicial: string }) {
  const [aba, setAba] = useState<Aba>('encontro')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [cid, setCid] = useState(campanhaInicial)
  const [fichas, setFichas] = useState<FichaLista[]>([])
  useEffect(() => {
    let vivo = true
    api<{ campanhas: Campanha[] }>('campanhas').then(r => {
      if (!vivo) return
      const minhas = r.campanhas.filter(c => (c.meuPapel === 'mestre' || c.meuPapel === 'comestre') && sistemaDaCampanha(c.sistema) === 'dnd5e-srd')
      setCampanhas(minhas)
      if (!campanhaInicial && minhas.length === 1) setCid(minhas[0].id)
    }).catch(() => { if (vivo) setCampanhas([]) })
    return () => { vivo = false }
  }, [campanhaInicial])
  useEffect(() => {
    let vivo = true
    if (!cid) return
    api<{ fichas: FichaLista[] }>(`campanhas/${cid}/fichas`).then(r => { if (vivo) setFichas(r.fichas.filter(f => f.status !== 'recusada')) })
      .catch(e => { if (vivo) { setFichas([]); toast.error(e instanceof ErroNuvem ? e.message : 'Falha ao carregar as fichas.') } })
    return () => { vivo = false }
  }, [cid])
  const campanha = campanhas.find(c => c.id === cid) ?? null
  const fichasDaCampanha = cid ? fichas : []

  return <main className="fundo-tema min-h-screen overflow-x-hidden px-3 py-5 text-(--a-f2ebff) sm:px-6 sm:py-8">
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={cid ? '/mesa?campanha=' + cid : '/central'} className="inline-flex items-center gap-1 text-sm text-(--a-c7a8ff) hover:underline"><ArrowLeft size={16} /> {cid ? 'Voltar à mesa' : 'Voltar à Central'}</Link>
      </div>
      <header className={card}>
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-(--a-ed9cd8)">🎩 Guia do mestre · D&D 2024</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Ferramentas do mestre</h1>
        <p className="mt-2 text-sm text-(--a-cfc0df)">Monte encontros pelo orçamento de XP, escolha CDs, acompanhe XP e níveis, consulte condições e ações e confira as fichas do grupo.</p>
        <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">Campanha
          <select value={cid} onChange={e => setCid(e.target.value)} className={input}>
            <option value="">Sem campanha (só calcular)</option>
            {campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {!campanhas.length && <span className="text-xs text-(--a-a998bd)">Você ainda não é mestre de uma campanha de D&D.</span>}
        </label>
      </header>
      <nav aria-label="Ferramentas" className="flex gap-2 overflow-x-auto pb-1">
        {ABAS.map(a => <button key={a.id} type="button" onClick={() => setAba(a.id)} aria-current={aba === a.id ? 'page' : undefined}
          className={'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ' + (aba === a.id ? 'border-(--a-b99bff) bg-(--s-3b2b57) font-semibold text-white' : 'border-(--a-55456e) bg-(--s-201a32)/90 text-(--a-d6c8f0)')}>
          <a.icone size={16} aria-hidden /> {a.nome}</button>)}
      </nav>
      {aba === 'encontro' && <Encontro key={campanha?.id ?? 'livre'} campanha={campanha} fichas={fichasDaCampanha} />}
      {aba === 'testes' && <Testes />}
      {aba === 'xp' && <XpNiveis />}
      {aba === 'regras' && <Regras />}
      {aba === 'conferir' && <Conferir campanha={campanha} fichas={fichasDaCampanha} />}
      <p className="text-[11px] text-(--a-8f84a6)">Tabelas do System Reference Document 5.2.1 (Wizards of the Coast LLC), licença CC BY 4.0. Resumos em português da plataforma.</p>
    </div>
  </main>
}

/* ───────── Encontro ───────── */
function Encontro({ campanha, fichas }: { campanha: Campanha | null; fichas: FichaLista[] }) {
  const chave = 'prg-encontro-dnd-' + (campanha?.id ?? 'livre')
  // Rascunho do encontro guardado neste navegador (por campanha; o componente é recriado ao trocar).
  const [rascunho] = useState(() => ler<{ niveis?: number[]; criaturas?: Criatura[]; alvo?: Dificuldade } | null>(chave, null))
  const [niveis, setNiveis] = useState<number[]>(rascunho?.niveis?.length ? rascunho.niveis : [1, 1, 1, 1])
  const [criaturas, setCriaturas] = useState<Criatura[]>(rascunho?.criaturas ?? [{ nome: '', nd: '1/4', qtd: 2 }])
  const [alvo, setAlvo] = useState<Dificuldade>(rascunho?.alvo ?? 'moderada')
  const [fora, setFora] = useState<string[]>([])
  const jogadores = fichas.filter(f => !f.npc && f.status === 'ativa')
  const doGrupo = jogadores.filter(f => !fora.includes(f.id))
  useEffect(() => { gravar(chave, { niveis, criaturas, alvo }) }, [chave, niveis, criaturas, alvo])
  const grupo = campanha && jogadores.length ? doGrupo.map(f => Math.max(1, Math.min(20, Number(f.nivel) || 1))) : niveis
  const e = montarEncontro(grupo, criaturas, alvo)
  const max = Math.max(e.orcamento.alta * 1.15, e.gasto, 1)
  const cor = e.faixa === 'acima' ? 'bg-red-500' : e.faixa === 'alta' ? 'bg-orange-400' : e.faixa === 'moderada' ? 'bg-amber-300' : 'bg-emerald-400'
  const mudar = (i: number, c: Partial<Criatura>) => setCriaturas(cs => cs.map((x, k) => k === i ? { ...x, ...c } : x))
  async function darXp() {
    if (!campanha || !doGrupo.length || !e.xpPorPersonagem) return
    if (!confirm(`Dar ${mil(e.xpPorPersonagem)} XP para ${doGrupo.map(f => f.nome).join(', ')}?`)) return
    try {
      await api(`campanhas/${campanha.id}/recompensas`, { method: 'POST', body: { fichaIds: doGrupo.map(f => f.id), xp: e.xpPorPersonagem, motivo: 'Encontro: ' + criaturas.filter(c => c.qtd > 0).map(c => `${c.qtd}× ${c.nome || 'ND ' + c.nd}`).join(', ') } })
      toast.success('XP entregue ao grupo.')
    } catch (er) { toast.error(er instanceof ErroNuvem ? er.message : 'Falha ao dar o XP.') }
  }
  return <div className="space-y-4">
    <section className={card + ' space-y-3'}>
      <h2 className="font-bold text-(--a-ed9cd8)">1. O grupo</h2>
      {campanha && jogadores.length ? <ul className="flex flex-wrap gap-2">{jogadores.map(f => { const on = !fora.includes(f.id); return <li key={f.id}>
        <button type="button" aria-pressed={on} onClick={() => setFora(x => on ? [...x, f.id] : x.filter(y => y !== f.id))}
          className={'rounded-full border px-3 py-1.5 text-sm ' + (on ? 'border-(--a-b99bff) bg-(--s-3b2b57) text-white' : 'border-(--a-55456e) text-(--a-a998bd) line-through')}>
          {on ? '✓ ' : ''}{f.nome} · nível {Number(f.nivel) || 1}</button></li> })}</ul>
        : <div className="flex flex-wrap items-center gap-2">
          {niveis.map((n, i) => <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-(--a-3d3152) bg-(--s-171325) px-2 py-1 text-sm">
            <select aria-label={`Nível do personagem ${i + 1}`} value={n} onChange={ev => setNiveis(v => v.map((x, k) => k === i ? Number(ev.target.value) : x))} className="bg-transparent text-white">
              {Array.from({ length: 20 }, (_, k) => <option key={k} value={k + 1} className="bg-(--s-151123)">Nível {k + 1}</option>)}</select>
            {niveis.length > 1 && <button type="button" aria-label="Tirar personagem" onClick={() => setNiveis(v => v.filter((_, k) => k !== i))} className="rounded p-0.5 text-(--a-a998bd) hover:text-white"><X size={14} /></button>}
          </span>)}
          {niveis.length < 12 && <button type="button" onClick={() => setNiveis(v => [...v, v[v.length - 1] ?? 1])} className={btn}><Plus size={14} /> Personagem</button>}
        </div>}
      {campanha && !jogadores.length && <p className="text-xs text-(--a-a998bd)">Nenhuma ficha de jogador aprovada nesta campanha: monte o grupo à mão.</p>}
      <div role="radiogroup" aria-label="Dificuldade" className="flex flex-wrap gap-2">{(['baixa', 'moderada', 'alta'] as Dificuldade[]).map(d => <button key={d} type="button" role="radio" aria-checked={alvo === d} onClick={() => setAlvo(d)}
        className={'rounded-xl border px-3 py-2 text-sm ' + (alvo === d ? 'border-(--a-b99bff) bg-(--s-3b2b57) text-white' : 'border-(--a-55456e) text-(--a-c4b6d4)')}>{NOME_DIFICULDADE[d]} · {mil(e.orcamento[d])} XP</button>)}</div>
      <p className="text-xs text-(--a-b4aeca)">Baixa: um ou dois sustos, ninguém cai. Moderada: sem descanso pode dar ruim. Alta: pode matar alguém sem boa tática.</p>
    </section>
    <section className={card + ' space-y-3'}>
      <h2 className="font-bold text-(--a-ed9cd8)">2. As criaturas</h2>
      <ul className="space-y-2">{criaturas.map((c, i) => <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-(--a-3d3152) bg-(--s-171325) p-2">
        <input aria-label="Nome da criatura" value={c.nome ?? ''} maxLength={40} onChange={ev => mudar(i, { nome: ev.target.value })} placeholder="Nome (ex.: Goblin)" className={input + ' min-w-0 flex-1 basis-36'} />
        <label className="flex items-center gap-1 text-sm">ND<select value={c.nd} onChange={ev => mudar(i, { nd: ev.target.value })} className={input}>{XP_POR_ND.map(([n, xp]) => <option key={n} value={n}>{n} ({mil(xp)} XP)</option>)}</select></label>
        <span className="flex items-center gap-1">
          <button type="button" aria-label="Menos uma" onClick={() => mudar(i, { qtd: Math.max(0, c.qtd - 1) })} className={btn + ' !px-2'}><Minus size={14} /></button>
          <span className="w-7 text-center font-bold tabular-nums">{c.qtd}</span>
          <button type="button" aria-label="Mais uma" onClick={() => mudar(i, { qtd: Math.min(50, c.qtd + 1) })} className={btn + ' !px-2'}><Plus size={14} /></button></span>
        <span className="w-24 text-right text-xs tabular-nums text-(--a-c4b6d4)">{mil(c.qtd * (XP_POR_ND.find(([n]) => n === c.nd)?.[1] ?? 0))} XP</span>
        <button type="button" aria-label="Tirar criatura" onClick={() => setCriaturas(cs => cs.filter((_, k) => k !== i))} className="rounded p-1.5 text-(--a-a998bd) hover:bg-(--s-2b2140) hover:text-white"><Trash2 size={15} /></button>
      </li>)}</ul>
      <button type="button" disabled={criaturas.length >= 12} onClick={() => setCriaturas(cs => [...cs, { nome: '', nd: cs[cs.length - 1]?.nd ?? '1', qtd: 1 }])} className={btn}><Plus size={14} /> Criatura</button>
    </section>
    <section className={card + ' space-y-3'} aria-live="polite">
      <h2 className="font-bold text-(--a-ed9cd8)">3. Resultado</h2>
      <div className="relative h-5 overflow-hidden rounded-full bg-(--s-151123)">
        <div className={'absolute inset-y-0 left-0 rounded-full ' + cor} style={{ width: `${Math.min(100, e.gasto / max * 100)}%` }} />
        {(['baixa', 'moderada', 'alta'] as Dificuldade[]).map(d => <span key={d} className="absolute inset-y-0 w-0.5 bg-white/70" style={{ left: `${e.orcamento[d] / max * 100}%` }} title={NOME_DIFICULDADE[d]} />)}
      </div>
      <p className="text-lg"><strong className="tabular-nums">{mil(e.gasto)} XP</strong> em {e.criaturas} criatura{e.criaturas === 1 ? '' : 's'} · <strong>{e.faixa === 'acima' ? 'acima da Alta ⚠️' : e.faixa === 'trivial' ? 'bem fácil' : NOME_DIFICULDADE[e.faixa]}</strong></p>
      <p className="text-sm text-(--a-cfc0df)">{e.sobra === 0 ? `Usou o orçamento ${NOME_DIFICULDADE[alvo].toLowerCase()} inteiro.` : e.sobra > 0 ? `Ainda cabem ${mil(e.sobra)} XP no orçamento ${NOME_DIFICULDADE[alvo].toLowerCase()}.` : `Passou ${mil(-e.sobra)} XP do orçamento ${NOME_DIFICULDADE[alvo].toLowerCase()}.`} Cada personagem ganha {mil(e.xpPorPersonagem)} XP se o grupo vencer.</p>
      {e.avisos.length > 0 && <ul className="space-y-1.5">{e.avisos.map(a => <li key={a} className="flex gap-2 rounded-lg bg-amber-950/40 p-2 text-sm text-amber-100"><TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />{a}</li>)}</ul>}
      {campanha && doGrupo.length > 0 && <button type="button" disabled={!e.xpPorPersonagem} onClick={() => void darXp()} className={btn + ' border-(--a-8b6cba) bg-(--s-2b2140) font-semibold text-white'}>🎁 Dar {mil(e.xpPorPersonagem)} XP a cada um do grupo</button>}
    </section>
  </div>
}

/* ───────── Testes e CDs ───────── */
function Testes() {
  return <div className="space-y-4">
    <section className={card}>
      <h2 className="font-bold text-(--a-ed9cd8)">Classe de Dificuldade (CD) típica</h2>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{CDS_TIPICAS.map(([n, cd]) => <li key={n} className="flex items-center justify-between rounded-xl bg-(--s-171325) px-3 py-2"><span>{n}</span><strong className="text-xl tabular-nums">{cd}</strong></li>)}</ul>
      <p className="mt-3 text-sm text-(--a-cfc0df)">Peça teste só quando o resultado é incerto e falhar tem consequência. Se der para fazer com calma e sem pressão, deixe passar.</p>
    </section>
    <section className={card + ' space-y-2 text-sm text-(--a-ddd0ec)'}>
      <h2 className="font-bold text-(--a-ed9cd8)">Como funciona o d20</h2>
      <p><strong>Teste de atributo, salvaguarda ou ataque:</strong> d20 + modificador (+ proficiência se for treinado). Iguala ou passa a CD (ou a CA): sucesso.</p>
      <p><strong>Vantagem / Desvantagem:</strong> rola 2d20 e fica com o maior / menor. Várias vantagens não somam; uma vantagem e uma desvantagem se anulam.</p>
      <p><strong>Ataque:</strong> 20 natural sempre acerta e é crítico (dobra os dados de dano); 1 natural sempre erra.</p>
      <p><strong>Esconder:</strong> Destreza (Furtividade) CD 15. <strong>Influenciar</strong> um monstro hesitante: CD 15 ou a Inteligência dele, o que for maior.</p>
      <p><strong>Procurar</strong> (Sabedoria): Intuição, Medicina, Percepção, Sobrevivência. <strong>Estudar</strong> (Inteligência): Arcanismo, História, Investigação, Natureza, Religião.</p>
    </section>
  </div>
}

/* ───────── XP e níveis ───────── */
function XpNiveis() {
  const [xp, setXp] = useState(0)
  const n = nivelPeloXp(xp)
  const [nd, setNd] = useState('5')
  return <div className="space-y-4">
    <section className={card + ' space-y-2'}>
      <h2 className="font-bold text-(--a-ed9cd8)">Em que nível está?</h2>
      <label className="flex flex-wrap items-center gap-2 text-sm">XP do personagem<input type="number" min={0} max={999999} value={xp} onChange={e => setXp(Math.max(0, Number(e.target.value) || 0))} className={input + ' w-32'} /></label>
      <p className="text-lg">Nível <strong>{n}</strong> · proficiência <strong>+{proficienciaDoNivel(n)}</strong>{n < 20 && <> · faltam <strong>{mil(XP_DO_NIVEL[n] - xp)} XP</strong> para o nível {n + 1}</>}</p>
      <p className="text-sm text-(--a-c4b6d4)">{PATAMAR(n)}</p>
    </section>
    <section className={card}>
      <h2 className="font-bold text-(--a-ed9cd8)">Tabela de avanço</h2>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">{XP_DO_NIVEL.map((x, i) => <p key={i} className={'flex justify-between rounded px-2 py-0.5 ' + (i + 1 === n ? 'bg-(--s-3b2b57)' : '')}><span>Nível {i + 1}</span><span className="tabular-nums text-(--a-c4b6d4)">{mil(x)}</span></p>)}</div>
    </section>
    <section className={card + ' space-y-2'}>
      <h2 className="font-bold text-(--a-ed9cd8)">Criatura por Nível de Desafio</h2>
      <label className="flex flex-wrap items-center gap-2 text-sm">ND<select value={nd} onChange={e => setNd(e.target.value)} className={input}>{XP_POR_ND.map(([x]) => <option key={x} value={x}>{x}</option>)}</select></label>
      <p>Vale <strong>{mil(XP_POR_ND.find(([x]) => x === nd)?.[1] ?? 0)} XP</strong> · bônus de proficiência <strong>+{proficienciaDoNd(nd)}</strong>. Uma criatura de ND igual ao nível do grupo é um desafio baixo para 4 personagens.</p>
    </section>
  </div>
}

/* ───────── Condições, ações e descanso ───────── */
function Regras() {
  const [aberta, setAberta] = useState<string | null>(null)
  return <div className="space-y-4">
    <section className={card}>
      <h2 className="font-bold text-(--a-ed9cd8)">Condições</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">{CONDICOES_DND.map(c => <li key={c.id} className="min-w-0">
        <button type="button" aria-expanded={aberta === c.id} onClick={() => setAberta(a => a === c.id ? null : c.id)} className="w-full rounded-xl bg-(--s-171325) px-3 py-2 text-left">
          <span className="font-semibold text-white">{c.nome}</span>
          {aberta === c.id ? <ul className="mt-1 space-y-1 text-sm text-(--a-cfc0df)">{c.efeitos.map(x => <li key={x}>• {x}</li>)}</ul> : <span className="block line-clamp-1 break-words text-xs text-(--a-a998bd)">{c.efeitos[0]}</span>}
        </button></li>)}</ul>
    </section>
    <section className={card}>
      <h2 className="font-bold text-(--a-ed9cd8)">Ações no turno</h2>
      <p className="mt-1 text-sm text-(--a-c4b6d4)">No turno: mover-se até o deslocamento, 1 ação e, se algo der, 1 Ação Bônus. 1 Reação por rodada.</p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">{ACOES_DND.map(([n, t]) => <div key={n} className="rounded-xl bg-(--s-171325) px-3 py-2"><dt className="font-semibold text-white">{n}</dt><dd className="text-sm text-(--a-cfc0df)">{t}</dd></div>)}</dl>
    </section>
    <section className={card}>
      <h2 className="font-bold text-(--a-ed9cd8)">Descansos</h2>
      <dl className="mt-2 space-y-2">{DESCANSOS.map(([n, t]) => <div key={n} className="rounded-xl bg-(--s-171325) px-3 py-2"><dt className="font-semibold text-white">{n}</dt><dd className="text-sm text-(--a-cfc0df)">{t}</dd></div>)}</dl>
    </section>
  </div>
}

/* ───────── Conferir fichas ───────── */
function Conferir({ campanha, fichas }: { campanha: Campanha | null; fichas: FichaLista[] }) {
  const [res, setRes] = useState<Record<string, ItemConferencia[] | 'carregando' | string>>({})
  const s = sistemaPorId('dnd5e-srd')!
  async function conferir(f: FichaLista) {
    setRes(r => ({ ...r, [f.id]: 'carregando' }))
    try {
      const r = await api<{ ficha: { dados: DadosFicha }; configProgressao?: unknown }>('fichas/' + f.id)
      const d = normalizarFicha(s, r.ficha.dados)
      const efeitos = modoDaFicha(lerConfiguracaoProgressao(r.configProgressao ?? campanha?.config_progressao), f.id) !== 'manual'
      setRes(x => ({ ...x, [f.id]: conferirFichaDnd(d, calcular(s, d, { efeitosDnd: efeitos }), { efeitos }) }))
    } catch (e) { setRes(x => ({ ...x, [f.id]: e instanceof ErroNuvem ? e.message : 'Falha ao abrir a ficha.' })) }
  }
  if (!campanha) return <section className={card}><p className="text-sm text-(--a-cfc0df)">Escolha uma campanha lá em cima para conferir as fichas do grupo. Cada ficha de D&D também tem a sua conferência na aba Principal.</p></section>
  return <section className={card + ' space-y-3'}>
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="flex-1 font-bold text-(--a-ed9cd8)">Fichas de {campanha.nome}</h2>
      {fichas.length > 0 && <button type="button" onClick={() => { for (const f of fichas) void conferir(f) }} className={btn}><ClipboardCheck size={15} /> Conferir todas</button>}
    </div>
    {!fichas.length && <p className="text-sm text-(--a-a998bd)">Nenhuma ficha nesta campanha.</p>}
    <ul className="space-y-2">{fichas.map(f => { const r = res[f.id]; const lista = Array.isArray(r) ? r : null
      const erros = lista?.filter(x => x.tipo === 'erro').length ?? 0, avisos = lista?.filter(x => x.tipo === 'aviso').length ?? 0
      return <li key={f.id} className="rounded-xl border border-(--a-3d3152) bg-(--s-171325) p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1"><strong className="text-white">{f.nome || 'Sem nome'}</strong> <span className="text-xs text-(--a-a998bd)">{f.npc ? 'NPC' : f.dono?.apelido ?? ''}{f.classe ? ` · ${f.classe} ${Number(f.nivel) || 1}` : ''}{f.status === 'pendente' ? ' · aguardando aprovação' : ''}</span></span>
          {lista && <span className={'rounded-full px-2 py-0.5 text-xs ' + (erros ? 'bg-red-950/70 text-red-200' : avisos ? 'bg-amber-950/70 text-amber-200' : 'bg-emerald-950/70 text-emerald-200')}>{erros ? `${erros} erro(s)` : avisos ? `${avisos} aviso(s)` : '✔ pronta'}</span>}
          <button type="button" onClick={() => void conferir(f)} className={btn}>{r === 'carregando' ? 'Conferindo…' : lista ? 'De novo' : 'Conferir'}</button>
          <Link href={'/ficha?nuvem=' + f.id} className={btn}>Abrir</Link>
        </div>
        {typeof r === 'string' && r !== 'carregando' && <p className="mt-2 text-sm text-red-200">{r}</p>}
        {lista && <ListaConferencia itens={lista} />}
      </li> })}</ul>
  </section>
}

export function ListaConferencia({ itens, irPara }: { itens: ItemConferencia[]; irPara?: (aba: NonNullable<ItemConferencia['aba']>) => void }) {
  return <ul className="mt-2 space-y-1">{itens.map((x, i) => <li key={i} className={'flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm ' + (x.tipo === 'erro' ? 'bg-red-950/40 text-red-100' : x.tipo === 'aviso' ? 'bg-amber-950/40 text-amber-100' : 'text-(--a-cfc0df)')}>
    {x.tipo === 'ok' ? <Check size={15} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden /> : <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />}
    <span className="flex-1">{x.texto}</span>
    {irPara && x.aba && x.tipo !== 'ok' && <button type="button" onClick={() => irPara(x.aba!)} className="shrink-0 rounded border border-current/40 px-1.5 text-xs opacity-90 hover:opacity-100">Ir</button>}
  </li>)}</ul>
}

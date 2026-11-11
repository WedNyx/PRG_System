'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react'
import { enviarImagemNuvem, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import { TEMAS, type Tema } from '@/lib/tema'
import { aplicarVisual, CORES_PRONTAS, FONTES, limparVisual, TAMANHOS, type Visual } from '@/lib/visual'

type Estado = 'salvo' | 'salvando' | 'pendente' | 'erro'
const amostra = (matiz: number, l = 0.62, c = 0.16) => `oklch(${l} ${c} ${matiz})`
const bloco = 'rounded-2xl border border-(--a-55456e) bg-(--s-201a32)/90 p-4 sm:p-5'
const chip = (ativo: boolean) => 'rounded-xl border px-3 py-2 text-sm transition ' + (ativo ? 'border-(--a-e4d3ff) bg-(--s-3a2c58) text-white' : 'border-(--a-55456e) text-(--a-cfc0df) hover:bg-(--s-2b2140)')

/** Central → Aparência: tema, foto de fundo, cores, cartões, fonte e tamanho. Muda na hora e salva sozinho no perfil. */
export default function Aparencia({ perfilId, inicial, tema, escolherTema, salvo }: {
  perfilId: string; inicial: Visual; tema: Tema; escolherTema: (t: Tema) => void; salvo: (v: Visual) => void
}) {
  const [v, setV] = useState<Visual>(inicial)
  const [estado, setEstado] = useState<Estado>('salvo')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimo = useRef(JSON.stringify(inicial))

  async function enviar(novo: Visual) {
    setEstado('salvando')
    try {
      const r = await fetch('/api/aventureiros/' + perfilId, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-prg-aventureiro': perfilId }, body: JSON.stringify({ visual: novo }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.erro || 'Não foi possível salvar a aparência.')
      ultimo.current = JSON.stringify(novo); setEstado('salvo'); setErro(''); salvo(novo)
    } catch (e) { setEstado('erro'); setErro(e instanceof Error ? e.message : 'Falha ao salvar.') }
  }
  const mudar = (p: Partial<Visual>) => definir({ ...v, ...p })
  function definir(bruto: Visual) {
    const novo = limparVisual(bruto)
    // null nos campos de cor e foto significa “seguir o tema”: tira do objeto.
    for (const k of ['cor', 'cartaoCor', 'fundo'] as const) if (novo[k] === null) delete novo[k]
    setV(novo); aplicarVisual(perfilId, novo)
    if (!NUVEM_ATIVA) return
    setEstado('pendente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { if (JSON.stringify(novo) !== ultimo.current) void enviar(novo); else setEstado('salvo') }, 700)
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function escolherFoto(f: File) {
    setEnviando(true); setErro('')
    try { mudar({ fundo: await enviarImagemNuvem('imagens', f, 1920), fundoEscuro: v.fundoEscuro ?? 40 }) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao enviar a imagem.') } finally { setEnviando(false) }
  }

  const rotulo = { salvo: '✓ Salvo no seu perfil', salvando: '☁️ Salvando…', pendente: '✏️ Salvando em instantes…', erro: '⚠️ Não salvou' }[estado]
  const corAtual = v.cor ?? null, cartaoAtual = v.cartaoCor ?? null

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-(--a-55456e) bg-(--s-171325)/80 px-4 py-3 text-sm">
      <span className="flex-1 text-(--a-cfc0df)">Tudo muda na hora. {NUVEM_ATIVA ? 'Fica salvo no seu perfil e vale em qualquer aparelho.' : 'Fica salvo neste aparelho.'}</span>
      {NUVEM_ATIVA && <span aria-live="polite" className={'rounded-full border px-2.5 py-1 text-xs ' + (estado === 'erro' ? 'border-red-800 text-red-200' : estado === 'salvo' ? 'border-emerald-700/60 text-emerald-200' : 'border-amber-700/60 text-amber-100')}>{rotulo}</span>}
      <button type="button" onClick={() => definir(v.tema ? { tema: v.tema } : {})}
        className="inline-flex items-center gap-1.5 rounded-xl border border-(--a-62527e) px-3 py-1.5 text-xs hover:bg-(--s-2b2140)"><RotateCcw size={14} /> Voltar ao padrão do tema</button>
    </div>
    {erro && <p role="alert" className="rounded-xl border border-red-800/70 bg-red-950/40 p-3 text-sm text-red-200">{erro}</p>}

    <section className={bloco} aria-labelledby="ap-tema">
      <h2 id="ap-tema" className="text-lg font-bold">🎨 Tema</h2>
      <p className="mt-1 text-sm text-(--a-bfb2cf)">Cada tema traz um fundo e as cores da plataforma que combinam com ele.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TEMAS.map(t => { const ativo = t.id === tema
          return <button key={t.id} type="button" onClick={() => { escolherTema(t.id); mudar({ tema: t.id }) }} aria-pressed={ativo}
            className={'group overflow-hidden rounded-xl border-2 text-left transition hover:-translate-y-0.5 ' + (ativo ? 'border-(--a-e4d3ff) shadow-[0_0_24px_#9b7bff66]' : 'border-(--a-48385e) hover:border-(--a-8b6cba)')}>
            <span className="relative block h-20 w-full sm:h-24" style={{ background: t.mini }}>
              {ativo && <span className="absolute right-1.5 top-1.5 rounded-full bg-(--a-7853b4) px-2 py-0.5 text-[11px] font-bold text-white shadow">✓ Em uso</span>}
              <span className="absolute bottom-1.5 left-1.5 flex gap-1" aria-hidden="true">{[0, 1, 2].map(i => <span key={i} className="h-3 w-3 rounded-full border border-white/40" style={{ background: amostra(t.matiz + i * 18, 0.55 + i * 0.12, t.intensidade * 0.15) }} />)}</span>
            </span>
            <span className="block bg-(--s-201a32)/95 px-2.5 py-2"><span className="block text-sm font-semibold">{t.nome}</span><span className="line-clamp-2 block text-[11px] text-(--a-bfb2cf)">{t.descricao}</span></span>
          </button> })}
      </div>
    </section>

    <section className={bloco} aria-labelledby="ap-fundo">
      <h2 id="ap-fundo" className="text-lg font-bold">🖼️ Foto de fundo</h2>
      <p className="mt-1 text-sm text-(--a-bfb2cf)">Use uma imagem da sua galeria no lugar do fundo do tema.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="relative h-24 w-40 overflow-hidden rounded-xl border border-(--a-62527e) bg-(--s-151123)">
          {v.fundo ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${v.fundo}")` }} /> : <span className="flex h-full items-center justify-center text-xs text-(--a-a99bbb)">Fundo do tema</span>}
          {v.fundo && <span className="absolute inset-0" style={{ background: `rgba(8,6,16,${(v.fundoEscuro ?? 40) / 100})` }} />}
        </span>
        <div className="flex flex-wrap gap-2">
          {NUVEM_ATIVA ? <label className={'inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-(--a-7652ac) px-3 py-2 text-sm font-semibold hover:bg-(--a-8b68c4) ' + (enviando ? 'pointer-events-none opacity-60' : '')}>
            <ImagePlus size={16} /> {enviando ? 'Enviando…' : v.fundo ? 'Trocar foto' : 'Escolher foto'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Foto de fundo" disabled={enviando} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void escolherFoto(f) }} />
          </label> : <p className="text-xs text-(--a-a99bbb)">A foto de fundo precisa da nuvem ligada.</p>}
          {v.fundo && <button type="button" onClick={() => mudar({ fundo: null })} className="inline-flex items-center gap-1.5 rounded-xl border border-(--a-62527e) px-3 py-2 text-sm hover:bg-(--s-2b2140)"><Trash2 size={15} /> Tirar foto</button>}
        </div>
      </div>
      {v.fundo && <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Deslizar rotulo="Escurecer a foto" valor={v.fundoEscuro ?? 40} min={0} max={85} passo={5} mostrar={n => n + '%'} mudar={n => mudar({ fundoEscuro: n })} dica="Mais escuro = texto mais fácil de ler." />
        <Deslizar rotulo="Desfocar a foto" valor={v.fundoDesfoque ?? 0} min={0} max={16} passo={1} mostrar={n => n ? n + ' px' : 'nítida'} mudar={n => mudar({ fundoDesfoque: n })} />
      </div>}
    </section>

    <section className={bloco} aria-labelledby="ap-cor">
      <h2 id="ap-cor" className="text-lg font-bold">💜 Cor principal</h2>
      <p className="mt-1 text-sm text-(--a-bfb2cf)">Botões, bordas, destaques e textos acompanham a cor escolhida.</p>
      <Paleta atual={corAtual} escolher={m => mudar({ cor: m })} semCor="Do tema" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Deslizar rotulo="Ajuste fino da cor" valor={corAtual ?? 300} min={0} max={359} passo={1} mostrar={() => ''} mudar={n => mudar({ cor: n })} trilha="linear-gradient(90deg, oklch(0.62 0.16 0), oklch(0.62 0.16 60), oklch(0.62 0.16 120), oklch(0.62 0.16 180), oklch(0.62 0.16 240), oklch(0.62 0.16 300), oklch(0.62 0.16 359))" />
        <Deslizar rotulo="Intensidade" valor={v.intensidade ?? 1} min={0.3} max={1.6} passo={0.05} mostrar={n => n < 0.7 ? 'suave' : n > 1.2 ? 'vibrante' : 'normal'} mudar={n => mudar({ intensidade: n })} />
      </div>
    </section>

    <section className={bloco} aria-labelledby="ap-cartoes">
      <h2 id="ap-cartoes" className="text-lg font-bold">🃏 Cartões</h2>
      <p className="mt-1 text-sm text-(--a-bfb2cf)">A cor de fundo dos quadros (fichas, campanhas, menus) e quanto do fundo aparece por trás.</p>
      <Paleta atual={cartaoAtual} escolher={m => mudar({ cartaoCor: m })} semCor="Igual à cor principal" escuro />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Deslizar rotulo="Claridade" valor={v.cartaoLuz ?? 0} min={-0.08} max={0.12} passo={0.01} mostrar={n => n < -0.02 ? 'mais escuro' : n > 0.02 ? 'mais claro' : 'normal'} mudar={n => mudar({ cartaoLuz: n })} />
        <Deslizar rotulo="Transparência" valor={Math.round((1 - (v.cartaoAlfa ?? 0.84)) * 100)} min={0} max={55} passo={5} mostrar={n => n === 0 ? 'sólido' : n + '%'} mudar={n => mudar({ cartaoAlfa: 1 - n / 100 })} dica="Com transparência, o fundo aparece desfocado por trás dos cartões." />
      </div>
    </section>

    <section className={bloco} aria-labelledby="ap-texto">
      <h2 id="ap-texto" className="text-lg font-bold">🔤 Texto</h2>
      <p className="mt-3 text-sm font-semibold">Fonte dos títulos</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {FONTES.map(f => <button key={f.id} type="button" aria-pressed={(v.fonte ?? 'fantasia') === f.id} onClick={() => mudar({ fonte: f.id })} className={chip((v.fonte ?? 'fantasia') === f.id) + ' text-left'}>
          <span className="block text-xl" style={{ fontFamily: f.id === 'fantasia' ? 'var(--font-cinzel), Georgia, serif' : f.id === 'elegante' ? 'var(--font-cormorant), Georgia, serif' : 'var(--font-geist-sans), sans-serif', fontWeight: 700 }}>Aventura</span>
          <span className="block text-xs text-(--a-a99bbb)">{f.nome} · {f.descricao}</span></button>)}
      </div>
      <p className="mt-4 text-sm font-semibold">Tamanho do texto</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Tamanho do texto">
        {TAMANHOS.map((t, i) => <button key={t.id} type="button" role="radio" aria-checked={(v.tamanho ?? 'm') === t.id} onClick={() => mudar({ tamanho: t.id })} className={chip((v.tamanho ?? 'm') === t.id)}>
          <span style={{ fontSize: 13 + i * 2.5 }}>A</span> {t.nome}</button>)}
      </div>
    </section>
  </div>
}

function Paleta({ atual, escolher, semCor, escuro = false }: { atual: number | null; escolher: (m: number | null) => void; semCor: string; escuro?: boolean }) {
  return <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={semCor}>
    <button type="button" role="radio" aria-checked={atual === null} onClick={() => escolher(null)} className={chip(atual === null) + ' text-xs'}>{semCor}</button>
    {CORES_PRONTAS.map(c => <button key={c.nome} type="button" role="radio" aria-checked={atual === c.matiz} aria-label={c.nome} title={c.nome} onClick={() => escolher(c.matiz)}
      className={'h-10 w-10 rounded-full border-2 transition hover:scale-110 ' + (atual === c.matiz ? 'border-white ring-2 ring-white/40' : 'border-white/20')}
      style={{ background: escuro ? `linear-gradient(135deg, ${amostra(c.matiz, 0.36, 0.07)}, ${amostra(c.matiz, 0.24, 0.05)})` : `linear-gradient(135deg, ${amostra(c.matiz, 0.72, 0.15)}, ${amostra(c.matiz, 0.5, 0.17)})` }} />)}
  </div>
}

function Deslizar({ rotulo, valor, min, max, passo, mostrar, mudar, dica, trilha }: {
  rotulo: string; valor: number; min: number; max: number; passo: number; mostrar: (n: number) => string; mudar: (n: number) => void; dica?: string; trilha?: string
}) {
  return <label className="block text-sm">
    <span className="flex justify-between gap-2"><span className="font-semibold">{rotulo}</span><span className="text-xs text-(--a-a99bbb)">{mostrar(valor)}</span></span>
    <input type="range" min={min} max={max} step={passo} value={valor} onChange={e => mudar(Number(e.target.value))}
      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full accent-(--a-b99bff)" style={{ background: trilha ?? 'var(--s-3a2c58)' }} />
    {dica && <span className="mt-1 block text-[11px] text-(--a-a99bbb)">{dica}</span>}
  </label>
}

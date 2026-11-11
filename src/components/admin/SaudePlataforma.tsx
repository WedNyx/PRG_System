'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Erro = { id: number; origem: string; local: string; mensagem: string; detalhe: string; criado_em: string }
type Copia = { nome: string; criado_em: string | null; tamanho: number | null }
type Saude = { versao: string; revisao: string | null; banco: boolean; ms: number; erros: Erro[]; erros24h: number; copias: Copia[] | null; manter: number; agendada: boolean }

const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const tamanho = (b: number | null) => b == null ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
const dataDoNome = (n: string) => n.replace(/^prg-backup-(\d{4})-(\d{2})-(\d{2})\.json$/, '$3/$2/$1')

async function chamar(senha: string, corpo: Record<string, unknown>) {
  const r = await fetch('/api/prg/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha, ...corpo }) })
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.erro || 'Falha na área do administrador.') }
  return r
}

/** Painel do administrador: estado do site, erros recentes e cópias de segurança. */
export default function SaudePlataforma({ senha, fechar }: { senha: string; fechar: () => void }) {
  const [saude, setSaude] = useState<Saude | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setErro('')
    try { setSaude(await (await chamar(senha, { acao: 'saude' })).json()) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar.') }
  }, [senha])
  useEffect(() => { const t = setTimeout(() => void carregar(), 0); return () => clearTimeout(t) }, [carregar])

  async function acao(nome: string, fn: () => Promise<void>) {
    setOcupado(nome)
    try { await fn() } catch (e) { toast.error(e instanceof Error ? e.message : 'Falhou.') } finally { setOcupado(null) }
  }
  const baixar = (nome?: string) => acao('baixar' + (nome ?? ''), async () => {
    const r = await chamar(senha, { acao: 'baixar', nome })
    const arquivo = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') ?? '')?.[1] ?? 'prg-backup.json'
    const url = URL.createObjectURL(await r.blob())
    const a = document.createElement('a'); a.href = url; a.download = arquivo; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  const copiarAgora = () => acao('copiar', async () => {
    const r = await (await chamar(senha, { acao: 'backup_agora' })).json() as { tabelas: Record<string, number> }
    const total = Object.values(r.tabelas).reduce((a, b) => a + b, 0)
    toast.success(`Cópia guardada (${total} registros).`); await carregar()
  })
  const limparErros = () => acao('limpar', async () => {
    if (!confirm('Apagar todo o registro de erros?')) return
    await chamar(senha, { acao: 'limpar_erros' }); await carregar()
  })

  const botao = 'rounded-lg border border-(--a-62527e) px-3 py-2 text-sm hover:bg-(--s-34294f) disabled:opacity-50'
  return <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="saude-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="my-6 w-full max-w-2xl rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-5 text-(--a-f4f0ff) shadow-2xl sm:p-6">
      <div className="flex items-center gap-3">
        <h2 id="saude-titulo" className="flex-1 text-lg font-bold">🩺 Saúde da plataforma</h2>
        <button type="button" onClick={() => void carregar()} className={botao}>↻ Atualizar</button>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg px-2 py-1 text-xl hover:bg-(--s-34294f)">×</button>
      </div>
      {erro && <p role="alert" className="mt-4 rounded-lg border border-red-500/40 p-3 text-sm text-red-200">{erro}</p>}
      {!saude && !erro && <p className="mt-6 text-sm text-(--a-b4aeca)">Carregando…</p>}
      {saude && <>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-(--a-3d3152) bg-(--s-201a32) p-3">
            <p className="text-xs text-(--a-b4aeca)">Banco de dados</p>
            <p className={'mt-1 font-bold ' + (saude.banco ? 'text-emerald-300' : 'text-red-300')}>{saude.banco ? `✅ Respondendo (${saude.ms} ms)` : '❌ Fora do ar'}</p>
          </div>
          <div className="rounded-xl border border-(--a-3d3152) bg-(--s-201a32) p-3">
            <p className="text-xs text-(--a-b4aeca)">Erros nas últimas 24 h</p>
            <p className={'mt-1 font-bold ' + (saude.erros24h ? 'text-amber-300' : 'text-emerald-300')}>{saude.erros24h ? `⚠️ ${saude.erros24h}` : '✅ Nenhum'}</p>
          </div>
          <div className="rounded-xl border border-(--a-3d3152) bg-(--s-201a32) p-3">
            <p className="text-xs text-(--a-b4aeca)">Versão no ar</p>
            <p className="mt-1 font-bold">v{saude.versao}{saude.revisao && <span className="ml-1 text-xs font-normal text-(--a-b4aeca)">({saude.revisao})</span>}</p>
          </div>
        </div>

        <h3 className="mt-6 font-semibold">💾 Cópias de segurança</h3>
        <p className="mt-1 text-xs text-(--a-b4aeca)">
          {saude.agendada ? `Uma cópia de tudo (perfis, campanhas, fichas, mesa, músicas, sistemas…) é guardada todo dia de madrugada, numa pasta privada. Ficam as últimas ${saude.manter}.`
            : '⚠️ A cópia diária está desligada: falta a variável CRON_SECRET na Vercel. Dá para fazer cópias manuais aqui.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!!ocupado} onClick={copiarAgora} className={botao}>{ocupado === 'copiar' ? 'Guardando…' : '💾 Guardar cópia agora'}</button>
          <button type="button" disabled={!!ocupado} onClick={() => baixar()} className={botao}>{ocupado === 'baixar' ? 'Preparando…' : '⬇️ Baixar cópia completa agora'}</button>
        </div>
        {saude.copias === null && <p className="mt-3 text-sm text-amber-200">Não consegui ler a pasta de cópias (o bucket prg-backups existe no Supabase?).</p>}
        {saude.copias && saude.copias.length === 0 && <p className="mt-3 text-sm text-(--a-b4aeca)">Nenhuma cópia guardada ainda.</p>}
        {saude.copias && saude.copias.length > 0 && <ul className="mt-3 divide-y divide-(--a-2b2140) rounded-xl border border-(--a-3d3152)">
          {saude.copias.map(c => <li key={c.nome} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="flex-1">{dataDoNome(c.nome)} <span className="text-xs text-(--a-9d8db0)">{tamanho(c.tamanho)}</span></span>
            <button type="button" disabled={!!ocupado} onClick={() => baixar(c.nome)} className="rounded-md px-2 py-1 text-(--a-c7a8ff) hover:bg-(--s-2b2140) disabled:opacity-50">{ocupado === 'baixar' + c.nome ? '…' : '⬇️ Baixar'}</button>
          </li>)}
        </ul>}

        <div className="mt-6 flex items-center gap-2">
          <h3 className="flex-1 font-semibold">🐞 Erros recentes</h3>
          {saude.erros.length > 0 && <button type="button" disabled={!!ocupado} onClick={limparErros} className="rounded-md px-2 py-1 text-xs text-(--a-c4b6d4) hover:bg-(--s-2b2140)">Limpar registro</button>}
        </div>
        {saude.erros.length === 0 ? <p className="mt-2 text-sm text-(--a-b4aeca)">Nenhum erro registrado. 🌙</p>
          : <ul className="mt-2 max-h-80 divide-y divide-(--a-2b2140) overflow-y-auto rounded-xl border border-(--a-3d3152)">
            {saude.erros.map(e => <li key={e.id}>
              <button type="button" onClick={() => setAberto(a => a === e.id ? null : e.id)} aria-expanded={aberto === e.id} className="w-full px-3 py-2 text-left hover:bg-(--s-241c38)">
                <span className="block text-sm">{e.origem === 'navegador' ? '🖥️' : '🗄️'} {e.mensagem}</span>
                <span className="block text-[11px] text-(--a-9d8db0)">{quando(e.criado_em)} · {e.local || '—'}</span>
              </button>
              {aberto === e.id && e.detalhe && <pre className="overflow-x-auto whitespace-pre-wrap break-all bg-(--s-100f20) px-3 py-2 text-[11px] text-(--a-c9bcd9)">{e.detalhe}</pre>}
            </li>)}
          </ul>}
      </>}
    </section>
  </div>
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, CheckCheck, Trash2, X } from 'lucide-react'
import { api, NUVEM_ATIVA } from '@/lib/nuvem/cliente'

type Aviso = { id: number; campanha_id: string | null; tipo: string; titulo: string; texto: string; link: string | null; lida: boolean; criada_em: string }
const INTERVALO = 30_000

function haQuanto(d: string) {
  const s = Math.max(0, (Date.now() - Date.parse(d)) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  const dias = Math.floor(s / 86400)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

/**
 * Sininho de avisos (dentro da plataforma, nunca por e-mail). Atualiza a cada 30 s e ao voltar para a aba;
 * avisos novos também aparecem como um balão rápido.
 */
export default function Sino({ classe = '' }: { classe?: string }) {
  const router = useRouter()
  const [itens, setItens] = useState<Aviso[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [aberto, setAberto] = useState(false)
  const ultimo = useRef<number | null>(null)
  const painel = useRef<HTMLDivElement>(null)

  const abrirAviso = useCallback(async (a: Aviso) => {
    setAberto(false)
    if (!a.lida) {
      setItens(l => l.map(x => x.id === a.id ? { ...x, lida: true } : x)); setNaoLidas(n => Math.max(0, n - 1))
      void api('notificacoes', { method: 'POST', body: { acao: 'ler', ids: [a.id] } }).catch(() => {})
    }
    if (a.link) router.push(a.link)
  }, [router])

  const carregar = useCallback(async () => {
    try {
      const r = await api<{ itens: Aviso[]; naoLidas: number }>('notificacoes?limite=40')
      const maior = r.itens[0]?.id ?? 0
      // Balão só para avisos que chegaram depois que a página abriu.
      if (ultimo.current !== null) for (const a of r.itens.filter(x => x.id > ultimo.current! && !x.lida).slice(0, 3).reverse())
        toast(a.titulo, { description: a.texto || undefined, action: a.link ? { label: 'Ver', onClick: () => void abrirAviso(a) } : undefined })
      ultimo.current = Math.max(ultimo.current ?? 0, maior)
      setItens(r.itens); setNaoLidas(r.naoLidas)
    } catch { /* sem conexão: tenta de novo depois */ }
  }, [abrirAviso])

  useEffect(() => {
    if (!NUVEM_ATIVA) return
    const primeira = setTimeout(() => void carregar(), 300)
    const t = setInterval(() => { if (document.visibilityState === 'visible') void carregar() }, INTERVALO)
    const volta = () => { if (document.visibilityState === 'visible') void carregar() }
    document.addEventListener('visibilitychange', volta)
    return () => { clearTimeout(primeira); clearInterval(t); document.removeEventListener('visibilitychange', volta) }
  }, [carregar])

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (painel.current && !painel.current.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc) }
  }, [aberto])

  async function lerTodas() {
    setItens(l => l.map(x => ({ ...x, lida: true }))); setNaoLidas(0)
    await api('notificacoes', { method: 'POST', body: { acao: 'ler' } }).catch(() => {})
  }
  async function limparLidas() {
    setItens(l => l.filter(x => !x.lida))
    await api('notificacoes', { method: 'POST', body: { acao: 'apagar_lidas' } }).catch(() => {})
  }

  if (!NUVEM_ATIVA) return null
  return <div ref={painel} className={'relative ' + classe}>
    <button type="button" onClick={() => { setAberto(a => !a); if (!aberto) void carregar() }} aria-expanded={aberto} aria-haspopup="dialog"
      aria-label={naoLidas ? `Avisos: ${naoLidas} não lidos` : 'Avisos'} className="relative rounded-full p-2 text-(--a-e4d3ff) hover:bg-(--s-342749)">
      <Bell size={20} className={naoLidas ? 'prg-sino' : ''} />
      {naoLidas > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ed5f9a] px-1 text-[11px] font-bold text-white shadow">{naoLidas > 99 ? '99+' : naoLidas}</span>}
    </button>
    {aberto && <div role="dialog" aria-label="Avisos" className="fixed inset-x-2 top-16 z-[80] max-h-[75vh] overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-1b1529) shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
      <div className="flex items-center gap-2 border-b border-(--a-3d3152) px-4 py-3">
        <h2 className="flex-1 font-bold text-(--a-f2ebff)">🔔 Avisos</h2>
        {naoLidas > 0 && <button type="button" onClick={() => void lerTodas()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-(--a-c7a8ff) hover:bg-(--s-2b2140)"><CheckCheck size={14} /> Ler todos</button>}
        <button type="button" onClick={() => setAberto(false)} aria-label="Fechar avisos" className="rounded-lg p-1 text-(--a-c4b6d4) hover:bg-(--s-2b2140)"><X size={18} /></button>
      </div>
      <ul className="max-h-[calc(75vh-110px)] overflow-y-auto">
        {itens.length === 0 && <li className="px-4 py-10 text-center text-sm text-(--a-bfb2cf)">Nenhum aviso por enquanto. 🌙</li>}
        {itens.map(a => <li key={a.id}>
          <button type="button" onClick={() => void abrirAviso(a)} className={'flex w-full gap-3 border-b border-(--a-2b2140) px-4 py-3 text-left hover:bg-(--s-2b2140) ' + (a.lida ? 'opacity-70' : 'bg-(--s-241c38)')}>
            <span className={'mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (a.lida ? 'bg-transparent' : 'bg-[#ed5f9a]')} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-(--a-f2ebff)">{a.titulo}</span>
              {a.texto && <span className="mt-0.5 block text-xs text-(--a-c9bcd9)">{a.texto}</span>}
              <span className="mt-1 block text-[11px] text-(--a-9d8db0)">{haQuanto(a.criada_em)}{!a.lida && <span className="sr-only"> · não lido</span>}</span>
            </span>
          </button>
        </li>)}
      </ul>
      {itens.some(a => a.lida) && <div className="border-t border-(--a-3d3152) px-4 py-2 text-right">
        <button type="button" onClick={() => void limparLidas()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-(--a-c4b6d4) hover:bg-(--s-2b2140)"><Trash2 size={13} /> Apagar os já lidos</button>
      </div>}
    </div>}
  </div>
}

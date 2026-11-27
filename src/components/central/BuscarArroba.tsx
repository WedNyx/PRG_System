'use client'

import { useEffect, useState } from 'react'
import { AtSign, Loader2, UserPlus } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { limparUsuario } from '@/lib/usuario'

type Achado = { id: string; apelido: string; usuario: string }

/**
 * Campo “@ de quem você quer chamar” (v0.37.0): digita o @ ou o nome, aparecem sugestões, toca e escolhe.
 * `escolher` recebe o @ (sem o “@”). `esconder` tira da lista quem já está na campanha ou já foi escolhido.
 */
export default function BuscarArroba({ aventureiroId, escolher, esconder = [], rotulo = 'Convidar pelo @', ocupado }: {
  aventureiroId: string; escolher: (usuario: string) => void | Promise<void>; esconder?: string[]; rotulo?: string; ocupado?: boolean
}) {
  const [texto, setTexto] = useState('')
  const [achados, setAchados] = useState<Achado[]>([])
  const [buscando, setBuscando] = useState(false)
  const termo = limparUsuario(texto)

  useEffect(() => {
    if (termo.length < 2) return
    let ativo = true
    const t = setTimeout(async () => {
      setBuscando(true)
      try {
        const r = await api<{ perfis: Achado[] }>('usuarios?busca=' + encodeURIComponent(termo), { aventureiro: aventureiroId })
        if (ativo) setAchados(r.perfis)
      } catch { if (ativo) setAchados([]) } finally { if (ativo) setBuscando(false) }
    }, 250)
    return () => { ativo = false; clearTimeout(t) }
  }, [termo, aventureiroId])

  const lista = termo.length < 2 ? [] : achados.filter(a => !esconder.includes(a.usuario))
  async function usar(usuario: string) { await escolher(usuario); setTexto(''); setAchados([]) }

  return <div data-buscar-arroba className="relative">
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (termo.length >= 3) void usar(lista.find(a => a.usuario === termo)?.usuario ?? termo) }}>
      <label className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-(--a-70588c) bg-(--s-151123) px-2 focus-within:border-(--a-b79aff)">
        <AtSign size={16} className="shrink-0 text-(--a-b5a5c8)" aria-hidden />
        <span className="sr-only">{rotulo}</span>
        <input value={texto} onChange={e => setTexto(e.target.value)} maxLength={40} placeholder="usuario ou nome" autoComplete="off" autoCapitalize="none" spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none" />
        {buscando && <Loader2 size={14} className="animate-spin text-(--a-b5a5c8)" aria-hidden />}
      </label>
      <button type="submit" disabled={ocupado || termo.length < 3} className="inline-flex items-center gap-1 rounded-lg border border-(--a-70588c) px-3 text-sm hover:bg-(--s-38294d) disabled:opacity-50"><UserPlus size={15} /> Chamar</button>
    </form>
    {lista.length > 0 && <ul role="listbox" aria-label="Sugestões" className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-(--a-62527e) bg-(--s-1b1529) p-1 shadow-xl">
      {lista.map(a => <li key={a.id}><button type="button" role="option" aria-selected={false} disabled={ocupado} onClick={() => void usar(a.usuario)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-(--s-2b2140)">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--s-342749) text-xs font-semibold">{(a.apelido[0] ?? '?').toUpperCase()}</span>
        <span className="min-w-0"><span className="block truncate font-semibold">{a.apelido}</span><span className="block truncate text-xs text-(--a-b5a5c8)">@{a.usuario}</span></span>
      </button></li>)}
    </ul>}
  </div>
}

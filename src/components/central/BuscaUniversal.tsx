'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import { api, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import { linkFicha } from './PainelFichasCampanha'
import { filtrarBusca, type ItemBusca } from '@/lib/busca'

export type { ItemBusca } from '@/lib/busca'

type Ficha = { id: string; nome: string; sistema: string; campanha: { nome: string } | null; campanha_id?: string | null }
type Campanha = { id: string; nome: string; meuPapel: string; estado: string }

/**
 * Busca universal (v0.36.5): personagens, campanhas, partes da Central e ferramentas num lugar só.
 * Abre com o botão 🔎, com Ctrl+K (⌘K no Mac) ou com “/”.
 */
export default function BuscaUniversal({ aberto, fechar, aventureiroId, fixos }: { aberto: boolean; fechar: () => void; aventureiroId: string; fixos: ItemBusca[] }) {
  const router = useRouter()
  const [termo, setTermo] = useState('')
  const [sel, setSel] = useState(0)
  const [extras, setExtras] = useState<ItemBusca[] | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!aberto || extras || !NUVEM_ATIVA) return
    let vivo = true
    void Promise.all([
      api<{ fichas: Ficha[] }>('fichas', { aventureiro: aventureiroId }).then(r => r.fichas).catch(() => [] as Ficha[]),
      api<{ campanhas: Campanha[] }>('campanhas', { aventureiro: aventureiroId }).then(r => r.campanhas).catch(() => [] as Campanha[]),
    ]).then(([fichas, campanhas]) => {
      if (!vivo) return
      setExtras([
        ...fichas.map(f => ({ id: 'ficha-' + f.id, titulo: f.nome || 'Ficha sem nome', sub: f.campanha ? 'Ficha · ' + f.campanha.nome : 'Ficha avulsa', icone: '📜', grupo: 'Personagens', href: linkFicha(f), palavras: f.sistema })),
        ...campanhas.flatMap(c => [
          { id: 'camp-' + c.id, titulo: c.nome, sub: (c.meuPapel === 'mestre' ? '👑 Mestre' : c.meuPapel === 'comestre' ? '🎩 Co-mestre' : c.meuPapel === 'espectador' ? '👁️ Espectador' : '⚔️ Jogador') + (c.estado === 'encerrada' ? ' · encerrada' : ''), icone: '🏰', grupo: 'Campanhas', href: '/central?secao=campanhas&campanha=' + c.id },
          ...(c.estado !== 'encerrada' ? [{ id: 'mesa-' + c.id, titulo: 'Mesa: ' + c.nome, sub: 'Abrir a mesa virtual', icone: '🗺️', grupo: 'Campanhas', href: '/mesa?campanha=' + c.id, palavras: 'mesa virtual mapa sessao' }] : []),
        ]),
      ])
    })
    return () => { vivo = false }
  }, [aberto, extras, aventureiroId])

  useEffect(() => {
    if (!aberto) return
    const t = setTimeout(() => entrada.current?.focus(), 30)
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', esc)
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc) }
  }, [aberto, fechar])

  const todos = useMemo(() => [...fixos, ...(extras ?? [])], [fixos, extras])
  const achados = useMemo(() => filtrarBusca(todos, termo), [todos, termo])
  const atual = Math.min(sel, Math.max(0, achados.length - 1))

  useEffect(() => { lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [atual])

  if (!aberto) return null
  const escolher = (it: ItemBusca) => { fechar(); setTermo(''); setSel(0); if (it.acao) it.acao(); else if (it.href) router.push(it.href) }

  return <NaTela><div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-3 pt-[10vh] backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label="Buscar na plataforma" className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-(--a-6d5690) bg-(--s-171325) text-(--a-f2ebff) shadow-[0_30px_80px_#000c]">
      <div className="flex items-center gap-2 border-b border-(--a-3d3152) px-3">
        <Search size={18} className="shrink-0 text-(--a-b99bff)" aria-hidden="true" />
        <input ref={entrada} value={termo} onChange={e => { setTermo(e.target.value); setSel(0) }} role="combobox" aria-expanded="true" aria-controls="busca-resultados" aria-activedescendant={achados[atual] ? 'busca-' + achados[atual].id : undefined}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(achados.length - 1, atual + 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(0, atual - 1)) }
            else if (e.key === 'Enter' && achados[atual]) { e.preventDefault(); escolher(achados[atual]) }
          }}
          placeholder="Personagem, campanha, ferramenta…" aria-label="O que você procura?" className="min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none placeholder:text-(--a-a99bbb)" />
        <button type="button" onClick={fechar} aria-label="Fechar a busca" className="rounded-lg p-1.5 text-(--a-a99bbb) hover:bg-(--s-2b2140) hover:text-white"><X size={18} /></button>
      </div>
      <ul ref={lista} id="busca-resultados" role="listbox" aria-label="Resultados" className="min-h-0 flex-1 overflow-y-auto p-2">
        {achados.map((it, i) => {
          const cab = i === 0 || achados[i - 1].grupo !== it.grupo ? it.grupo : null
          return <li key={it.id} role="presentation">
            {cab && <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[.18em] text-(--ouro)">{cab}</p>}
            <div id={'busca-' + it.id} role="option" aria-selected={i === atual} onMouseEnter={() => setSel(i)} onClick={() => escolher(it)}
              className={'flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 ' + (i === atual ? 'bg-(--s-3a2c58) text-white' : 'hover:bg-(--s-2b2140)')}>
              <span className="text-xl" aria-hidden="true">{it.icone}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{it.titulo}</span>{it.sub && <span className="block truncate text-xs text-(--a-a99bbb)">{it.sub}</span>}</span>
              {i === atual && <CornerDownLeft size={15} className="shrink-0 text-(--a-b99bff)" aria-hidden="true" />}
            </div>
          </li>
        })}
        {!achados.length && <li className="px-3 py-8 text-center text-sm text-(--a-a99bbb)">Nada encontrado para “{termo}”.</li>}
        {NUVEM_ATIVA && extras === null && <li className="px-3 py-2 text-center text-xs text-(--a-a99bbb)">Carregando personagens e campanhas…</li>}
      </ul>
      <p className="hidden border-t border-(--a-3d3152) px-3 py-2 text-[11px] text-(--a-a99bbb) sm:block">↑ ↓ para escolher · Enter para abrir · Esc para fechar · Ctrl+K abre de qualquer parte da Central</p>
    </div>
  </div></NaTela>
}

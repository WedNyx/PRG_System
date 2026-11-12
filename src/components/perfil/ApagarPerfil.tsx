'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'

/** “Apagar meu perfil” (v0.33.2): explica o que some, pede o nome do perfil e apaga de verdade. */
export default function ApagarPerfil({ perfil }: { perfil: { id: string; apelido: string } }) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [manter, setManter] = useState(true)
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false)
  const [minhas, setMinhas] = useState<string[] | null>(null)
  const [levar, setLevar] = useState(false)
  // Campanhas em que a pessoa é mestre: precisam ir junto (com aviso claro).
  useEffect(() => {
    if (!aberto) return
    let vivo = true
    api<{ campanhas: { nome: string; meuPapel: string }[] }>('campanhas', { aventureiro: perfil.id })
      .then(r => { if (vivo) setMinhas(r.campanhas.filter(c => c.meuPapel === 'mestre').map(c => c.nome)) }).catch(() => { if (vivo) setMinhas([]) })
    return () => { vivo = false }
  }, [aberto, perfil.id])
  const confere = nome.trim().toLowerCase() === perfil.apelido.trim().toLowerCase() && minhas !== null && (!minhas.length || levar)

  async function apagar() {
    setOcupado(true); setErro('')
    try {
      const r = await fetch('/api/aventureiros/' + perfil.id, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-prg-aventureiro': perfil.id }, body: JSON.stringify({ confirmar: nome, manterPersonagens: manter, apagarCampanhas: levar }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.erro || 'Não foi possível apagar o perfil.')
      try {
        localStorage.removeItem('prg-visual-' + perfil.id)
        if (localStorage.getItem('prg-aventureiro-selecionado-v1') === perfil.id) localStorage.removeItem('prg-aventureiro-selecionado-v1')
      } catch {}
      window.location.href = '/portal?apagado=1'
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao apagar.'); setOcupado(false) }
  }

  return <section className="rounded-xl border border-red-900/60 bg-red-950/20 p-3" aria-label="Apagar perfil">
    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-red-200"><Trash2 size={15} /> Apagar meu perfil</h3>
    <p className="mt-1 text-xs text-(--a-b4aeca)">Apaga o perfil e tudo dele de vez, neste e em todos os aparelhos.</p>
    <button type="button" onClick={() => { setAberto(true); setNome(''); setErro('') }} className="mt-2 rounded-lg border border-red-800/70 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950/50">Apagar perfil…</button>
    {aberto && createPortal(<div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !ocupado) setAberto(false) }}>
      <div role="dialog" aria-modal="true" aria-labelledby="apagar-perfil-titulo" onKeyDown={e => { if (e.key === 'Escape' && !ocupado) setAberto(false) }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-red-800/70 bg-(--s-19172c) p-5 text-(--a-f4f0ff) shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-950 text-xl" aria-hidden="true">⚠️</span>
          <div className="min-w-0 flex-1"><h2 id="apagar-perfil-titulo" className="text-lg font-bold">Apagar “{perfil.apelido}”?</h2>
            <p className="text-sm text-(--a-c4b6d4)">Não dá para desfazer.</p></div>
          <button type="button" disabled={ocupado} onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-lg p-1 text-(--a-b4aeca) hover:bg-white/10"><X size={18} /></button>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-(--a-d6c8e8)">
          <li>🗑️ Some: o perfil, a foto, a senha, a aparência, as fichas avulsas, os sistemas que você criou e as suas playlists.</li>
          <li>🏰 Você sai de todas as campanhas em que joga.</li>
          <li>💡 Quer guardar um personagem? Baixe a ficha antes (botão ⬇️ no topo da ficha).</li>
        </ul>
        {!!minhas?.length && <label className="mt-4 flex items-start gap-2 rounded-xl border border-red-800/70 bg-red-950/30 p-3 text-sm">
          <input type="checkbox" checked={levar} onChange={e => setLevar(e.target.checked)} className="mt-0.5 accent-red-500" />
          <span>Apagar também as minhas campanhas: <b>{minhas.join(', ')}</b> <span className="block text-xs text-(--a-c4b6d4)">Você é mestre delas. Some a mesa, o diário e as fichas que estão nelas; as fichas avulsas dos jogadores continuam com eles. Sem marcar, não dá para apagar o perfil.</span></span>
        </label>}
        <label className="mt-4 flex items-start gap-2 rounded-xl border border-(--a-4a4267) bg-(--s-151223) p-3 text-sm">
          <input type="checkbox" checked={manter} onChange={e => setManter(e.target.checked)} className="mt-0.5 accent-(--a-b99bff)" />
          <span>Deixar meus personagens das campanhas de outros mestres com eles, como NPC <span className="block text-xs text-(--a-a99bbb)">Assim a história continua. Sem marcar, eles também são apagados.</span></span>
        </label>
        <label className="mt-4 block text-sm text-(--a-b4aeca)">Para confirmar, escreva <b className="text-white">{perfil.apelido}</b>
          <input value={nome} onChange={e => setNome(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-lg border border-(--a-4a4267) bg-(--s-100f20) p-3 text-white outline-none focus:border-red-400" /></label>
        {erro && <p role="alert" className="mt-3 rounded-lg border border-red-500/40 p-3 text-sm text-red-200">{erro}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={ocupado} onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-(--a-62527e) p-2.5">Cancelar</button>
          <button type="button" disabled={!confere || ocupado} onClick={() => void apagar()} className="flex-1 rounded-lg bg-red-700 p-2.5 font-semibold text-white hover:bg-red-600 disabled:opacity-40">{ocupado ? 'Apagando…' : 'Apagar para sempre'}</button>
        </div>
      </div>
    </div>, document.body)}
  </section>
}

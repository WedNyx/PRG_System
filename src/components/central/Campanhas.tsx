'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Castle, Pencil, Plus, Save, X } from 'lucide-react'

export type Modelo = 'A' | 'B' | 'C'
type Campanha = {
  id: string
  mestreId: string
  nome: string
  descricao: string
  sistema: string
  modeloPadrao: Modelo
  excecoes: Record<string, Modelo>
  criadaEm: string
}
const PREFIX = 'prg-campanhas-rascunho-v1-'
const modelos: { id: Modelo; nome: string; detalhe: string }[] = [
  { id: 'A', nome: 'Jogador edita', detalhe: 'O jogador edita; o mestre supervisiona.' },
  { id: 'B', nome: 'Mestre controla', detalhe: 'O mestre edita; o jogador solicita mudanças.' },
  { id: 'C', nome: 'Compartilhado', detalhe: 'Edição compartilhada com aprovações.' },
]
const isModelo = (v: unknown): v is Modelo => v === 'A' || v === 'B' || v === 'C'
const valid = (c: unknown): c is Campanha => {
  if (!c || typeof c !== 'object') return false
  const v = c as Record<string, unknown>
  return typeof v.id === 'string' && /^[a-f0-9-]{36}$/.test(v.id) &&
    typeof v.mestreId === 'string' && typeof v.nome === 'string' &&
    typeof v.descricao === 'string' && typeof v.sistema === 'string' &&
    isModelo(v.modeloPadrao) && typeof v.criadaEm === 'string' &&
    !!v.excecoes && typeof v.excecoes === 'object' && !Array.isArray(v.excecoes)
}
export default function Campanhas({ aventureiroId }: { aventureiroId: string }) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [mode, setMode] = useState<'lista' | 'criar' | 'editar'>('lista')
  const [editing, setEditing] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [sistema, setSistema] = useState('Lunethernnyis — Opositores')
  const [modelo, setModelo] = useState<Modelo>('C')
  const [erro, setErro] = useState('')
  const [ready, setReady] = useState(false)
  const key = PREFIX + aventureiroId

  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) || '[]')
      setCampanhas(Array.isArray(raw) ? raw.filter(valid).filter(c => c.mestreId === aventureiroId).slice(0, 100) : [])
    } catch { setErro('Não foi possível carregar os rascunhos locais.') }
    setReady(true)
  }, [aventureiroId])

  function startCreate() {
    setEditing(null); setNome(''); setDescricao(''); setSistema('Lunethernnyis — Opositores'); setModelo('C'); setErro(''); setMode('criar')
  }
  function startEdit(c: Campanha) {
    setEditing(c.id); setNome(c.nome); setDescricao(c.descricao); setSistema(c.sistema); setModelo(c.modeloPadrao); setErro(''); setMode('editar')
  }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const n = nome.trim(), d = descricao.trim(), s = sistema.trim()
    if (n.length < 3 || n.length > 80 || d.length > 600 || s.length < 2 || s.length > 80) {
      setErro('Informe um nome (3–80 caracteres), sistema (2–80) e descrição de até 600 caracteres.'); return
    }
    try {
      const next = editing
        ? campanhas.map(c => c.id === editing ? { ...c, nome: n, descricao: d, sistema: s, modeloPadrao: modelo } : c)
        : [...campanhas, { id: crypto.randomUUID(), mestreId: aventureiroId, nome: n, descricao: d, sistema: s, modeloPadrao: modelo, excecoes: {}, criadaEm: new Date().toISOString() }]
      if (next.length > 100) { setErro('Limite de 100 rascunhos neste navegador.'); return }
      localStorage.setItem(key, JSON.stringify(next))
      setCampanhas(next); setMode('lista'); setEditing(null); setErro('')
    } catch { setErro('Não foi possível salvar. Verifique o armazenamento do navegador.') }
  }
  return <div className="mt-6 space-y-5">
    <div className="rounded-xl border border-[#67517f] bg-[#2b2140] p-4 text-sm text-[#e6d9f6]" role="note">
      <strong>Etapa 1 — Rascunhos locais:</strong> campanhas criadas aqui ficam apenas neste navegador. Ainda não há convites, jogadores conectados, permissões efetivas ou sincronização. Não compartilhe códigos: nenhum código de convite é gerado nesta etapa.
    </div>
    {mode === 'lista' ? <>
      <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-3 font-semibold hover:bg-[#8b68c4]"><Plus size={18}/> Criar campanha</button>
      {ready && campanhas.length === 0 && <div className="rounded-2xl border border-dashed border-[#594871] p-8 text-center text-[#cbb9dc]"><Castle className="mx-auto mb-3" size={32}/>Nenhuma campanha criada neste navegador.</div>}
      <div className="grid gap-4 sm:grid-cols-2">{campanhas.map(c => <article key={c.id} className="rounded-2xl border border-[#55456e] bg-[#201a32] p-5">
        <div className="flex items-start gap-3"><BookOpen className="shrink-0 text-[#c5a7ff]"/><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{c.nome}</h2><p className="mt-1 text-sm text-[#c4b6d4]">{c.sistema}</p></div></div>
        {c.descricao && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#d1c4df]">{c.descricao}</p>}
        <p className="mt-3 text-sm text-[#d4baff]">Modelo padrão {c.modeloPadrao} — {modelos.find(m => m.id === c.modeloPadrao)?.nome}</p>
        <p className="mt-1 text-xs text-[#ab9bbc]">Exceções individuais: disponíveis quando houver participantes autenticados.</p>
        <button type="button" onClick={() => startEdit(c)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#70588c] px-3 py-2 text-sm hover:bg-[#38294d]"><Pencil size={16}/> Editar configurações</button>
      </article>)}</div>
    </> : <form onSubmit={save} className="max-w-2xl space-y-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{mode === 'criar' ? 'Nova campanha' : 'Editar campanha'}</h2><button type="button" onClick={() => { setMode('lista'); setErro('') }} aria-label="Cancelar" className="rounded-lg p-2 hover:bg-[#38294d]"><X size={20}/></button></div>
      <label className="block text-sm font-medium">Nome da campanha<input required minLength={3} maxLength={80} value={nome} onChange={e => setNome(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" placeholder="Ex.: Ecos da Lua Partida"/></label>
      <label className="block text-sm font-medium">Descrição<textarea maxLength={600} rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" placeholder="Conte sobre sua aventura..."/></label>
      <label className="block text-sm font-medium">Sistema de RPG<input required minLength={2} maxLength={80} value={sistema} onChange={e => setSistema(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white"/></label>
      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Modelo padrão de edição das fichas</legend>
        {modelos.map(m => <label key={m.id} className={'flex cursor-pointer gap-3 rounded-xl border p-4 ' + (modelo === m.id ? 'border-[#b79aff] bg-[#3a2a53]' : 'border-[#55456e]')}>
          <input type="radio" name="modelo" checked={modelo === m.id} onChange={() => setModelo(m.id)} className="accent-[#b79aff]"/>
          <span><strong>{m.id} — {m.nome}</strong><span className="mt-1 block text-sm text-[#c9b9d8]">{m.detalhe}</span></span>
        </label>)}
      </fieldset>
      <p className="text-xs leading-relaxed text-[#b9a7ca]">O modelo escolhido será o padrão da campanha. Futuramente o mestre poderá atribuir exceções por jogador, com verificação no servidor. Alterar o padrão não apagará fichas.</p>
      {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
      <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-5 py-3 font-semibold hover:bg-[#8b68c4]"><Save size={18}/> Salvar rascunho</button>
    </form>}
    {mode === 'lista' && erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
  </div>
}

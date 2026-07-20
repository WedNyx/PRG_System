'use client'

import { useEffect, useRef, useState } from 'react'
import { enviarMensagem, rolarDados } from '@/app/actions/mesa'
import { atualizarIniciativa, atualizarTurno } from '@/app/actions/campanhas'
import { detectarCritico } from '@/lib/dice'
import type { IniciativaEntry, Macro, Mensagem, Rolagem } from '@/types/database'

export type ItemFeed =
  | {
      tipo: 'msg'
      id: string
      playerId: string
      conteudo: string
      msgTipo: string
      destinatarioId: string | null
      createdAt: string
    }
  | {
      tipo: 'roll'
      id: string
      playerId: string
      expressao: string
      resultados: number[]
      total: number
      secreta: boolean
      createdAt: string
    }

export function mensagemParaItem(m: Mensagem): ItemFeed {
  return {
    tipo: 'msg',
    id: m.id,
    playerId: m.player_id,
    conteudo: m.conteudo,
    msgTipo: m.tipo,
    destinatarioId: m.destinatario_id,
    createdAt: m.created_at,
  }
}

export function rolagemParaItem(r: Rolagem): ItemFeed {
  return {
    tipo: 'roll',
    id: r.id,
    playerId: r.player_id,
    expressao: r.expressao,
    resultados: r.resultados,
    total: r.total,
    secreta: r.is_secreta,
    createdAt: r.created_at,
  }
}

const DADOS_RAPIDOS = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100']

type Membro = { id: string; username: string }

export default function PainelLateral({
  campanhaId,
  feed,
  iniciativa,
  turno,
  nomes,
  membros,
  meuId,
  souMestre,
  macros,
  onRolarIniciativaTodos,
}: {
  campanhaId: string
  feed: ItemFeed[]
  iniciativa: IniciativaEntry[]
  turno: number
  nomes: Record<string, string>
  membros: Membro[]
  meuId: string
  souMestre: boolean
  macros: Macro[]
  onRolarIniciativaTodos: () => void
}) {
  const [aba, setAba] = useState<'chat' | 'iniciativa'>('chat')

  return (
    <div className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setAba('chat')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            aba === 'chat' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          💬 Chat & Dados
        </button>
        <button
          onClick={() => setAba('iniciativa')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            aba === 'iniciativa' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          ⚔️ Iniciativa
        </button>
      </div>

      {aba === 'chat' ? (
        <AbaChat
          campanhaId={campanhaId}
          feed={feed}
          nomes={nomes}
          membros={membros}
          meuId={meuId}
          souMestre={souMestre}
          macros={macros}
        />
      ) : (
        <AbaIniciativa
          campanhaId={campanhaId}
          iniciativa={iniciativa}
          turno={turno}
          souMestre={souMestre}
          onRolarTodos={onRolarIniciativaTodos}
        />
      )}
    </div>
  )
}

function AbaChat({
  campanhaId,
  feed,
  nomes,
  membros,
  meuId,
  souMestre,
  macros,
}: {
  campanhaId: string
  feed: ItemFeed[]
  nomes: Record<string, string>
  membros: Membro[]
  meuId: string
  souMestre: boolean
  macros: Macro[]
}) {
  const [texto, setTexto] = useState('')
  const [expressao, setExpressao] = useState('')
  const [secreta, setSecreta] = useState(false)
  const [destinatario, setDestinatario] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feed.length])

  async function mandarMensagem(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setTexto('')
    setErro(null)

    // Comandos: /r rolagem · /me emote · /ooc fora do personagem · /w nome sussurro
    if (t.startsWith('/r ') || t.startsWith('/roll ')) {
      const result = await rolarDados(campanhaId, t.replace(/^\/(r|roll)\s+/, ''), false)
      if (result?.error) setErro(result.error)
      return
    }
    if (t.startsWith('/me ')) {
      const result = await enviarMensagem(campanhaId, t.slice(4), 'emote')
      if (result?.error) setErro(result.error)
      return
    }
    if (t.startsWith('/ooc ')) {
      const result = await enviarMensagem(campanhaId, t.slice(5), 'ooc')
      if (result?.error) setErro(result.error)
      return
    }
    if (t.startsWith('/w ')) {
      const [, alvo, ...resto] = t.split(' ')
      const membro = membros.find((m) => m.username.toLowerCase() === alvo?.toLowerCase())
      if (!membro) {
        setErro(`Jogador "${alvo}" não encontrado. Use /w NomeExato mensagem`)
        return
      }
      const result = await enviarMensagem(campanhaId, resto.join(' '), 'sussurro', membro.id)
      if (result?.error) setErro(result.error)
      return
    }

    const tipo = destinatario ? 'sussurro' : 'fala'
    const result = await enviarMensagem(campanhaId, t, tipo, destinatario || null)
    if (result?.error) setErro(result.error)
  }

  async function rolar(expr: string) {
    setErro(null)
    const result = await rolarDados(campanhaId, expr, secreta && souMestre)
    if (result?.error) setErro(result.error)
    setExpressao('')
  }

  return (
    <>
      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {feed.length === 0 && (
          <p className="text-xs text-slate-600 text-center mt-8">
            O chat da sessão começa aqui.
            <br />
            Comandos: /r 1d20 · /me ação · /ooc · /w nome
          </p>
        )}
        {feed.map((item) => (
          <FeedItem key={item.id} item={item} nomes={nomes} meuId={meuId} />
        ))}
        <div ref={fimRef} />
      </div>

      {erro && <div className="mx-3 mb-2 text-xs text-red-400 bg-red-950/50 rounded px-2 py-1">{erro}</div>}

      {/* Macros do jogador */}
      {macros.length > 0 && (
        <div className="px-3 pb-1 flex flex-wrap gap-1.5">
          {macros.map((m, i) => (
            <button
              key={i}
              onClick={() => rolar(m.expressao)}
              title={m.expressao}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-1 rounded transition-colors"
            >
              ⚡ {m.nome}
            </button>
          ))}
        </div>
      )}

      {/* Dados rápidos + vantagem */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {DADOS_RAPIDOS.map((d) => (
          <button
            key={d}
            onClick={() => rolar(d)}
            className="text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => rolar('2d20kh1')}
          title="Vantagem: rola 2d20 e usa o maior"
          className="text-xs bg-emerald-900/50 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 px-2 py-1 rounded transition-colors"
        >
          ⬆ Vant
        </button>
        <button
          onClick={() => rolar('2d20kl1')}
          title="Desvantagem: rola 2d20 e usa o menor"
          className="text-xs bg-red-900/50 hover:bg-red-900 border border-red-700/50 text-red-300 px-2 py-1 rounded transition-colors"
        >
          ⬇ Desv
        </button>
      </div>

      {/* Rolagem custom */}
      <div className="px-3 pb-2 flex gap-1.5">
        <input
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && expressao.trim()) rolar(expressao)
          }}
          placeholder="2d6+3 · 4d6kh3 · 1d6!"
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder-slate-600"
        />
        <button
          onClick={() => expressao.trim() && rolar(expressao)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          🎲
        </button>
      </div>
      {souMestre && (
        <label className="px-3 pb-2 flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={secreta}
            onChange={(e) => setSecreta(e.target.checked)}
            className="accent-purple-500"
          />
          Rolagem secreta (só você vê) 🤫
        </label>
      )}

      {/* Destinatário + mensagem */}
      <div className="px-3 pb-1 border-t border-slate-800 pt-2">
        <select
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-400 rounded-lg px-2 py-1 text-xs focus:outline-none"
        >
          <option value="">💬 Para todos</option>
          {membros
            .filter((m) => m.id !== meuId)
            .map((m) => (
              <option key={m.id} value={m.id}>
                🤫 Sussurrar para {m.username}
              </option>
            ))}
        </select>
      </div>
      <form onSubmit={mandarMensagem} className="p-3 pt-1.5 flex gap-1.5">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem, /r, /me, /ooc, /w..."
          maxLength={2000}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
        />
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          ➤
        </button>
      </form>
    </>
  )
}

function FeedItem({ item, nomes, meuId }: { item: ItemFeed; nomes: Record<string, string>; meuId: string }) {
  if (item.tipo === 'roll') {
    const critico = detectarCritico(item.expressao, item.resultados)
    return (
      <div
        className={`rounded-lg px-3 py-2 border ${
          item.secreta
            ? 'bg-purple-950/40 border-purple-800/50'
            : critico === 'critico'
              ? 'bg-amber-500/10 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
              : critico === 'falha'
                ? 'bg-red-950/40 border-red-700/50'
                : 'bg-slate-800/60 border-slate-700/50'
        }`}
      >
        <span className="font-semibold text-slate-200 text-sm">{nomes[item.playerId] ?? '?'}</span>
        <span className="text-slate-400 text-sm"> rolou </span>
        <span className="font-mono text-amber-300 text-sm">{item.expressao}</span>
        {item.secreta && <span className="text-purple-400 text-xs"> (secreta 🤫)</span>}
        {critico === 'critico' && <span className="text-amber-300 text-xs font-bold"> ✨ CRÍTICO!</span>}
        {critico === 'falha' && <span className="text-red-400 text-xs font-bold"> 💥 FALHA CRÍTICA!</span>}
        <div className="text-xs text-slate-500 font-mono mt-0.5">[{item.resultados.join(', ')}]</div>
        <div className={`text-lg font-bold ${critico === 'critico' ? 'text-amber-300' : 'text-amber-400'}`}>
          = {item.total}
        </div>
      </div>
    )
  }

  const autor = nomes[item.playerId] ?? '?'
  const minha = item.playerId === meuId

  if (item.msgTipo === 'emote') {
    return (
      <div className="text-sm italic text-violet-300">
        * {autor} {item.conteudo}
      </div>
    )
  }
  if (item.msgTipo === 'ooc') {
    return (
      <div className="text-sm text-slate-500">
        <span className="text-[10px] font-bold uppercase mr-1 bg-slate-800 px-1 rounded">ooc</span>
        <b>{autor}:</b> {item.conteudo}
      </div>
    )
  }
  if (item.msgTipo === 'sussurro') {
    const dest = item.destinatarioId ? (nomes[item.destinatarioId] ?? '?') : '?'
    return (
      <div className="text-sm text-purple-300 bg-purple-950/30 border border-purple-800/40 rounded-lg px-2.5 py-1.5">
        🤫 <b>{autor}</b> <span className="text-purple-400/70">→ {dest}:</span> {item.conteudo}
      </div>
    )
  }
  return (
    <div className="text-sm">
      <span className={`font-semibold ${minha ? 'text-amber-400' : 'text-blue-400'}`}>{autor}:</span>{' '}
      <span className="text-slate-300 break-words">{item.conteudo}</span>
    </div>
  )
}

function AbaIniciativa({
  campanhaId,
  iniciativa,
  turno,
  souMestre,
  onRolarTodos,
}: {
  campanhaId: string
  iniciativa: IniciativaEntry[]
  turno: number
  souMestre: boolean
  onRolarTodos: () => void
}) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  const ordenada = [...iniciativa].sort((a, b) => b.valor - a.valor)
  const turnoAtual = ordenada.length > 0 ? turno % ordenada.length : 0

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || valor === '') return
    const nova = [...iniciativa, { nome: nome.trim(), valor: parseInt(valor) || 0 }]
    setNome('')
    setValor('')
    await atualizarIniciativa(campanhaId, nova)
  }

  async function remover(idx: number) {
    const alvo = ordenada[idx]
    const nova = iniciativa.filter((e) => !(e.nome === alvo.nome && e.valor === alvo.valor))
    await atualizarIniciativa(campanhaId, nova)
  }

  async function proximoTurno() {
    await atualizarTurno(campanhaId, (turnoAtual + 1) % Math.max(1, ordenada.length))
  }

  async function limpar() {
    await atualizarIniciativa(campanhaId, [])
    await atualizarTurno(campanhaId, 0)
  }

  return (
    <div className="flex-1 flex flex-col p-3 min-h-0">
      {souMestre && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={onRolarTodos}
            title="Rola 1d20 para cada token do mapa"
            className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            🎲 Rolar todos
          </button>
          {ordenada.length > 0 && (
            <button
              onClick={proximoTurno}
              className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              ▶ Próximo turno
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5">
        {ordenada.length === 0 && (
          <p className="text-xs text-slate-600 text-center mt-8">
            Nenhuma iniciativa rolada ainda.
            {souMestre && ' Use "Rolar todos" ou adicione abaixo!'}
          </p>
        )}
        {ordenada.map((e, i) => (
          <div
            key={`${e.nome}-${i}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
              i === turnoAtual ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800/60 border-slate-700/50'
            }`}
          >
            <span className={`font-bold font-mono w-8 text-center ${i === turnoAtual ? 'text-amber-400' : 'text-slate-400'}`}>
              {e.valor}
            </span>
            <span className="flex-1 text-sm text-slate-200 truncate">
              {i === turnoAtual && '▶ '}
              {e.nome}
            </span>
            {souMestre && (
              <button onClick={() => remover(i)} className="text-slate-600 hover:text-red-400 text-xs">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {souMestre && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <form onSubmit={adicionar} className="flex gap-1.5">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
              className="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              type="number"
              placeholder="Init"
              className="w-16 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 rounded-lg text-sm">
              +
            </button>
          </form>
          {ordenada.length > 0 && (
            <button onClick={limpar} className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors">
              Limpar iniciativa
            </button>
          )}
        </div>
      )}
    </div>
  )
}

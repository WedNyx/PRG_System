'use client'

import { useEffect, useRef, useState } from 'react'
import { enviarMensagem, rolarDados } from '@/app/actions/mesa'
import { atualizarIniciativa } from '@/app/actions/campanhas'
import type { IniciativaEntry, Mensagem, Rolagem } from '@/types/database'

export type ItemFeed =
  | { tipo: 'msg'; id: string; playerId: string; conteudo: string; createdAt: string }
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
  return { tipo: 'msg', id: m.id, playerId: m.player_id, conteudo: m.conteudo, createdAt: m.created_at }
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

export default function PainelLateral({
  campanhaId,
  feed,
  iniciativa,
  nomes,
  meuId,
  souMestre,
}: {
  campanhaId: string
  feed: ItemFeed[]
  iniciativa: IniciativaEntry[]
  nomes: Record<string, string>
  meuId: string
  souMestre: boolean
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
        <AbaChat campanhaId={campanhaId} feed={feed} nomes={nomes} meuId={meuId} souMestre={souMestre} />
      ) : (
        <AbaIniciativa campanhaId={campanhaId} iniciativa={iniciativa} souMestre={souMestre} />
      )}
    </div>
  )
}

function AbaChat({
  campanhaId,
  feed,
  nomes,
  meuId,
  souMestre,
}: {
  campanhaId: string
  feed: ItemFeed[]
  nomes: Record<string, string>
  meuId: string
  souMestre: boolean
}) {
  const [texto, setTexto] = useState('')
  const [expressao, setExpressao] = useState('')
  const [secreta, setSecreta] = useState(false)
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
    // Suporte a /r 2d6+3 direto no chat
    if (t.startsWith('/r ') || t.startsWith('/roll ')) {
      const expr = t.replace(/^\/(r|roll)\s+/, '')
      const result = await rolarDados(campanhaId, expr, false)
      if (result?.error) setErro(result.error)
      return
    }
    const result = await enviarMensagem(campanhaId, t)
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
            O chat da sessão começa aqui. Digite /r 1d20 para rolar!
          </p>
        )}
        {feed.map((item) => (
          <div key={item.id} className="text-sm">
            {item.tipo === 'msg' ? (
              <div>
                <span className={`font-semibold ${item.playerId === meuId ? 'text-amber-400' : 'text-blue-400'}`}>
                  {nomes[item.playerId] ?? '?'}:
                </span>{' '}
                <span className="text-slate-300 break-words">{item.conteudo}</span>
              </div>
            ) : (
              <div
                className={`rounded-lg px-3 py-2 border ${
                  item.secreta
                    ? 'bg-purple-950/40 border-purple-800/50'
                    : 'bg-slate-800/60 border-slate-700/50'
                }`}
              >
                <span className="font-semibold text-slate-200">{nomes[item.playerId] ?? '?'}</span>
                <span className="text-slate-400"> rolou </span>
                <span className="font-mono text-amber-300">{item.expressao}</span>
                {item.secreta && <span className="text-purple-400 text-xs"> (secreta 🤫)</span>}
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  [{item.resultados.join(', ')}]
                </div>
                <div className="text-lg font-bold text-amber-400">= {item.total}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      {erro && <div className="mx-3 mb-2 text-xs text-red-400 bg-red-950/50 rounded px-2 py-1">{erro}</div>}

      {/* Dados rápidos */}
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
      </div>

      {/* Rolagem custom */}
      <div className="px-3 pb-2 flex gap-1.5">
        <input
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && expressao.trim()) rolar(expressao)
          }}
          placeholder="2d6+3"
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

      {/* Mensagem */}
      <form onSubmit={mandarMensagem} className="p-3 pt-1 border-t border-slate-800 flex gap-1.5">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem ou /r 1d20..."
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

function AbaIniciativa({
  campanhaId,
  iniciativa,
  souMestre,
}: {
  campanhaId: string
  iniciativa: IniciativaEntry[]
  souMestre: boolean
}) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  const ordenada = [...iniciativa].sort((a, b) => b.valor - a.valor)

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

  async function limpar() {
    await atualizarIniciativa(campanhaId, [])
  }

  return (
    <div className="flex-1 flex flex-col p-3">
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {ordenada.length === 0 && (
          <p className="text-xs text-slate-600 text-center mt-8">
            Nenhuma iniciativa rolada ainda.
            {souMestre && ' Adicione os combatentes abaixo!'}
          </p>
        )}
        {ordenada.map((e, i) => (
          <div
            key={`${e.nome}-${i}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
              i === 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800/60 border-slate-700/50'
            }`}
          >
            <span className={`font-bold font-mono w-8 text-center ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {e.valor}
            </span>
            <span className="flex-1 text-sm text-slate-200 truncate">
              {i === 0 && '▶ '}
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
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 rounded-lg text-sm"
            >
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

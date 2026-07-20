'use client'

import { useRef, useState } from 'react'
import { atualizarFicha } from '@/app/actions/personagens'
import { rolarDados } from '@/app/actions/mesa'
import { uploadImagem } from '@/lib/upload'
import { modificadorD20, type TemplateFicha } from '@/lib/fichas'
import type { Macro, Personagem } from '@/types/database'

const CORES_TOKEN = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function FichaEditor({
  personagem,
  campanhaId,
  template,
  podeEditar,
}: {
  personagem: Personagem
  campanhaId: string
  template: TemplateFicha
  podeEditar: boolean
}) {
  const [nome, setNome] = useState(personagem.nome)
  const [hpAtual, setHpAtual] = useState(personagem.hp_atual)
  const [hpMax, setHpMax] = useState(personagem.hp_max)
  const [cor, setCor] = useState(personagem.cor)
  const [tokenUrl, setTokenUrl] = useState(personagem.token_url)
  const [dados, setDados] = useState<Record<string, string | number>>(personagem.dados ?? {})
  const [macros, setMacros] = useState<Macro[]>(personagem.macros ?? [])
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [ultimaRolagem, setUltimaRolagem] = useState<string | null>(null)
  const [novoMacro, setNovoMacro] = useState({ nome: '', expressao: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  function setCampo(id: string, valor: string | number) {
    setDados((d) => ({ ...d, [id]: valor }))
  }

  async function salvar() {
    setStatus('saving')
    const result = await atualizarFicha(personagem.id, campanhaId, {
      nome,
      dados,
      hp_atual: hpAtual,
      hp_max: hpMax,
      cor,
      token_url: tokenUrl,
      macros,
    })
    setStatus(result?.error ? 'error' : 'saved')
    if (!result?.error) setTimeout(() => setStatus('idle'), 2000)
  }

  async function rolarNoChat(expressao: string, rotulo: string) {
    setUltimaRolagem(`Rolando ${rotulo}...`)
    const result = await rolarDados(campanhaId, expressao, false)
    if (result?.error) {
      setUltimaRolagem(`Erro: ${result.error}`)
    } else if (result?.resultado) {
      setUltimaRolagem(`🎲 ${rotulo}: ${result.resultado.detalhes} = ${result.resultado.total} (enviado ao chat da mesa!)`)
    }
  }

  async function enviarToken(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await uploadImagem(file, `tokens/${campanhaId}`)
    if (result.url) setTokenUrl(result.url)
    else alert(result.error)
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500 disabled:opacity-60'

  return (
    <div className="mt-3 space-y-6">
      {/* Cabeçalho da ficha */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => podeEditar && fileRef.current?.click()}
            title={podeEditar ? 'Clique para enviar imagem do token' : undefined}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-950 font-bold text-2xl shrink-0 overflow-hidden bg-cover bg-center"
            style={{
              backgroundColor: cor,
              backgroundImage: tokenUrl ? `url(${tokenUrl})` : undefined,
            }}
          >
            {!tokenUrl && (nome[0]?.toUpperCase() ?? '?')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={enviarToken} className="hidden" />
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-slate-500 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={!podeEditar}
              maxLength={60}
              className={`${inputClass} text-lg font-semibold`}
            />
          </div>
          <div className="w-20">
            <label className="block text-xs text-slate-500 mb-1">HP Atual</label>
            <input
              type="number"
              value={hpAtual}
              onChange={(e) => setHpAtual(parseInt(e.target.value) || 0)}
              disabled={!podeEditar}
              className={inputClass}
            />
          </div>
          <div className="w-20">
            <label className="block text-xs text-slate-500 mb-1">HP Máx</label>
            <input
              type="number"
              value={hpMax}
              onChange={(e) => setHpMax(parseInt(e.target.value) || 0)}
              disabled={!podeEditar}
              className={inputClass}
            />
          </div>
        </div>

        {/* Barra de HP */}
        <div className="mt-4">
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${hpMax > 0 ? Math.max(0, Math.min(100, (hpAtual / hpMax) * 100)) : 0}%`,
                backgroundColor:
                  hpAtual / Math.max(1, hpMax) > 0.5
                    ? '#10b981'
                    : hpAtual / Math.max(1, hpMax) > 0.25
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            />
          </div>
        </div>

        {/* Cor do token */}
        {podeEditar && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Cor do token:</span>
            {CORES_TOKEN.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                  cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <span className="text-xs text-slate-600 ml-2">
              💡 clique no avatar para enviar uma imagem
            </span>
          </div>
        )}
      </div>

      {/* Feedback de rolagem */}
      {ultimaRolagem && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-2.5 rounded-xl">
          {ultimaRolagem}
        </div>
      )}

      {/* Macros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-amber-400 mb-1">⚡ Macros de Rolagem</h3>
        <p className="text-xs text-slate-500 mb-4">
          Crie botões de rolagem prontos — eles aparecem aqui e na mesa ao vivo!
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {macros.length === 0 && (
            <span className="text-xs text-slate-600">Nenhum macro ainda. Ex: “Ataque” → 1d20+7</span>
          )}
          {macros.map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => rolarNoChat(m.expressao, m.nome)}
                className="px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                title={m.expressao}
              >
                🎲 {m.nome}
              </button>
              {podeEditar && (
                <button
                  onClick={() => setMacros(macros.filter((_, j) => j !== i))}
                  className="px-2 py-1.5 text-slate-600 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
        {podeEditar && (
          <div className="flex gap-2 flex-wrap">
            <input
              value={novoMacro.nome}
              onChange={(e) => setNovoMacro({ ...novoMacro, nome: e.target.value })}
              placeholder="Nome (ex: Ataque)"
              maxLength={30}
              className={`${inputClass} flex-1 min-w-32`}
            />
            <input
              value={novoMacro.expressao}
              onChange={(e) => setNovoMacro({ ...novoMacro, expressao: e.target.value })}
              placeholder="1d20+7"
              maxLength={40}
              className={`${inputClass} w-32 font-mono`}
            />
            <button
              onClick={() => {
                if (novoMacro.nome.trim() && novoMacro.expressao.trim()) {
                  setMacros([...macros, { nome: novoMacro.nome.trim(), expressao: novoMacro.expressao.trim() }])
                  setNovoMacro({ nome: '', expressao: '' })
                }
              }}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + Adicionar
            </button>
          </div>
        )}
      </div>

      {/* Seções do template */}
      {template.secoes.map((secao) => (
        <div key={secao.titulo} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-4">{secao.titulo}</h3>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(secao.colunas ?? 3, 6)}, minmax(0, 1fr))`,
            }}
          >
            {secao.campos.map((campo) => (
              <div key={campo.id} className={campo.tipo === 'area' ? 'col-span-full' : ''}>
                <label className="block text-xs text-slate-500 mb-1">{campo.label}</label>
                {campo.tipo === 'area' ? (
                  <textarea
                    value={String(dados[campo.id] ?? '')}
                    onChange={(e) => setCampo(campo.id, e.target.value)}
                    disabled={!podeEditar}
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />
                ) : campo.tipo === 'numero' ? (
                  <>
                    <input
                      type="number"
                      value={dados[campo.id] ?? ''}
                      onChange={(e) => setCampo(campo.id, parseInt(e.target.value) || 0)}
                      disabled={!podeEditar}
                      className={`${inputClass} text-center`}
                    />
                    {campo.mod && (
                      <button
                        onClick={() => {
                          const mod = modificadorD20(Number(dados[campo.id]) || 10)
                          rolarNoChat(`1d20${mod === '+0' ? '' : mod}`, `${campo.label} (${mod})`)
                        }}
                        title={`Rolar 1d20${modificadorD20(Number(dados[campo.id]) || 10)}`}
                        className="w-full text-center text-xs text-amber-400 mt-1 font-mono hover:bg-amber-500/10 rounded py-0.5 transition-colors cursor-pointer"
                      >
                        🎲 {modificadorD20(Number(dados[campo.id]) || 10)}
                      </button>
                    )}
                  </>
                ) : (
                  <input
                    value={String(dados[campo.id] ?? '')}
                    onChange={(e) => setCampo(campo.id, e.target.value)}
                    disabled={!podeEditar}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Barra de salvar */}
      {podeEditar && (
        <div className="sticky bottom-4 flex items-center justify-end gap-3 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl px-4 py-3">
          {status === 'saved' && <span className="text-sm text-emerald-400">✓ Ficha salva!</span>}
          {status === 'error' && <span className="text-sm text-red-400">Erro ao salvar</span>}
          <button
            onClick={salvar}
            disabled={status === 'saving'}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-amber-900 text-slate-950 font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
          >
            {status === 'saving' ? 'Salvando...' : 'Salvar ficha'}
          </button>
        </div>
      )}
    </div>
  )
}

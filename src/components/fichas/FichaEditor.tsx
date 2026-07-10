'use client'

import { useState } from 'react'
import { atualizarFicha } from '@/app/actions/personagens'
import { modificadorD20, type TemplateFicha } from '@/lib/fichas'
import type { Personagem } from '@/types/database'

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
  const [dados, setDados] = useState<Record<string, string | number>>(personagem.dados ?? {})
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

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
    })
    setStatus(result?.error ? 'error' : 'saved')
    if (!result?.error) setTimeout(() => setStatus('idle'), 2000)
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-500 disabled:opacity-60'

  return (
    <div className="mt-3 space-y-6">
      {/* Cabeçalho da ficha */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-950 font-bold text-2xl shrink-0"
            style={{ backgroundColor: cor }}
          >
            {nome[0]?.toUpperCase() ?? '?'}
          </div>
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
              className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all"
              style={{ width: `${hpMax > 0 ? Math.max(0, Math.min(100, (hpAtual / hpMax) * 100)) : 0}%` }}
            />
          </div>
        </div>

        {/* Cor do token */}
        {podeEditar && (
          <div className="mt-4 flex items-center gap-2">
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
                      <p className="text-center text-xs text-amber-400 mt-1 font-mono">
                        {modificadorD20(Number(dados[campo.id]) || 10)}
                      </p>
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

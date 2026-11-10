'use client'

import { useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { MODELOS_ROLAGEM, PECAS_ROLAGEM, erroDaFormula } from '@/lib/sistemas/regrasRolagem'
import { montarRolagem, rolarExpressao } from '@/lib/dice'

const input = 'w-full rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-sm text-white'
const pequeno = 'rounded-lg border border-[#5e4b78] bg-[#151123] p-2 text-sm text-white'
const botao = 'inline-flex items-center gap-1 rounded-lg border border-[#5e4b78] px-2.5 py-1.5 text-xs hover:bg-[#34294f] disabled:opacity-40'

/** Monta a regra dos testes: escolhe um modelo ou escreve a fórmula com VALOR e testa na hora. */
export default function EditorRolagem({ regra, mudar, aoTestar }: { regra: { nome: string; formula: string }; mudar: (r: { nome: string; formula: string }) => void; aoTestar?: (expr: string, total: number) => void }) {
  const campo = useRef<HTMLInputElement>(null)
  const [valorTeste, setValorTeste] = useState(3)
  const [teste, setTeste] = useState<{ expr: string; total: number; detalhes: string } | null>(null)
  const erro = erroDaFormula(regra.formula)
  function inserir(pedaco: string) {
    const el = campo.current, f = regra.formula
    const ini = el?.selectionStart ?? f.length, fim = el?.selectionEnd ?? f.length
    const nova = (f.slice(0, ini) + pedaco + f.slice(fim)).slice(0, 60)
    mudar({ ...regra, formula: nova })
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(ini + pedaco.length, ini + pedaco.length) })
  }
  function testar() {
    const expr = montarRolagem(regra.formula, valorTeste), r = rolarExpressao(expr)
    setTeste(r ? { expr, total: r.total, detalhes: r.detalhes } : null)
    if (r) aoTestar?.(expr, r.total)
  }
  return <div className="space-y-3 rounded-xl border border-[#6d5690] bg-[#171325] p-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-[#ed9cd8]">1. Escolha um modelo (ou pule e monte a sua)</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{MODELOS_ROLAGEM.map(m => <button key={m.id} type="button" onClick={() => { mudar({ nome: m.nome, formula: m.formula }); setTeste(null) }}
      className={'rounded-lg border p-2 text-left text-xs hover:bg-[#2b2140] ' + (regra.formula === m.formula ? 'border-[#b99bff] bg-[#2b2140]' : 'border-[#4a3d63]')}>
      <span className="block font-semibold text-[#f2ebff]">{m.nome}</span><span className="block font-mono text-[11px] text-[#c7a8ff]">{m.formula}</span>
      <span className="mt-0.5 block text-[11px] text-[#a998bd]">{m.explica}</span></button>)}</div>
    <p className="text-xs font-semibold uppercase tracking-wider text-[#ed9cd8]">2. Monte a sua regra</p>
    <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
      <label className="block text-sm">Nome da rolagem<input value={regra.nome} maxLength={40} onChange={e => mudar({ ...regra, nome: e.target.value })} className={input + ' mt-1'} placeholder="Ex.: Teste de destino" /></label>
      <label className="block text-sm">Fórmula<input ref={campo} value={regra.formula} maxLength={60} onChange={e => { mudar({ ...regra, formula: e.target.value }); setTeste(null) }} className={input + ' mt-1 font-mono'} placeholder="Ex.: 2d20kh1+VALOR" /></label>
    </div>
    <div className="flex flex-wrap gap-1.5">{PECAS_ROLAGEM.map(p => <button key={p.texto} type="button" title={p.dica} onClick={() => inserir(p.texto)} className={botao + ' font-mono'}>{p.rotulo}</button>)}</div>
    <p className="text-[11px] text-[#a998bd]">VALOR é o número do atributo ou da perícia em que a pessoa tocou na ficha. Ex.: <span className="font-mono">VALORd6s5</span> rola tantos d6 quanto o valor e conta os 5 e 6.</p>
    {erro ? <p className="flex items-start gap-2 rounded-lg bg-[#4d3f1d]/80 p-2 text-xs text-[#f3dc9a]"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {erro}</p>
      : <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#201a32] p-2 text-sm">
        <span>Testar com VALOR =</span>
        <input type="number" aria-label="Valor de teste" value={valorTeste} min={-20} max={30} onChange={e => setValorTeste(Number(e.target.value) || 0)} className={pequeno + ' w-20'} />
        <button type="button" onClick={testar} className={botao}>🎲 Rolar teste</button>
        {teste && <span className="text-xs"><span className="font-mono text-[#c7a8ff]">{teste.expr}</span> → <strong className="text-lg text-[#ed9cd8]">{teste.total}</strong> <span className="text-[#a998bd]">{teste.detalhes}</span></span>}
      </div>}
  </div>
}

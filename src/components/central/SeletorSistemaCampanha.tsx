'use client'

import { useState } from 'react'
import { GRUPOS_SISTEMA, OPCOES_SISTEMA } from '@/lib/sistemas/criar'

// A ficha automática de Lunethernnyis e a V8 são o mesmo sistema de campanha.
const OPCOES = OPCOES_SISTEMA.filter(o => o.id !== 'lunethernnyis').map(o => ({ ...o, nome: o.id === 'lunethernnyis-v8' ? 'Lunethernnyis — Opositores' : o.nome }))
const NOMES = OPCOES.map(o => o.nome)

/** Escolha do sistema da campanha entre os da plataforma, com opção "Outro". */
export default function SeletorSistemaCampanha({ valor, onChange, classe }: { valor: string; onChange: (v: string) => void; classe: string }) {
  const conhecido = NOMES.includes(valor)
  const [outro, setOutro] = useState(!conhecido && !!valor)
  return <div className="mt-2 space-y-2">
    <select aria-label="Sistema de RPG" value={outro ? '__outro' : valor} onChange={e => { if (e.target.value === '__outro') { setOutro(true); onChange('') } else { setOutro(false); onChange(e.target.value) } }} className={classe}>
      {!valor && !outro && <option value="">Escolha…</option>}
      {GRUPOS_SISTEMA.map(g => <optgroup key={g.id} label={g.nome.replace(/^\S+ /, '')}>{OPCOES.filter(o => o.grupo === g.id).map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}</optgroup>)}
      <option value="__outro">Outro (digitar o nome)</option>
    </select>
    {outro && <input required minLength={2} maxLength={80} value={valor} onChange={e => onChange(e.target.value)} placeholder="Nome do sistema" className={classe} />}
  </div>
}

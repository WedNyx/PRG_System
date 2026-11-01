'use client'

import { Suspense, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Dados3D, { type Dados3DHandle } from '@/components/mesa/Dados3D'
import { rolarExpressao } from '@/lib/dice'

function FichaV8Conteudo() {
  const search = useSearchParams()
  const personagem = search.get('personagem') ?? ''
  const campanha = search.get('campanha') ?? ''
  const src = useMemo(() => '/ficha-v8.html?personagem=' + encodeURIComponent(personagem), [personagem])
  const dadosRef = useRef<Dados3DHandle>(null)
  const [expressao, setExpressao] = useState('1d20')
  const [resultado, setResultado] = useState('')
  const [animacao, setAnimacao] = useState(true)

  function rolar() {
    // Rolagem local: nenhuma consulta, gravação ou evento no Supabase.
    const r = rolarExpressao(expressao)
    if (!r) {
      setResultado('Expressão inválida. Ex.: 2d6+1d8+3')
      return
    }
    setResultado(r.detalhes + ' = ' + r.total)
    if (animacao) dadosRef.current?.animar(r.expressao, r.resultados)
  }

  return (
    <div className="min-h-screen bg-[#0d0c19] text-[#f4f0ff]">
      {animacao && <Dados3D ref={dadosRef} somAtivo={false} />}
      <header className="flex flex-wrap items-center gap-3 border-b border-[#373251] bg-[#19172c] px-4 py-3">
        <Link href={campanha ? '/campanha/' + encodeURIComponent(campanha) : '/dashboard'} className="text-sm text-[#b99bff] hover:underline">← Voltar à campanha</Link>
        <h1 className="font-bold text-lg">🌙 Lunethernnyis · Ficha V8</h1>
        <span className="text-xs text-[#b4aeca]">Salvamento neste navegador · sem sincronização automática</span>
      </header>
      <section aria-label="Central de dados" className="flex flex-wrap items-center gap-2 border-b border-[#373251] bg-[#19172c] p-3">
        <label htmlFor="dice-expr" className="text-sm text-[#ed9cd8] font-semibold">🎲 Dados</label>
        <input id="dice-expr" value={expressao} onChange={e => setExpressao(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') rolar() }}
          className="rounded-lg border border-[#62527e] bg-[#100f20] px-3 py-2 text-sm w-44" placeholder="2d6+1d8+3" />
        <button onClick={rolar} className="rounded-lg bg-[#7654bb] px-4 py-2 font-semibold hover:bg-[#8a67ce]">Rolar</button>
        <label className="flex items-center gap-2 text-xs text-[#b4aeca]">
          <input type="checkbox" checked={animacao} onChange={e => setAnimacao(e.target.checked)} /> Animação 3D
        </label>
        <output aria-live="polite" className="text-sm text-[#ed9cd8] break-words">{resultado}</output>
      </section>
      <p className="px-4 pt-2 text-xs text-[#b4aeca]">
        As rolagens são locais e não são enviadas ao chat. Use “Salvar minha ficha” na V8 para baixar seu backup JSON.
      </p>
      <iframe title="Ficha de personagem V8" src={src} className="w-full border-0 min-h-[1100px] h-[calc(100vh-160px)]"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" />
    </div>
  )
}

export default function FichaV8Page() {
  return <Suspense fallback={<p className="p-6 text-violet-200">Carregando ficha V8...</p>}><FichaV8Conteudo /></Suspense>
}

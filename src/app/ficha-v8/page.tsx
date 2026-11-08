'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Dados3D, { type Dados3DHandle } from '@/components/mesa/Dados3D'
import { rolarExpressao, type ResultadoRolagem } from '@/lib/dice'
import { useFichaNuvem, type EstadoSync } from '@/components/fichas/useFichaNuvem'

const TIPOS = [4, 6, 8, 10, 12, 20, 100] as const
type TipoDado = typeof TIPOS[number]
type Quantidades = Record<TipoDado, number>
const INICIAL: Quantidades = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 }
const MAX_DADOS = 20
const ROTULO_SYNC: Record<EstadoSync, string> = {
  carregando: 'Carregando da nuvem...', pronto: '☁️ Sincronizada', salvando: '☁️ Salvando...', salvo: '☁️ Salvo na nuvem',
  offline: '⚠️ Sem conexão · salvo neste aparelho', conflito: '⚠️ Conflito de versões', erro: '⚠️ Erro ao sincronizar', leitura: '👁️ Somente leitura',
}
const NUVEM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function FichaV8Conteudo() {
  const search = useSearchParams()
  const nuvemParam = search.get('nuvem') ?? ''
  const nuvemId = NUVEM_ID.test(nuvemParam) ? nuvemParam : null
  const personagem = nuvemId ?? search.get('personagem') ?? ''
  const campanha = search.get('campanha') ?? ''
  const sync = useFichaNuvem(nuvemId)
  const src = useMemo(() => '/ficha-v8.html?personagem=' + encodeURIComponent(personagem), [personagem])
  const dadosRef = useRef<Dados3DHandle>(null)
  const resultadoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [painel, setPainel] = useState(false)
  const [quantidades, setQuantidades] = useState<Quantidades>(INICIAL)
  const [modificador, setModificador] = useState(0)
  const [animacao, setAnimacao] = useState(true)
  const [rolando, setRolando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoRolagem | null>(null)
  const [erro, setErro] = useState('')

  const totalDados = TIPOS.reduce((s, tipo) => s + quantidades[tipo], 0)
  const expressao = TIPOS.filter(tipo => quantidades[tipo] > 0)
    .map(tipo => `${quantidades[tipo]}d${tipo}`).join('+') +
    (modificador > 0 ? `+${modificador}` : modificador < 0 ? String(modificador) : '')

  useEffect(() => () => { if (resultadoTimer.current) clearTimeout(resultadoTimer.current) }, [])

  function ajustar(tipo: TipoDado, delta: number) {
    if (rolando || (delta > 0 && totalDados >= MAX_DADOS)) return
    setQuantidades(atual => ({ ...atual, [tipo]: Math.max(0, atual[tipo] + delta) }))
    setResultado(null)
    setErro('')
  }

  function rolar() {
    if (rolando || totalDados < 1) return
    const r = rolarExpressao(expressao)
    if (!r) { setErro('Não foi possível interpretar essa combinação.'); return }
    setErro('')
    setResultado(null)
    setRolando(true)
    if (animacao) dadosRef.current?.animar(r.expressao, r.resultados)
    if (resultadoTimer.current) clearTimeout(resultadoTimer.current)
    // Mostra os valores já sorteados depois da animação, nunca um segundo sorteio.
    resultadoTimer.current = setTimeout(() => {
      setResultado(r)
      setRolando(false)
    }, animacao ? 1900 : 0)
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0d0c19] text-[#f4f0ff]">
      {animacao && <Dados3D ref={dadosRef} somAtivo={false} />}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#373251] bg-[#19172c] px-4 py-3">
        <Link href={campanha ? '/campanha/' + encodeURIComponent(campanha) : nuvemId ? '/central' : '/portal'} className="text-sm text-[#b99bff] hover:underline">← Voltar ao portal</Link>
        <h1 className="font-bold text-lg">🌙 Lunethernnyis · Ficha V8</h1>
        <span className="text-xs text-[#b4aeca]" aria-live="polite">{nuvemId ? ROTULO_SYNC[sync.estado] : 'Salvamento neste navegador · sem sincronização automática'}</span>
      </header>
      {nuvemId && sync.erro && <div role="alert" className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#62527e] bg-[#2b2140] px-4 py-2 text-sm">
        <span className="flex-1">{sync.erro}</span>
        {sync.estado === 'conflito' && <>
          <button type="button" onClick={() => sync.resolver('nuvem')} className="rounded-lg border border-[#b99bff] px-3 py-1">Usar a versão da nuvem</button>
          <button type="button" onClick={() => { if (window.confirm('Substituir a versão da nuvem pela deste aparelho?')) sync.resolver('aparelho') }} className="rounded-lg border border-[#62527e] px-3 py-1">Manter a deste aparelho</button>
        </>}
      </div>}
      {nuvemId && sync.aviso && <div role="status" className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#62527e] bg-[#1f2a40] px-4 py-2 text-sm">
        <span className="flex-1">{sync.aviso.texto}</span>
        {sync.aviso.desfazer && <button type="button" onClick={() => sync.resolver('nuvem')} className="rounded-lg border border-[#b99bff] px-3 py-1">Desfazer (voltar ao salvo)</button>}
      </div>}
      {nuvemId && !sync.pronta ? <div className="flex flex-1 items-center justify-center text-[#b4aeca]">{sync.estado === 'erro' ? 'Não foi possível abrir a ficha.' : 'Carregando ficha da nuvem...'}</div> : <iframe title="Ficha de personagem V8" src={src} className="block w-full min-h-0 flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" />}

      <button type="button" onClick={() => setPainel(aberto => !aberto)}
        aria-expanded={painel} aria-controls="central-dados" aria-label={painel ? 'Fechar central de dados' : 'Abrir central de dados'}
        className="fixed right-4 top-1/2 z-[75] flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#b99bff] bg-[#34294f] text-lg font-black text-[#f4f0ff] shadow-[0_0_24px_#7654bb88] hover:bg-[#7654bb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6">
        D20
      </button>

      {painel && (
        <aside id="central-dados" aria-label="Central de rolagens"
          className="fixed bottom-4 right-20 top-20 z-[74] flex w-[min(360px,calc(100vw-100px))] flex-col overflow-y-auto rounded-2xl border border-[#62527e] bg-[#19172c] p-4 shadow-2xl sm:right-24">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#ed9cd8]">🎲 Central de Dados</h2>
            <button type="button" onClick={() => setPainel(false)} aria-label="Fechar central" className="rounded-lg p-2 hover:bg-[#34294f]">✕</button>
          </div>
          <p className="mt-2 text-xs text-[#b4aeca]">Escolha os tipos e quantidades para rolar juntos.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {TIPOS.map(tipo => (
              <button type="button" key={tipo} onClick={() => ajustar(tipo, 1)} disabled={rolando || totalDados >= MAX_DADOS}
                className={`rounded-xl border p-3 text-sm font-bold transition-colors disabled:opacity-40 ${quantidades[tipo] ? 'border-[#b99bff] bg-[#34294f]' : 'border-[#51466a] bg-[#100f20] hover:bg-[#34294f]'}`}>
                d{tipo}<span className="mt-1 block text-xs font-normal text-[#b4aeca]">{quantidades[tipo]} selecionado(s)</span>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {TIPOS.filter(tipo => quantidades[tipo] > 0).map(tipo => (
              <div key={tipo} className="flex items-center justify-between rounded-lg bg-[#100f20] px-3 py-2">
                <span className="font-semibold">d{tipo}</span>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label={`Retirar um d${tipo}`} onClick={() => ajustar(tipo, -1)} disabled={rolando} className="rounded bg-[#34294f] px-3 py-1">−</button>
                  <span className="min-w-4 text-center tabular-nums">{quantidades[tipo]}</span>
                  <button type="button" aria-label={`Adicionar um d${tipo}`} onClick={() => ajustar(tipo, 1)} disabled={rolando || totalDados >= MAX_DADOS} className="rounded bg-[#34294f] px-3 py-1">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <label htmlFor="modificador-dados" className="text-sm">Modificador</label>
            <input id="modificador-dados" type="number" min="-100" max="100" value={modificador} disabled={rolando}
              onChange={e => { setModificador(Math.max(-100, Math.min(100, Number(e.target.value) || 0))); setResultado(null) }}
              className="w-20 rounded-lg border border-[#62527e] bg-[#100f20] p-2 text-center" />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-[#b4aeca]">
            <input type="checkbox" checked={animacao} disabled={rolando} onChange={e => setAnimacao(e.target.checked)} /> Animação 3D
          </label>
          <div className="mt-4 rounded-lg bg-[#100f20] p-3 text-center text-sm text-[#b99bff]">
            {totalDados ? expressao : 'Selecione pelo menos um dado'} · {totalDados}/{MAX_DADOS} dados
          </div>
          <button type="button" onClick={rolar} disabled={rolando || totalDados === 0}
            className="mt-3 rounded-xl bg-[#7654bb] px-4 py-3 font-bold hover:bg-[#8a67ce] disabled:opacity-50">
            {rolando ? '🎲 Rolando...' : '🎲 Rolar dados'}
          </button>
          <button type="button" disabled={rolando} onClick={() => { setQuantidades({ ...INICIAL, 20: 0 }); setResultado(null) }}
            className="mt-2 rounded-lg border border-[#62527e] px-3 py-2 text-sm disabled:opacity-50">Limpar seleção</button>
          {erro && <p role="alert" className="mt-3 text-sm text-red-300">{erro}</p>}
          {resultado && (
            <output aria-live="polite" className="mt-4 rounded-xl border border-[#62527e] bg-[#100f20] p-3 text-center">
              <span className="block text-xs text-[#b4aeca]">Resultados individuais</span>
              <span className="mt-2 block break-words text-sm">{resultado.detalhes}</span>
              <span className="mt-2 block text-3xl font-black text-[#ed9cd8]">{resultado.total}</span>
              <span className="block text-xs text-[#b4aeca]">Total da rolagem</span>
            </output>
          )}
          <p className="mt-4 text-xs text-[#b4aeca]">Rolagens locais. Faça backup da ficha pela opção “Salvar minha ficha” na V8.</p>
        </aside>
      )}
    </div>
  )
}

export default function FichaV8Page() {
  return <Suspense fallback={<p className="p-6 text-violet-200">Carregando ficha V8...</p>}><FichaV8Conteudo /></Suspense>
}

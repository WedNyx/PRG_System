'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import FichaGenerica from '@/components/fichas/FichaGenerica'
import { sistemaPorId } from '@/lib/sistemas/catalogo'
import { obterSistema } from '@/lib/sistemas/cliente'
import { normalizarFicha } from '@/lib/sistemas/calculo'
import type { DadosFicha, Sistema } from '@/lib/sistemas/tipos'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { CAMPOS } from '@/lib/campanhas/permissoes'

const AREAS: Record<string, string> = Object.fromEntries(CAMPOS.map(c => [c.id, c.titulo]))

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LOCAL = 'prg-ficha-gen-'
type Estado = 'carregando' | 'salvo' | 'salvando' | 'pendente' | 'offline' | 'conflito' | 'erro' | 'leitura' | 'local'
const ROTULO: Record<Estado, string> = {
  carregando: 'Carregando...', salvo: '☁️ Salvo na nuvem', salvando: '☁️ Salvando...', pendente: '✏️ Alterações não salvas',
  offline: '⚠️ Sem conexão · tentando de novo', conflito: '⚠️ Alterada em outro lugar', erro: '⚠️ Erro ao salvar',
  leitura: '👁️ Somente leitura', local: '💾 Salvo neste navegador',
}

function Conteudo() {
  const q = useSearchParams()
  const nuvem = UUID.test(q.get('nuvem') ?? '') ? q.get('nuvem')! : null
  const local = /^[a-zA-Z0-9-]{1,80}$/.test(q.get('local') ?? '') ? q.get('local')! : null
  const [sistema, setSistema] = useState<Sistema | null>(null)
  const [dados, setDados] = useState<DadosFicha | null>(null)
  const [estado, setEstado] = useState<Estado>('carregando')
  const [erro, setErro] = useState('')
  const versao = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ultimo = useRef<DadosFicha | null>(null)
  const salvando = useRef(false)
  const [aviso, setAviso] = useState<{ texto: string; desfazer: boolean } | null>(null)
  const [campanhaId, setCampanhaId] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    ;(async () => {
      try {
        if (nuvem) {
          const r = await api<{ ficha: { sistema: string; dados: DadosFicha; versao: number; status?: string; bloqueada?: boolean; observacao_mestre?: string; campanha_id?: string | null }; podeEditar: boolean; pendentes?: string[] }>('fichas/' + nuvem)
          if (r.pendentes?.length) setAviso({ texto: 'Aguardando o mestre aprovar: ' + r.pendentes.map(a => AREAS[a] ?? a).join(', ') + '.', desfazer: false })
          if (r.ficha.observacao_mestre) setErro('Mestre: ' + r.ficha.observacao_mestre)
          else if (!r.podeEditar && r.ficha.bloqueada) setErro('O mestre travou esta ficha neste momento.')
          const s = await obterSistema(r.ficha.sistema)
          if (!s) throw new ErroNuvem(400, 'O sistema desta ficha não foi encontrado (talvez tenha sido excluído).')
          if (!ativo) return
          versao.current = r.ficha.versao
          setCampanhaId(r.ficha.campanha_id ?? null)
          setSistema(s); setDados(normalizarFicha(s, r.ficha.dados)); setEstado(r.podeEditar ? 'salvo' : 'leitura')
        } else if (local) {
          const salvo = JSON.parse(localStorage.getItem(LOCAL + local) || 'null')
          const s = sistemaPorId(salvo?.sistema ?? q.get('sistema') ?? '')
          if (!s) throw new ErroNuvem(404, 'Ficha não encontrada neste navegador.')
          setSistema(s); setDados(normalizarFicha(s, salvo)); setEstado('local')
        } else throw new ErroNuvem(404, 'Ficha não encontrada.')
      } catch (e) { if (ativo) { setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.'); setEstado('erro') } }
    })()
    return () => { ativo = false }
  }, [nuvem, local, q])

  const enviar = useCallback(async () => {
    if (!nuvem || salvando.current || !ultimo.current) return
    const d = ultimo.current
    salvando.current = true; setEstado('salvando')
    try {
      const r = await api<{ versao: number; pendentes?: string[]; ignoradas?: string[] }>('fichas/' + nuvem, { method: 'PUT', body: { versao: versao.current, dados: d } })
      versao.current = r.versao
      const nomes = (l: string[]) => l.map(a => AREAS[a] ?? a).join(', ')
      if (r.ignoradas?.length) setAviso({ texto: `Somente o mestre pode alterar: ${nomes(r.ignoradas)}. Essas mudanças NÃO foram salvas.`, desfazer: true })
      else if (r.pendentes?.length) setAviso({ texto: `Enviado para aprovação do mestre: ${nomes(r.pendentes)}. O resto foi salvo.`, desfazer: false })
      else setAviso(null)
      if (ultimo.current === d) { ultimo.current = null; setEstado('salvo') } else setEstado('pendente')
      setErro('')
    } catch (e) {
      if (e instanceof ErroNuvem && e.status === 423) { setEstado('leitura'); setErro(e.message + ' Suas últimas mudanças não foram salvas.') }
      else if (e instanceof ErroNuvem && e.status === 409) { setEstado('conflito'); setErro('Esta ficha foi alterada em outro aparelho. Recarregue para ver a versão mais nova (suas últimas mudanças serão perdidas).') }
      else if (e instanceof ErroNuvem && e.status < 500 && e.status !== 429) { setEstado('erro'); setErro(e.message) }
      else { setEstado('offline'); setErro('') }
    } finally {
      salvando.current = false
      if (ultimo.current && ultimo.current !== d) { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void enviar(), 1200) }
    }
  }, [nuvem])

  useEffect(() => {
    const tentar = () => { if (ultimo.current) void enviar() }
    const sair = (e: BeforeUnloadEvent) => { if (ultimo.current) e.preventDefault() }
    window.addEventListener('online', tentar); window.addEventListener('beforeunload', sair)
    const t = setInterval(() => { if (ultimo.current && navigator.onLine) void enviar() }, 15000)
    return () => { window.removeEventListener('online', tentar); window.removeEventListener('beforeunload', sair); clearInterval(t) }
  }, [enviar])

  function mudar(d: DadosFicha) {
    setDados(d)
    if (estado === 'leitura' || estado === 'conflito') return
    if (local) { try { localStorage.setItem(LOCAL + local, JSON.stringify(d)) } catch {} return }
    ultimo.current = d; setEstado(s => s === 'salvando' ? s : 'pendente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void enviar(), 1200)
  }

  return <main className="min-h-screen fundo-tema text-[#f2ebff]">
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-[#373251] bg-[#19172c]/95 px-4 py-3 backdrop-blur">
      <Link href="/central" className="text-sm text-[#b99bff] hover:underline">← Início</Link>
      <h1 className="min-w-0 flex-1 truncate font-bold">{sistema?.nome ?? 'Ficha'}{sistema?.autor && <span className="block truncate text-xs font-normal text-[#ed9cd8]">✍️ Sistema criado por {sistema.autor}</span>}</h1>
      <span className="text-xs text-[#b4aeca]" aria-live="polite">{ROTULO[estado]}</span>
    </header>
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6">
      {erro && <p role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#62527e] bg-[#2b2140] p-3 text-sm">
        <span className="flex-1">{erro}</span>{estado === 'conflito' && <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-[#b99bff] px-3 py-1">Recarregar</button>}</p>}
      {aviso && <p role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#62527e] bg-[#1f2a40] p-3 text-sm">
        <span className="flex-1">{aviso.texto}</span>{aviso.desfazer && <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-[#b99bff] px-3 py-1">Desfazer (voltar ao salvo)</button>}</p>}
      {sistema && dados ? <FichaGenerica sistema={sistema} dados={dados} onChange={mudar} somenteLeitura={estado === 'leitura'}
        rolarNaCampanha={campanhaId ? async (expressao, rotulo) => {
          try { const r = await api<{ evento: { resultados: number[]; total: number } }>('mesa/' + campanhaId, { method: 'POST', body: { acao: 'evento', tipo: 'rolagem', expressao, personagem: dados.nome, texto: rotulo } }); return r.evento }
          catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha ao rolar.'); return null }
        } : undefined} />
        : estado === 'carregando' && <p className="text-center text-[#b4aeca]">Carregando ficha...</p>}
    </div>
  </main>
}

export default function FichaPage() {
  return <Suspense fallback={<p className="p-6 text-violet-200">Carregando ficha...</p>}><Conteudo /></Suspense>
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { marcarEspelho } from '@/lib/nuvem/locais'
import { CAMPOS } from '@/lib/campanhas/permissoes'

const AREAS: Record<string, string> = Object.fromEntries(CAMPOS.map(c => [c.id, c.titulo]))

/**
 * Ponte entre a Ficha V8 (iframe que salva no localStorage) e a nuvem.
 * A V8 continua igual: ela grava em `lunethernnyis-ficha-v8-<id>`; aqui ouvimos
 * o evento `storage` e enviamos ao servidor com controle de versão.
 * Se a internet cair, a alteração fica marcada como pendente e é enviada depois.
 */
export const CHAVE_V8 = 'lunethernnyis-ficha-v8-'
const PENDENTE = 'prg-nuvem-pendente-'
type Pendente = { versao: number }
export type EstadoSync = 'carregando' | 'pronto' | 'salvando' | 'salvo' | 'offline' | 'conflito' | 'erro' | 'leitura'

const lerPendente = (id: string): Pendente | null => {
  try { const p = JSON.parse(localStorage.getItem(PENDENTE + id) || 'null'); return p && Number.isInteger(p.versao) ? p : null } catch { return null }
}

export function useFichaNuvem(id: string | null) {
  const [estado, setEstado] = useState<EstadoSync>('carregando')
  const [erro, setErro] = useState('')
  const [pronta, setPronta] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; desfazer: boolean } | null>(null)
  const [campanhaId, setCampanhaId] = useState<string | null>(null)
  const versao = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enviando = useRef(false)
  const deNovo = useRef(false)
  const estadoRef = useRef<EstadoSync>('carregando')
  useEffect(() => { estadoRef.current = estado }, [estado])

  const enviarRef = useRef<() => Promise<void>>(async () => {})
  const enviar = useCallback(async () => {
    if (!id) return
    if (enviando.current) { deNovo.current = true; return }
    const raw = localStorage.getItem(CHAVE_V8 + id)
    if (!raw) return
    enviando.current = true
    setEstado('salvando')
    try {
      const r = await api<{ versao: number; pendentes?: string[]; ignoradas?: string[] }>('fichas/' + id, { method: 'PUT', body: { versao: versao.current, dados: JSON.parse(raw) } })
      versao.current = r.versao
      const nomes = (l: string[]) => l.map(a => AREAS[a] ?? a).join(', ')
      if (r.ignoradas?.length) setAviso({ texto: `Somente o mestre pode alterar: ${nomes(r.ignoradas)}. Essas mudanças NÃO foram salvas.`, desfazer: true })
      else if (r.pendentes?.length) setAviso({ texto: `Enviado para aprovação do mestre: ${nomes(r.pendentes)}. O resto foi salvo.`, desfazer: false })
      else setAviso(null)
      if (localStorage.getItem(CHAVE_V8 + id) === raw) localStorage.removeItem(PENDENTE + id)
      else localStorage.setItem(PENDENTE + id, JSON.stringify({ versao: r.versao }))
      setEstado('salvo'); setErro('')
    } catch (e) {
      if (e instanceof ErroNuvem && e.status === 409) { setEstado('conflito'); setErro(e.message) }
      else if (e instanceof ErroNuvem && e.status === 423) { setEstado('leitura'); setErro(e.message + ' Suas últimas mudanças não foram salvas.') }
      else if (e instanceof ErroNuvem && e.status < 500 && e.status !== 429) { setEstado('erro'); setErro(e.message) }
      else { setEstado('offline'); setErro('Sem conexão: as mudanças estão guardadas neste aparelho e serão enviadas depois.') }
    } finally {
      enviando.current = false
      if (deNovo.current) { deNovo.current = false; void enviarRef.current() }
    }
  }, [id])
  useEffect(() => { enviarRef.current = enviar }, [enviar])

  // Carrega da nuvem antes de abrir a V8.
  useEffect(() => {
    if (!id) return
    marcarEspelho(id)
    let ativo = true
    ;(async () => {
      try {
        const r = await api<{ ficha: { dados: unknown; versao: number; status?: string; bloqueada?: boolean; observacao_mestre?: string; campanha_id?: string | null }; podeEditar: boolean; pendentes?: string[] }>('fichas/' + id)
        if (!ativo) return
        versao.current = r.ficha.versao
        setCampanhaId(r.ficha.campanha_id ?? null)
        const pend = lerPendente(id)
        if (r.pendentes?.length) setAviso({ texto: 'Aguardando o mestre aprovar: ' + r.pendentes.map(a => AREAS[a] ?? a).join(', ') + '.', desfazer: false })
        if (r.ficha.observacao_mestre) setErro('Mestre: ' + r.ficha.observacao_mestre)
        if (!r.podeEditar) {
          localStorage.setItem(CHAVE_V8 + id, JSON.stringify(r.ficha.dados)); setEstado('leitura')
          if (r.ficha.bloqueada) setErro('O mestre travou esta ficha neste momento.')
          else if (r.ficha.status === 'recusada') setErro('Ficha recusada pelo mestre.' + (r.ficha.observacao_mestre ? ' Motivo: ' + r.ficha.observacao_mestre : ''))
        } else if (pend && pend.versao === r.ficha.versao && localStorage.getItem(CHAVE_V8 + id)) {
          setEstado('pronto'); void enviar() // alterações feitas offline neste aparelho
        } else if (pend && localStorage.getItem(CHAVE_V8 + id)) {
          setEstado('conflito'); setErro('Este aparelho tem alterações não enviadas, mas a ficha também mudou em outro lugar.')
        } else {
          localStorage.setItem(CHAVE_V8 + id, JSON.stringify(r.ficha.dados)); setEstado('pronto')
        }
        setPronta(true)
      } catch (e) {
        if (!ativo) return
        if (localStorage.getItem(CHAVE_V8 + id)) {
          setEstado('offline'); setErro('Sem conexão: abrindo a cópia salva neste aparelho.'); setPronta(true)
        } else { setEstado('erro'); setErro(e instanceof ErroNuvem ? e.message : 'Não foi possível carregar a ficha.') }
      }
    })()
    return () => { ativo = false }
  }, [id, enviar])

  // Ouve as gravações da V8 e envia com atraso curto (agrupa várias digitações).
  useEffect(() => {
    if (!id || !pronta) return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CHAVE_V8 + id || e.newValue === null) return
      if (estadoRef.current === 'leitura' || estadoRef.current === 'conflito') return
      try { localStorage.setItem(PENDENTE + id, JSON.stringify({ versao: versao.current })) } catch {}
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void enviar(), 1500)
    }
    const onOnline = () => { if (lerPendente(id)) void enviar() }
    const onHide = () => { if (document.visibilityState === 'hidden' && lerPendente(id)) { if (timer.current) clearTimeout(timer.current); void enviar() } }
    window.addEventListener('storage', onStorage)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('storage', onStorage); window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onHide)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [id, pronta, enviar])

  /** Resolve conflito: 'nuvem' descarta a cópia local; 'aparelho' sobrescreve a nuvem com a local. */
  const resolver = useCallback(async (usar: 'nuvem' | 'aparelho') => {
    if (!id) return
    try {
      const r = await api<{ ficha: { dados: unknown; versao: number } }>('fichas/' + id)
      versao.current = r.ficha.versao
      if (usar === 'nuvem') {
        localStorage.setItem(CHAVE_V8 + id, JSON.stringify(r.ficha.dados)); localStorage.removeItem(PENDENTE + id)
        window.location.reload()
      } else { setEstado('pronto'); await enviar() }
    } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') }
  }, [id, enviar])

  return { estado, erro, pronta, resolver, aviso, campanhaId }
}

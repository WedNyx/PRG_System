'use client'
import { useEffect, useState } from 'react'
import { api, NUVEM_ATIVA } from '../nuvem/cliente'
import { sistemaPorId } from './catalogo'
import { OPCOES_SISTEMA } from './criar'
import { ehAutoral } from './autoral'
import type { Sistema } from './tipos'

export type ResumoAutoral = { id: string; nome: string; resumo: string; publicado: boolean; versao: number; dados: string; autor: string; meu: boolean; atualizado_em: string }
const cache = new Map<string, Promise<Sistema | undefined>>()

/** Sistema do catálogo ou autoral (busca no servidor e guarda em memória). */
export function obterSistema(id: string): Promise<Sistema | undefined> {
  const s = sistemaPorId(id)
  if (s) return Promise.resolve(s)
  if (!ehAutoral(id) || !NUVEM_ATIVA) return Promise.resolve(undefined)
  if (!cache.has(id)) cache.set(id, api<{ sistema: Sistema }>('sistemas/' + id).then(r => r.sistema).catch(() => { cache.delete(id); return undefined }))
  return cache.get(id)!
}
export const esquecerSistema = (id: string) => cache.delete(id)

/** Lista de sistemas autorais visíveis (publicados + os meus). */
export function useSistemasAutorais(): { lista: ResumoAutoral[] | null; recarregar: () => void } {
  const [lista, setLista] = useState<ResumoAutoral[] | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!NUVEM_ATIVA) { const t = setTimeout(() => setLista([]), 0); return () => clearTimeout(t) }
    let ativo = true
    api<{ sistemas: ResumoAutoral[] }>('sistemas').then(r => { if (ativo) setLista(r.sistemas) }).catch(() => { if (ativo) setLista([]) })
    return () => { ativo = false }
  }, [n])
  return { lista, recarregar: () => setN(x => x + 1) }
}

/** Opções para escolher sistema: catálogo + autorais (publicados e meus rascunhos). */
export function useOpcoesSistema() {
  const { lista } = useSistemasAutorais()
  const autorais = (lista ?? []).map(a => ({ id: a.id, nome: `${a.nome} · criado por ${a.autor}${a.publicado ? '' : ' (rascunho)'}`, grupo: 'autoral' as const }))
  const opcoes = [...OPCOES_SISTEMA, ...autorais]
  const nomes: Record<string, string> = Object.fromEntries([...OPCOES_SISTEMA.map(o => [o.id, o.nome]), ...(lista ?? []).map(a => [a.id, a.nome])])
  return { opcoes, nomeDe: (id: string) => nomes[id] ?? sistemaPorId(id)?.nome ?? (ehAutoral(id) ? 'Sistema autoral' : id), carregando: lista === null }
}

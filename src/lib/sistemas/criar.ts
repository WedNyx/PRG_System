'use client'
import { api, NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import { SISTEMAS, SISTEMAS_VISIVEIS, SISTEMA_V8 } from './catalogo'
import { fichaVazia } from './calculo'

export type GrupoSistema = 'publicado' | 'autoral'
export const GRUPOS_SISTEMA: { id: GrupoSistema; nome: string; descricao: string }[] = [
  { id: 'publicado', nome: '📚 Sistemas publicados', descricao: 'RPGs já existentes, com licença aberta ou como estrutura de ficha.' },
  { id: 'autoral', nome: '✍️ Sistemas autorais', descricao: 'Sistemas criados por jogadores da plataforma.' },
]
/** Opções de sistema para escolher: primeiro os publicados, depois os autorais. */
export const OPCOES_SISTEMA: { id: string; nome: string; grupo: GrupoSistema }[] = [
  ...SISTEMAS_VISIVEIS.filter(s => s.tipo !== 'autoral').map(s => ({ id: s.id, nome: s.nome, grupo: 'publicado' as const })),
  ...SISTEMAS_VISIVEIS.filter(s => s.tipo === 'autoral').map(s => ({ id: s.id, nome: s.nome, grupo: 'autoral' as const })),
]
export const nomeDoSistema = (id: string) => OPCOES_SISTEMA.find(o => o.id === id)?.nome ?? id

/** Cria uma ficha do sistema escolhido (na nuvem ou neste navegador) e abre. */
export async function criarEAbrirFicha(sistema: string, aventureiroId: string) {
  if (NUVEM_ATIVA) {
    const r = await api<{ ficha: { id: string } }>('fichas', { method: 'POST', aventureiro: aventureiroId, body: { sistema } })
    window.location.assign((sistema === SISTEMA_V8 ? '/ficha-v8?nuvem=' : '/ficha?nuvem=') + r.ficha.id)
    return
  }
  const id = crypto.randomUUID()
  if (sistema === SISTEMA_V8) {
    const k = 'prg-fichas-independentes-v1-' + aventureiroId
    const lista = JSON.parse(localStorage.getItem(k) || '[]')
    localStorage.setItem(k, JSON.stringify([...lista, { id, criadaEm: new Date().toISOString() }]))
    window.location.assign('/ficha-v8?personagem=' + encodeURIComponent(id))
    return
  }
  const s = SISTEMAS.find(x => x.id === sistema)!
  localStorage.setItem('prg-ficha-gen-' + id, JSON.stringify(fichaVazia(s)))
  const k = 'prg-fichas-gen-lista-' + aventureiroId
  const lista = JSON.parse(localStorage.getItem(k) || '[]')
  localStorage.setItem(k, JSON.stringify([...lista, { id, sistema, criadaEm: new Date().toISOString() }]))
  window.location.assign('/ficha?local=' + id)
}

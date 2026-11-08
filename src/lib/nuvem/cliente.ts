'use client'
/** Chamadas do navegador para a API da nuvem, identificando o aventureiro escolhido no portal. */
export const NUVEM_ATIVA = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'
export const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'

export class ErroNuvem extends Error {
  constructor(public status: number, mensagem: string, public dados?: Record<string, unknown>) { super(mensagem) }
}

export function aventureiroAtual(): string | null {
  try { return localStorage.getItem(SELECTED_KEY) } catch { return null }
}

export async function api<T = Record<string, unknown>>(caminho: string, init: { method?: string; body?: unknown; aventureiro?: string } = {}): Promise<T> {
  const id = init.aventureiro ?? aventureiroAtual()
  const r = await fetch('/api/prg/' + caminho, {
    method: init.method ?? 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(id ? { 'x-prg-aventureiro': id } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  let dados: Record<string, unknown> = {}
  try { dados = await r.json() } catch {}
  if (!r.ok) throw new ErroNuvem(r.status, typeof dados.erro === 'string' ? dados.erro : 'Falha de conexão. Tente novamente.', dados)
  return dados as T
}

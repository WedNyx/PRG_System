'use client'
/** Chamadas do navegador para a API da nuvem, identificando o aventureiro escolhido no portal. */
export const NUVEM_ATIVA = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'
export const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'

/** Disparado quando o servidor diz “este perfil tem senha” (PedirSenhaGlobal mostra a janela). */
export const EVENTO_SENHA = 'prg:senha'

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
  if (r.status === 401 && dados.senha === true && typeof dados.perfil === 'string') {
    try { window.dispatchEvent(new CustomEvent(EVENTO_SENHA, { detail: dados.perfil })) } catch {}
  }
  if (!r.ok) throw new ErroNuvem(r.status, typeof dados.erro === 'string' ? dados.erro : 'Falha de conexão. Tente novamente.', dados)
  return dados as T
}

/** Diminui uma imagem do aparelho (lado maior até `max` px, WEBP) para enviar rápido e gastar pouco espaço. */
export async function reduzirImagem(arq: File, max = 1000): Promise<Blob> {
  if (!/^image\/(png|jpeg|webp)$/.test(arq.type)) throw new ErroNuvem(415, 'Use uma imagem PNG, JPG ou WEBP.')
  try {
    const bmp = await createImageBitmap(arq)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const b = await new Promise<Blob | null>(res => c.toBlob(res, 'image/webp', 0.86))
    if (b && b.size < arq.size) return b
  } catch { /* navegador sem suporte: manda a original */ }
  return arq
}

/** Envia uma imagem (retrato ou capa) e devolve o link público. `destino`: 'imagens' ou 'mesa/<campanha>/upload'. */
export async function enviarImagemNuvem(destino: string, arq: File, max = 1000): Promise<string> {
  const corpo = await reduzirImagem(arq, max)
  if (corpo.size > 3 * 1024 * 1024) throw new ErroNuvem(413, 'Imagem grande demais (máximo 3 MB).')
  const id = aventureiroAtual()
  const r = await fetch('/api/prg/' + destino, { method: 'POST', body: corpo, headers: { 'Content-Type': corpo.type || arq.type, ...(id ? { 'x-prg-aventureiro': id } : {}) } })
  const d = await r.json().catch(() => ({})) as { url?: string; erro?: string }
  if (!r.ok || !d.url) throw new ErroNuvem(r.status, d.erro || 'Falha ao enviar a imagem.')
  return d.url
}

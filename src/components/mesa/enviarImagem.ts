/** Envia uma imagem do aparelho e devolve o link público + proporção (altura/largura). */
export async function enviarImagem(campanhaId: string, eu: string, arq: File): Promise<{ url: string; ar: number }> {
  if (arq.size > 5 * 1024 * 1024) throw new Error('Imagem maior que 5 MB.')
  const ar = await new Promise<number>(res => { const img = new Image(); img.onload = () => res(img.naturalHeight / img.naturalWidth || 1); img.onerror = () => res(1); img.src = URL.createObjectURL(arq) })
  const r = await fetch('/api/prg/mesa/' + campanhaId + '/upload', { method: 'POST', body: arq, headers: { 'Content-Type': arq.type, 'x-prg-aventureiro': eu } })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.erro || 'Falha no envio')
  return { url: d.url, ar }
}


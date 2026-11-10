import { ator, checarOrigem, ok, rota, ErroApi } from '@/lib/nuvem/servidor'

export const dynamic = 'force-dynamic'
const TIPOS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX = 3 * 1024 * 1024

/** Envia a imagem de um personagem (retrato da ficha), até 3 MB, para o bucket público prg-mesa. */
export const POST = rota(async req => {
  checarOrigem(req)
  const eu = await ator(req)
  const tipo = req.headers.get('content-type') ?? ''
  const ext = TIPOS[tipo]
  if (!ext) throw new ErroApi(415, 'Envie uma imagem PNG, JPG ou WEBP.')
  if (Number(req.headers.get('content-length') || 0) > MAX) throw new ErroApi(413, 'Imagem maior que 3 MB.')
  const corpo = await req.arrayBuffer()
  if (corpo.byteLength > MAX) throw new ErroApi(413, 'Imagem maior que 3 MB.')
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const caminho = `retratos/${eu}/${crypto.randomUUID()}.${ext}`
  const r = await fetch(`${base}/storage/v1/object/prg-mesa/${caminho}`, {
    method: 'POST', body: corpo, headers: { Authorization: 'Bearer ' + chave, apikey: chave!, 'Content-Type': tipo, 'x-upsert': 'false' },
  })
  if (!r.ok) throw new ErroApi(502, 'Não foi possível enviar a imagem.')
  return ok({ url: `${base}/storage/v1/object/public/prg-mesa/${caminho}` }, 201)
})

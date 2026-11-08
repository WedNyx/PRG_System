import { ator, checarOrigem, ok, papelNaCampanha, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ cid: string }> }
const TIPOS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX = 5 * 1024 * 1024

/** Envia imagem de mapa/token para o Storage do Supabase (bucket público prg-mesa). Qualquer participante. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { cid } = await params
  checarOrigem(req)
  const eu = await ator(req)
  if (!isUuid(cid) || !(await papelNaCampanha(cid, eu))) throw new ErroApi(403, 'Você não participa desta campanha.')
  const tipo = req.headers.get('content-type') ?? ''
  const ext = TIPOS[tipo]
  if (!ext) throw new ErroApi(415, 'Envie uma imagem PNG, JPG ou WEBP.')
  if (Number(req.headers.get('content-length') || 0) > MAX) throw new ErroApi(413, 'Imagem maior que 5 MB.')
  const corpo = await req.arrayBuffer()
  if (corpo.byteLength > MAX) throw new ErroApi(413, 'Imagem maior que 5 MB.')
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const caminho = `${cid}/${crypto.randomUUID()}.${ext}`
  const r = await fetch(`${base}/storage/v1/object/prg-mesa/${caminho}`, {
    method: 'POST', body: corpo, headers: { Authorization: 'Bearer ' + chave, apikey: chave!, 'Content-Type': tipo, 'x-upsert': 'false' },
  })
  if (!r.ok) throw new ErroApi(502, 'Não foi possível enviar a imagem.')
  return ok({ url: `${base}/storage/v1/object/public/prg-mesa/${caminho}` }, 201)
})

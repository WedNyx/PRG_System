import { ErroApi, lerJson, localDaRota, ok, registrarErro, rota } from '@/lib/nuvem/servidor'

export const dynamic = 'force-dynamic'

const janela = new Map<string, { n: number; ate: number }>()
const MAX = 20, DURACAO = 10 * 60_000

/** O navegador avisa um erro inesperado da tela (sem dados pessoais: só mensagem, página e pilha). */
export const POST = rota(async req => {
  const b = await lerJson(req, 5000) as { mensagem?: unknown; pagina?: unknown; detalhe?: unknown }
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local'
  const agora = Date.now(), t = janela.get(ip)
  const atual = t && t.ate > agora ? t : { n: 0, ate: agora + DURACAO }
  if (atual.n >= MAX) throw new ErroApi(429, 'Muitos avisos de erro. Tente mais tarde.')
  janela.set(ip, { ...atual, n: atual.n + 1 })
  if (janela.size > 5000) janela.clear()
  const mensagem = typeof b.mensagem === 'string' ? b.mensagem.trim() : ''
  if (!mensagem) throw new ErroApi(400, 'Mensagem vazia.')
  const pagina = typeof b.pagina === 'string' && b.pagina.startsWith('/') ? b.pagina.split('?')[0] : ''
  await registrarErro('navegador', localDaRota(pagina), mensagem, typeof b.detalhe === 'string' ? b.detalhe : '')
  return ok({ ok: true }, 201)
})

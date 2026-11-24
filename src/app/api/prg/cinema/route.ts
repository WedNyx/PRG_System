import { randomBytes, createHash } from 'node:crypto'
import { NextRequest } from 'next/server'
import { rest, rota, ok, lerJson, ErroApi, q } from '@/lib/nuvem/servidor'
import { cinemaInicial, adicionarVideo, selecionarVideo, controlarCinema, type EstadoCinema } from '@/lib/nuvem/cinema'

export const dynamic = 'force-dynamic'
type Sala = { codigo: string; nome: string; anfitriao_hash: string; estado: EstadoCinema; revisao: number }
const hash = (s: string) => createHash('sha256').update(s).digest('hex')
const publica = (s: Sala) => ({ codigo: s.codigo, nome: s.nome, estado: s.estado, revisao: s.revisao, agora: Date.now() })
async function buscar(codigo: string) {
  if (!/^[A-F0-9]{16}$/.test(codigo)) throw new ErroApi(400, 'Código inválido.')
  const [s] = await rest<Sala[]>('prg_cinema_salas?codigo=eq.' + q(codigo))
  if (!s) throw new ErroApi(404, 'Sala não encontrada.')
  return s
}
export const GET = rota(async (req: NextRequest) => ok(publica(await buscar(req.nextUrl.searchParams.get('codigo') || ''))))
export const POST = rota(async (req: NextRequest) => {
  const raw = await lerJson(req)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ErroApi(400, 'Dados inválidos.')
  const d = raw as Record<string, unknown>
  if (d.acao === 'criar') {
    const token = randomBytes(32).toString('hex')
    const codigo = randomBytes(8).toString('hex').toUpperCase()
    const nome = typeof d.nome === 'string' ? d.nome.trim().slice(0, 80) : ''
    if (!nome) throw new ErroApi(400, 'Informe o nome da sala.')
    const [s] = await rest<Sala[]>('prg_cinema_salas', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ codigo, nome, anfitriao_hash: hash(token), estado: cinemaInicial() }) })
    return ok({ ...publica(s), token }, 201)
  }
  const s = await buscar(typeof d.codigo === 'string' ? d.codigo : '')
  if (typeof d.token !== 'string' || hash(d.token) !== s.anfitriao_hash) throw new ErroApi(403, 'Somente o anfitrião pode controlar a sala.')
  let estado = s.estado
  try {
    switch (d.acao) {
      case 'adicionar': estado = adicionarVideo(estado, typeof d.url === 'string' ? d.url : '', typeof d.titulo === 'string' ? d.titulo : ''); break
      case 'selecionar': estado = selecionarVideo(estado, typeof d.indice === 'number' ? d.indice : -1, Date.now()); break
      case 'pausar': case 'continuar': case 'avancar': case 'voltar': estado = controlarCinema(estado, d.acao, Date.now()); break
      default: throw new Error('Ação inválida.')
    }
  } catch (e) { throw new ErroApi(400, e instanceof Error ? e.message : 'Ação inválida.') }
  const [atual] = await rest<Sala[]>('prg_cinema_salas?codigo=eq.' + q(s.codigo) + '&revisao=eq.' + s.revisao, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ estado, revisao: s.revisao + 1 }) })
  if (!atual) throw new ErroApi(409, 'A sala mudou. Tente novamente.')
  return ok(publica(atual))
})

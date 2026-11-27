import { ator, ok, q, rest, rota } from '@/lib/nuvem/servidor'
import { termoDeBusca, termoDeNome } from '@/lib/usuario'

export const dynamic = 'force-dynamic'

/** Busca de perfis pelo @ ou pelo nome (v0.37.0), para convidar para campanhas. No máximo 8 resultados. */
export const GET = rota(async req => {
  const eu = await ator(req)
  const bruto = req.nextUrl.searchParams.get('busca')
  const termo = termoDeBusca(bruto), nome = termoDeNome(bruto)
  if (nome.length < 2) return ok({ perfis: [] })
  // Só letras, números, espaço, "_", "." e "-" chegam aqui; o nome vai entre aspas. O filtro não tem como ser “quebrado”.
  const filtro = `(${termo.length >= 2 ? `usuario.like.${termo}*,` : ''}apelido.ilike."*${nome}*")`
  const perfis = await rest<{ id: string; apelido: string; usuario: string }[]>(
    `prg_public_adventurers?select=id,apelido,usuario&or=${q(filtro)}&id=neq.${q(eu)}&order=usuario.asc&limit=8`)
  return ok({ perfis })
})

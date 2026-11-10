import { apelidoDe, ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid } from '@/lib/nuvem/validacao'
import { idAutoral, validarSistema } from '@/lib/sistemas/autoral'

export const dynamic = 'force-dynamic'
const MAX_POR_PESSOA = 20
type Linha = { id: string; dono_id: string; nome: string; resumo: string; publicado: boolean; versao: number; atualizado_em: string; definicao?: { dados?: string }; dono?: { apelido: string } | null }
const resumo = (l: Linha, eu: string) => ({ id: idAutoral(l.id), nome: l.nome, resumo: l.resumo, publicado: l.publicado, versao: l.versao, atualizado_em: l.atualizado_em,
  dados: l.definicao?.dados ?? 'd20', autor: l.dono?.apelido ?? 'Alguém', meu: l.dono_id === eu })

/** Sistemas autorais publicados (de todos) + os meus (inclusive rascunhos). */
export const GET = rota(async req => {
  const eu = await ator(req)
  const sel = 'id,dono_id,nome,resumo,publicado,versao,atualizado_em,definicao->dados,dono:prg_public_adventurers(apelido)'
  const linhas = await rest<(Linha & { dados?: string })[]>(`prg_sistemas_autorais?select=${sel}&or=(publicado.eq.true,dono_id.eq.${q(eu)})&order=nome.asc&limit=300`)
  return ok({ sistemas: linhas.map(l => resumo({ ...l, definicao: { dados: l.dados } }, eu)) })
})

/** Criar, salvar, publicar/despublicar e excluir (só o autor). */
export const POST = rota(async req => {
  const eu = await ator(req)
  const b = await lerJson(req, 150_000) as Record<string, unknown>
  if (b.acao === 'criar' || b.acao === 'salvar') {
    let uuid: string
    if (b.acao === 'criar') {
      const meus = await rest<unknown[]>(`prg_sistemas_autorais?select=id&dono_id=eq.${q(eu)}&limit=${MAX_POR_PESSOA}`)
      if (meus.length >= MAX_POR_PESSOA) throw new ErroApi(429, `Limite de ${MAX_POR_PESSOA} sistemas por pessoa.`)
      uuid = crypto.randomUUID()
    } else {
      if (!isUuid(b.uuid)) throw new ErroApi(400, 'Sistema inválido.')
      const [l] = await rest<{ dono_id: string }[]>(`prg_sistemas_autorais?select=dono_id&id=eq.${q(b.uuid)}`)
      if (!l) throw new ErroApi(404, 'Sistema não encontrado.')
      if (l.dono_id !== eu) throw new ErroApi(403, 'Só quem criou pode editar este sistema.')
      uuid = b.uuid
    }
    const r = validarSistema(b.definicao, { id: idAutoral(uuid), autor: await apelidoDe(eu) })
    if (!r.ok) return ok({ erro: 'O sistema tem problemas para corrigir.', erros: r.erros }, 400)
    const linha = { nome: r.sistema.nome, resumo: r.sistema.resumo, definicao: r.sistema, atualizado_em: new Date().toISOString() }
    if (b.acao === 'criar') await rest('prg_sistemas_autorais', { method: 'POST', body: JSON.stringify({ id: uuid, dono_id: eu, ...linha }) })
    else {
      const [atual] = await rest<{ versao: number }[]>(`prg_sistemas_autorais?select=versao&id=eq.${q(uuid)}`)
      await rest(`prg_sistemas_autorais?id=eq.${q(uuid)}&dono_id=eq.${q(eu)}`, { method: 'PATCH', body: JSON.stringify({ ...linha, versao: (atual?.versao ?? 1) + 1 }) })
    }
    return ok({ id: idAutoral(uuid), uuid, avisos: r.avisos }, b.acao === 'criar' ? 201 : 200)
  }
  if (!isUuid(b.uuid)) throw new ErroApi(400, 'Sistema inválido.')
  const filtro = `prg_sistemas_autorais?id=eq.${q(b.uuid)}&dono_id=eq.${q(eu)}`
  if (b.acao === 'publicar') {
    const r = await rest<unknown[]>(filtro, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ publicado: b.publicado === true }) })
    if (!r.length) throw new ErroApi(403, 'Só quem criou pode publicar este sistema.')
    return ok({ ok: true })
  }
  if (b.acao === 'excluir') {
    const usadas = await rest<unknown[]>(`prg_fichas?select=id&sistema=eq.${q(idAutoral(b.uuid))}&limit=1`)
    if (usadas.length) throw new ErroApi(409, 'Já existem fichas usando este sistema. Você pode despublicar, mas não excluir.')
    const r = await rest<unknown[]>(filtro, { method: 'DELETE', prefer: 'return=representation' })
    if (!r.length) throw new ErroApi(403, 'Só quem criou pode excluir este sistema.')
    return ok({ ok: true })
  }
  throw new ErroApi(400, 'Ação desconhecida.')
})

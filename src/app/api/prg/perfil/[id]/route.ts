import type { NextRequest } from 'next/server'
import { ator, ErroApi, lerJson, ok, q, rest, rota, sessaoValida } from '@/lib/nuvem/servidor'
import { exigirAdmin } from '@/lib/nuvem/admin'
import { isUuid } from '@/lib/nuvem/validacao'
import { apagarCookie, conferirHash, DIAS_LEMBRADO, gerarHash, gravarCookie, hashToken, lerToken, MAX_FALHAS, nomeAparelho, novoToken, TRAVA_MIN, validarSenhaNova } from '@/lib/nuvem/senha'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
type Linha = { id: string; senha_hash: string | null; senha_falhas: number; senha_bloqueio_ate: string | null }

async function perfil(id: string): Promise<Linha> {
  if (!isUuid(id)) throw new ErroApi(404, 'Aventureiro não encontrado.')
  const [p] = await rest<Linha[]>(`prg_public_adventurers?select=id,senha_hash,senha_falhas,senha_bloqueio_ate&id=eq.${q(id)}&limit=1`)
  if (!p) throw new ErroApi(404, 'Aventureiro não encontrado.')
  return p
}
const mudar = (id: string, campos: Record<string, unknown>) =>
  rest(`prg_public_adventurers?id=eq.${q(id)}`, { method: 'PATCH', body: JSON.stringify(campos) })

/** Confere a senha do perfil contando erros: 5 erros seguidos travam por 10 minutos. */
async function conferir(p: Linha, senha: unknown) {
  if (p.senha_bloqueio_ate && new Date(p.senha_bloqueio_ate).getTime() > Date.now()) {
    const min = Math.max(1, Math.ceil((new Date(p.senha_bloqueio_ate).getTime() - Date.now()) / 60_000))
    throw new ErroApi(429, `Muitas tentativas erradas. Tente de novo em ${min} ${min === 1 ? 'minuto' : 'minutos'}.`)
  }
  if (await conferirHash(senha, p.senha_hash)) {
    if (p.senha_falhas || p.senha_bloqueio_ate) await mudar(p.id, { senha_falhas: 0, senha_bloqueio_ate: null })
    return
  }
  const falhas = (p.senha_falhas || 0) + 1
  await mudar(p.id, falhas >= MAX_FALHAS
    ? { senha_falhas: 0, senha_bloqueio_ate: new Date(Date.now() + TRAVA_MIN * 60_000).toISOString() }
    : { senha_falhas: falhas })
  await new Promise(r => setTimeout(r, 500))
  throw new ErroApi(401, falhas >= MAX_FALHAS ? `Senha incorreta. Muitas tentativas: espere ${TRAVA_MIN} minutos.` : 'Senha incorreta.')
}

/** Lembra este aparelho (30 dias) e devolve a resposta com o cookie. */
async function lembrar(req: NextRequest, id: string, corpo: Record<string, unknown>) {
  const token = novoToken()
  await rest('prg_perfil_sessoes', { method: 'POST', body: JSON.stringify({
    aventureiro_id: id, token_hash: hashToken(token), aparelho: nomeAparelho(req.headers.get('user-agent')),
    expira_em: new Date(Date.now() + DIAS_LEMBRADO * 86400_000).toISOString(),
  }) })
  // Aproveita para limpar aparelhos vencidos deste perfil.
  await rest(`prg_perfil_sessoes?aventureiro_id=eq.${q(id)}&expira_em=lt.${q(new Date().toISOString())}`, { method: 'DELETE' }).catch(() => {})
  const res = ok(corpo)
  gravarCookie(res, req, id, token)
  return res
}
const esquecerTodos = (id: string) => rest(`prg_perfil_sessoes?aventureiro_id=eq.${q(id)}`, { method: 'DELETE' })

/** Situação da senha do perfil neste aparelho (sem segredo nenhum). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const p = await perfil(id)
  const conectado = !!p.senha_hash && await sessaoValida(req, id)
  let aparelhos: { id: string; aparelho: string; criado_em: string; este: boolean }[] = []
  if (conectado) {
    const meu = hashToken(lerToken(req, id) ?? '')
    const rows = await rest<{ id: string; aparelho: string; criado_em: string; token_hash: string }[]>(
      `prg_perfil_sessoes?select=id,aparelho,criado_em,token_hash&aventureiro_id=eq.${q(id)}&expira_em=gt.${q(new Date().toISOString())}&order=criado_em.desc&limit=20`)
    aparelhos = rows.map(r => ({ id: r.id, aparelho: r.aparelho, criado_em: r.criado_em, este: r.token_hash === meu }))
  }
  return ok({ protegido: !!p.senha_hash, conectado, aparelhos })
})

/**
 * acao: 'entrar' {senha} · 'definir' {nova, atual?} · 'remover' {atual} · 'sair' {todos?} · 'redefinir' {admin} (senha de administrador).
 */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const b = await lerJson(req, 2000) as Record<string, unknown>
  const p = await perfil(id)
  switch (b.acao) {
    case 'entrar': {
      if (!p.senha_hash) throw new ErroApi(400, 'Este perfil não tem senha.')
      await conferir(p, b.senha)
      return lembrar(req, id, { ok: true })
    }
    case 'definir': {
      if (req.headers.get('x-prg-aventureiro') !== id) throw new ErroApi(403, 'Só o próprio perfil cria ou troca a senha.')
      await ator(req)
      if (p.senha_hash) await conferir(p, b.atual)
      const v = validarSenhaNova(b.nova)
      if (!v.ok) throw new ErroApi(400, v.erro)
      await mudar(id, { senha_hash: await gerarHash(v.senha), senha_falhas: 0, senha_bloqueio_ate: null })
      // Trocar a senha desconecta os outros aparelhos; este continua lembrado.
      await esquecerTodos(id)
      return lembrar(req, id, { ok: true, protegido: true })
    }
    case 'remover': {
      if (req.headers.get('x-prg-aventureiro') !== id) throw new ErroApi(403, 'Só o próprio perfil remove a senha.')
      await ator(req)
      if (!p.senha_hash) throw new ErroApi(400, 'Este perfil não tem senha.')
      await conferir(p, b.atual)
      await mudar(id, { senha_hash: null, senha_falhas: 0, senha_bloqueio_ate: null })
      await esquecerTodos(id)
      const res = ok({ ok: true, protegido: false }); apagarCookie(res, req, id); return res
    }
    case 'sair': {
      const t = lerToken(req, id)
      if (b.todos === true) {
        if (!p.senha_hash || !(await sessaoValida(req, id))) throw new ErroApi(401, 'Entre com a senha para desconectar os aparelhos.', { senha: true, perfil: id })
        await esquecerTodos(id)
      } else if (t) await rest(`prg_perfil_sessoes?aventureiro_id=eq.${q(id)}&token_hash=eq.${q(hashToken(t))}`, { method: 'DELETE' })
      const res = ok({ ok: true }); apagarCookie(res, req, id); return res
    }
    case 'redefinir': {
      await exigirAdmin(req, b.admin)
      await mudar(id, { senha_hash: null, senha_falhas: 0, senha_bloqueio_ate: null })
      await esquecerTodos(id)
      return ok({ ok: true, protegido: false })
    }
    default: throw new ErroApi(400, 'Ação desconhecida.')
  }
})

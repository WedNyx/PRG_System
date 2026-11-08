import { NextRequest } from 'next/server'
import { ator, buscarFicha, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, type Papel } from '@/lib/nuvem/validacao'
import { aplicarNevoa, corValida, filtroVisibilidade, normalizarCondicoes, normalizarIniciativa, normalizarPontos, urlValida, type Visibilidade } from '@/lib/nuvem/mesa'
import { rolarExpressao } from '@/lib/dice'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ cid: string }> }
type Cena = { id: string; nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number; fog_ativo: boolean; fog_revelado: string[]; ativa: boolean }
type Token = { id: string; cena_id: string; ficha_id: string | null; dono_id: string | null; visivel: boolean; npc: boolean }
const EVENTO = 'id,tipo,visibilidade,autor_id,destinatario_id,personagem,texto,expressao,resultados,total,criado_em,autor:prg_public_adventurers!prg_mesa_eventos_autor_id_fkey(apelido)'

async function contexto(req: NextRequest, cid: string) {
  if (!isUuid(cid)) throw new ErroApi(404, 'Campanha não encontrada.')
  const eu = await ator(req)
  const papel = await papelNaCampanha(cid, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  return { eu, papel, admin: podeAdministrar(papel) }
}
const exigirAdmin = (admin: boolean) => { if (!admin) throw new ErroApi(403, 'Apenas o mestre pode fazer isso.') }
async function cenaDaCampanha(cid: string, cenaId: unknown): Promise<Cena> {
  if (!isUuid(cenaId)) throw new ErroApi(400, 'Cena inválida.')
  const [c] = await rest<Cena[]>(`prg_cenas?select=*&id=eq.${q(cenaId)}&campanha_id=eq.${q(cid)}`)
  if (!c) throw new ErroApi(404, 'Cena não encontrada.')
  return c
}
async function tokenDaCampanha(cid: string, tokenId: unknown): Promise<Token> {
  if (!isUuid(tokenId)) throw new ErroApi(400, 'Token inválido.')
  const [t] = await rest<Token[]>(`prg_tokens?select=id,cena_id,ficha_id,dono_id,visivel,npc&id=eq.${q(tokenId)}&campanha_id=eq.${q(cid)}`)
  if (!t) throw new ErroApi(404, 'Token não encontrado.')
  return t
}
const inteiro = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null }

/**
 * Estado da mesa. Jogadores recebem só a cena ativa, tokens visíveis e o que podem ver do chat.
 * ?historico=1&antes=<id>&autor=<id>&personagem=<texto>&tipo=rolagem|chat → histórico permanente.
 */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { cid } = await params
  const { eu, papel, admin } = await contexto(req, cid)
  const sp = req.nextUrl.searchParams
  const vis = filtroVisibilidade(eu, admin)

  if (sp.get('historico')) {
    const filtros: string[] = [vis]
    const antes = Number(sp.get('antes')); if (Number.isInteger(antes) && antes > 0) filtros.push(`id=lt.${antes}`)
    if (isUuid(sp.get('autor'))) filtros.push(`autor_id=eq.${q(sp.get('autor')!)}`)
    const tipo = sp.get('tipo'); if (tipo === 'rolagem' || tipo === 'chat') filtros.push(`tipo=eq.${tipo}`)
    const pers = (sp.get('personagem') ?? '').replace(/[*,()%]/g, '').slice(0, 60); if (pers) filtros.push(`personagem=ilike.*${q(pers)}*`)
    const eventos = await rest(`prg_mesa_eventos?select=${EVENTO}&campanha_id=eq.${q(cid)}&${filtros.join('&')}&order=id.desc&limit=100`)
    return ok({ eventos })
  }

  const [camp] = await rest<{ id: string; nome: string; sistema: string; mesa: Record<string, unknown> }[]>(`prg_campanhas?select=id,nome,sistema,mesa&id=eq.${q(cid)}`)
  const cenas = await rest<Cena[]>(`prg_cenas?select=*&campanha_id=eq.${q(cid)}${admin ? '' : '&ativa=eq.true'}&order=criada_em.asc`)
  const ativa = cenas.find(c => c.ativa) ?? null
  const [tokens, desenhos, eventos, membros, fichas] = await Promise.all([
    ativa ? rest(`prg_tokens?select=*&cena_id=eq.${q(ativa.id)}${admin ? '' : '&visivel=eq.true'}&order=criado_em.asc`) : Promise.resolve([]),
    ativa ? rest(`prg_desenhos?select=id,cor,pontos,autor_id&cena_id=eq.${q(ativa.id)}&order=criado_em.asc&limit=300`) : Promise.resolve([]),
    rest<unknown[]>(`prg_mesa_eventos?select=${EVENTO}&campanha_id=eq.${q(cid)}&${vis}&order=id.desc&limit=80`),
    rest(`prg_campanha_membros?select=aventureiro_id,papel,aventureiro:prg_public_adventurers(apelido,avatar)&campanha_id=eq.${q(cid)}`),
    rest(`prg_fichas?select=id,nome,dono_id,npc&campanha_id=eq.${q(cid)}&status=eq.ativa${admin ? '' : `&dono_id=eq.${q(eu)}&npc=eq.false`}&limit=200`),
  ])
  return ok({
    campanha: { id: camp.id, nome: camp.nome, sistema: camp.sistema, meuPapel: papel as Papel },
    mesa: camp.mesa, cenas: admin ? cenas : ativa ? [ativa] : [], cenaAtiva: ativa, tokens, desenhos,
    eventos: eventos.reverse(), membros, fichas, eu,
  })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { cid } = await params
  const { eu, admin } = await contexto(req, cid)
  const b = await lerJson(req, 80_000) as Record<string, unknown>

  switch (b.acao) {
    case 'evento': {
      const tipo = b.tipo === 'rolagem' ? 'rolagem' : 'chat'
      const visibilidade: Visibilidade = b.visibilidade === 'mestre' ? 'mestre' : b.visibilidade === 'privada' ? 'privada' : 'publica'
      let destinatario: string | null = null
      if (visibilidade === 'privada') {
        if (!isUuid(b.destinatarioId) || !(await papelNaCampanha(cid, b.destinatarioId))) throw new ErroApi(400, 'Escolha para quem é a mensagem privada.')
        destinatario = b.destinatarioId
      }
      const personagem = typeof b.personagem === 'string' ? b.personagem.trim().slice(0, 90) || null : null
      const linha: Record<string, unknown> = { campanha_id: cid, autor_id: eu, tipo, visibilidade, destinatario_id: destinatario, personagem }
      if (tipo === 'rolagem') {
        // O servidor rola os dados: ninguém consegue "escolher" o resultado.
        const expr = typeof b.expressao === 'string' ? b.expressao.trim().slice(0, 80) : ''
        const r = rolarExpressao(expr)
        if (!r) throw new ErroApi(400, 'Expressão de dados inválida. Ex.: 1d20+5, 2d6, 4d6kh3.')
        Object.assign(linha, { expressao: r.expressao, resultados: r.resultados, total: r.total, texto: typeof b.texto === 'string' ? b.texto.trim().slice(0, 200) || null : null })
      } else {
        const texto = typeof b.texto === 'string' ? b.texto.trim().slice(0, 1000) : ''
        if (!texto) throw new ErroApi(400, 'Mensagem vazia.')
        linha.texto = texto
      }
      const [ev] = await rest<unknown[]>(`prg_mesa_eventos?select=${EVENTO}`, { method: 'POST', prefer: 'return=representation', body: JSON.stringify(linha) })
      return ok({ evento: ev }, 201)
    }
    case 'cena_criar': {
      exigirAdmin(admin)
      const nome = typeof b.nome === 'string' ? b.nome.trim().slice(0, 80) : ''
      if (!nome) throw new ErroApi(400, 'Dê um nome à cena.')
      if (!urlValida(b.mapa_url ?? null)) throw new ErroApi(400, 'Link do mapa inválido (use https://).')
      const existentes = await rest<{ id: string }[]>(`prg_cenas?select=id&campanha_id=eq.${q(cid)}&limit=60`)
      if (existentes.length >= 50) throw new ErroApi(429, 'Limite de 50 cenas por campanha.')
      const [c] = await rest<Cena[]>('prg_cenas', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        campanha_id: cid, nome, mapa_url: b.mapa_url || null, grid_cols: inteiro(b.grid_cols, 5, 100) ?? 20, grid_rows: inteiro(b.grid_rows, 5, 100) ?? 15,
        fog_ativo: b.fog_ativo === true, ativa: existentes.length === 0,
      }) })
      return ok({ cena: c }, 201)
    }
    case 'cena_editar': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      const m: Record<string, unknown> = {}
      if (typeof b.nome === 'string' && b.nome.trim()) m.nome = b.nome.trim().slice(0, 80)
      if (b.mapa_url !== undefined) { if (!urlValida(b.mapa_url)) throw new ErroApi(400, 'Link do mapa inválido (use https://).'); m.mapa_url = b.mapa_url || null }
      if (b.grid_cols !== undefined) m.grid_cols = inteiro(b.grid_cols, 5, 100)
      if (b.grid_rows !== undefined) m.grid_rows = inteiro(b.grid_rows, 5, 100)
      if (typeof b.fog_ativo === 'boolean') m.fog_ativo = b.fog_ativo
      if (b.fog_limpar === true) m.fog_revelado = []
      await rest(`prg_cenas?id=eq.${q(c.id)}`, { method: 'PATCH', body: JSON.stringify(m) })
      return ok({ ok: true })
    }
    case 'cena_ativar': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      await rest(`prg_cenas?campanha_id=eq.${q(cid)}&ativa=eq.true`, { method: 'PATCH', body: JSON.stringify({ ativa: false }) })
      await rest(`prg_cenas?id=eq.${q(c.id)}`, { method: 'PATCH', body: JSON.stringify({ ativa: true }) })
      return ok({ ok: true })
    }
    case 'cena_excluir': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      await rest(`prg_cenas?id=eq.${q(c.id)}`, { method: 'DELETE' })
      return ok({ ok: true })
    }
    case 'nevoa': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      const novo = aplicarNevoa(c.fog_revelado ?? [], b.celulas, b.revelar === true, c.grid_cols, c.grid_rows)
      await rest(`prg_cenas?id=eq.${q(c.id)}`, { method: 'PATCH', body: JSON.stringify({ fog_revelado: novo }) })
      return ok({ ok: true })
    }
    case 'token_criar': {
      const c = await cenaDaCampanha(cid, b.cenaId)
      const nome = typeof b.nome === 'string' ? b.nome.trim().slice(0, 60) : ''
      let dono: string | null = isUuid(b.donoId) ? b.donoId : null, ficha: string | null = null
      if (isUuid(b.fichaId)) {
        const f = await buscarFicha(b.fichaId)
        if (!f || f.campanha_id !== cid || f.status !== 'ativa') throw new ErroApi(400, 'Ficha inválida para esta campanha.')
        if (!admin && f.dono_id !== eu) throw new ErroApi(403, 'Você só pode colocar o seu personagem na mesa.')
        ficha = f.id; dono = f.npc ? null : f.dono_id
      } else if (!admin) throw new ErroApi(403, 'Escolha a ficha do seu personagem.')
      if (dono && !(await papelNaCampanha(cid, dono))) dono = null
      if (!nome) throw new ErroApi(400, 'Dê um nome ao token.')
      if (b.cor !== undefined && !corValida(b.cor)) throw new ErroApi(400, 'Cor inválida.')
      if (!urlValida(b.imagem_url ?? null)) throw new ErroApi(400, 'Imagem inválida (use https://).')
      const total = await rest<unknown[]>(`prg_tokens?select=id&cena_id=eq.${q(c.id)}&limit=201`)
      if (total.length >= 200) throw new ErroApi(429, 'Limite de 200 tokens por cena.')
      const hp = inteiro(b.hp_max, 0, 100000)
      const [t] = await rest<unknown[]>('prg_tokens', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        campanha_id: cid, cena_id: c.id, ficha_id: ficha, dono_id: dono, nome, cor: b.cor ?? '#a78bfa', imagem_url: b.imagem_url || null,
        x: inteiro(b.x, 0, c.grid_cols - 1) ?? Math.floor(c.grid_cols / 2), y: inteiro(b.y, 0, c.grid_rows - 1) ?? Math.floor(c.grid_rows / 2), npc: admin && b.npc === true,
        visivel: !(admin && b.visivel === false), hp_max: hp, hp_atual: hp,
      }) })
      return ok({ token: t }, 201)
    }
    case 'token_mover': {
      const t = await tokenDaCampanha(cid, b.tokenId)
      if (!admin && t.dono_id !== eu) throw new ErroApi(403, 'Você só move o seu personagem.')
      const [c] = await rest<Cena[]>(`prg_cenas?select=grid_cols,grid_rows&id=eq.${q(t.cena_id)}`)
      await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ x: inteiro(b.x, 0, (c?.grid_cols ?? 100) - 1) ?? 0, y: inteiro(b.y, 0, (c?.grid_rows ?? 100) - 1) ?? 0 }) })
      return ok({ ok: true })
    }
    case 'token_editar': {
      const t = await tokenDaCampanha(cid, b.tokenId)
      const dono = t.dono_id === eu
      if (!admin && !dono) throw new ErroApi(403, 'Sem permissão para este token.')
      const m: Record<string, unknown> = {}
      if (b.hp_atual !== undefined) m.hp_atual = inteiro(b.hp_atual, -1000, 100000)
      if (b.condicoes !== undefined) m.condicoes = normalizarCondicoes(b.condicoes)
      if (admin) {
        if (typeof b.nome === 'string' && b.nome.trim()) m.nome = b.nome.trim().slice(0, 60)
        if (corValida(b.cor)) m.cor = b.cor
        if (typeof b.visivel === 'boolean') m.visivel = b.visivel
        if (b.hp_max !== undefined) m.hp_max = inteiro(b.hp_max, 0, 100000)
        if (b.imagem_url !== undefined) { if (!urlValida(b.imagem_url)) throw new ErroApi(400, 'Imagem inválida.'); m.imagem_url = b.imagem_url || null }
      }
      if (!Object.keys(m).length) throw new ErroApi(400, 'Nada para alterar.')
      await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify(m) })
      return ok({ ok: true })
    }
    case 'token_excluir': {
      exigirAdmin(admin)
      const t = await tokenDaCampanha(cid, b.tokenId)
      await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'DELETE' })
      return ok({ ok: true })
    }
    case 'desenho': {
      const c = await cenaDaCampanha(cid, b.cenaId)
      const pontos = normalizarPontos(b.pontos)
      if (!pontos || !corValida(b.cor)) throw new ErroApi(400, 'Desenho inválido.')
      await rest('prg_desenhos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, cena_id: c.id, autor_id: eu, cor: b.cor, pontos }) })
      return ok({ ok: true }, 201)
    }
    case 'desenhos_limpar': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      await rest(`prg_desenhos?cena_id=eq.${q(c.id)}`, { method: 'DELETE' })
      return ok({ ok: true })
    }
    case 'iniciativa': {
      exigirAdmin(admin)
      const iniciativa = normalizarIniciativa(b.iniciativa)
      const turno = Math.max(0, Math.min(iniciativa.length ? iniciativa.length - 1 : 0, inteiro(b.turno, 0, 100) ?? 0))
      const rodada = inteiro(b.rodada, 1, 10000) ?? 1
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ mesa: { iniciativa, turno, rodada } }) })
      return ok({ mesa: { iniciativa, turno, rodada } })
    }
    default: throw new ErroApi(400, 'Ação desconhecida.')
  }
})

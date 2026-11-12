import { NextRequest } from 'next/server'
import { ator, buscarFicha, nomeDaCampanha, notificar, participantes, lerJson, ok, papelNaCampanha, q, rest, rota, rpc, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, type Papel } from '@/lib/nuvem/validacao'
import { aplicarNevoa, corValida, filtroVisibilidade, normalizarCamadas, normalizarCondicoes, normalizarIniciativa, normalizarPontos, podeMoverToken, todasCelulas, urlValida, type Movimento, type Visibilidade } from '@/lib/nuvem/mesa'
import { rolarExpressao } from '@/lib/dice'
import { aplicarDano, atualizarMorte, avisarMesa, danoComMorte, fichaDeCombate, lerRegrasCombate, mudarFicha, tokenCombate, vidaDasFichas } from '@/lib/nuvem/combateServidor'
import { aceitarMedida, aoCair, lerMorte, MEDIDAS, testeMorte, type EstadoMorte } from '@/lib/sistemas/morte'
import { detectarCritico } from '@/lib/dice'
import { lerTabelas, rolarTabela, TABELAS_PRONTAS } from '@/lib/tabelas'
import { aplicarDescanso } from '@/lib/sistemas/descanso'
import { filtroResultado, resumirRolagens, type EventoResumo } from '@/lib/historico'
import { gruposDaExpressao, resultadoAssim } from '@/lib/sistemas/assimilacao'
import { acertou, ALCANCE_CORPO, criticoBlades, distancia, gastarCusto, ordenarIniciativa, regraDeAtaque, regraDeIniciativa, rolarDano, resumoCombate, type EntradaOrdem } from '@/lib/sistemas/combate'
import { carregarSistema } from '@/lib/nuvem/sistemasServidor'
import { ehV8 } from '@/lib/nuvem/categorias'
import { condicoesDisponiveis, emojiCondicao, nomeCondicao, normalizarDanos, normalizarRodadas, passarRodada } from '@/lib/condicoes'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ cid: string }> }
type Cena = { id: string; nome: string; mapa_url: string | null; grid_cols: number; grid_rows: number; fog_ativo: boolean; fog_revelado: string[]; ativa: boolean; tokens_travados: boolean }
type Token = { id: string; cena_id: string; ficha_id: string | null; dono_id: string | null; visivel: boolean; npc: boolean; movimento: Movimento }
const EVENTO = 'id,tipo,visibilidade,autor_id,destinatario_id,personagem,texto,expressao,resultados,total,dados,criado_em,autor:prg_public_adventurers!prg_mesa_eventos_autor_id_fkey(apelido)'

async function contexto(req: NextRequest, cid: string) {
  if (!isUuid(cid)) throw new ErroApi(404, 'Campanha não encontrada.')
  const eu = await ator(req)
  const papel = await papelNaCampanha(cid, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  return { eu, papel, admin: podeAdministrar(papel), espectador: papel === 'espectador' }
}
/** Com a sessão fechada, só o mestre (e co-mestre) entra na mesa. */
async function exigirSessaoAberta(cid: string, admin: boolean) {
  if (admin) return
  const [c] = await rest<{ sessao_aberta: boolean }[]>(`prg_campanhas?select=sessao_aberta&id=eq.${q(cid)}`)
  if (!c?.sessao_aberta) throw new ErroApi(423, 'A sessão está fechada. Aguarde o mestre abrir a mesa.')
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
  const [t] = await rest<Token[]>(`prg_tokens?select=id,cena_id,ficha_id,dono_id,visivel,npc,movimento&id=eq.${q(tokenId)}&campanha_id=eq.${q(cid)}`)
  if (!t) throw new ErroApi(404, 'Token não encontrado.')
  return t
}
/** Lê a ordem salva sem reordenar (a ordem da rodada é a que já está na mesa). */
const normalizarIniciativaSemOrdenar = (v: unknown) => {
  const l = normalizarIniciativa(v), ids = Array.isArray(v) ? (v as { id?: unknown }[]).map(x => x?.id) : []
  return [...l].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
}
/**
 * Começo do turno de um token: condições com dano por turno (Queimando, Envenenado…) rolam e tiram vida.
 * Devolve as linhas para o chat.
 */
async function danoNoInicioDoTurno(cid: string, tokenId: string | null | undefined): Promise<string[]> {
  if (!tokenId) return []
  const [tk] = await rest<{ id: string; nome: string; condicoes: string[] | null; condicoes_dano: Record<string, string> | null }[]>(`prg_tokens?select=id,nome,condicoes,condicoes_dano&id=eq.${q(tokenId)}&campanha_id=eq.${q(cid)}`).catch(() => [])
  const danos = tk ? normalizarDanos(tk.condicoes_dano, tk.condicoes ?? []) : {}
  if (!tk || !Object.keys(danos).length) return []
  const linhas: string[] = []
  for (const [c, expr] of Object.entries(danos)) {
    const rol = rolarExpressao(expr); if (!rol) continue
    const dano = Math.max(0, rol.total)
    const alvo = await tokenCombate(cid, tk.id)
    const vida = dano > 0 ? await aplicarDano(alvo, dano) : null
    const extra = vida ? await atualizarMorte(cid, alvo, vida, dano) : []
    linhas.push(`${emojiCondicao[c] ?? ''} ${nomeCondicao(c)}: ${tk.nome} sofreu ${dano} de dano (${expr} → [${rol.resultados.join(', ')}])${vida?.depois !== null && vida?.depois !== undefined ? ` · ❤️ ${vida.depois}${vida.max ? '/' + vida.max : ''}` : ''}.`, ...extra)
  }
  return linhas
}
/** Começo do turno de quem está caído: teste contra a morte automático (d20), se a regra estiver ligada. */
async function testeNoInicioDoTurno(cid: string, tokenId: string | null | undefined): Promise<string[]> {
  if (!tokenId) return []
  const [camp] = await rest<{ combate: unknown }[]>(`prg_campanhas?select=combate&id=eq.${q(cid)}`)
  if (lerRegrasCombate(camp?.combate).morte === 'desligado') return []
  const [tk] = await rest<{ id: string; nome: string; morte: unknown }[]>(`prg_tokens?select=id,nome,morte&id=eq.${q(tokenId)}&campanha_id=eq.${q(cid)}`).catch(() => [])
  const m = lerMorte(tk?.morte)
  if (!tk || m.estado !== 'caido') return []
  return [await rolarTesteMorte(cid, tk, m)]
}
async function rolarTesteMorte(cid: string, tk: { id: string; nome: string }, m: EstadoMorte): Promise<string> {
  const d20 = rolarExpressao('1d20')!.resultados[0]
  const r = testeMorte(m, d20)
  await rest(`prg_tokens?id=eq.${q(tk.id)}`, { method: 'PATCH', body: JSON.stringify({ morte: r.m }) })
  if (r.levanta) await aplicarDano(await tokenCombate(cid, tk.id), -1)
  return `💀 Teste contra a morte de ${tk.nome}: 🎲 ${r.texto}`
}
/** Onde o token novo entra: a casa pedida ou, sem casa, a livre mais perto do meio (para não ficar um em cima do outro). */
async function posicaoLivre(c: { id: string; grid_cols: number; grid_rows: number }, x: unknown, y: unknown) {
  const px = inteiro(x, 0, c.grid_cols - 1), py = inteiro(y, 0, c.grid_rows - 1)
  if (px !== null && py !== null) return { x: px, y: py }
  const ocupadas = new Set((await rest<{ x: number; y: number }[]>(`prg_tokens?select=x,y&cena_id=eq.${q(c.id)}&limit=300`).catch(() => [])).map(t => t.x + ',' + t.y))
  const cx = Math.floor(c.grid_cols / 2), cy = Math.floor(c.grid_rows / 2)
  for (let raio = 0; raio < Math.max(c.grid_cols, c.grid_rows); raio++)
    for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue
      const nx = cx + dx, ny = cy + dy
      if (nx >= 0 && ny >= 0 && nx < c.grid_cols && ny < c.grid_rows && !ocupadas.has(nx + ',' + ny)) return { x: nx, y: ny }
    }
  return { x: cx, y: cy }
}
const inteiro = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null }

/**
 * Estado da mesa. Jogadores recebem só a cena ativa, tokens visíveis e o que podem ver do chat.
 * ?historico=1&antes=<id>&autor=<id>&personagem=<texto>&tipo=rolagem|ataque|dados|chat|sistema&desde=<iso>&busca=<texto>&resultado=critico|falha → histórico permanente.
 * ?historico=1&resumo=1&desde=<iso> → resumo das rolagens do período (críticos, falhas, maior dano…).
 */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { cid } = await params
  const { eu, papel, admin } = await contexto(req, cid)
  const sp = req.nextUrl.searchParams
  const vis = filtroVisibilidade(eu, admin)

  // Aba “Fichas” da mesa: mestre vê todas (jogadores e NPCs); jogador vê as dele. Com vida, defesa e ataques.
  if (sp.get('tabelas')) {
    // Tabelas do mestre: as prontas da plataforma + as da campanha (só o mestre vê e rola).
    if (!admin) throw new ErroApi(403, 'Só o mestre usa as tabelas.')
    const [c] = await rest<{ tabelas: unknown }[]>(`prg_campanhas?select=tabelas&id=eq.${q(cid)}`)
    return ok({ prontas: TABELAS_PRONTAS, tabelas: lerTabelas(c?.tabelas) })
  }
  if (sp.get('fichas')) {
    const fs = await rest<{ id: string; nome: string; sistema: string; dados: Record<string, unknown>; dono_id: string; npc: boolean; oculta: boolean; dono: { apelido: string } | null }[]>(
      `prg_fichas?select=id,nome,sistema,dados,dono_id,npc,oculta,dono:prg_public_adventurers(apelido)&campanha_id=eq.${q(cid)}&status=eq.ativa${admin ? '' : `&dono_id=eq.${q(eu)}&npc=eq.false`}&order=npc.asc,nome.asc&limit=200`)
    const cache = new Map<string, Awaited<ReturnType<typeof carregarSistema>>>()
    const fichas = []
    for (const f of fs) {
      if (!cache.has(f.sistema)) cache.set(f.sistema, ehV8(f.sistema) ? undefined : await carregarSistema(f.sistema))
      const s = cache.get(f.sistema)
      fichas.push({ id: f.id, nome: f.nome, sistema: f.sistema, dono_id: f.dono_id, dono: f.dono?.apelido ?? null, npc: f.npc, oculta: f.oculta,
        retrato: typeof f.dados?.retrato === 'string' ? f.dados.retrato : null, combate: s ? resumoCombate(s, f.dados) : null })
    }
    return ok({ fichas })
  }

  if (sp.get('historico')) {
    const filtros: string[] = [vis]
    const antes = Number(sp.get('antes')); if (Number.isInteger(antes) && antes > 0) filtros.push(`id=lt.${antes}`)
    if (isUuid(sp.get('autor'))) filtros.push(`autor_id=eq.${q(sp.get('autor')!)}`)
    const tipo = sp.get('tipo')
    if (tipo === 'rolagem' || tipo === 'chat' || tipo === 'ataque' || tipo === 'sistema') filtros.push(`tipo=eq.${tipo}`)
    else if (tipo === 'dados') filtros.push('tipo=in.(rolagem,ataque)')
    const limpo = (v: string | null) => (v ?? '').replace(/[*,()%\\]/g, '').trim().slice(0, 60)
    const pers = limpo(sp.get('personagem')); if (pers) filtros.push(`personagem=ilike.*${q(pers)}*`)
    const busca = limpo(sp.get('busca')); if (busca) filtros.push(`texto=ilike.*${q(busca)}*`)
    const desde = sp.get('desde'); if (desde && !Number.isNaN(Date.parse(desde))) filtros.push(`criado_em=gte.${q(new Date(desde).toISOString())}`)
    const res = sp.get('resultado'); if (res === 'critico' || res === 'falha') filtros.push(...filtroResultado(res))
    const [camp] = await rest<{ sessao_aberta_em: string | null }[]>(`prg_campanhas?select=sessao_aberta_em&id=eq.${q(cid)}`)
    if (sp.get('resumo')) {
      // Resumo: até 2000 rolagens/ataques do período (respeitando o que a pessoa pode ver).
      const evs = await rest<EventoResumo[]>(`prg_mesa_eventos?select=tipo,personagem,autor_id,expressao,resultados,total,dados,criado_em&campanha_id=eq.${q(cid)}&${filtros.filter(x => !x.startsWith('tipo=')).join('&')}&tipo=in.(rolagem,ataque)&order=id.desc&limit=2000`)
      const membros = await rest<{ aventureiro_id: string; aventureiro: { apelido: string } | null }[]>(`prg_campanha_membros?select=aventureiro_id,aventureiro:prg_public_adventurers(apelido)&campanha_id=eq.${q(cid)}`)
      const nomes = Object.fromEntries(membros.map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? 'Alguém']))
      return ok({ resumo: resumirRolagens(evs, id => (id && nomes[id]) || 'Alguém'), total: evs.length, sessaoAbertaEm: camp?.sessao_aberta_em ?? null })
    }
    const eventos = await rest(`prg_mesa_eventos?select=${EVENTO}&campanha_id=eq.${q(cid)}&${filtros.join('&')}&order=id.desc&limit=100`)
    return ok({ eventos, sessaoAbertaEm: camp?.sessao_aberta_em ?? null })
  }

  const [camp] = await rest<{ id: string; nome: string; sistema: string; mesa: Record<string, unknown>; musica: unknown; sessao_aberta: boolean; sessao_aberta_em: string | null; combate: unknown }[]>(`prg_campanhas?select=id,nome,sistema,mesa,musica,sessao_aberta,sessao_aberta_em,combate&id=eq.${q(cid)}`)
  if (!admin && !camp.sessao_aberta) throw new ErroApi(423, 'A sessão está fechada. Aguarde o mestre abrir a mesa.')
  const cenas = await rest<Cena[]>(`prg_cenas?select=*&campanha_id=eq.${q(cid)}${admin ? '' : '&ativa=eq.true'}&order=criada_em.asc`)
  const ativa = cenas.find(c => c.ativa) ?? null
  const [tokens, desenhos, eventos, membros, fichas] = await Promise.all([
    ativa ? rest(`prg_tokens?select=*&cena_id=eq.${q(ativa.id)}${admin ? '' : '&visivel=eq.true'}&order=criado_em.asc`) : Promise.resolve([]),
    ativa ? rest(`prg_desenhos?select=id,cor,pontos,autor_id&cena_id=eq.${q(ativa.id)}&order=criado_em.asc&limit=300`) : Promise.resolve([]),
    rest<unknown[]>(`prg_mesa_eventos?select=${EVENTO}&campanha_id=eq.${q(cid)}&${vis}&order=id.desc&limit=80`),
    rest(`prg_campanha_membros?select=aventureiro_id,papel,aventureiro:prg_public_adventurers(apelido,avatar)&campanha_id=eq.${q(cid)}`),
    rest(`prg_fichas?select=id,nome,dono_id,npc&campanha_id=eq.${q(cid)}&status=eq.ativa${admin ? '' : `&dono_id=eq.${q(eu)}&npc=eq.false`}&limit=200`),
  ])
  // Tokens ligados a fichas mostram a vida da ficha (ela é quem manda).
  const ligados = (tokens as { ficha_id: string | null }[]).flatMap(t => t.ficha_id ? [t.ficha_id] : [])
  const vidas = ligados.length ? await vidaDasFichas(ligados).catch(() => ({} as Record<string, { atual: number; max: number | null }>)) : {}
  const tokensVivos = (tokens as Record<string, unknown>[]).map(t => { const v = t.ficha_id ? vidas[t.ficha_id as string] : undefined; return v ? { ...t, hp_atual: v.atual, hp_max: v.max } : t })
  return ok({
    campanha: { id: camp.id, nome: camp.nome, sistema: camp.sistema, meuPapel: papel as Papel }, combate: lerRegrasCombate(camp.combate),
    mesa: camp.mesa, cenas: admin ? cenas : ativa ? [ativa] : [], cenaAtiva: ativa, tokens: tokensVivos, desenhos,
    eventos: eventos.reverse(), membros, fichas, eu, musica: camp.musica ?? { tocando: false }, agora: new Date().toISOString(),
    sessao: { aberta: !!camp.sessao_aberta, aberta_em: camp.sessao_aberta_em },
  })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { cid } = await params
  const { eu, admin, espectador } = await contexto(req, cid)
  const b = await lerJson(req, 80_000) as Record<string, unknown>
  await exigirSessaoAberta(cid, admin)
  // Espectador: só conversa no chat (sem rolagens, tokens, desenhos...).
  if (espectador && !(b.acao === 'evento' && b.tipo !== 'rolagem')) throw new ErroApi(403, 'Espectadores só assistem e conversam no chat.')

  switch (b.acao) {
    case 'sessao': {
      exigirAdmin(admin)
      const aberta = b.aberta === true
      const mud: Record<string, unknown> = { sessao_aberta: aberta, sessao_aberta_em: aberta ? new Date().toISOString() : null }
      if (!aberta) {
        // Ao encerrar, a música para para todo mundo.
        const [c] = await rest<{ musica: Record<string, unknown> }[]>(`prg_campanhas?select=musica&id=eq.${q(cid)}`)
        mud.musica = { ...(c?.musica ?? {}), tocando: false, pausado: false }
      }
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify(mud) })
      await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica', texto: aberta ? '🟢 O mestre abriu a sessão.' : '🔴 O mestre encerrou a sessão.' }) }).catch(() => {})
      if (aberta) {
        const [nomeC, ps] = await Promise.all([nomeDaCampanha(cid), participantes(cid)])
        await notificar(ps.map(p => ({ destinatario_id: p.aventureiro_id, campanha_id: cid, tipo: 'sessao_aberta',
          titulo: `🟢 A sessão de ${nomeC} começou!`, texto: 'Toque para entrar na mesa.', link: `/mesa?campanha=${cid}` })), eu)
      }
      return ok({ aberta })
    }
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
        if (!r) throw new ErroApi(400, 'Expressão de dados inválida. Ex.: 1d20+5, 2d6, 4d6kh3, 6d6s5, 4dF.')
        Object.assign(linha, { expressao: r.expressao, resultados: r.resultados, total: r.total, texto: typeof b.texto === 'string' ? b.texto.trim().slice(0, 200) || null : null })
        // Dados de símbolos (Assimilação): o chat mostra Sucessos, Adaptações e Pressões em vez da soma.
        if (b.estilo === 'assimilacao' && gruposDaExpressao(r.expressao)) linha.dados = { assimilacao: { manter: inteiro(b.manter, 1, 4) ?? 1, ...(b.todos === true ? { todos: true } : {}) } }
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
      const gc = inteiro(b.grid_cols, 5, 100) ?? 20, gr = inteiro(b.grid_rows, 5, 100) ?? 15
      const camadas = b.camadas === undefined ? [] : normalizarCamadas(b.camadas, gc, gr)
      if (!camadas) throw new ErroApi(400, 'Imagens do mapa inválidas.')
      const [c] = await rest<Cena[]>('prg_cenas', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        campanha_id: cid, nome, mapa_url: b.mapa_url || null, grid_cols: gc, grid_rows: gr, camadas,
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
      if (b.nevoa_tudo === true) m.fog_revelado = todasCelulas(m.grid_cols as number ?? c.grid_cols, m.grid_rows as number ?? c.grid_rows)
      if (typeof b.tokens_travados === 'boolean') m.tokens_travados = b.tokens_travados
      if (b.camadas !== undefined) {
        const camadas = normalizarCamadas(b.camadas, (m.grid_cols as number) ?? c.grid_cols, (m.grid_rows as number) ?? c.grid_rows)
        if (!camadas) throw new ErroApi(400, 'Imagens do mapa inválidas (máximo 30, só links https).')
        m.camadas = camadas
      }
      if (!Object.keys(m).length) throw new ErroApi(400, 'Nada para alterar.')
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
      let dono: string | null = isUuid(b.donoId) ? b.donoId : null, ficha: string | null = null, nomeFicha = ''
      if (isUuid(b.fichaId)) {
        const f = await buscarFicha(b.fichaId)
        if (!f || f.campanha_id !== cid || f.status !== 'ativa') throw new ErroApi(400, 'Ficha inválida para esta campanha.')
        if (!admin && f.dono_id !== eu) throw new ErroApi(403, 'Você só pode colocar o seu personagem na mesa.')
        ficha = f.id; dono = f.npc ? null : f.dono_id
        // Token importado da ficha: nome e imagem vêm dela (a vida é lida da ficha ao vivo).
        if (!nomeFicha) nomeFicha = f.nome
        if (!b.imagem_url && typeof f.dados?.retrato === 'string' && f.dados.retrato.startsWith('https://')) b.imagem_url = f.dados.retrato
      } else if (!admin) {
        // Jogador pode colocar o próprio token mesmo sem ficha aprovada (até 3 por cena).
        const meus = await rest<unknown[]>(`prg_tokens?select=id&cena_id=eq.${q(c.id)}&dono_id=eq.${q(eu)}&limit=4`)
        if (meus.length >= 3) throw new ErroApi(429, 'Você já tem 3 tokens nesta cena.')
        dono = eu
      }
      if (dono && !(await papelNaCampanha(cid, dono))) dono = null
      if (!nome && !nomeFicha) throw new ErroApi(400, 'Dê um nome ao token.')
      if (b.cor !== undefined && !corValida(b.cor)) throw new ErroApi(400, 'Cor inválida.')
      if (!urlValida(b.imagem_url ?? null)) throw new ErroApi(400, 'Imagem inválida (use https://).')
      const total = await rest<unknown[]>(`prg_tokens?select=id&cena_id=eq.${q(c.id)}&limit=201`)
      if (total.length >= 200) throw new ErroApi(429, 'Limite de 200 tokens por cena.')
      const hp = inteiro(b.hp_max, 0, 100000)
      const [t] = await rest<unknown[]>('prg_tokens', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        campanha_id: cid, cena_id: c.id, ficha_id: ficha, dono_id: dono, nome: nome || nomeFicha.slice(0, 60) || 'Personagem', cor: b.cor ?? '#a78bfa', imagem_url: b.imagem_url || null,
        ...(await posicaoLivre(c, b.x, b.y)), npc: admin && b.npc === true,
        visivel: !(admin && b.visivel === false), hp_max: hp, hp_atual: hp,
        tamanho: inteiro(b.tamanho, 1, 4) ?? 1, movimento: admin && (b.movimento === 'todos' || b.movimento === 'mestre') ? b.movimento : 'dono',
      }) })
      // Casa escolhida pelo servidor: o banco acha a casa livre com a cena travada (vários tokens entrando juntos não empilham).
      if (inteiro(b.x, 0, 1e6) === null || inteiro(b.y, 0, 1e6) === null) {
        const [casa] = await rpc<{ x: number; y: number }[]>('prg_token_casa_livre', { p_token: (t as { id: string }).id }).catch(() => [])
        if (casa) Object.assign(t as object, casa)
      }
      return ok({ token: t }, 201)
    }
    case 'token_mover': {
      const t = await tokenDaCampanha(cid, b.tokenId)
      const [c] = await rest<Cena[]>(`prg_cenas?select=grid_cols,grid_rows,tokens_travados&id=eq.${q(t.cena_id)}`)
      if (!podeMoverToken(t, eu, admin, !!c?.tokens_travados)) throw new ErroApi(403, c?.tokens_travados ? 'O mestre travou os tokens desta cena.' : 'Você não pode mover este token.')
      await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ x: inteiro(b.x, 0, (c?.grid_cols ?? 100) - 1) ?? 0, y: inteiro(b.y, 0, (c?.grid_rows ?? 100) - 1) ?? 0 }) })
      return ok({ ok: true })
    }
    case 'token_editar': {
      const t = await tokenDaCampanha(cid, b.tokenId)
      const dono = t.dono_id === eu
      if (!admin && !dono) throw new ErroApi(403, 'Sem permissão para este token.')
      const m: Record<string, unknown> = {}
      if (b.hp_atual !== undefined) {
        const novo = inteiro(b.hp_atual, -1000, 100000)
        const fc = t.ficha_id && novo !== null ? await fichaDeCombate(t.ficha_id) : null
        // Token ligado a ficha: o dano/cura vai para a vida da ficha.
        const tc = await tokenCombate(cid, t.id)
        if (fc?.r.vida) { const v = fc.r.vida; await danoComMorte(cid, eu, { ...tc, hp_atual: v.atual, hp_max: v.max }, v.atual - (novo as number)) }
        else if (novo !== null && (tc.hp_atual !== null || tc.hp_max !== null)) await danoComMorte(cid, eu, tc, (tc.hp_atual ?? tc.hp_max ?? 0) - novo)
        else m.hp_atual = novo
      }
      if (b.condicoes !== undefined || b.rodadas !== undefined || b.danos !== undefined) {
        // Condições, quantas rodadas cada uma dura (sem número = sem limite) e o dano por turno.
        const [atual] = await rest<{ condicoes: string[] | null; condicoes_rodadas: Record<string, number> | null; condicoes_dano: Record<string, string> | null }[]>(`prg_tokens?select=condicoes,condicoes_rodadas,condicoes_dano&id=eq.${q(t.id)}`)
        const antes = atual?.condicoes ?? []
        const cond = b.condicoes !== undefined ? normalizarCondicoes(b.condicoes) : antes
        m.condicoes = cond
        m.condicoes_rodadas = normalizarRodadas(b.rodadas !== undefined ? b.rodadas : atual?.condicoes_rodadas, cond)
        // Condição que acabou de entrar já vem com o dano sugerido (Queimando 1d6…); o mestre pode mudar ou tirar.
        const danos: Record<string, unknown> = { ...(atual?.condicoes_dano ?? {}), ...(b.danos && typeof b.danos === 'object' ? b.danos as object : {}) }
        for (const c of cond) if (!antes.includes(c) && danos[c] === undefined) { const sug = condicoesDisponiveis.find(x => x.id === c)?.dano; if (sug) danos[c] = sug }
        m.condicoes_dano = normalizarDanos(danos, cond)
      }
      if (admin || dono) {
        if (b.imagem_url !== undefined) { if (!urlValida(b.imagem_url)) throw new ErroApi(400, 'Imagem inválida.'); m.imagem_url = b.imagem_url || null }
        if (corValida(b.cor)) m.cor = b.cor
      }
      if (admin) {
        if (b.movimento === 'dono' || b.movimento === 'todos' || b.movimento === 'mestre') m.movimento = b.movimento
        if (b.tamanho !== undefined) m.tamanho = inteiro(b.tamanho, 1, 4)
        if (typeof b.nome === 'string' && b.nome.trim()) m.nome = b.nome.trim().slice(0, 60)
        if (typeof b.visivel === 'boolean') m.visivel = b.visivel
        if (b.hp_max !== undefined) m.hp_max = inteiro(b.hp_max, 0, 100000)
      }
      if (!Object.keys(m).length) { if (b.hp_atual !== undefined) return ok({ ok: true }); throw new ErroApi(400, 'Nada para alterar.') }
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
      await rest('prg_desenhos', { method: 'POST', body: JSON.stringify({ ...(isUuid(b.id) ? { id: b.id } : {}), campanha_id: cid, cena_id: c.id, autor_id: eu, cor: b.cor, pontos }) })
      return ok({ ok: true }, 201)
    }
    case 'desenhos_limpar': {
      exigirAdmin(admin)
      const c = await cenaDaCampanha(cid, b.cenaId)
      await rest(`prg_desenhos?cena_id=eq.${q(c.id)}`, { method: 'DELETE' })
      return ok({ ok: true })
    }
    case 'tabelas_salvar': {
      exigirAdmin(admin)
      const tabelas = lerTabelas(b.tabelas)
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ tabelas }) })
      return ok({ tabelas })
    }
    case 'descanso': {
      // O mestre dá um descanso curto ou longo para o grupo (fichas ativas da campanha; NPCs só se pedir).
      exigirAdmin(admin)
      const tipo = b.tipo === 'curto' ? 'curto' : 'longo'
      const fichas = await rest<{ id: string; nome: string; sistema: string }[]>(`prg_fichas?select=id,nome,sistema&campanha_id=eq.${q(cid)}&status=eq.ativa${b.npcs === true ? '' : '&npc=eq.false'}&limit=100`)
      const linhas: string[] = []
      for (const f of fichas) {
        if (ehV8(f.sistema)) continue
        const s = await carregarSistema(f.sistema)
        if (!s) continue
        let mud: string[] = []
        await mudarFicha(f.id, dados => { const r = aplicarDescanso(s, dados, tipo); mud = r.mudancas; return r.mudancas.length ? r.d as unknown as Record<string, unknown> : null })
        if (mud.length) linhas.push(`${f.nome || 'Sem nome'}: ${mud.join(', ')}`)
      }
      if (tipo === 'longo') {
        // Depois de uma noite de sono, quem estava caído ou estável levanta (quem morreu continua morto).
        await rest(`prg_tokens?campanha_id=eq.${q(cid)}&morte->>estado=in.(caido,estavel)`, { method: 'PATCH', body: JSON.stringify({ morte: {} }) }).catch(() => {})
      }
      const titulo = tipo === 'longo' ? '🌙 Descanso longo para o grupo.' : '☕ Descanso curto para o grupo.'
      await avisarMesa(cid, eu, (titulo + (linhas.length ? '\n' + linhas.join('\n') : ' Ninguém precisava recuperar nada.')).slice(0, 1000))
      return ok({ ok: true, fichas: fichas.length, recuperaram: linhas.length })
    }
    case 'tabela_rolar': {
      exigirAdmin(admin)
      const [c] = await rest<{ tabelas: unknown }[]>(`prg_campanhas?select=tabelas&id=eq.${q(cid)}`)
      const todas = [...TABELAS_PRONTAS, ...lerTabelas(c?.tabelas)]
      const tab = todas.find(x => x.id === b.id)
      if (!tab) throw new ErroApi(404, 'Tabela não encontrada.')
      const resultado = rolarTabela(tab.id, todas).slice(0, 900)
      const visibilidade = b.visibilidade === 'mestre' ? 'mestre' : 'publica'
      await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade,
        texto: `${tab.icone} ${tab.nome}: ${resultado}${visibilidade === 'mestre' ? ' (só o mestre vê)' : ''}` }) }).catch(() => {})
      return ok({ resultado, tabela: { id: tab.id, nome: tab.nome, icone: tab.icone } })
    }
    case 'morte': {
      // À beira da morte: rolar o teste, ajustar na mão (mestre) ou aceitar medidas desesperadas (dono).
      const t = await tokenDaCampanha(cid, b.tokenId)
      if (!admin && t.dono_id !== eu) throw new ErroApi(403, 'Só o mestre ou o dono deste token.')
      const [camp] = await rest<{ combate: unknown }[]>(`prg_campanhas?select=combate&id=eq.${q(cid)}`)
      const regra = lerRegrasCombate(camp?.combate).morte
      if (regra === 'desligado') throw new ErroApi(400, 'A regra “à beira da morte” está desligada nesta campanha.')
      const tc = await tokenCombate(cid, t.id)
      const [tk] = await rest<{ morte: unknown }[]>(`prg_tokens?select=morte&id=eq.${q(t.id)}`)
      let m = lerMorte(tk?.morte)
      const op = b.op
      if (op === 'rolar') {
        if (m.estado !== 'caido') throw new ErroApi(400, `${tc.nome} não está caído.`)
        await avisarMesa(cid, eu, await rolarTesteMorte(cid, tc, m))
        return ok({ ok: true })
      }
      if (op === 'medida') {
        if (regra !== 'desesperadas') throw new ErroApi(400, 'A campanha não usa Medidas desesperadas.')
        const n = b.n === 3 ? 3 : 1
        const novo = aceitarMedida(m, n)
        if (!novo) throw new ErroApi(400, m.estado ? 'Só dá para usar de pé.' : 'No máximo 3 falhas futuras guardadas.')
        await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ morte: novo }) })
        await avisarMesa(cid, eu, `⚠️ ${tc.nome} usou Medidas desesperadas: aceita ${n} falha(s) futura(s) para ${MEDIDAS[n]}. (Guardadas: ${novo.futuras}/3)`)
        return ok({ morte: novo })
      }
      exigirAdmin(admin)
      if (op === 'sucesso') m = { ...m, estado: m.estado ?? 'caido', sucessos: Math.min(3, m.sucessos + 1) }
      else if (op === 'falha') m = { ...m, estado: m.estado ?? 'caido', falhas: Math.min(3, m.falhas + 1) }
      else if (op === 'estabilizar') m = { ...m, estado: 'estavel', sucessos: 3 }
      else if (op === 'cair') m = aoCair(m)
      else if (op === 'zerar') m = { sucessos: 0, falhas: 0, futuras: 0 }
      else throw new ErroApi(400, 'Ação inválida.')
      if (m.sucessos >= 3 && m.estado === 'caido') m = { ...m, estado: 'estavel' }
      if (m.falhas >= 3) m = { ...m, estado: 'morto' }
      await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ morte: m }) })
      return ok({ morte: m })
    }
    case 'combate_config': {
      exigirAdmin(admin)
      const [atual] = await rest<{ combate: unknown }[]>(`prg_campanhas?select=combate&id=eq.${q(cid)}`)
      const antes = lerRegrasCombate(atual?.combate)
      const combate = lerRegrasCombate({ acerto: b.acerto ?? antes.acerto, morte: b.morte ?? antes.morte })
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ combate }) })
      if (combate.acerto !== antes.acerto) await avisarMesa(cid, eu, combate.acerto === 'automatico' ? '⚔️ Combate: o dano dos ataques agora sai automaticamente.' : '⚔️ Combate: o mestre confirma cada dano antes de aplicar.')
      if (combate.morte !== antes.morte) await avisarMesa(cid, eu, combate.morte === 'desligado' ? '💀 Regra “à beira da morte” desligada: vida 0 não faz testes.'
        : combate.morte === 'desesperadas' ? '💀 À beira da morte: testes contra a morte + ⚠️ Medidas desesperadas (falhas futuras em troca de agir agora).' : '💀 À beira da morte: quem chega a 0 faz testes contra a morte no turno.')
      return ok({ combate })
    }
    case 'ataque': {
      const at = await tokenCombate(cid, b.atacante), al = await tokenCombate(cid, b.alvo)
      if (at.id === al.id) throw new ErroApi(400, 'Escolha outro alvo.')
      if (at.cena_id !== al.cena_id) throw new ErroApi(400, 'Atacante e alvo precisam estar na mesma cena.')
      if (!admin && at.dono_id !== eu) throw new ErroApi(403, 'Você só ataca com o seu personagem.')
      const [camp] = await rest<{ combate: unknown }[]>(`prg_campanhas?select=combate&id=eq.${q(cid)}`)
      const regras = lerRegrasCombate(camp?.combate)
      const fa = await fichaDeCombate(at.ficha_id)
      const fonte = b.fonte && typeof b.fonte === 'object' ? b.fonte as { tipo?: unknown; id?: unknown } : null
      const opcao = fonte ? fa?.r.ataques.find(a => a.tipo === fonte.tipo && a.id === fonte.id) : undefined
      if (fonte && !opcao) throw new ErroApi(400, 'Arma ou poder não encontrado na ficha.')
      const danoExpr = opcao?.dano ?? (typeof b.dano === 'string' ? b.dano.trim().toLowerCase().slice(0, 40) : '')
      if (!danoExpr || !rolarExpressao(danoExpr)) throw new ErroApi(400, 'Informe o dano (ex.: 1d8+3).')
      const alcance = opcao?.alcance ?? ALCANCE_CORPO
      const dist = distancia(at, al)
      if (opcao && dist > alcance && !admin) throw new ErroApi(400, `Fora de alcance: o alvo está a ${dist} m e ${opcao.nome} alcança ${alcance} m.`)
      // Bônus do teste escolhido (perícia/atributo da ficha); sem ficha, o bônus informado.
      // Teste escolhido > bônus informado > teste sugerido da ficha.
      const teste = fa?.r.testes.find(t => t.id === b.teste) ?? (b.bonus === undefined ? fa?.r.testes.find(t => t.id === fa.r.testePadrao) : undefined)
      const bonus = teste?.valor ?? (inteiro(b.bonus, -50, 100) ?? 0)
      // Custo do poder sai antes de rolar.
      if (opcao?.tipo === 'poder' && opcao.recurso && (opcao.custo ?? 0) > 0 && fa) {
        const rec = fa.r.recursos.find(r => r.id === opcao.recurso)
        if (!(await mudarFicha(fa.f.id, d => gastarCusto(d, opcao.recurso!, opcao.custo!)))) throw new ErroApi(400, `Sem ${rec?.nome ?? 'recurso'} suficiente (precisa de ${opcao.custo}).`)
      }
      const regra = regraDeAtaque(fa?.s, bonus, teste?.dados, teste?.assim)
      const rolagem = rolarExpressao(regra.expressao)!
      // Assimilação: mantém o melhor dado; o que vale são os Sucessos dele.
      const assim = regra.comparar === 'assimilacao' ? resultadoAssim(regra.expressao, rolagem.resultados, 1) : null
      const fal = await fichaDeCombate(al.ficha_id)
      const defesa = fal?.r.defesa?.valor ?? (admin ? inteiro(b.defesa, 0, 100) : null) ?? 10
      const hit = acertou(regra, assim ? assim.total.a : rolagem.total, defesa, bonus)
      const dano = hit ? rolarDano(danoExpr, fa?.s) : null
      const status: 'errou' | 'pendente' | 'aplicado' = hit ? (regras.acerto === 'automatico' ? 'aplicado' : 'pendente') : 'errou'
      let vida: Awaited<ReturnType<typeof aplicarDano>> | null = null
      const critico = hit && !assim && (regra.comparar === 'blades' ? criticoBlades(teste?.dados ?? 1, rolagem.resultados) : detectarCritico(regra.expressao, rolagem.resultados) === 'critico')
      if (status === 'aplicado' && dano) vida = await danoComMorte(cid, eu, al, dano.total, critico)
      const arma = opcao?.nome ?? 'Ataque'
      const placar = assim ? `${assim.total.a} Sucesso${assim.total.a === 1 ? '' : 's'}${assim.total.b ? `, ${assim.total.b} Adaptaç${assim.total.b === 1 ? 'ão' : 'ões'}` : ''}${assim.total.c ? `, ${assim.total.c} Press${assim.total.c === 1 ? 'ão' : 'ões'}` : ''}` : null
      const texto = placar ? `⚔️ ${at.nome} atacou ${al.nome} com ${arma} (${teste?.nome ?? 'teste'}): ${placar} → ` + (!hit ? 'errou.' : status === 'aplicado' ? `acertou! ${dano?.total ?? 0} de dano.` : `acertou! ${dano?.total ?? 0} de dano (aguardando o mestre).`)
        : `⚔️ ${at.nome} atacou ${al.nome} com ${arma}: ${rolagem.total}${regra.comparar === 'maior_igual' ? ` contra Defesa ${defesa}` : regra.comparar === 'menor_igual' ? ` (precisava ≤ ${bonus})` : regra.comparar === 'blades' ? '' : ' sucesso(s)'} → `
        + (!hit ? 'errou.' : status === 'aplicado' ? `acertou! ${dano?.total ?? 0} de dano.` : `acertou! ${dano?.total ?? 0} de dano (aguardando o mestre).`)
      const dados = { atacante: { id: at.id, nome: at.nome }, alvo: { id: al.id, nome: al.nome }, arma, defesa, comparar: regra.comparar, acerto: hit,
        dano: dano ? { expressao: dano.expressao, resultados: dano.resultados.slice(0, 60), total: dano.total } : null, status, aplicado: status === 'aplicado' ? dano?.total ?? 0 : 0,
        vida: vida ? { depois: vida.depois, max: vida.max } : null, distancia: dist, ...(critico ? { critico: true } : {}), ...(assim ? { assimilacao: { manter: 1 } } : {}) }
      const [ev] = await rest<unknown[]>(`prg_mesa_eventos?select=${EVENTO}`, { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        campanha_id: cid, autor_id: eu, tipo: 'ataque', visibilidade: 'publica', personagem: at.nome.slice(0, 90), texto: texto.slice(0, 1000),
        expressao: rolagem.expressao, resultados: rolagem.resultados.slice(0, 100), total: rolagem.total, dados }) })
      return ok({ evento: ev }, 201)
    }
    case 'combate_preparar': {
      exigirAdmin(admin)
      // Rola a iniciativa de cada token escolhido (bônus da ficha, ou o informado pelo mestre) e começa o combate.
      const pedidos = (Array.isArray(b.tokens) ? b.tokens : []).slice(0, 60) as { tokenId?: unknown; bonus?: unknown }[]
      if (!pedidos.length) throw new ErroApi(400, 'Escolha quem entra no combate.')
      const ordem: EntradaOrdem[] = []
      for (const ped of pedidos) {
        const t = await tokenCombate(cid, ped.tokenId)
        if (ordem.some(o => o.tokenId === t.id)) continue
        const fc = await fichaDeCombate(t.ficha_id)
        const bonus = ped.bonus !== undefined && ped.bonus !== null && ped.bonus !== '' ? (inteiro(ped.bonus, -50, 100) ?? 0) : (fc?.r.iniciativa ?? 0)
        const r = rolarExpressao(regraDeIniciativa(fc?.s, bonus, fc?.r.iniciativaDados)) ?? rolarExpressao('1d20')!
        ordem.push({ tokenId: t.id, nome: t.nome, valor: r.total, bonus, dados: r.resultados.slice(0, 20) })
      }
      const ord = ordenarIniciativa(ordem)
      const iniciativa = ord.map(o => ({ id: crypto.randomUUID(), nome: o.nome, valor: o.valor, tokenId: o.tokenId }))
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ mesa: { iniciativa, turno: 0, rodada: 1 } }) })
      await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica',
        texto: ('⚔️ O combate começou! Ordem: ' + ord.map((o, i) => `${i + 1}. ${o.nome} (${o.valor})`).join(' · ') + `\n▶️ Vez de ${ord[0].nome}.`).slice(0, 1000) }) }).catch(() => {})
      for (const texto of [...await danoNoInicioDoTurno(cid, ord[0].tokenId), ...await testeNoInicioDoTurno(cid, ord[0].tokenId)]) await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica', texto }) }).catch(() => {})
      return ok({ mesa: { iniciativa, turno: 0, rodada: 1 }, rolagens: ord })
    }
    case 'turno': {
      const [c] = await rest<{ mesa: { iniciativa?: unknown; turno?: number; rodada?: number } }[]>(`prg_campanhas?select=mesa&id=eq.${q(cid)}`)
      const lista = normalizarIniciativaSemOrdenar(c?.mesa?.iniciativa)
      if (!lista.length) throw new ErroApi(400, 'Ninguém na iniciativa.')
      let turno = Math.min(Math.max(0, Number(c.mesa.turno) || 0), lista.length - 1), rodada = Math.max(1, Number(c.mesa.rodada) || 1)
      const antes = lista[turno]
      if (!admin) {
        // O jogador pode encerrar o próprio turno (só para a frente, e só quando é a vez de um token dele).
        if (b.direcao === -1 || !antes.tokenId || typeof b.turnoAtual !== 'number' || b.turnoAtual !== turno) throw new ErroApi(403, 'Só o mestre passa o turno.')
        const [tk] = await rest<{ dono_id: string | null }[]>(`prg_tokens?select=dono_id&id=eq.${q(antes.tokenId)}&campanha_id=eq.${q(cid)}`)
        if (!tk || tk.dono_id !== eu) throw new ErroApi(403, 'Não é a sua vez.')
      }
      const filtroAntes = `&mesa->>turno=${c.mesa.turno === undefined || c.mesa.turno === null ? 'is.null' : 'eq.' + q(String(c.mesa.turno))}&mesa->>rodada=${c.mesa.rodada === undefined || c.mesa.rodada === null ? 'is.null' : 'eq.' + q(String(c.mesa.rodada))}`
      if (b.direcao === -1) { turno--; if (turno < 0) { turno = lista.length - 1; rodada = Math.max(1, rodada - 1) } }
      else { turno++; if (turno >= lista.length) { turno = 0; rodada++ } }
      // Só passa se o turno ainda for o mesmo (toque duplo, ou jogador e mestre ao mesmo tempo, passam uma vez só).
      const passou = await rest<unknown[]>(`prg_campanhas?id=eq.${q(cid)}${filtroAntes}`, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ mesa: { iniciativa: lista, turno, rodada } }) })
      if (!passou.length) throw new ErroApi(409, 'O turno já passou.')
      if (b.direcao !== -1) {
        // Fim do turno de quem jogou: as condições com duração perdem 1 rodada.
        const avisos: string[] = []
        if (antes.tokenId) {
          const [tk] = await rest<{ id: string; nome: string; condicoes: string[] | null; condicoes_rodadas: Record<string, number> | null }[]>(`prg_tokens?select=id,nome,condicoes,condicoes_rodadas&id=eq.${q(antes.tokenId)}&campanha_id=eq.${q(cid)}`).catch(() => [])
          if (tk && Object.keys(tk.condicoes_rodadas ?? {}).length) {
            const p = passarRodada(tk.condicoes ?? [], tk.condicoes_rodadas ?? {})
            await rest(`prg_tokens?id=eq.${q(tk.id)}`, { method: 'PATCH', body: JSON.stringify({ condicoes: p.condicoes, condicoes_rodadas: p.rodadas }) })
            for (const a of p.acabaram) avisos.push(`⏳ ${emojiCondicao[a] ?? ''} ${nomeCondicao(a)} acabou em ${tk.nome}.`)
          }
        }
        let estado = ''
        const prox = lista[turno]
        if (prox.tokenId) {
          const [tk] = await rest<{ condicoes: string[] | null; condicoes_rodadas: Record<string, number> | null }[]>(`prg_tokens?select=condicoes,condicoes_rodadas&id=eq.${q(prox.tokenId)}&campanha_id=eq.${q(cid)}`).catch(() => [])
          const cs = tk?.condicoes ?? []
          if (cs.length) estado = ' (' + cs.map(x => `${emojiCondicao[x] ?? ''} ${nomeCondicao(x)}${tk?.condicoes_rodadas?.[x] ? ' · ' + tk.condicoes_rodadas[x] : ''}`).join(', ') + ')'
        }
        const linhas = [...avisos, `▶️ Vez de ${prox.nome}${turno === 0 ? ` · rodada ${rodada}` : ''}${estado}.`, ...await danoNoInicioDoTurno(cid, prox.tokenId), ...await testeNoInicioDoTurno(cid, prox.tokenId)]
        for (const texto of linhas) await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica', texto }) }).catch(() => {})
      }
      return ok({ mesa: { iniciativa: lista, turno, rodada } })
    }
    case 'combate_encerrar': {
      exigirAdmin(admin)
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ mesa: { iniciativa: [], turno: 0, rodada: 1 } }) })
      await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica', texto: '🏳️ Fim do combate.' }) }).catch(() => {})
      return ok({ ok: true })
    }
    case 'ataque_decidir': {
      exigirAdmin(admin)
      const id = Number(b.eventoId)
      if (!Number.isInteger(id) || id <= 0) throw new ErroApi(400, 'Ataque inválido.')
      const [ev] = await rest<{ id: number; dados: Record<string, unknown> | null; texto: string }[]>(`prg_mesa_eventos?select=id,dados,texto&id=eq.${id}&campanha_id=eq.${q(cid)}&tipo=eq.ataque`)
      const d = ev?.dados
      if (!d || (d.status !== 'pendente' && d.status !== 'errou')) throw new ErroApi(409, 'Este ataque já foi resolvido.')
      // Reserva o ataque (clique duplo ou dois mestres ao mesmo tempo: só um aplica).
      const reservado = await rest<unknown[]>(`prg_mesa_eventos?id=eq.${id}&dados->>status=eq.${q(String(d.status))}`, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ dados: { ...d, status: 'resolvendo' } }) })
      if (!reservado.length) throw new ErroApi(409, 'Este ataque já foi resolvido.')
      const fator = b.fator === 0.5 ? 0.5 : b.fator === 0 ? 0 : 1
      const dano = d.dano as { total: number } | null
      // “Errou” também pode virar acerto, se o mestre quiser (ex.: regra especial do sistema).
      let total = dano?.total ?? 0
      if (!dano && fator > 0) total = inteiro(b.dano, 0, 100000) ?? 0
      const aplicado = Math.floor(total * fator)
      let vida: Awaited<ReturnType<typeof aplicarDano>> | null = null
      try { if (aplicado > 0) { const al = await tokenCombate(cid, (d.alvo as { id: string }).id); vida = await danoComMorte(cid, eu, al, aplicado, d.critico === true) } }
      catch (e) { await rest(`prg_mesa_eventos?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ dados: d }) }).catch(() => {}); throw e }
      const novo = { ...d, status: fator === 0 ? 'ignorado' : 'aplicado', aplicado, vida: vida ? { depois: vida.depois, max: vida.max } : null }
      await rest(`prg_mesa_eventos?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ dados: novo }) })
      const alvo = (d.alvo as { nome: string }).nome
      await rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica',
        texto: fator === 0 ? `🛡️ O mestre anulou o dano em ${alvo}.` : `💥 ${alvo} recebeu ${aplicado} de dano${fator === 0.5 ? ' (metade)' : ''}.` }) }).catch(() => {})
      return ok({ ok: true, aplicado })
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

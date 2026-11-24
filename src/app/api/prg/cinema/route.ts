import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { apelidoDe, ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import {
  adicionarVideo, anfitriaoAusente, cinemaInicial, codigoCinema, codigoValido, controlarCinema, limparMensagem, presentes, removerVideo, selecionarVideo,
  type EstadoCinema,
} from '@/lib/nuvem/cinema'

/**
 * Cinema Secreto (easter egg, v0.36.8): salas para ver vídeos do YouTube juntos.
 * Cada pessoa entra com o perfil da plataforma. O anfitrião controla a fila e a reprodução e pode passar o controle;
 * se ele sumir por um minuto, quem está na sala pode assumir. Chat e lista de presentes por consulta (a cada ~2,5 s).
 */
export const dynamic = 'force-dynamic'
type Sala = { codigo: string; nome: string; anfitriao_id: string | null; estado: EstadoCinema; revisao: number }
type Pessoa = { aventureiro_id: string; visto_em: string; entrou_em: string; aventureiro: { apelido: string } | null }
type Mensagem = { id: number; autor_id: string | null; texto: string; sistema: boolean; criada_em: string; autor: { apelido: string } | null }
const MAX_SALAS = 5, GUARDAR_MENSAGENS = 300, DIAS_PARADA = 2

async function buscar(c: unknown): Promise<Sala> {
  const codigo = codigoCinema(c)
  if (!codigoValido(codigo)) throw new ErroApi(400, 'Código inválido.')
  const [s] = await rest<Sala[]>(`prg_cinema_salas?select=codigo,nome,anfitriao_id,estado,revisao&codigo=eq.${q(codigo)}`)
  if (!s) throw new ErroApi(404, 'Sala não encontrada.')
  return s
}
const sinal = (codigo: string, eu: string) => rest('prg_cinema_presenca', { method: 'POST', prefer: 'resolution=merge-duplicates',
  body: JSON.stringify({ codigo, aventureiro_id: eu, visto_em: new Date().toISOString() }) })
const pessoas = (codigo: string) => rest<Pessoa[]>(`prg_cinema_presenca?select=aventureiro_id,visto_em,entrou_em,aventureiro:prg_public_adventurers(apelido)&codigo=eq.${q(codigo)}`)
async function mensagens(codigo: string, desde: number) {
  const l = await rest<Mensagem[]>(`prg_cinema_mensagens?select=id,autor_id,texto,sistema,criada_em,autor:prg_public_adventurers(apelido)&codigo=eq.${q(codigo)}&id=gt.${Math.max(0, Math.floor(desde) || 0)}&order=id.desc&limit=60`)
  return l.reverse()
}
const avisar = (codigo: string, texto: string) => rest('prg_cinema_mensagens', { method: 'POST', body: JSON.stringify({ codigo, texto: texto.slice(0, 500), sistema: true }) })

async function resposta(s: Sala, eu: string, desde: number) {
  const agora = Date.now(), lista = await pessoas(s.codigo), aqui = presentes(lista, agora)
  const nomeAnfitriao = !s.anfitriao_id ? '' : lista.find(p => p.aventureiro_id === s.anfitriao_id)?.aventureiro?.apelido ?? await apelidoDe(s.anfitriao_id).catch(() => '—')
  return {
    codigo: s.codigo, nome: s.nome, estado: s.estado, revisao: s.revisao, agora,
    anfitriao: s.anfitriao_id ? { id: s.anfitriao_id, apelido: nomeAnfitriao } : null,
    souAnfitriao: s.anfitriao_id === eu, eu,
    podeAssumir: s.anfitriao_id !== eu && anfitriaoAusente(s.anfitriao_id, lista, agora),
    participantes: aqui.map(p => ({ id: p.aventureiro_id, apelido: p.aventureiro?.apelido ?? '—', anfitriao: p.aventureiro_id === s.anfitriao_id })),
    mensagens: (await mensagens(s.codigo, desde)).map(m => ({ id: m.id, autor: m.sistema ? null : { id: m.autor_id, apelido: m.autor?.apelido ?? 'alguém' }, texto: m.texto, sistema: m.sistema, em: m.criada_em })),
  }
}
async function gravar(s: Sala, mudanca: Partial<Pick<Sala, 'estado' | 'anfitriao_id'>>): Promise<Sala> {
  const [atual] = await rest<Sala[]>(`prg_cinema_salas?codigo=eq.${q(s.codigo)}&revisao=eq.${s.revisao}&select=codigo,nome,anfitriao_id,estado,revisao`, {
    method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ ...mudanca, revisao: s.revisao + 1, atualizada_em: new Date().toISOString() }) })
  if (!atual) throw new ErroApi(409, 'A sala mudou. Tente de novo.')
  return atual
}

/** Consultar a sala (também conta como “estou aqui”): estado, quem está, anfitrião e mensagens novas. */
export const GET = rota(async (req: NextRequest) => {
  const eu = await ator(req)
  const s = await buscar(req.nextUrl.searchParams.get('codigo'))
  await sinal(s.codigo, eu)
  return ok(await resposta(s, eu, Number(req.nextUrl.searchParams.get('desde')) || 0))
})

export const POST = rota(async (req: NextRequest) => {
  const eu = await ator(req)
  const raw = await lerJson(req)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ErroApi(400, 'Dados inválidos.')
  const d = raw as Record<string, unknown>
  const desde = Number(d.desde) || 0

  if (d.acao === 'criar') {
    const nome = typeof d.nome === 'string' ? d.nome.trim().slice(0, 80) : ''
    if (!nome) throw new ErroApi(400, 'Dê um nome para a sala.')
    // Salas paradas há dias saem sozinhas; cada perfil tem no máximo 5 salas abertas.
    await rest(`prg_cinema_salas?atualizada_em=lt.${q(new Date(Date.now() - DIAS_PARADA * 864e5).toISOString())}`, { method: 'DELETE' })
    const minhas = await rest<{ codigo: string }[]>(`prg_cinema_salas?select=codigo&anfitriao_id=eq.${q(eu)}`)
    if (minhas.length >= MAX_SALAS) throw new ErroApi(400, `Você já tem ${MAX_SALAS} salas abertas. Encerre uma antes de criar outra.`)
    const [s] = await rest<Sala[]>('prg_cinema_salas?select=codigo,nome,anfitriao_id,estado,revisao', { method: 'POST', prefer: 'return=representation',
      body: JSON.stringify({ codigo: randomBytes(8).toString('hex').toUpperCase(), nome, anfitriao_id: eu, estado: cinemaInicial() }) })
    await sinal(s.codigo, eu)
    await avisar(s.codigo, `🎬 ${await apelidoDe(eu)} abriu a sala.`)
    return ok(await resposta(s, eu, 0), 201)
  }

  let s = await buscar(d.codigo)
  await sinal(s.codigo, eu)
  const lista = await pessoas(s.codigo), agora = Date.now(), eAnfitriao = s.anfitriao_id === eu
  const nomeDe = (id: string) => lista.find(p => p.aventureiro_id === id)?.aventureiro?.apelido ?? 'alguém'

  switch (d.acao) {
    case 'mensagem': {
      const texto = limparMensagem(d.texto)
      if (!texto) throw new ErroApi(400, 'Escreva alguma coisa.')
      const [ultima] = await rest<{ criada_em: string }[]>(`prg_cinema_mensagens?select=criada_em&codigo=eq.${q(s.codigo)}&autor_id=eq.${q(eu)}&order=id.desc&limit=1`)
      if (ultima && agora - Date.parse(ultima.criada_em) < 700) throw new ErroApi(429, 'Calma: espere um instante antes de mandar outra.')
      const [m] = await rest<{ id: number }[]>('prg_cinema_mensagens?select=id', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ codigo: s.codigo, autor_id: eu, texto }) })
      if (m.id % 50 === 0) await rest(`prg_cinema_mensagens?codigo=eq.${q(s.codigo)}&id=lt.${m.id - GUARDAR_MENSAGENS}`, { method: 'DELETE' })
      return ok(await resposta(s, eu, desde))
    }
    case 'sair': {
      await rest(`prg_cinema_presenca?codigo=eq.${q(s.codigo)}&aventureiro_id=eq.${q(eu)}`, { method: 'DELETE' })
      // O anfitrião que sai passa o controle para quem chegou primeiro entre os que ficaram.
      const proximo = eAnfitriao ? presentes(lista, agora).find(p => p.aventureiro_id !== eu) : undefined
      if (proximo) { await gravar(s, { anfitriao_id: proximo.aventureiro_id }); await avisar(s.codigo, `👑 ${nomeDe(eu)} saiu e ${nomeDe(proximo.aventureiro_id)} virou o anfitrião.`) }
      else await avisar(s.codigo, `👋 ${nomeDe(eu)} saiu da sala.`)
      return ok({ ok: true })
    }
    case 'assumir': {
      if (eAnfitriao) return ok(await resposta(s, eu, desde))
      if (!anfitriaoAusente(s.anfitriao_id, lista, agora)) throw new ErroApi(403, 'O anfitrião ainda está na sala. Peça para ele passar o controle.')
      s = await gravar(s, { anfitriao_id: eu }); await avisar(s.codigo, `👑 ${nomeDe(eu)} assumiu o controle da sala.`)
      return ok(await resposta(s, eu, desde))
    }
  }

  if (!eAnfitriao) throw new ErroApi(403, 'Só o anfitrião controla a sala.')
  if (d.acao === 'transferir') {
    const para = typeof d.para === 'string' ? d.para : ''
    if (para === eu || !presentes(lista, agora).some(p => p.aventureiro_id === para)) throw new ErroApi(400, 'Escolha alguém que está na sala agora.')
    s = await gravar(s, { anfitriao_id: para }); await avisar(s.codigo, `👑 ${nomeDe(eu)} passou o controle para ${nomeDe(para)}.`)
    return ok(await resposta(s, eu, desde))
  }
  if (d.acao === 'encerrar') {
    await rest(`prg_cinema_salas?codigo=eq.${q(s.codigo)}`, { method: 'DELETE' })
    return ok({ ok: true, encerrada: true })
  }
  let estado = s.estado
  try {
    switch (d.acao) {
      case 'adicionar': estado = adicionarVideo(estado, typeof d.url === 'string' ? d.url : '', typeof d.titulo === 'string' ? d.titulo : ''); break
      case 'selecionar': estado = selecionarVideo(estado, typeof d.indice === 'number' ? d.indice : -1, agora); break
      case 'remover': estado = removerVideo(estado, typeof d.indice === 'number' ? d.indice : -1); break
      case 'pausar': case 'continuar': case 'avancar': case 'voltar': estado = controlarCinema(estado, d.acao, agora); break
      default: throw new Error('Ação inválida.')
    }
  } catch (e) { throw new ErroApi(400, e instanceof Error ? e.message : 'Ação inválida.') }
  s = await gravar(s, { estado })
  return ok(await resposta(s, eu, desde))
})

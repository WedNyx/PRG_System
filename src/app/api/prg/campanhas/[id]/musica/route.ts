import { NextRequest } from 'next/server'
import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'
import { fonteDaMusica, type EstadoMusica } from '@/lib/nuvem/musica'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
type Playlist = { id: string; campanha_id: string; dono_id: string; nome: string; enviada: boolean }
type Musica = { id: string; playlist_id: string; titulo: string; url: string; tipo: 'youtube' | 'audio'; video_id: string | null; ordem: number }
const MAX_PLAYLISTS = 30, MAX_MUSICAS = 200
const base = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''

async function contexto(req: NextRequest, cid: string) {
  if (!isUuid(cid)) throw new ErroApi(404, 'Campanha não encontrada.')
  const eu = await ator(req)
  const papel = await papelNaCampanha(cid, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  return { eu, admin: podeAdministrar(papel) }
}
async function minhaPlaylist(cid: string, eu: string, id: unknown): Promise<Playlist> {
  if (!isUuid(id)) throw new ErroApi(400, 'Playlist inválida.')
  const [p] = await rest<Playlist[]>(`prg_playlists?select=*&id=eq.${q(id)}&campanha_id=eq.${q(cid)}`)
  if (!p) throw new ErroApi(404, 'Playlist não encontrada.')
  if (p.dono_id !== eu) throw new ErroApi(403, 'Só o dono pode mudar esta playlist.')
  return p
}
async function musicaComPlaylist(cid: string, id: unknown) {
  if (!isUuid(id)) throw new ErroApi(400, 'Música inválida.')
  const [m] = await rest<(Musica & { playlist: Playlist })[]>(`prg_musicas?select=*,playlist:prg_playlists!inner(*)&id=eq.${q(id)}&playlist.campanha_id=eq.${q(cid)}`)
  if (!m) throw new ErroApi(404, 'Música não encontrada.')
  return m
}
const nomeValido = (v: unknown, max: number) => { const s = typeof v === 'string' ? v.trim().slice(0, max) : ''; return s || null }

/** Título pelo oEmbed do YouTube (não precisa de chave). */
async function tituloYoutube(url: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(4000), cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json() as { title?: unknown }
    return typeof j.title === 'string' ? j.title.slice(0, 200) : null
  } catch { return null }
}

async function buscarYoutube(termo: string) {
  const chave = process.env.YOUTUBE_API_KEY
  if (!chave) throw new ErroApi(503, 'A busca do YouTube ainda não foi configurada. Cole o link do vídeo.')
  const u = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&videoEmbeddable=true&q=${encodeURIComponent(termo)}&key=${encodeURIComponent(chave)}`
  const r = await fetch(u, { signal: AbortSignal.timeout(6000), cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) throw new ErroApi(502, 'A busca do YouTube falhou agora. Tente de novo ou cole o link.')
  const j = await r.json() as { items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } } }[] }
  const dec = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  return (j.items ?? []).filter(i => /^[A-Za-z0-9_-]{11}$/.test(i.id?.videoId ?? '')).map(i => ({
    video_id: i.id!.videoId!, url: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
    titulo: dec(i.snippet?.title ?? 'Vídeo do YouTube'), canal: dec(i.snippet?.channelTitle ?? ''), thumb: i.snippet?.thumbnails?.default?.url ?? null,
  }))
}

/**
 * GET → suas playlists, as recebidas (mestre: playlists enviadas pelos jogadores, com o nome de quem enviou)
 * e o que está tocando. ?buscar=termo → busca no YouTube (precisa de YOUTUBE_API_KEY no servidor).
 */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id: cid } = await params
  const { eu, admin } = await contexto(req, cid)
  const termo = (req.nextUrl.searchParams.get('buscar') ?? '').trim().slice(0, 100)
  if (termo) return ok({ resultados: await buscarYoutube(termo) })

  const sel = 'id,dono_id,nome,enviada,atualizada_em,dono:prg_public_adventurers(apelido,avatar),musicas:prg_musicas(id,titulo,url,tipo,video_id,ordem)'
  const [minhas, recebidas, [camp]] = await Promise.all([
    rest(`prg_playlists?select=${sel}&campanha_id=eq.${q(cid)}&dono_id=eq.${q(eu)}&order=criada_em.asc&musicas.order=ordem.asc`),
    admin ? rest(`prg_playlists?select=${sel}&campanha_id=eq.${q(cid)}&dono_id=neq.${q(eu)}&enviada=eq.true&order=atualizada_em.desc&musicas.order=ordem.asc`) : Promise.resolve([]),
    rest<{ musica: EstadoMusica }[]>(`prg_campanhas?select=musica&id=eq.${q(cid)}`),
  ])
  return ok({ minhas, recebidas, tocando: camp?.musica ?? { tocando: false }, agora: new Date().toISOString(), admin, buscaAtiva: !!process.env.YOUTUBE_API_KEY })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { id: cid } = await params
  const { eu, admin } = await contexto(req, cid)
  const b = await lerJson(req, 10_000) as Record<string, unknown>
  const agora = new Date().toISOString()

  switch (b.acao) {
    case 'playlist_criar': {
      const nome = nomeValido(b.nome, 80); if (!nome) throw new ErroApi(400, 'Dê um nome para a playlist.')
      const ja = await rest<{ id: string }[]>(`prg_playlists?select=id&campanha_id=eq.${q(cid)}&dono_id=eq.${q(eu)}`)
      if (ja.length >= MAX_PLAYLISTS) throw new ErroApi(400, `Limite de ${MAX_PLAYLISTS} playlists por pessoa.`)
      const [p] = await rest<Playlist[]>('prg_playlists', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ campanha_id: cid, dono_id: eu, nome }) })
      return ok({ playlist: p }, 201)
    }
    case 'playlist_editar': {
      const p = await minhaPlaylist(cid, eu, b.id)
      const mud: Record<string, unknown> = { atualizada_em: agora }
      if (b.nome !== undefined) { const n = nomeValido(b.nome, 80); if (!n) throw new ErroApi(400, 'Nome inválido.'); mud.nome = n }
      if (typeof b.enviada === 'boolean') mud.enviada = b.enviada
      await rest(`prg_playlists?id=eq.${q(p.id)}`, { method: 'PATCH', body: JSON.stringify(mud) })
      return ok({ ok: true })
    }
    case 'playlist_excluir': {
      const p = await minhaPlaylist(cid, eu, b.id)
      await rest(`prg_playlists?id=eq.${q(p.id)}`, { method: 'DELETE' })
      return ok({ ok: true })
    }
    case 'musica_adicionar': {
      const p = await minhaPlaylist(cid, eu, b.playlistId)
      const f = fonteDaMusica(b.url, base())
      if (!f) throw new ErroApi(400, 'Use um link do YouTube ou um link https de áudio (mp3, ogg, wav, m4a).')
      const qtd = await rest<{ ordem: number }[]>(`prg_musicas?select=ordem&playlist_id=eq.${q(p.id)}&order=ordem.desc`)
      if (qtd.length >= MAX_MUSICAS) throw new ErroApi(400, `Limite de ${MAX_MUSICAS} músicas por playlist.`)
      let titulo = nomeValido(b.titulo, 200)
      if (!titulo && f.tipo === 'youtube') titulo = await tituloYoutube(f.url)
      if (!titulo) titulo = f.tipo === 'youtube' ? 'Vídeo do YouTube' : decodeURIComponent(f.url.split('/').pop()?.split('?')[0] ?? 'Áudio').slice(0, 200) || 'Áudio'
      const [m] = await rest<Musica[]>('prg_musicas', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({
        playlist_id: p.id, titulo, url: f.url, tipo: f.tipo, video_id: f.tipo === 'youtube' ? f.video_id : null, ordem: (qtd[0]?.ordem ?? -1) + 1 }) })
      await rest(`prg_playlists?id=eq.${q(p.id)}`, { method: 'PATCH', body: JSON.stringify({ atualizada_em: agora }) })
      return ok({ musica: m }, 201)
    }
    case 'musica_remover':
    case 'musica_mover': {
      const m = await musicaComPlaylist(cid, b.id)
      if (m.playlist.dono_id !== eu) throw new ErroApi(403, 'Só o dono pode mudar esta playlist.')
      if (b.acao === 'musica_remover') { await rest(`prg_musicas?id=eq.${q(m.id)}`, { method: 'DELETE' }); return ok({ ok: true }) }
      const todas = await rest<Musica[]>(`prg_musicas?select=id,ordem&playlist_id=eq.${q(m.playlist_id)}&order=ordem.asc,criada_em.asc`)
      const i = todas.findIndex(x => x.id === m.id), j = i + (b.direcao === 'cima' ? -1 : 1)
      if (j < 0 || j >= todas.length) return ok({ ok: true })
      ;[todas[i], todas[j]] = [todas[j], todas[i]]
      await Promise.all(todas.map((x, k) => x.ordem === k ? null : rest(`prg_musicas?id=eq.${q(x.id)}`, { method: 'PATCH', body: JSON.stringify({ ordem: k }) })))
      return ok({ ok: true })
    }
    // ---- Somente o mestre: o que toca para todo mundo ----
    case 'tocar': {
      if (!admin) throw new ErroApi(403, 'Apenas o mestre escolhe a música da mesa.')
      const m = await musicaComPlaylist(cid, b.musicaId)
      if (m.playlist.dono_id !== eu && !m.playlist.enviada) throw new ErroApi(403, 'Essa playlist não foi enviada ao mestre.')
      const [camp] = await rest<{ musica: EstadoMusica }[]>(`prg_campanhas?select=musica&id=eq.${q(cid)}`)
      const estado: EstadoMusica = { tocando: true, loop: typeof b.loop === 'boolean' ? b.loop : !!camp?.musica?.loop, iniciada_em: agora,
        musica_id: m.id, titulo: m.titulo, url: m.url, tipo: m.tipo, video_id: m.video_id, por: eu }
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ musica: estado }) })
      return ok({ tocando: estado, agora })
    }
    case 'parar':
    case 'loop': {
      if (!admin) throw new ErroApi(403, 'Apenas o mestre controla a música da mesa.')
      const [camp] = await rest<{ musica: EstadoMusica }[]>(`prg_campanhas?select=musica&id=eq.${q(cid)}`)
      const atual = camp?.musica ?? { tocando: false }
      const estado: EstadoMusica = b.acao === 'parar' ? { ...atual, tocando: false } : { ...atual, loop: !!b.ativo }
      await rest(`prg_campanhas?id=eq.${q(cid)}`, { method: 'PATCH', body: JSON.stringify({ musica: estado }) })
      return ok({ tocando: estado, agora })
    }
    default: throw new ErroApi(400, 'Ação desconhecida.')
  }
})

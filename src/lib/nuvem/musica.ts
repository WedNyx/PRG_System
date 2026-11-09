/** Regras puras da música da mesa (testadas em musica.test.ts). */

const YT = /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
/** Extrai o ID de 11 caracteres de um link do YouTube (watch, youtu.be, shorts, embed, music). */
export function idYoutube(url: string): string | null {
  const m = url.trim().match(YT)
  return m ? m[1] : null
}

export type FonteMusica = { tipo: 'youtube'; video_id: string; url: string } | { tipo: 'audio'; url: string }
/** Aceita link do YouTube ou um link https de áudio (mp3, ogg, wav, m4a, aac, webm, ou do nosso Storage). */
export function fonteDaMusica(url: unknown, storageBase?: string): FonteMusica | null {
  if (typeof url !== 'string' || url.length > 1000) return null
  const u = url.trim()
  const v = idYoutube(u)
  if (v) return { tipo: 'youtube', video_id: v, url: `https://www.youtube.com/watch?v=${v}` }
  if (!/^https:\/\//.test(u)) return null
  if (/\.(mp3|ogg|oga|wav|m4a|aac|webm|opus)(\?.*)?$/i.test(u) || (storageBase && u.startsWith(storageBase + '/storage/v1/object/public/prg-mesa/'))) return { tipo: 'audio', url: u }
  return null
}

export type EstadoMusica = {
  tocando: boolean; loop?: boolean; iniciada_em?: string; musica_id?: string | null; playlist_id?: string | null
  titulo?: string; url?: string; tipo?: 'youtube' | 'audio'; video_id?: string | null; por?: string
  /** Pausada pelo mestre: todos param em `posicao` (segundos). */
  pausado?: boolean; posicao?: number
}

/**
 * Em que segundo da música todos devem estar agora (sincronia entre aparelhos).
 * Sem loop e depois do fim → null (a música acabou).
 */
export function posicaoAtual(e: EstadoMusica, agoraMs: number, duracao?: number | null): number | null {
  if (!e.tocando || !e.iniciada_em) return null
  const pos = e.pausado ? Math.max(0, e.posicao ?? 0) : Math.max(0, (agoraMs - Date.parse(e.iniciada_em)) / 1000)
  if (!duracao || duracao <= 0) return pos
  if (e.loop) return pos % duracao
  return pos >= duracao ? null : pos
}

/** Pausa: guarda onde parou. Continuar: recomeça dali (ajustando o horário de início). */
export function pausar(e: EstadoMusica, agoraMs: number): EstadoMusica {
  if (!e.tocando || e.pausado) return e
  return { ...e, pausado: true, posicao: posicaoAtual(e, agoraMs) ?? 0 }
}
export function continuar(e: EstadoMusica, agoraMs: number): EstadoMusica {
  if (!e.tocando || !e.pausado) return e
  const { posicao = 0, ...resto } = e
  return { ...resto, pausado: false, iniciada_em: new Date(agoraMs - posicao * 1000).toISOString() }
}
/** Avança/volta alguns segundos (nunca antes do começo). */
export function pular(e: EstadoMusica, agoraMs: number, segundos: number): EstadoMusica {
  if (!e.tocando) return e
  const alvo = Math.max(0, (posicaoAtual(e, agoraMs) ?? 0) + segundos)
  return e.pausado ? { ...e, posicao: alvo } : { ...e, iniciada_em: new Date(agoraMs - alvo * 1000).toISOString() }
}
/** Próxima/anterior da lista (dá a volta). */
export function vizinha<T extends { id: string }>(lista: T[], atualId: string | null | undefined, passo: 1 | -1): T | null {
  if (!lista.length) return null
  const i = lista.findIndex(x => x.id === atualId)
  return lista[((i < 0 ? (passo === 1 ? -1 : 0) : i) + passo + lista.length) % lista.length]
}

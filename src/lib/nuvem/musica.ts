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

export type EstadoMusica = { tocando: boolean; loop?: boolean; iniciada_em?: string; musica_id?: string | null; titulo?: string; url?: string; tipo?: 'youtube' | 'audio'; video_id?: string | null; por?: string }

/**
 * Em que segundo da música todos devem estar agora (sincronia entre aparelhos).
 * Sem loop e depois do fim → null (a música acabou).
 */
export function posicaoAtual(e: EstadoMusica, agoraMs: number, duracao?: number | null): number | null {
  if (!e.tocando || !e.iniciada_em) return null
  const pos = Math.max(0, (agoraMs - Date.parse(e.iniciada_em)) / 1000)
  if (!duracao || duracao <= 0) return pos
  if (e.loop) return pos % duracao
  return pos >= duracao ? null : pos
}

/** Extrai o ID de um vídeo a partir de um link do YouTube (ou aceita o ID puro). */
export function extrairYoutubeId(url: string): string | null {
  const texto = url.trim()
  const padroes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const padrao of padroes) {
    const m = texto.match(padrao)
    if (m) return m[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(texto)) return texto
  return null
}

/** Busca o título real do vídeo via oEmbed (público, sem chave de API). Nunca lança erro. */
export async function buscarTituloVideo(videoId: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    )
    if (!resp.ok) return videoId
    const data = (await resp.json()) as { title?: string }
    return data.title?.trim() || videoId
  } catch {
    return videoId
  }
}

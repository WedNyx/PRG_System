import { idYoutube, posicaoAtual, pausar, continuar, pular, type EstadoMusica } from './musica'

export type VideoCinema = { id: string; titulo: string }
export type EstadoCinema = { fila: VideoCinema[]; atual: number; reproducao: EstadoMusica }
export const cinemaInicial = (): EstadoCinema => ({ fila: [], atual: -1, reproducao: { tocando: false } })
export function adicionarVideo(e: EstadoCinema, url: string, titulo: string): EstadoCinema {
  const id = idYoutube(url)
  if (!id || e.fila.length >= 100) throw new Error('Link inválido ou fila cheia.')
  return { ...e, fila: [...e.fila, { id, titulo: titulo.trim().slice(0, 160) || id }] }
}
export function selecionarVideo(e: EstadoCinema, indice: number, agora: number): EstadoCinema {
  const v = e.fila[indice]
  if (!v || !Number.isInteger(indice)) throw new Error('Vídeo não encontrado.')
  return { ...e, atual: indice, reproducao: { tocando: true, tipo: 'youtube', video_id: v.id, titulo: v.titulo, iniciada_em: new Date(agora).toISOString(), pausado: true, posicao: 0 } }
}
export function controlarCinema(e: EstadoCinema, acao: 'pausar' | 'continuar' | 'avancar' | 'voltar', agora: number): EstadoCinema {
  const r = e.reproducao
  return { ...e, reproducao: acao === 'pausar' ? pausar(r, agora) : acao === 'continuar' ? continuar(r, agora) : pular(r, agora, acao === 'avancar' ? 10 : -10) }
}
export const segundoCinema = (e: EstadoCinema, agora: number) => posicaoAtual(e.reproducao, agora) ?? 0

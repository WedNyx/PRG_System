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
export function removerVideo(e: EstadoCinema, indice: number): EstadoCinema {
  if (!Number.isInteger(indice) || !e.fila[indice]) throw new Error('Vídeo não encontrado.')
  const fila = e.fila.filter((_, i) => i !== indice)
  if (indice === e.atual) return { fila, atual: -1, reproducao: { tocando: false } }
  return { ...e, fila, atual: indice < e.atual ? e.atual - 1 : e.atual }
}
export function controlarCinema(e: EstadoCinema, acao: 'pausar' | 'continuar' | 'avancar' | 'voltar', agora: number): EstadoCinema {
  const r = e.reproducao
  return { ...e, reproducao: acao === 'pausar' ? pausar(r, agora) : acao === 'continuar' ? continuar(r, agora) : pular(r, agora, acao === 'avancar' ? 10 : -10) }
}
export const segundoCinema = (e: EstadoCinema, agora: number) => posicaoAtual(e.reproducao, agora) ?? 0

// ---------------------------------------------------------------- participantes, anfitrião e chat (v0.36.8)

/** Quem mandou sinal nos últimos segundos conta como presente na sala. */
export const PRESENCA_MS = 20_000
/** Sem sinal do anfitrião por este tempo, quem está na sala pode assumir o controle. */
export const ANFITRIAO_AUSENTE_MS = 60_000
export type Presenca = { aventureiro_id: string; visto_em: string; entrou_em?: string }
export const presentes = <T extends Presenca>(lista: T[], agora: number) =>
  lista.filter(p => agora - Date.parse(p.visto_em) <= PRESENCA_MS).sort((a, b) => Date.parse(a.entrou_em ?? a.visto_em) - Date.parse(b.entrou_em ?? b.visto_em))
/** O anfitrião sumiu (não está presente há um minuto)? Então outra pessoa da sala pode assumir. */
export function anfitriaoAusente(anfitriao: string | null, lista: Presenca[], agora: number): boolean {
  if (!anfitriao) return true
  const p = lista.find(x => x.aventureiro_id === anfitriao)
  return !p || agora - Date.parse(p.visto_em) > ANFITRIAO_AUSENTE_MS
}
/** Texto do chat: sem espaços sobrando, até 500 letras, sem caracteres de controle. */
export function limparMensagem(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 500)
}
/** Código de convite: 16 letras/números hexadecimais (aceita colar com espaços ou minúsculas). */
export const codigoCinema = (v: unknown) => typeof v === 'string' ? v.replace(/[^0-9a-f]/gi, '').toUpperCase().slice(0, 16) : ''
export const codigoValido = (c: string) => /^[A-F0-9]{16}$/.test(c)

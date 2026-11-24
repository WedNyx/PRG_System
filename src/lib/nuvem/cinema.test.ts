import { describe, it, expect } from 'vitest'
import { cinemaInicial, adicionarVideo, selecionarVideo, controlarCinema, segundoCinema } from './cinema'
describe('Cinema Secreto', () => {
  const t = 1700000000000
  const fila = () => adicionarVideo(cinemaInicial(), 'https://youtu.be/dQw4w9WgXcQ', 'Vídeo')
  it('rejeita links inválidos', () => expect(() => adicionarVideo(cinemaInicial(), 'https://example.com', '')).toThrow())
  it('seleciona vídeo inicialmente pausado', () => {
    const e = selecionarVideo(fila(), 0, t)
    expect(e.reproducao.pausado).toBe(true)
    expect(segundoCinema(e, t + 5000)).toBe(0)
  })
  it('sincroniza pausa, retomada e avanço', () => {
    let e = controlarCinema(selecionarVideo(fila(), 0, t), 'continuar', t)
    expect(segundoCinema(e, t + 5000)).toBe(5)
    e = controlarCinema(e, 'pausar', t + 5000)
    expect(segundoCinema(e, t + 9000)).toBe(5)
    e = controlarCinema(e, 'avancar', t + 9000)
    expect(segundoCinema(e, t + 9000)).toBe(15)
    e = controlarCinema(e, 'continuar', t + 9000)
    expect(segundoCinema(e, t + 11000)).toBe(17)
  })
  it('não retrocede antes do início', () => expect(segundoCinema(controlarCinema(selecionarVideo(fila(), 0, t), 'voltar', t), t)).toBe(0))
})

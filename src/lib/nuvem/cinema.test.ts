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

describe('Cinema Secreto: pessoas, anfitrião e chat (v0.36.8)', () => {
  const agora = 1700000100000, iso = (ms: number) => new Date(agora - ms).toISOString()
  it('presentes: só quem deu sinal nos últimos 20 s, na ordem de chegada', async () => {
    const { presentes } = await import('./cinema')
    const l = [{ aventureiro_id: 'b', visto_em: iso(1000), entrou_em: iso(50000) }, { aventureiro_id: 'a', visto_em: iso(2000), entrou_em: iso(90000) }, { aventureiro_id: 'c', visto_em: iso(30000) }]
    expect(presentes(l, agora).map(p => p.aventureiro_id)).toEqual(['a', 'b'])
  })
  it('anfitrião ausente há mais de 1 minuto (ou sem anfitrião) libera assumir', async () => {
    const { anfitriaoAusente } = await import('./cinema')
    expect(anfitriaoAusente('a', [{ aventureiro_id: 'a', visto_em: iso(5000) }], agora)).toBe(false)
    expect(anfitriaoAusente('a', [{ aventureiro_id: 'a', visto_em: iso(70000) }], agora)).toBe(true)
    expect(anfitriaoAusente('a', [], agora)).toBe(true)
    expect(anfitriaoAusente(null, [], agora)).toBe(true)
  })
  it('mensagem e código são limpos', async () => {
    const { limparMensagem, codigoCinema, codigoValido } = await import('./cinema')
    expect(limparMensagem('  oi\u0007 pessoal\n\n\n\nbora  ')).toBe('oi pessoal\n\nbora')
    expect(limparMensagem('x'.repeat(900))).toHaveLength(500)
    expect(limparMensagem(42)).toBe('')
    expect(codigoCinema(' 0a1b 2c3d-4e5f 6a7b ')).toBe('0A1B2C3D4E5F6A7B')
    expect(codigoValido('0A1B2C3D4E5F6A7B')).toBe(true); expect(codigoValido('XYZ')).toBe(false)
  })
})

describe('Cinema Secreto: tirar da fila (v0.36.8)', () => {
  it('tirar um vídeo ajusta o atual; tirar o que está passando para a sessão', async () => {
    const { removerVideo } = await import('./cinema')
    let e = adicionarVideo(adicionarVideo(adicionarVideo(cinemaInicial(), 'https://youtu.be/dQw4w9WgXcQ', 'A'), 'https://youtu.be/9bZkp7q19f0', 'B'), 'https://youtu.be/kJQP7kiw5Fk', 'C')
    e = selecionarVideo(e, 2, 1)
    expect(removerVideo(e, 0)).toMatchObject({ atual: 1, fila: [{ titulo: 'B' }, { titulo: 'C' }] })
    expect(removerVideo(e, 2)).toMatchObject({ atual: -1, reproducao: { tocando: false } })
    expect(() => removerVideo(e, 9)).toThrow()
  })
})

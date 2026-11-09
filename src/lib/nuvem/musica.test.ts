import { describe, expect, it } from 'vitest'
import { fonteDaMusica, idYoutube, posicaoAtual } from './musica'

describe('links de música', () => {
  it('reconhece os formatos do YouTube', () => {
    for (const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=10', 'https://m.youtube.com/watch?feature=x&v=dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=abc', 'youtube.com/embed/dQw4w9WgXcQ'])
      expect(idYoutube(u), u).toBe('dQw4w9WgXcQ')
    expect(idYoutube('https://vimeo.com/123')).toBeNull()
  })
  it('aceita áudio https e recusa o resto', () => {
    expect(fonteDaMusica('https://site.com/trilha.mp3')).toEqual({ tipo: 'audio', url: 'https://site.com/trilha.mp3' })
    expect(fonteDaMusica('https://abc.supabase.co/storage/v1/object/public/prg-mesa/c/x', 'https://abc.supabase.co')?.tipo).toBe('audio')
    expect(fonteDaMusica('http://site.com/a.mp3')).toBeNull()
    expect(fonteDaMusica('https://site.com/pagina.html')).toBeNull()
    expect(fonteDaMusica('javascript:alert(1)')).toBeNull()
    expect(fonteDaMusica('https://youtu.be/dQw4w9WgXcQ')).toEqual({ tipo: 'youtube', video_id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  })
})

describe('sincronia', () => {
  const inicio = '2026-11-09T12:00:00.000Z', t = Date.parse(inicio)
  it('calcula onde a música está para todo mundo', () => {
    expect(posicaoAtual({ tocando: true, iniciada_em: inicio }, t + 30_000)).toBe(30)
    expect(posicaoAtual({ tocando: false, iniciada_em: inicio }, t + 30_000)).toBeNull()
  })
  it('loop recomeça; sem loop acaba', () => {
    expect(posicaoAtual({ tocando: true, loop: true, iniciada_em: inicio }, t + 130_000, 60)).toBe(10)
    expect(posicaoAtual({ tocando: true, loop: false, iniciada_em: inicio }, t + 130_000, 60)).toBeNull()
  })
})

describe('controles do mestre', () => {
  const inicio = '2026-11-09T12:00:00.000Z', t = Date.parse(inicio)
  it('pausar segura a posição para todos; continuar segue dali', async () => {
    const { pausar, continuar } = await import('./musica')
    const p = pausar({ tocando: true, iniciada_em: inicio }, t + 40_000)
    expect(p.pausado).toBe(true); expect(posicaoAtual(p, t + 999_000)).toBe(40)
    const c = continuar(p, t + 100_000)
    expect(c.pausado).toBe(false); expect(posicaoAtual(c, t + 105_000)).toBe(45)
  })
  it('avançar/voltar e próxima/anterior', async () => {
    const { pular, vizinha } = await import('./musica')
    expect(posicaoAtual(pular({ tocando: true, iniciada_em: inicio }, t + 30_000, 10), t + 30_000)).toBe(40)
    expect(posicaoAtual(pular({ tocando: true, iniciada_em: inicio }, t + 5_000, -10), t + 5_000)).toBe(0)
    const l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(vizinha(l, 'c', 1)?.id).toBe('a'); expect(vizinha(l, 'a', -1)?.id).toBe('c'); expect(vizinha(l, 'x', 1)?.id).toBe('a')
  })
})

import { describe, expect, it } from 'vitest'
import { filtroResultado, inicioDoPeriodo, resumirRolagens, type EventoResumo } from './historico'

const ev = (o: Partial<EventoResumo>): EventoResumo => ({ tipo: 'rolagem', personagem: null, autor_id: 'a', expressao: '1d20+3', resultados: [10], total: 13, criado_em: '2026-11-11T10:00:00Z', ...o })

describe('histórico de rolagens', () => {
  it('resume críticos, falhas, maior dano e média do d20 por personagem', () => {
    const r = resumirRolagens([
      ev({ personagem: 'Lyra', resultados: [20], total: 23 }),
      ev({ personagem: 'Lyra', resultados: [12], total: 15 }),
      ev({ personagem: 'Borin', resultados: [1], total: 4 }),
      ev({ personagem: 'Borin', tipo: 'ataque', resultados: [18], total: 21, dados: { acerto: true, dano: { total: 11 }, alvo: { nome: 'Ogro' } } }),
      ev({ personagem: 'Borin', tipo: 'ataque', resultados: [5], total: 8, dados: { acerto: false, dano: null } }),
      ev({ tipo: 'chat', expressao: null, resultados: null, total: null }),
      ev({ personagem: null, autor_id: 'x', expressao: '8d6', resultados: [6, 6, 6, 6, 6, 6, 6, 6], total: 48 }),
    ], id => id === 'x' ? 'Mestra' : '?')
    expect(r.rolagens).toBe(4); expect(r.ataques).toBe(2); expect(r.acertos).toBe(1)
    expect(r.criticos).toBe(1); expect(r.falhas).toBe(1)
    expect(r.maiorDano).toEqual({ valor: 11, quem: 'Borin', alvo: 'Ogro' })
    expect(r.maiorRolagem).toEqual({ valor: 48, quem: 'Mestra', expressao: '8d6' })
    const lyra = r.porPersonagem.find(p => p.nome === 'Lyra')!
    expect(lyra.mediaD20).toBe(16); expect(lyra.criticos).toBe(1)
    expect(r.porPersonagem[0].nome).toBe('Borin')
    expect(r.porPersonagem.find(p => p.nome === 'Mestra')?.mediaD20).toBeNull()
  })
  it('períodos e filtros', () => {
    const agora = new Date('2026-11-11T15:00:00Z')
    expect(inicioDoPeriodo('tudo', agora)).toBeNull()
    expect(inicioDoPeriodo('sessao', agora, '2026-11-11T13:00:00Z')).toBe('2026-11-11T13:00:00Z')
    expect(inicioDoPeriodo('semana', agora)).toBe('2026-11-04T15:00:00.000Z')
    expect(filtroResultado('critico')).toContain('resultados=cs.{20}')
    expect(filtroResultado('')).toEqual([])
  })
})

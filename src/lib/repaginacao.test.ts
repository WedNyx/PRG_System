import { describe, expect, it } from 'vitest'
import { limparPreferencias, PREFERENCIAS_PADRAO } from './preferencias'
import { AMBIENTES, CENAS_PRONTAS, EFEITOS, efeitoRepentino, ehEfeito, limparCamadas, limparCena } from './mesa/somMesa'
import { filtrarBusca, normalizar, type ItemBusca } from './busca'
import { limparVisual } from './visual'
import { TEMA_PADRAO, TEMAS } from './tema'

describe('Repaginação (v0.36.5)', () => {
  it('preferências: inválidas voltam ao padrão, volume fica entre 0 e 1', () => {
    expect(limparPreferencias(null)).toEqual(PREFERENCIAS_PADRAO)
    expect(limparPreferencias({ dados3d: false, volumeSons: 7, somDados: 'sim' })).toMatchObject({ dados3d: false, volumeSons: 1, somDados: true })
    expect(limparPreferencias({ volumeSons: -2 }).volumeSons).toBe(0)
  })
  it('Mesa de Som: catálogo coerente e entradas do canal conferidas', () => {
    expect(EFEITOS.length).toBeGreaterThanOrEqual(20)
    expect(new Set(EFEITOS.map(e => e.id)).size).toBe(EFEITOS.length)
    expect(EFEITOS.filter(e => e.repentino).map(e => e.id).sort()).toEqual(['explosao', 'grito', 'rugido'])
    expect(efeitoRepentino('espada')).toBe(false)
    expect(ehEfeito('trovao')).toBe(true); expect(ehEfeito('<script>')).toBe(false)
    expect(limparCamadas({ chuva: 0.5, vento: 9, lava: 1, fogueira: -1, mar: 'x' })).toEqual({ chuva: 0.5, vento: 1 })
    for (const c of CENAS_PRONTAS) {
      expect(Object.keys(c.camadas).every(k => AMBIENTES.some(a => a.id === k)), c.id).toBe(true)
      expect((c.aleatorios ?? []).every(a => ehEfeito(a.efeito)), c.id).toBe(true)
    }
    expect(limparCena({ id: 'x', nome: 'Minha', camadas: { chuva: 1 }, aleatorios: [{ efeito: 'nada', min: 1, max: 2 }, { efeito: 'trovao', min: 1, max: 2 }] }))
      .toMatchObject({ camadas: { chuva: 1 }, aleatorios: [{ efeito: 'trovao', min: 5, max: 5 }] })
    expect(limparCena('lixo')).toBeNull()
  })
  it('busca universal: ignora acentos e ordena pelo começo do nome', () => {
    expect(normalizar('Crônicas Mágicas')).toBe('cronicas magicas')
    const itens: ItemBusca[] = [
      { id: '1', titulo: 'Mesa: Crônicas da Lua', icone: '', grupo: 'Campanhas' },
      { id: '2', titulo: 'Crônicas da Lua', icone: '', grupo: 'Campanhas' },
      { id: '3', titulo: 'Aparência', icone: '', grupo: 'Configurações', palavras: 'tema cores' },
    ]
    expect(filtrarBusca(itens, 'cronicas').map(x => x.id)).toEqual(['2', '1'])
    expect(filtrarBusca(itens, 'cores').map(x => x.id)).toEqual(['3'])
    expect(filtrarBusca(itens, 'xyz')).toEqual([])
  })
  it('identidade: Noite lunar é o padrão e o conforto é guardado no perfil', () => {
    expect(TEMA_PADRAO).toBe('lunar'); expect(TEMAS[0].id).toBe('lunar'); expect(TEMAS.some(t => t.id === 'sonhos')).toBe(true)
    expect(limparVisual({ movimento: 'reduzido', efeitos: 'leves' })).toEqual({ movimento: 'reduzido', efeitos: 'leves' })
    expect(limparVisual({ movimento: 'rapido', efeitos: 'muitos' })).toEqual({})
  })
})

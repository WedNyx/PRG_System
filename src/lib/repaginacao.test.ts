import { describe, expect, it, vi } from 'vitest'
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

describe('Fichas e mesa (v0.36.6)', () => {
  it('arrastar na iniciativa: vai para a posição certa e a vez continua com quem estava nela', async () => {
    const { moverPara } = await import('./sistemas/ordemCombate')
    const l = [{ id: 'a', nome: 'A', valor: 20 }, { id: 'b', nome: 'B', valor: 15 }, { id: 'c', nome: 'C', valor: 10 }]
    const r = moverPara(l, 'c', 0, 0)
    expect(r.lista.map(x => x.id)).toEqual(['c', 'a', 'b'])
    expect(r.lista[r.turno].id).toBe('a')
    expect(moverPara(l, 'x', 0, 1)).toEqual({ lista: l, turno: 1 })
  })
  it('Arsenal da Ordem: só estatísticas, sem citar o livro', async () => {
    const { ARSENAL_ORDEM } = await import('./arsenalOrdem')
    expect(ARSENAL_ORDEM.length).toBeGreaterThan(10)
    expect(ARSENAL_ORDEM.every(x => !/livro de regras|p\. ?\d/i.test(x.descricao))).toBe(true)
    expect(ARSENAL_ORDEM.find(x => x.nome === 'Machadinha')?.rolagens?.[0].expr).toBe('3d6')
  })
  it('áudio da Mesa de Som só da própria campanha e do próprio Storage', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
    const { audioDaPlataforma } = await import('./imagens')
    const cid = '0b9b2f0e-1111-4111-8111-111111111111'
    const url = `https://x.supabase.co/storage/v1/object/public/prg-mesa/${cid}/a1.mp3`
    expect(audioDaPlataforma(url, cid)).toBe(true)
    expect(audioDaPlataforma(url, '0b9b2f0e-2222-4222-8222-222222222222')).toBe(false)
    expect(audioDaPlataforma('https://evil.com/a.mp3')).toBe(false)
    expect(audioDaPlataforma(`https://evil.com/storage/v1/object/public/prg-mesa/${cid}/a1.mp3`, cid)).toBe(false)
    const outraCid = '0b9b2f0e-2222-4222-8222-222222222222'
    expect(audioDaPlataforma(`https://x.supabase.co/storage/v1/object/public/prg-mesa/${outraCid}/a1.mp3?x=/storage/v1/object/public/prg-mesa/${cid}/a1.mp3`, cid)).toBe(false)
    vi.unstubAllEnvs()
  })
  it('cada sistema tem o roteiro da ficha de papel', async () => {
    const { FICHA_OFICIAL } = await import('./sistemas/fichaOficial')
    for (const id of ['dnd5e-srd', 'pf2e', 'ordem-paranormal', 'tormenta20', 'fate-core', 'blades', 'call-of-cthulhu', 'brp', 'mork-borg', 'assimilacao', 'faroeste-arcano']) expect(FICHA_OFICIAL[id]?.ordem.length, id).toBeGreaterThan(3)
  })
})

import { describe, expect, it } from 'vitest'
import { limparVisual, SCRIPT_VISUAL, variaveisDoVisual } from './visual'

const FOTO = 'https://x.supabase.co/storage/v1/object/public/prg-mesa/imagens/a.webp'

describe('aparência do perfil', () => {
  it('limpa campos inválidos e limita os números', () => {
    expect(limparVisual({ tema: 'lua', cor: 400, intensidade: 9, cartaoAlfa: 0.1, fonte: 'comic', tamanho: 'g', lixo: 1 }))
      .toEqual({ tema: 'lua', cor: 40, intensidade: 1.6, cartaoAlfa: 0.45, tamanho: 'g' })
    expect(limparVisual({ tema: 'inventado', fundo: 'https://outro.site/a.png' })).toEqual({})
    expect(limparVisual({ fundo: FOTO, fundoEscuro: 120 })).toEqual({ fundo: FOTO, fundoEscuro: 85 })
    expect(limparVisual('texto')).toEqual({})
    expect(limparVisual({ cor: null, cartaoCor: null })).toEqual({ cor: null, cartaoCor: null })
  })
  it('vira variáveis CSS (cor gira a partir do roxo original)', () => {
    expect(variaveisDoVisual({})).toEqual({})
    const v = variaveisDoVisual({ cor: 155, cartaoCor: 210, cartaoAlfa: 1, fundo: FOTO, fundoEscuro: 30, fundoDesfoque: 4 })
    expect(v['--giro']).toBe('-145')
    expect(v['--cartao-giro']).toBe('-83')
    expect(v['--vidro']).toBe('0px')
    expect(v['--tema-pc']).toBe(`url("${FOTO}")`)
    expect(v['--tema-veu']).toContain('0.3')
    expect(v['--fundo-desfoque']).toBe('4px')
  })
  it('o script que roda antes da página é JavaScript válido e sem dependências', () => {
    expect(() => new Function(SCRIPT_VISUAL)).not.toThrow()
    expect(SCRIPT_VISUAL).not.toMatch(/import|require|MATIZ_/)
  })
})

import { describe, expect, it } from 'vitest'
import { blocosEmOrdem, cssDaMontagem, cssDoVisual, lerMontagem, ordenarAbas } from './montagemFicha'
import { lerVisualAutor, TEMAS_ESTUDIO } from './visualAutor'

const IMG = 'https://x.supabase.co/storage/v1/object/public/prg-mesa/imagens/abc.webp'

describe('estúdio da ficha (v0.36.6)', () => {
  it('montagem: só abas e partes conhecidas, números com limite, Principal nunca some', () => {
    const m = lerMontagem({
      secoes: [{ id: 'anotacoes', icone: '📖' }, { id: 'principal', oculta: true }, { id: 'nada' }, { id: 'equipamentos', oculta: true, icone: '<b>' }, { id: 'anotacoes' }],
      blocos: { 'principal.identidade': { ordem: 2, largura: 6 }, 'principal.recursos': { ordem: 1, titulo: 'Vida e poder' }, 'principal.faixa': { titulo: 'não renomeável' },
        'x.y': { ordem: 1 }, 'atributos.teste': { largura: 5, oculto: true, ordem: 999 } },
    })
    expect(m?.secoes).toEqual([{ id: 'anotacoes', icone: '📖' }, { id: 'principal' }, { id: 'equipamentos', oculta: true }])
    expect(m?.blocos).toEqual({ 'principal.identidade': { ordem: 2, largura: 6 }, 'principal.recursos': { ordem: 1, titulo: 'Vida e poder' }, 'atributos.teste': { oculto: true } })
    expect(lerMontagem('lixo')).toBeUndefined()
    const abas = ordenarAbas([{ id: 'principal', icone: 'a' }, { id: 'equipamentos', icone: 'b' }, { id: 'anotacoes', icone: 'c' }], m)
    expect(abas.map(a => a.id + a.icone)).toEqual(['anotacoes📖', 'principala'])
    expect(blocosEmOrdem('principal', m).slice(0, 3).map(b => b.id)).toEqual(['recursos', 'faixa', 'identidade'])
  })
  it('aparência: imagens só da plataforma, cores e formatos de listas fechadas', () => {
    const v = lerVisualAutor({ acento: '#FF0000', texto: 'red;}', fundoImagem: IMG, fundoEscuro: 300, logo: 'https://evil.com/a.png', moldura: 'imagem',
      cartaoEstilo: 'vidro', raio: -5, atributosEstilo: 'estrela', barrasEstilo: 'fina', fonteCorpo: 'mono' })
    expect(v).toEqual({ acento: '#ff0000', fonteCorpo: 'mono', fundoImagem: IMG, fundoEscuro: 90, cartaoEstilo: 'vidro', raio: 0, barrasEstilo: 'fina' })
    for (const t of TEMAS_ESTUDIO) expect(lerVisualAutor(t.visual), t.id).toEqual(t.visual)
  })
  it('CSS gerado fica preso à ficha do autor e não deixa escapar nada', () => {
    const css = cssDoVisual(lerVisualAutor({ fundoImagem: IMG, texto: '#222222', atributosEstilo: 'hexagono', montagem: { blocos: { 'principal.identidade': { largura: 6, ordem: 1 } } } }))
    expect(css).toContain(`url("${IMG}")`)
    expect(css).toContain('background:#ffffffb3') // texto escuro clareia os campos
    expect(css).toContain('@container ficha (min-width: 560px)')
    expect(css.split('\n').filter(l => l.trim() && !l.startsWith('[data-ficha-autor]') && !l.startsWith('@container'))).toEqual([])
    expect(cssDoVisual(undefined)).toBe('')
    expect(cssDaMontagem({ blocos: { 'principal.acoes': { oculto: true } } })).toMatch(/data-bloco="acoes"\]\{display:none!important;\}/)
  })
})

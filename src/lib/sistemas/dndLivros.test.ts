import { describe, expect, it } from 'vitest'
import { LIVROS_BASE_DND, SUPLEMENTOS_DND, compativelLivroDnd, lerLivrosDnd, validarLivrosDnd } from './dndLivros'
import { lerConfiguracaoProgressao } from './modoProgressao'
import { esquemaFichaPorLivro, RACAS_2014, ANTECEDENTES_2014, SUBRACAS_2014, validarAlteracoesExclusivas2024 } from './dnd2014Criacao'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { FONTE_PHB, FONTE_LEGADO_2014, fontesLiberadas, fontePermitida } from './dnd2024Fontes'
import { categoria } from '../nuvem/categorias'

const s = sistemaPorId('dnd5e-srd')!

describe('Edições e livros D&D por ficha · PR #49', () => {
  it('identifica explicitamente as duas edições-base e mais de 25 suplementos oficiais', () => {
    expect(LIVROS_BASE_DND.map(x => x.id)).toEqual(['phb2014','phb2024'])
    expect(LIVROS_BASE_DND.map(x => x.ano)).toEqual([2014,2024])
    expect(SUPLEMENTOS_DND.length).toBeGreaterThan(25)
    expect(new Set(SUPLEMENTOS_DND.map(x => x.id)).size).toBe(SUPLEMENTOS_DND.length)
    for (const x of SUPLEMENTOS_DND) {
      expect(x.ano).toBeGreaterThanOrEqual(2014)
      expect(x.ano).toBeLessThanOrEqual(2026)
      expect(x.versao).toMatch(/2014|2024/)
      expect(x.implementacao).toBe('referencia')
      expect(x.titulo.length).toBeGreaterThan(6)
    }
  })
  it('restringe suplementos pela edição e reconhece legado opcional na mesa revisada', () => {
    expect(compativelLivroDnd('tasha2020','phb2014')).toBe(true)
    expect(compativelLivroDnd('tasha2020','phb2024')).toBe(true)
    expect(compativelLivroDnd('arcana2026','phb2014')).toBe(false)
    expect(compativelLivroDnd('arcana2026','phb2024')).toBe(true)
    expect(compativelLivroDnd('phb2014','phb2024')).toBe(true)
    expect(compativelLivroDnd('phb2014','phb2014')).toBe(false)
    expect(compativelLivroDnd('desconhecido','phb2024')).toBe(false)
  })
  it('normaliza dados antigos sem trocar silenciosamente a edição e não guarda ids inexistentes', () => {
    expect(lerLivrosDnd(null)).toEqual({ base:'phb2024', suplementos:[] })
    expect(lerLivrosDnd(null,'phb2014')).toEqual({ base:'phb2014', suplementos:[] })
    expect(lerLivrosDnd({ base:'phb2014', suplementos:['tasha2020','arcana2026','tasha2020','invalido'] }))
      .toEqual({ base:'phb2014', suplementos:['tasha2020'] })
    const d=fichaVazia(s)
    const n=normalizarFicha(s,{...d,dndLivros:{base:'phb2024',suplementos:['tasha2020','fizban2021']}})
    expect(n.dndLivros).toEqual({base:'phb2024',suplementos:['tasha2020','fizban2021']})
    expect(normalizarFicha(s,d).dndLivros).toBeUndefined()
  })
  it('impede forçar livros não liberados pelo mestre e a edição errada', () => {
    const cfg={baseLivro:'phb2024' as const, fontes:['tasha2020']}
    expect(validarLivrosDnd(undefined,{base:'phb2014',suplementos:[]},cfg,false)[0]).toContain('fixada')
    expect(validarLivrosDnd(undefined,{base:'phb2024',suplementos:['arcana2026']},cfg,false)[0]).toContain('não liberou')
    expect(validarLivrosDnd(undefined,{base:'phb2024',suplementos:['tasha2020']},cfg,false)).toEqual([])
    expect(validarLivrosDnd(undefined,{base:'phb2024',suplementos:['nao-existe']},cfg,true)[0]).toContain('não reconhecido')
    expect(validarLivrosDnd(undefined,{base:'phb2024',suplementos:['tasha2020','tasha2020']},cfg,false)[0]).toContain('repetida')
    expect(validarLivrosDnd(undefined,{base:'phb2014',suplementos:['arcana2026']},null,true)[0]).toContain('incompatível')
  })
  it('preserva a base de campanha na configuração, sem interferir nas fontes existentes', () => {
    const cfg=lerConfiguracaoProgressao({modo:'hibrido',baseLivro:'phb2014',fontes:['tasha2020']})
    expect(cfg.baseLivro).toBe('phb2014')
    expect(cfg.fontes).toEqual(['tasha2020'])
    expect(lerConfiguracaoProgressao({modo:'manual',baseLivro:'nao-existe'}).baseLivro).toBeUndefined()
    expect(fontesLiberadas(['phb2014', 'tasha2020'])).toEqual(new Set(['srd521','phb2014','tasha2020']))
    expect(fontePermitida(FONTE_LEGADO_2014, fontesLiberadas(['phb2014']))).toBe(true)
    expect(fontePermitida(FONTE_PHB, fontesLiberadas(['phb2014']))).toBe(false)
  })
  it('ficha 2014 mostra raças/sub-raças e 13 antecedentes próprios, sem bônus de espécie 2024', () => {
    const ficha=fichaVazia(s)
    ficha.dndLivros={base:'phb2014',suplementos:[]}
    const legado=esquemaFichaPorLivro(s,ficha)
    expect(legado.campos.find(x=>x.id==='especie')?.opcoes).toHaveLength(9)
    expect(legado.campos.find(x=>x.id==='antecedente')?.opcoes).toHaveLength(13)
    expect(legado.campos.find(x=>x.id==='especie')?.opcoes?.map(x=>x.nome)).toContain('Meio-Elfo')
    expect(legado.campos.find(x=>x.id==='antecedente')?.opcoes?.map(x=>x.nome)).toContain('Forasteiro')
    expect(RACAS_2014).toHaveLength(9)
    expect(ANTECEDENTES_2014).toHaveLength(13)
    expect(SUBRACAS_2014.Elfo).toHaveLength(3)
    expect(legado.campos.find(x=>x.id==='especie')?.opcoes?.find(x=>x.nome==='Anão')?.vars).toBeUndefined()
    ficha.campos.classe='Bárbaro'
    ficha.campos.nivel=3
    ficha.campos.especie='Anão'
    expect(calcular(legado,ficha).vars.dnd_furias).toBe(3) // tabela própria de Fúrias do SRD 5.1
    expect(calcular(s,{...ficha,dndLivros:{base:'phb2024',suplementos:[]}}).vars.dnd_furias).toBeGreaterThan(0)
    expect(esquemaFichaPorLivro(s,ficha,'phb2024')).toBe(s)
  })
  it('mantém regras de 2024 guardadas mas não permite modificá-las na edição legada', () => {
    const a={dndEscolhas:{'guerreiro-subclasse':'campeao'}}
    expect(validarAlteracoesExclusivas2024(a,a)).toEqual([])
    expect(validarAlteracoesExclusivas2024(a,{dndEscolhas:{'guerreiro-subclasse':'outra'}})).toHaveLength(1)
    expect(validarAlteracoesExclusivas2024(a,{...a,dndMagias:{'fire-bolt':'preparada'}})).toHaveLength(1)
    expect(categoria('dnd5e-srd','dndLivros')).toBe('identidade')
  })
})

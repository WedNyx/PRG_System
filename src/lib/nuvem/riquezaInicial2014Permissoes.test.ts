import { describe, expect, it } from 'vitest'
import { agruparRiquezaInicial2014 } from './riquezaInicial2014Permissoes'
import { aplicar, diferencas, separarPorRegra } from './categorias'
import { permissoesPadrao } from '../campanhas/permissoes'
import type { DadosFicha } from '../sistemas/tipos'

const inicial={
  sistema:'dnd5e-srd',
  campos:{classe:'Guerreiro',antecedente:'Forasteiro',nivel:1},
  uso:{itens:{},poderes:{},carteira:''},
} as Partial<DadosFicha>
const ouro={
  ...inicial,
  dnd2014EquipamentoInicial:{
    modo:'ouro' as const,classe:'Guerreiro',antecedente:'Forasteiro',
    dados:[2,3,2,2,3],
  },
  uso:{itens:{},poderes:{},carteira:'120 PO'},
}

describe('ouro inicial D&D 2014: autorização atômica',()=>{
  const diferencasProtegidas=()=>agruparRiquezaInicial2014('dnd5e-srd',inicial,ouro,
    diferencas('dnd5e-srd',inicial,ouro))
  it('classifica ambos equipamento e carteira como equipamentos no mesmo salvamento',()=>{
    const mudancas=diferencasProtegidas()
    expect(mudancas.map(x=>x.categoria)).toEqual(['equipamentos','equipamentos'])
    expect(mudancas.map(x=>x.caminho).sort()).toEqual(['dnd2014EquipamentoInicial','uso'])
  })
  it('modelo C: carteira aguarda aprovação juntamente com a rolagem',()=>{
    const lista=diferencasProtegidas()
    const {livres,aprovacao}=separarPorRegra(lista,permissoesPadrao('C'),{})
    expect(livres).toEqual([])
    expect(aprovacao.map(x=>x.caminho).sort()).toEqual(['dnd2014EquipamentoInicial','uso'])
    expect(aplicar(inicial,livres)).toEqual(inicial)
  })
  it('modelo A ou exceção equipamentos livre: ambos entram juntos',()=>{
    const lista=diferencasProtegidas()
    for(const [regras,excecao] of [
      [permissoesPadrao('A'),{}],
      [permissoesPadrao('C'),{equipamentos:'livre' as const}],
    ] as const){
      const {livres,aprovacao}=separarPorRegra(lista,regras,excecao)
      expect(aprovacao).toEqual([])
      expect((aplicar(inicial,livres) as Partial<DadosFicha>).dnd2014EquipamentoInicial).toEqual(ouro.dnd2014EquipamentoInicial)
      expect((aplicar(inicial,livres) as Partial<DadosFicha>).uso).toEqual(ouro.uso)
    }
  })
  it('modelo B: bloqueia tanto rolagem quanto carteira',()=>{
    const {livres,bloqueadas}=separarPorRegra(diferencasProtegidas(),permissoesPadrao('B'),{})
    expect(livres).toEqual([])
    expect(bloqueadas).toHaveLength(2)
  })
  it('mudanças normais de PV/carteira continuam livres sem nova rolagem',()=>{
    const depois={...ouro,uso:{itens:{},poderes:{},carteira:'110 PO'}}
    const lista=agruparRiquezaInicial2014('dnd5e-srd',ouro,depois,diferencas('dnd5e-srd',ouro,depois))
    expect(lista.map(x=>({campo:x.caminho,categoria:x.categoria}))).toEqual([{campo:'uso',categoria:'pv'}])
    expect(agruparRiquezaInicial2014('outro',inicial,ouro,
      diferencas('outro',inicial,ouro)).some(x=>x.categoria==='pv')).toBe(true)
  })
})

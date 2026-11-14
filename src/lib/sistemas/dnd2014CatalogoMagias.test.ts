import {describe,expect,it} from 'vitest'
import { MAGIAS_PHB_2014, magiasDaClasse2014, magiaReferenciada2014 } from './dnd2014CatalogoMagias'
import { validarAlteracoesMagias2014 } from './dnd2014Magias'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'

describe('Índice do Livro do Jogador 2014 · capítulo 11',()=>{
  it('contém as listas das oito classes conjuradoras do livro',()=>{
    const tamanhos:Record<string,number>={
      bardo:120,bruxo:74,clerigo:106,druida:110,
      feiticeiro:129,mago:215,paladino:45,patrulheiro:46,
    }
    expect(MAGIAS_PHB_2014).toHaveLength(845)
    for(const [classe,qtde] of Object.entries(tamanhos))
      expect(magiasDaClasse2014(classe),classe).toHaveLength(qtde)
    expect(new Set(MAGIAS_PHB_2014.map(m=>m.nome)).size).toBe(367)
  })
  it('não duplica nomes dentro da classe e nível e mantém escolas e rituais',()=>{
    const keys=MAGIAS_PHB_2014.map(x=>x.classe+'|'+x.nivel+'|'+x.nome)
    expect(new Set(keys).size).toBe(keys.length)
    expect(MAGIAS_PHB_2014.every(x=>x.nivel>=0&&x.nivel<=9&&x.nome&&x.escola)).toBe(true)
    const detect=magiaReferenciada2014('mago','DETECTAR MAGIA')
    expect(detect).toMatchObject({nivel:1,ritual:true})
    expect(magiaReferenciada2014('mago','Bola de Fogo')?.nivel).toBe(3)
    expect(magiaReferenciada2014('mago','Sorcerous Burst')).toBeUndefined()
  })
  it('continua permitindo anotações de magias de fontes escolhidas sem transferir efeitos de 2024',()=>{
    const d=fichaVazia(sistemaPorId('dnd5e-srd')!)
    d.campos={...d.campos,classe:'Mago',nivel:5}
    d.dndLivros={base:'phb2014',suplementos:[]}
    const nova={...d,dnd2014Magias:[{
      id:'bola-de-fogo-3-mago',nome:'Bola de Fogo',nivel:3,classe:'mago',fonte:'phb2014',modo:'conhecida' as const,
    }]}
    expect(validarAlteracoesMagias2014(d,nova,'phb2014')).toEqual([])
    expect(validarAlteracoesMagias2014(d,nova,'phb2024').length).toBeGreaterThan(0)
  })
})

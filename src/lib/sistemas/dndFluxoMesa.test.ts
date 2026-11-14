import { describe, expect, it } from 'vitest'
import { sistemaPorId } from './catalogo'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { esquemaFichaPorLivro } from './dnd2014Criacao'
import { aplicarDescanso } from './descanso'
import { avaliarProntidaoDnd } from './dndProntidao'
import type { DadosFicha } from './tipos'
import { validarFichaDados } from '../nuvem/validacao'
import { validarAlteracoesMagias2014, lerMagias2014 } from './dnd2014Magias'
import { validarAlteracoes2014 } from './dnd2014Regras'
import { validarTalentos2014 } from './dnd2014Talentos'
import { validarAlteracoesExclusivas2024 } from './dnd2014Criacao'

const s=sistemaPorId('dnd5e-srd')!
const legado=esquemaFichaPorLivro(s,{dndLivros:{base:'phb2014',suplementos:[]}})
function criar2014(){
  const d=fichaVazia(legado,'Arien')
  d.campos={...d.campos,classe:'Guerreiro',nivel:3,especie:'Humano',subraca2014:'Humano padrão',antecedente:'Soldado'}
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.atributos={FOR:16,DES:14,CON:14,INT:10,SAB:12,CAR:10}
  d.dnd2014PericiasClasse=['acrobacia','percepcao']
  d.dnd2014Subclasse='campeao'
  d.recursos={...d.recursos,retomar_folego:{atual:0},surto_acao:{atual:0},pv:{atual:3},dados_vida:{atual:0}}
  return d
}
function roundtrip<T>(v:T):T{return JSON.parse(JSON.stringify(v)) as T}

describe('Homologação lógica da ficha D&D 2014/2024 para uso em mesa',()=>{
  it('2014: criar → validar payload API → salvar JSON → reabrir e preservar a edição e escolhas',()=>{
    const d=criar2014()
    const valido=validarFichaDados(roundtrip(d))
    expect(valido.ok).toBe(true)
    if(!valido.ok)return
    const reaberta=normalizarFicha(legado,roundtrip(valido.valor.dados) as Partial<DadosFicha>)
    expect(reaberta.dndLivros?.base).toBe('phb2014')
    expect(reaberta.dnd2014Subclasse).toBe('campeao')
    expect(reaberta.dnd2014PericiasClasse).toEqual(['acrobacia','percepcao'])
    expect(reaberta.recursos.pv.atual).toBe(3)
    expect(reaberta.recursos.surto_acao.atual).toBe(0)
    expect(calcular(legado,reaberta).vars.dnd_surto).toBe(1)
    expect(calcular(s,{...reaberta,dndLivros:{base:'phb2024',suplementos:[]}}).vars.dnd_retomar).toBeGreaterThan(0)
    expect(validarAlteracoes2014(d,reaberta,'phb2014')).toEqual([])
  })
  it('2014: subir nível e preservar escolhas de magia e talento após reabrir',()=>{
    const d=criar2014()
    const subiu={...d,campos:{...d.campos,nivel:4},dnd2014Talentos:['ALERTA']}
    expect(validarTalentos2014(d,subiu,'phb2014')).toEqual([])
    expect(validarAlteracoes2014(d,subiu,'phb2014')).toEqual([])
    const ultima=normalizarFicha(legado,roundtrip(subiu))
    expect(ultima.campos.nivel).toBe(4)
    expect(ultima.dnd2014Talentos).toEqual(['ALERTA'])
    expect(calcular(legado,ultima).vars.dnd_prof).toBe(2)
    expect(avaliarProntidaoDnd(ultima,'phb2014').pendencias.some(x=>x.id==='subclasse2014')).toBe(false)
  })
  it('2014: magias persistem e não são importadas automaticamente para a lista 2024',()=>{
    const d=criar2014()
    d.campos.classe='Mago';d.campos.nivel=5;d.dnd2014Subclasse='evocacao'
    d.dnd2014Magias=lerMagias2014([{nome:'Bola de Fogo',nivel:3,classe:'mago',fonte:'phb2014',modo:'preparada'}])
    expect(validarAlteracoesMagias2014({...d,dnd2014Magias:[]},d,'phb2014')).toEqual([])
    const reaberta=normalizarFicha(legado,roundtrip(d))
    expect(reaberta.dnd2014Magias?.[0].nome).toBe('Bola de Fogo')
    expect(reaberta.dndMagias).toBeUndefined()
    expect(validarAlteracoesExclusivas2024(reaberta,{...reaberta,dndMagias:{'fireball':'preparada'}})).toHaveLength(1)
  })
  it('2014: descanso curto restaura Retomar Fôlego/Surto sem recuperar PV automaticamente',()=>{
    const d=criar2014()
    const r=aplicarDescanso(legado,d,'curto')
    expect(r.d.recursos.retomar_folego.atual).toBe(1)
    expect(r.d.recursos.surto_acao.atual).toBe(1)
    expect(r.d.recursos.pv.atual).toBe(3)
    expect(r.d.recursos.dados_vida.atual).toBe(0)
  })
  it('2014: Bardo ganha recuperação de Inspiração no curto só a partir do nível 5',()=>{
    const d=criar2014();d.campos.classe='Bardo';d.campos.nivel=4
    d.atributos.CAR=16;d.recursos.inspiracao_bardo={atual:0}
    expect(aplicarDescanso(legado,d,'curto').d.recursos.inspiracao_bardo.atual).toBe(0)
    d.campos.nivel=5
    expect(aplicarDescanso(legado,d,'curto').d.recursos.inspiracao_bardo.atual).toBe(3)
  })
  it('2014: descanso longo recupera no máximo metade dos Dados de Vida e não duplica',()=>{
    const d=criar2014();d.campos.nivel=8;d.recursos.dados_vida={atual:1}
    const r=aplicarDescanso(legado,d,'longo')
    expect(r.d.recursos.dados_vida.atual).toBe(5)
    expect(r.d.recursos.pv.atual).toBeGreaterThan(3)
    expect(aplicarDescanso(legado,r.d,'longo').d.recursos.dados_vida.atual).toBe(8)
  })
  it('2024: criar → salvar JSON → reabrir sem converter para 2014',()=>{
    const d=fichaVazia(s,'Kaelen')
    d.campos={...d.campos,classe:'Guerreiro',nivel:3,especie:'Elfo',antecedente:'Soldado'}
    d.dndLivros={base:'phb2024',suplementos:[]}
    d.dndEscolhas={'guerreiro-subclasse':'campeao'}
    d.recursos.surto_acao={atual:0}
    const validado=validarFichaDados(roundtrip(d))
    expect(validado.ok).toBe(true)
    if(!validado.ok)return
    const n=normalizarFicha(s,roundtrip(validado.valor.dados) as Partial<DadosFicha>)
    expect(n.dndLivros?.base).toBe('phb2024')
    expect(n.dndEscolhas?.['guerreiro-subclasse']).toBe('campeao')
    expect(n.dnd2014Subclasse).toBeUndefined()
    expect(calcular(s,n).recursosMax.surto_acao).toBeGreaterThanOrEqual(1)
    expect(aplicarDescanso(s,n,'longo').d.recursos.surto_acao.atual).toBeGreaterThan(0)
  })
})

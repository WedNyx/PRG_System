import {describe,expect,it} from 'vitest'
import { avaliarProntidaoDnd } from './dndProntidao'
import { fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
const sistema = sistemaPorId('dnd5e-srd')!
function personagem2014() {
  const d = fichaVazia(sistema)
  d.nome='Arien'
  d.campos={...d.campos,classe:'Guerreiro',especie:'Humano',subraca2014:'Humano padrão',antecedente:'Forasteiro',nivel:1}
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.dnd2014PericiasClasse=['acrobacia','historia']
  return d
}
describe('Preparação não destrutiva para jogar',()=>{
  it('reconhece uma ficha 2014 de nível 1 completa, mas pede conferência de atributos legados',()=>{
    const d=personagem2014()
    const antes=JSON.stringify(d)
    const x=avaliarProntidaoDnd(d,'phb2014')
    expect(x.prontoParaConferir).toBe(true)
    expect(x.pendencias.some(p=>p.tipo==='conferir'&&p.id==='atributosBase2014')).toBe(true)
    expect(JSON.stringify(d)).toBe(antes)
  })
  it('cobra a subclasse apenas quando a classe inicial atinge seu nível de escolha',()=>{
    const d=personagem2014()
    d.campos.nivel=3
    let x=avaliarProntidaoDnd(d,'phb2014')
    expect(x.pendencias.some(p=>p.id==='subclasse2014')).toBe(true)
    d.dnd2014Subclasse='campeao'
    x=avaliarProntidaoDnd(d,'phb2014')
    expect(x.pendencias.some(p=>p.id==='subclasse2014')).toBe(false)
  })
  it('registra escolhas variáveis e perícias raciais do Humano Variante',()=>{
    const d=personagem2014()
    d.campos.subraca2014='Humano Variante'
    const x=avaliarProntidaoDnd(d,'phb2014')
    expect(x.pendencias.some(p=>p.id==='atributosRaciais2014')).toBe(true)
    expect(x.pendencias.some(p=>p.id==='periciasRaciais2014')).toBe(true)
  })
  it('não mistura um rascunho de 2024 com pendências exclusivas de 2014',()=>{
    const d=fichaVazia(sistema)
    d.nome='Kira'
    d.campos={...d.campos,classe:'Guerreiro',especie:'Elfo',antecedente:'Soldado',nivel:1}
    const x=avaliarProntidaoDnd(d,'phb2024')
    expect(x.edicao).toBe('phb2024')
    expect(x.pendencias.some(p=>p.id.endsWith('2014'))).toBe(false)
    expect(x.pendencias.some(p=>p.id.startsWith('marco2024-'))).toBe(true)
  })
  it('não concede poderes nem bloqueia salvar ficha incompleta',()=>{
    const d=fichaVazia(sistema)
    const antes=JSON.stringify(d)
    const x=avaliarProntidaoDnd(d,'phb2014')
    expect(x.prontoParaConferir).toBe(false)
    expect(x.pendencias.some(p=>p.id==='classe')).toBe(true)
    expect(JSON.stringify(d)).toBe(antes)
  })
})

import {describe,expect,it} from 'vitest'
import {fichaVazia} from './calculo'
import {sistemaPorId} from './catalogo'
import {expressaoMagia2014Valida,lerMagias2014,maximoNivelMagiaClasse2014,
  validarAlteracoesMagias2014} from './dnd2014Magias'
const sistema=sistemaPorId('dnd5e-srd')!
function personagem(classe='Mago',nivel=5) {
  const d=fichaVazia(sistema)
  d.campos={...d.campos,classe,nivel}
  d.dndLivros={base:'phb2014' as const,suplementos:['tasha2020']}
  return d
}
const entrada=(nome='Teste',nivel=1,classe='mago',fonte='phb2014',modo:'conhecida'|'preparada'|'extra'='preparada')=>
  ({nome,nivel,classe,fonte,modo})
describe('Grimório legado D&D 2014',()=>{
 it('não usa texto nem efeitos da edição revisada 2024, e valida a expressão de dados',()=>{
   expect(expressaoMagia2014Valida('3d6+2')).toBe(true)
   expect(expressaoMagia2014Valida('2d20-5')).toBe(true)
   expect(expressaoMagia2014Valida('2d6;alert(1)')).toBe(false)
   expect(expressaoMagia2014Valida('1d7')).toBe(false)
 })
 it('classes e subclasses têm níveis de magia compatíveis com a progressão do SRD 5.1',()=>{
   expect(maximoNivelMagiaClasse2014('Mago',1,undefined)).toBe(1)
   expect(maximoNivelMagiaClasse2014('Mago',5,undefined)).toBe(3)
   expect(maximoNivelMagiaClasse2014('Mago',17,undefined)).toBe(9)
   expect(maximoNivelMagiaClasse2014('Paladino',1,undefined)).toBe(0)
   expect(maximoNivelMagiaClasse2014('Paladino',2,undefined)).toBe(1)
   expect(maximoNivelMagiaClasse2014('Paladino',5,undefined)).toBe(2)
   expect(maximoNivelMagiaClasse2014('Bruxo',5,undefined)).toBe(3)
   expect(maximoNivelMagiaClasse2014('Guerreiro',7,'campeao')).toBe(0)
   expect(maximoNivelMagiaClasse2014('Guerreiro',7,'cavaleiro-arcano')).toBe(2)
 })
 it('normaliza nomes, impede duplicatas e mantém somente registros seguros',()=>{
   const r=lerMagias2014([entrada(' Mísseis Mágicos '),entrada('Mísseis Mágicos'),entrada('Raio',2,'mago','phb2014','extra'),
     {...entrada('Feitiço'),nivel:13},null])
   expect(r).toHaveLength(2)
   expect(r[0].nome).toBe('Mísseis Mágicos')
   expect(r[1].nivel).toBe(2)
   expect(lerMagias2014({})).toEqual([])
 })
 it('concede escolha de nível 3 a um Mago 5, mas rejeita nível 4',()=>{
   const d=personagem()
   const ok={...d,dnd2014Magias:lerMagias2014([entrada('Bola de Fogo',3)])}
   expect(validarAlteracoesMagias2014(d,ok,'phb2014')).toEqual([])
   const high={...d,dnd2014Magias:lerMagias2014([entrada('Magia além do nível',4)])}
   expect(validarAlteracoesMagias2014(d,high,'phb2014').some(e=>e.includes('Nível da magia'))).toBe(true)
 })
 it('bloqueia suplementos não selecionados e edição errada',()=>{
   const d=personagem()
   const wrong={...d,dnd2014Magias:lerMagias2014([entrada('Magia Desconhecida',1,'mago','ravenloft2021')])}
   expect(validarAlteracoesMagias2014(d,wrong,'phb2014')[0]).toContain('Fonte de magia')
   const right={...d,dnd2014Magias:lerMagias2014([entrada('Magia de suplemento',1,'mago','tasha2020')])}
   expect(validarAlteracoesMagias2014(d,right,'phb2014')).toEqual([])
   expect(validarAlteracoesMagias2014(d,right,'phb2024')[0]).toContain('2014')
 })
 it('rejeita magias de classes que o personagem não tem e truques não concedidos',()=>{
   const d=personagem('Paladino',3)
   const bad={...d,dnd2014Magias:lerMagias2014([entrada('Truque de Paladino',0,'paladino')])}
   expect(validarAlteracoesMagias2014(d,bad,'phb2014')[0]).toContain('truque')
   const wizard={...d,dnd2014Magias:lerMagias2014([entrada('Magia do Mago',1,'mago')])}
   expect(validarAlteracoesMagias2014(d,wizard,'phb2014')[0]).toContain('Classe da magia')
 })
 it('fichas sem grimório continuam podendo mudar classe e nível',()=>{
   const d=personagem('Mago',2)
   const changed={...d,campos:{...d.campos,nivel:3}}
   expect(validarAlteracoesMagias2014(d,changed,'phb2014')).toEqual([])
 })
 it('quando a classe muda revalida magias registradas sem apagá-las',()=>{
   const d={...personagem('Mago',5),dnd2014Magias:lerMagias2014([entrada('Bola de Fogo',3)])}
   const changed={...d,campos:{...d.campos,classe:'Paladino',nivel:5}}
   expect(validarAlteracoesMagias2014(d,changed,'phb2014').length).toBeGreaterThan(0)
 })
})

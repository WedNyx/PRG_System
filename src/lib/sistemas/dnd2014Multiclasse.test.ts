import { describe, expect, it } from 'vitest'
import { CLASSES_SRD } from './dnd2024Srd'
import { classesDaFicha2014, espacosDeMagia2014 } from './dnd2014Multiclasse'
import { SUBCLASSES_DND_2014, subclassesDaClasse2014, subclasseAtivaDnd2014,
  validarSubclasseDnd2014 } from './dnd2014Subclasses'
import { calcular, fichaVazia } from './calculo'
import { sistemaPorId } from './catalogo'
import { esquemaFichaPorLivro } from './dnd2014Criacao'
import { validarAlteracoes2014, efeitosDnd2014 } from './dnd2014Regras'
import { hexagonosOficiaisDnd } from './arvoreDndOficial'
const original = sistemaPorId('dnd5e-srd')!
const legado = esquemaFichaPorLivro(original,{dndLivros:{base:'phb2014',suplementos:[]}})
function ficha(classe:string,nivel:number,outras:Record<string,number>={}) {
  const d=fichaVazia(original)
  d.campos={...d.campos,classe,nivel,especie:'Humano',subraca2014:'Humano padrão',antecedente:'Soldado'}
  d.dndLivros={base:'phb2014',suplementos:[]}
  d.dnd2014Multiclasse=outras
  return d
}

describe('D&D 2014 — subclasses por PHB e SRD 5.1',()=>{
 it('tem um arquétipo aberto SRD 5.1 para as 12 classes e distingue os comerciais',()=>{
   for(const cls of CLASSES_SRD) {
     const subs=subclassesDaClasse2014(cls.nome)
     expect(subs.some(x=>x.fonte==='srd51'),cls.nome).toBe(true)
     expect(subs.some(x=>x.fonte==='phb2014'),cls.nome).toBe(true)
     expect(new Set(subs.map(x=>x.id)).size,cls.nome).toBe(subs.length)
   }
   expect(SUBCLASSES_DND_2014.filter(x=>x.fonte==='srd51')).toHaveLength(12)
 })
 it('somente seleciona arquétipos no nível certo da classe de 2014',()=>{
   expect(subclasseAtivaDnd2014('Clérigo','vida',1)?.fonte).toBe('srd51')
   expect(subclasseAtivaDnd2014('Mago','evocacao',1)).toBeNull()
   expect(subclasseAtivaDnd2014('Mago','evocacao',2)?.nivel).toBe(2)
   expect(subclasseAtivaDnd2014('Guerreiro','campeao',2)).toBeNull()
   expect(subclasseAtivaDnd2014('Guerreiro','campeao',3)?.nivel).toBe(3)
   expect(subclasseAtivaDnd2014('Guerreiro','vida',10)).toBeNull()
   expect(validarSubclasseDnd2014({campos:{classe:'Guerreiro',nivel:2}},
     {campos:{classe:'Guerreiro',nivel:2},dnd2014Subclasse:'campeao'})).toHaveLength(1)
   expect(validarSubclasseDnd2014({campos:{classe:'Guerreiro',nivel:2}},
     {campos:{classe:'Guerreiro',nivel:3},dnd2014Subclasse:'campeao'})).toEqual([])
 })
 it('não libera Campeão 3 em Guerreiro 2/Mago 4 por usar nível total',()=>{
   const d=ficha('Guerreiro',6,{mago:4})
   expect(validarSubclasseDnd2014({...d,dnd2014Subclasse:undefined},{...d,dnd2014Subclasse:'campeao'}).length).toBeGreaterThan(0)
   const campeao={...d,dnd2014Subclasse:'campeao',campos:{...d.campos,nivel:7}}
   expect(validarSubclasseDnd2014(d,campeao)).toEqual([])
   const regrediu={...campeao,campos:{...campeao.campos,nivel:6}}
   expect(validarSubclasseDnd2014(campeao,regrediu).length).toBeGreaterThan(0)
 })
 it('não permite alterações de subclasses do motor 2014 dentro de fichas 2024',()=>{
   const a=ficha('Guerreiro',3)
   expect(validarAlteracoes2014(a,{...a,dnd2014Subclasse:'campeao'},'phb2024')).toHaveLength(1)
   expect(validarAlteracoes2014(a,{...a,dnd2014Subclasse:'campeao'},'phb2014')).toEqual([])
 })
})

describe('D&D 2014 — conjuração e multiclasse próprias do SRD 5.1',()=>{
 it('Paladino 3 como único conjurador tem 3 espaços de 1º nível',()=>{
   const d=ficha('Paladino',3)
   const e=espacosDeMagia2014(classesDaFicha2014(d).lista)
   expect(e.espacos[1]).toBe(3)
   expect(e.espacos[2]).toBe(0)
 })
 it('Paladino 3 + Feiticeiro 2 arredonda 3/2 para baixo (conjurador 3)',()=>{
   const d=ficha('Paladino',5,{feiticeiro:2})
   const e=espacosDeMagia2014(classesDaFicha2014(d).lista)
   expect(e.multiclasse).toBe(true)
   expect(e.nivelConjurador).toBe(3)
   expect(e.espacos[1]).toBe(4)
   expect(e.espacos[2]).toBe(2)
   expect(calcular(legado,d).vars.dnd_espacos_2).toBe(2)
 })
 it('Paladino 5 + Feiticeiro 3 é conjurador 5 (2+3), e não 6',()=>{
   const d=ficha('Paladino',8,{feiticeiro:3})
   const e=espacosDeMagia2014(classesDaFicha2014(d).lista)
   expect(e.nivelConjurador).toBe(5)
   expect(e.espacos[3]).toBe(2)
 })
 it('Bruxo combina Pacto sem somar os slots ao conjurador comum',()=>{
   const d=ficha('Bruxo',8,{mago:3})
   const e=espacosDeMagia2014(classesDaFicha2014(d).lista)
   expect(e.nivelConjurador).toBe(3)
   expect(e.pacto).toBe(2)
   expect(e.pactoNivel).toBe(3)
   expect(calcular(legado,d).vars.dnd_espacos_2).toBe(2)
 })
 it('Cavaleiro Arcano 7 contribui como 2 níveis ao combinar com Mago 4',()=>{
   const d=ficha('Guerreiro',11,{mago:4})
   d.dnd2014Subclasse='cavaleiro-arcano'
   const e=espacosDeMagia2014(classesDaFicha2014(d).lista,d.dnd2014Subclasse)
   expect(e.nivelConjurador).toBe(6)
   expect(e.espacos[3]).toBe(3)
 })
 it('PV usam dados de vida de todas as classes e só o primeiro dado cheio',()=>{
   const d=ficha('Guerreiro',8,{mago:3})
   d.atributos={...d.atributos,CON:10}
   expect(classesDaFicha2014(d).lista.map(x=>x.nivel)).toEqual([5,3])
   expect(calcular(legado,d).derivados.pv_sugerido).toBe(46)
 })
 it('servidor rejeita níveis inválidos e multiclasse incompatível com requisitos',()=>{
   const d=ficha('Paladino',3)
   const invalid={...d,campos:{...d.campos,nivel:3},dnd2014Multiclasse:{feiticeiro:3}}
   expect(validarAlteracoes2014(d,invalid,'phb2014').some(x=>x.includes('pelo menos um nível'))).toBe(true)
   const low={...d,campos:{...d.campos,nivel:4},dnd2014Multiclasse:{feiticeiro:1}}
   expect(validarAlteracoes2014(d,low,'phb2014').some(x=>x.includes('Multiclasse 2014:'))).toBe(true)
   expect(validarAlteracoes2014(d,low,'phb2014',true)).toEqual([])
 })
})

describe('PHB 2014, capítulo 6 — características não cumulativas', () => {
  const vars={ca_base:10,armadura:0,mod_CON:3,mod_SAB:4,mod_CAR:2,deslocamento:9}
  it('Canalizar Divindade de Clérigo e Paladino compartilha usos, sem somar',()=>{
    expect(efeitosDnd2014(ficha('Paladino',3),vars).vars.dnd_canalizar).toBe(1)
    expect(efeitosDnd2014(ficha('Clérigo',10,{paladino:4}),vars).vars.dnd_canalizar).toBe(2)
    expect(efeitosDnd2014(ficha('Clérigo',5,{paladino:3}),vars).vars.dnd_canalizar).toBe(1)
  })
  it('Defesa sem Armadura usa a fórmula da classe inicial, nunca soma SAB e CON',()=>{
    expect(efeitosDnd2014(ficha('Bárbaro',6,{monge:3}),vars).vars.dnd_ca_extra).toBe(3)
    expect(efeitosDnd2014(ficha('Monge',6,{barbaro:3}),vars).vars.dnd_ca_extra).toBe(4)
    // Ordem de duas classes secundárias desconhecida: não assumir qual defesa foi recebida primeiro.
    expect(efeitosDnd2014(ficha('Guerreiro',6,{barbaro:2,monge:2}),vars).vars.dnd_ca_extra).toBe(0)
  })
})

describe('Árvore 2014 respeita níveis de cada classe', () => {
  it('Guerreiro 2 / Mago 4 não recebe Ataque Extra de Guerreiro 5', () => {
    const d=ficha('Guerreiro',6,{mago:4})
    d.dnd2014Subclasse='campeao' // ainda bloqueada: Guerreiro só tem nível 2
    const hex=hexagonosOficiaisDnd(d,'phb2014')
    expect(hex.some(x=>x.titulo==='Surto de Ação')).toBe(true)
    expect(hex.some(x=>x.titulo==='Ataque Extra')).toBe(false)
    expect(hex.some(x=>x.titulo==='Tradição Arcana (subclasse)')).toBe(true)
    expect(hex.some(x=>x.id==='2014-subclasse')).toBe(false)
    const futuros=hexagonosOficiaisDnd(d,'phb2014',null,true)
    expect(futuros.some(x=>x.titulo==='Ataque Extra' && x.estado==='futuro')).toBe(true)
  })
})

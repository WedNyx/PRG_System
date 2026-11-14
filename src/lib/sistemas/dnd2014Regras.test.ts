import { describe, expect, it } from 'vitest'
import { atributosEfetivos2014, aumentosRaciais2014, efeitosDnd2014,
  lerAtributosBase2014, periciasClasse2014, validarAlteracoes2014 } from './dnd2014Regras'
import { esquemaFichaPorLivro } from './dnd2014Criacao'
import { calcular, fichaVazia, normalizarFicha } from './calculo'
import { sistemaPorId } from './catalogo'

const s = sistemaPorId('dnd5e-srd')!
const legada = esquemaFichaPorLivro(s,{ dndLivros: {base:'phb2014', suplementos:[]} })
const criar = (raca: string, subraca = '', classe = 'Guerreiro', nivel = 1) => {
  const d = fichaVazia(s)
  d.campos = { ...d.campos, especie:raca, subraca2014:subraca, classe, antecedente:'Forasteiro', nivel }
  d.dndLivros = {base:'phb2014', suplementos:[]}
  return d
}
describe('D&D 5e 2014 · automações verificadas do SRD 5.1', () => {
  it('evita duplicar bônus raciais em fichas antigas sem valores-base confirmados', () => {
    const d=criar('Anão','Anão da Colina')
    d.atributos = {...d.atributos,CON:14,SAB:12}
    expect(atributosEfetivos2014(d)).toBeNull()
    expect(calcular(legada,d).vars.CON).toBe(14)
    expect(calcular(legada,d).vars.robusto).toBe(0)
    expect(calcular(legada,d).vars.SAB).toBe(12)
  })
  it('aplica a raça e sub-raça 2014 somente sobre valores-base: Anão da Colina', () => {
    const d=criar('Anão','Anão da Colina','Guerreiro',3)
    d.dnd2014AtributosBase={FOR:15,DES:12,CON:13,INT:10,SAB:11,CAR:8}
    expect(atributosEfetivos2014(d)).toMatchObject({CON:15,SAB:12,FOR:15})
    const c=calcular(legada,d)
    expect(c.vars.CON).toBe(15)
    expect(c.mods.CON).toBe(2)
    expect(c.vars.dnd_pv_extra).toBe(3)
    expect(c.derivados.pv_sugerido).toBe(31)
    expect(c.vars.dnd_furias).toBe(0)
  })
  it('distingue as seis variantes raciais e suas escolhas livres', () => {
    expect(aumentosRaciais2014('Elfo','Alto Elfo',[]).bonus).toMatchObject({DES:2,INT:1})
    expect(aumentosRaciais2014('Elfo','Drow',[]).bonus).toMatchObject({DES:2,CAR:1})
    expect(aumentosRaciais2014('Anão','Anão da Montanha',[]).bonus).toMatchObject({CON:2,FOR:2})
    expect(aumentosRaciais2014('Gnomo','Gnomo da Floresta',[]).bonus).toMatchObject({INT:2,DES:1})
    expect(aumentosRaciais2014('Halfling','Robusto',[]).bonus).toMatchObject({DES:2,CON:1})
    expect(aumentosRaciais2014('Humano','Humano padrão',[]).bonus).toMatchObject({FOR:1,DES:1,CON:1,INT:1,SAB:1,CAR:1})
    expect(aumentosRaciais2014('Meio-Elfo','',['FOR','SAB']).bonus).toMatchObject({CAR:2,FOR:1,SAB:1})
    expect(aumentosRaciais2014('Meio-Elfo','',[]).pendencias).toHaveLength(1)
    expect(aumentosRaciais2014('Humano','Humano Variante',['DES','CAR']).bonus).toMatchObject({DES:1,CAR:1})
    expect(aumentosRaciais2014('Humano','Humano Variante',[]).pendencias).toHaveLength(1)
  })
  it('perícias básicas 2014 são diferentes de 2024 onde necessário: Guerreiro e Ladino', () => {
    expect(periciasClasse2014('Guerreiro')?.opcoes).not.toContain('persuasao')
    expect(periciasClasse2014('Ladino')?.opcoes).toContain('atuacao')
    const d=criar('Elfo','Alto Elfo','Guerreiro')
    d.dnd2014PericiasClasse=['atletismo','percepcao']
    const c=calcular(legada,d)
    expect(c.automaticos?.atletismo).toContain('Guerreiro')
    expect(c.automaticos?.sobrevivencia).toContain('Forasteiro')
    expect(c.automaticos?.percepcao).toBeDefined()
  })
  it('recursos do SRD 5.1 usam tabelas próprias: Guerreiro, Bárbaro, Paladino, Bruxo', () => {
    const fighter=criar('Humano','Humano padrão','Guerreiro',2)
    const f=calcular(legada,fighter)
    expect(f.vars.dnd_surto).toBe(1)
    expect(f.vars.dnd_retomar).toBe(1)
    const barb=criar('Humano','Humano padrão','Bárbaro',5)
    expect(calcular(legada,barb).vars.dnd_furias).toBe(3)
    expect(calcular(legada,barb).vars.dnd_dano_furia).toBe(2)
    const pal1=criar('Humano','Humano padrão','Paladino',1)
    const pal2=criar('Humano','Humano padrão','Paladino',2)
    expect(calcular(legada,pal1).vars.dnd_espacos_1).toBe(0)
    expect(calcular(legada,pal2).vars.dnd_espacos_1).toBe(2)
    const pact=criar('Humano','Humano padrão','Bruxo',5)
    expect(calcular(legada,pact).vars.dnd_pacto).toBe(2)
    expect(calcular(legada,pact).vars.dnd_pacto_nivel).toBe(3)
  })
  it('impede escolhas inválidas e mudanças legadas em edições 2024', () => {
    expect(lerAtributosBase2014({FOR:10,DES:11,CON:12,INT:13,SAB:14,CAR:15})).not.toBeNull()
    expect(lerAtributosBase2014({FOR:10})).toBeNull()
    const d=criar('Meio-Elfo','','Ladino')
    expect(validarAlteracoes2014({}, {...d,dnd2014AtributosExtras:['CAR','FOR']},'phb2014')).toContain('Meio-Elfo 2014 deve escolher dois atributos diferentes de Carisma.')
    expect(validarAlteracoes2014({}, {...d,dnd2014PericiasClasse:['atletismo','atletismo']},'phb2014')).toHaveLength(1)
    expect(validarAlteracoes2014({}, {...d,dnd2014PericiasClasse:['atletismo','persuasao']},'phb2014')).toHaveLength(0)
    expect(validarAlteracoes2014({}, {...d,dnd2014PericiasClasse:['sobrevivencia']},'phb2014')).toHaveLength(1)
    expect(validarAlteracoes2014(
      {campos:{classe:'Guerreiro',especie:'Elfo',antecedente:'Forasteiro'}},
      {campos:{classe:'Guerreiro',especie:'Golias',antecedente:'Forasteiro'}},
      'phb2014').some(x=>x.includes('especie'))).toBe(true)
    expect(validarAlteracoes2014(
      {campos:{classe:'Guerreiro',especie:'Elfo',antecedente:'Forasteiro'}},
      {campos:{classe:'Guerreiro',especie:'Elfo',subraca2014:'Gnomo das Rochas',antecedente:'Forasteiro'}},
      'phb2014').some(x=>x.includes('Sub-raça'))).toBe(true)
    expect(validarAlteracoes2014({}, {...d,dnd2014AtributosExtras:['FOR']},'phb2024')).toHaveLength(1)
  })
  it('preserva campos 2014 em normalização e nunca aplica bônus com edição 2024', () => {
    const d=criar('Anão','Anão da Colina','Guerreiro',1)
    d.dnd2014AtributosBase={FOR:10,DES:10,CON:10,INT:10,SAB:10,CAR:10}
    const n=normalizarFicha(s,d)
    expect(n.dnd2014AtributosBase?.CON).toBe(10)
    expect(calcular(s,n).vars.CON).toBe(12)
    n.dndLivros={base:'phb2024',suplementos:[]}
    expect(calcular(s,n).vars.CON).toBe(10)
  })
})

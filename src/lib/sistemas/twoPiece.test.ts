import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validarSistema } from './autoral'
import { fichaVazia, tornarManual } from './calculo'
import { liberarNo, poderesDaArvore, preencherNo, type Arvore } from './arvore'
import { arvoreDoSistema } from './arvoreSistemas'

/** Two Piece (sistema autoral do Raijin, v0.36.9). A semente legível fica em supabase/sementes/two-piece.json. */
describe('Two Piece (sistema autoral do Raijin, v0.36.9)', () => {
  const def = JSON.parse(readFileSync(join(process.cwd(), 'supabase/sementes/two-piece.json'), 'utf8'))
  const r = validarSistema(def, { id: 'autoral-8d2f6a1c4b7e4e9a9c3b5d7f1a2e4c6b', autor: 'Raijin' })
  if (process.env.GERAR_TWO_PIECE && r.ok) writeFileSync(process.env.GERAR_TWO_PIECE, JSON.stringify(r.sistema))
  it('passa no construtor sem perder nada', () => {
    expect(r.ok, JSON.stringify(!r.ok && r.erros)).toBe(true)
    if (!r.ok) return
    const s = r.sistema
    expect(s.atributos.map(a => a.nome)).toEqual(['Força', 'Inteligência', 'Vigor', 'Destreza', 'Carisma', 'Força de vontade'])
    expect(s.recursos.map(x => x.id)).toEqual(['pv', 'mp', 'sn', 'em'])
    expect(s.rolagem).toBe('parada'); expect(s.parada?.lados).toBe(20)
    expect(s.campos.find(c => c.id === 'classe')?.opcoes?.map(o => o.nome)).toEqual(['Espadachim', 'Combatente/Artista marcial', 'Atirador'])
    expect(s.campos.find(c => c.id === 'raca')?.opcoes?.map(o => o.nome)).toEqual(['Lunarian', 'Humano', 'Cyborg'])
    expect(s.pericias?.livres).toBe(true)
    expect(s.carga?.formula).toBe('20')
  })
  it('árvore: limite de cada divisão, todos os espaços em aberto, Haki gasta EM', () => {
    if (!r.ok) return
    const nos = r.sistema.arvore!.nos as Arvore['nos']
    const conta = (p: string) => nos.filter(n => n.id.startsWith(p)).length
    expect([conta('tp-classe-'), conta('tp-raca-'), conta('tp-fruta-'), conta('tp-haki-arm-'), conta('tp-haki-obs-'), conta('tp-haki-rei-'), conta('tp-roku-') - conta('tp-roku-evo-'), conta('tp-roku-evo-')])
      .toEqual([10, 3, 10, 3, 3, 3, 6, 6])
    expect(nos.filter(n => n.id !== 'tp-centro').every(n => n.aberto)).toBe(true)
    expect(nos.filter(n => n.id.startsWith('tp-haki-')).every(n => n.aberto?.recurso === 'em')).toBe(true)
    expect(nos.filter(n => n.aberto && !n.id.startsWith('tp-haki-')).every(n => n.aberto?.recurso === 'mp')).toBe(true)
  })
  it('o jogador libera um espaço, escreve a habilidade e ela vira poder com dano, custo e usos', () => {
    if (!r.ok) return
    const s = r.sistema, d = tornarManual(s, fichaVazia(s, 'Kairo'))
    let a = arvoreDoSistema(s, d)!.autor!.arvore
    for (const id of ['tp-centro', 'tp-haki-arm-1']) { const x = liberarNo(a, id, 0, null); expect(x.erro).toBeUndefined(); a = x.arvore! }
    expect(liberarNo(a, 'tp-haki-arm-3', 0, null).erro).toBeTruthy() // precisa do 2 antes
    a = preencherNo(a, 'tp-haki-arm-1', { nome: 'Punho Negro', descricao: 'Endurece o braço.', dano: '2d8 + 3', custo: 4, usos: 2 })
    expect(poderesDaArvore(a)).toEqual([expect.objectContaining({ nome: 'Punho Negro', expressao: '2d8+3', recurso: 'em', custo: 4, usosMax: 2, descricao: 'Endurece o braço.' })])
    a = preencherNo(a, 'tp-haki-arm-1', { nome: 'Observar', dano: 'rm -rf' })
    expect(poderesDaArvore(a)[0]).toMatchObject({ nome: 'Observar' }); expect(poderesDaArvore(a)[0].expressao).toBeUndefined()
    expect(preencherNo(a, 'tp-centro', { nome: 'x' })).toBe(a) // o centro não é espaço em aberto
  })
})

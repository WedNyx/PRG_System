import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CAPITULOS, DUVIDAS, GUIA, TRILHAS } from './guia'

describe('guia da plataforma (v0.35.5)', () => {
  const ids = GUIA.map(t => t.id)
  it('tópicos únicos, cada um num capítulo que existe, na ordem dos capítulos', () => {
    expect(new Set(ids).size).toBe(ids.length)
    const caps = CAPITULOS.map(c => c.id)
    for (const t of GUIA) expect(caps, t.id).toContain(t.capitulo)
    const ordem = GUIA.map(t => caps.indexOf(t.capitulo))
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
  })
  it('trilhas e dúvidas apontam para tópicos que existem', () => {
    for (const tr of TRILHAS) for (const p of tr.passos) expect(ids, tr.id + ': ' + p.texto).toContain(p.topico)
    for (const d of DUVIDAS) if (d.topico) expect(ids, d.pergunta).toContain(d.topico)
  })
  it('toda foto do guia existe em public/guia', () => {
    for (const t of GUIA) for (const f of t.fotos ?? []) expect(existsSync(join(process.cwd(), 'public/guia', f.arquivo)), f.arquivo).toBe(true)
  })
})

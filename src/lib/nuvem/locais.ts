'use client'
/**
 * Encontra dados salvos só neste navegador (de QUALQUER perfil local), para importar
 * para a nuvem. Necessário porque, ao ligar a nuvem, os perfis são recriados com IDs
 * novos e os dados antigos ficavam "presos" ao ID local antigo.
 */
const V8 = 'lunethernnyis-ficha-v8-'
const GEN = 'prg-ficha-gen-'
const LISTA_V8 = 'prg-fichas-independentes-v1-'
const RASCUNHOS = 'prg-campanhas-rascunho-v1-'
const PERFIS = 'prg-aventureiros-demo-v1'
const IMPORTADOS = 'prg-nuvem-importados-v1'
const ESPELHOS = 'prg-nuvem-espelhos-v1'

export type FichaLocal = { chave: string; id: string; tipo: 'v8' | 'generica'; sistema?: string; nome: string; perfil: string }
export type CampanhaLocal = { chave: string; dados: Record<string, unknown>; nome: string; perfil: string }

const ler = <T,>(k: string, padrao: T): T => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? padrao } catch { return padrao } }
const conjunto = (k: string) => new Set<string>(ler<string[]>(k, []).filter(x => typeof x === 'string'))
const chaves = () => { const out: string[] = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) out.push(k) } } catch {} return out }

function nomesPerfis(): Record<string, string> {
  const lista = ler<unknown[]>(PERFIS, [])
  return Object.fromEntries((Array.isArray(lista) ? lista : []).filter((p): p is { id: string; apelido: string } => !!p && typeof (p as { id?: unknown }).id === 'string')
    .map(p => [p.id, String(p.apelido ?? '')]))
}

/** Marca uma ficha aberta pela nuvem: a cópia local dela NÃO deve ser oferecida para importar. */
export function marcarEspelho(id: string) {
  try { const s = conjunto(ESPELHOS); s.add(id); localStorage.setItem(ESPELHOS, JSON.stringify([...s].slice(-500))) } catch {}
}
export function marcarImportado(chave: string) {
  try { const s = conjunto(IMPORTADOS); s.add(chave); localStorage.setItem(IMPORTADOS, JSON.stringify([...s])) } catch {}
}

export function fichasLocais(idsNuvem: Set<string>): FichaLocal[] {
  const importados = conjunto(IMPORTADOS), espelhos = conjunto(ESPELHOS), perfis = nomesPerfis()
  // De qual perfil local veio cada ficha V8 (pela lista do perfil ou pela "ficha original" = ID do perfil).
  const dono: Record<string, string> = {}
  for (const k of chaves()) if (k.startsWith(LISTA_V8)) {
    const perfil = k.slice(LISTA_V8.length)
    for (const f of ler<unknown[]>(k, [])) if (f && typeof (f as { id?: unknown }).id === 'string') dono[(f as { id: string }).id] = perfil
  }
  const out: FichaLocal[] = []
  for (const k of chaves()) {
    const ehV8 = k.startsWith(V8), ehGen = k.startsWith(GEN)
    if (!ehV8 && !ehGen) continue
    const id = k.slice(ehV8 ? V8.length : GEN.length)
    if (importados.has(k) || espelhos.has(id) || idsNuvem.has(id)) continue
    const d = ler<Record<string, unknown> | null>(k, null)
    if (!d || typeof d !== 'object') continue
    const fields = (d.fields && typeof d.fields === 'object' ? d.fields : {}) as Record<string, unknown>
    const nome = String((ehV8 ? fields.name : d.nome) ?? '').trim().slice(0, 90) || 'Personagem sem nome'
    const perfilId = ehV8 ? (dono[id] ?? id) : ''
    out.push({ chave: k, id, tipo: ehV8 ? 'v8' : 'generica', sistema: ehGen ? String(d.sistema ?? '') : undefined, nome, perfil: perfis[perfilId] ?? '' })
  }
  return out
}

export function campanhasLocais(): CampanhaLocal[] {
  const importados = conjunto(IMPORTADOS), perfis = nomesPerfis()
  const out: CampanhaLocal[] = []
  for (const k of chaves()) if (k.startsWith(RASCUNHOS)) {
    const perfil = perfis[k.slice(RASCUNHOS.length)] ?? ''
    for (const c of ler<unknown[]>(k, [])) {
      if (!c || typeof c !== 'object') continue
      const dados = c as Record<string, unknown>
      const chave = k + '#' + String(dados.id)
      if (dados.importada || importados.has(chave)) continue
      out.push({ chave, dados, nome: String(dados.nome ?? 'Campanha'), perfil })
    }
  }
  return out
}

export const lerFichaLocal = (chave: string) => ler<Record<string, unknown> | null>(chave, null)

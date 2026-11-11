/**
 * Capas dos sistemas (v0.32): ilustrações próprias da plataforma, no clima de cada jogo
 * (nenhuma é a capa oficial do livro). Sistemas autorais usam a capa enviada pelo autor;
 * sem capa, usam a constelação com uma cor tirada do nome.
 */
const PRONTAS = ['dnd5e-srd', 'pf2e', 'fate-core', 'blades', 'brp', 'faroeste-arcano', 'ordem-paranormal', 'tormenta20', 'livre']

export type Capa = { src: string; matiz: number }

/** Matiz estável (0–359) a partir do nome, para as capas genéricas não ficarem todas iguais. */
export function matizDoNome(nome: string): number {
  let h = 0
  for (const c of nome) h = (h * 31 + c.codePointAt(0)!) >>> 0
  return h % 360
}

export function capaDoSistema(id: string, nome = '', capaEnviada?: string | null): Capa {
  if (capaEnviada) return { src: capaEnviada, matiz: 0 }
  if (PRONTAS.includes(id)) return { src: `/capas/sistemas/${id}.svg`, matiz: 0 }
  return { src: '/capas/sistemas/autoral.svg', matiz: matizDoNome(nome || id) }
}

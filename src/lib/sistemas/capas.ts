/**
 * Capas dos sistemas (v0.32): ilustrações próprias da plataforma, no clima de cada jogo
 * (nenhuma é a capa oficial do livro). Sistemas autorais usam a capa enviada pelo autor;
 * sem capa, usam a constelação com uma cor tirada do nome.
 */
/** Capas em imagem (arte enviada pelo Wed, v0.33.4). `lado`: a arte é a parte direita do cartão (o texto fica à esquerda, no escuro). */
const EM_IMAGEM: Record<string, { lado?: boolean }> = {
  'dnd5e-srd': { lado: true }, pf2e: { lado: true }, 'fate-core': { lado: true }, blades: { lado: true }, brp: { lado: true },
  'faroeste-arcano': { lado: true }, 'ordem-paranormal': { lado: true }, tormenta20: { lado: true }, livre: { lado: true },
  assimilacao: { lado: true }, 'mork-borg': {},
}

export type Capa = { src: string; matiz: number; lado?: boolean }

/** Matiz estável (0–359) a partir do nome, para as capas genéricas não ficarem todas iguais. */
export function matizDoNome(nome: string): number {
  let h = 0
  for (const c of nome) h = (h * 31 + c.codePointAt(0)!) >>> 0
  return h % 360
}

export function capaDoSistema(id: string, nome = '', capaEnviada?: string | null): Capa {
  if (capaEnviada) return { src: capaEnviada, matiz: 0 }
  if (EM_IMAGEM[id]) return { src: `/capas/sistemas/${id}.webp`, matiz: 0, ...EM_IMAGEM[id] }
  return { src: '/capas/sistemas/autoral.svg', matiz: matizDoNome(nome || id) }
}

/** Cor de destaque do cartão de cada sistema (borda brilhante e botão “Criar ficha”), no clima da capa. */
const CORES: Record<string, string> = {
  'dnd5e-srd': '#c0263a', pf2e: '#2f6fe4', 'fate-core': '#8b5cf6', blades: '#5b5bea', brp: '#16956f', 'faroeste-arcano': '#c9822f',
  'ordem-paranormal': '#c62a32', tormenta20: '#2a74e0', livre: '#8b5cf6', 'mork-borg': '#b3223f', assimilacao: '#b02fc2',
}
export function corDoSistema(id: string, nome = ''): string {
  return CORES[id] ?? `hsl(${matizDoNome(nome || id)} 62% 52%)`
}

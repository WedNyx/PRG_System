/**
 * Notação para os dados 3D (dice-box-threejs) com o resultado JÁ sorteado pelo servidor:
 * "2d20kh1+3" com [4, 17] vira "2d20@4,17". Os dados caem exatamente nas faces sorteadas.
 * Explosões entram como dados extras; dados que o 3D não tem (ex.: d3, d1000) ficam só no cartão.
 * d100 vira dois dados, como na mesa: dezenas (00–90) + unidades (0–9). Ex.: 57 → “50” e “7”; 100 → “00” e “0”.
 */
const FACES_3D = new Set([4, 6, 8, 10, 12, 20, 100])
export const MAX_DADOS_3D = 20

type Grupo = { qtd: number; faces: number; fudge: boolean; explode: boolean; keep?: { modo: 'h' | 'l'; qtd: number }; inicio: number; usados: number }

/** Separa a expressão em grupos de dados (com a posição de cada um em `resultados`) e soma os números fixos. */
function grupos(expressao: string, resultados: number[]): { grupos: Grupo[]; modificador: number } | null {
  const termos = expressao.toLowerCase().replace(/\s+/g, '').match(/[+-]?[^+-]+/g)
  if (!termos) return null
  const out: Grupo[] = []
  let cursor = 0, modificador = 0
  for (const termo of termos) {
    const neg = termo.startsWith('-'), corpo = termo.replace(/^[+-]/, '')
    if (/^\d+$/.test(corpo)) { modificador += (neg ? -1 : 1) * parseInt(corpo, 10); continue }
    const m = corpo.match(/^(\d*)d(\d+|f)(!)?(?:r1)?(?:k([hl])(\d+))?/)
    if (!m) continue
    const qtd = parseInt(m[1] || '1', 10), fudge = m[2] === 'f', faces = fudge ? 3 : parseInt(m[2], 10), explode = !!m[3] && !fudge
    // Quantas faces sorteadas pertencem a este grupo (cada explosão acrescenta uma).
    let usados = 0
    for (let i = 0; i < qtd; i++) {
      let r = resultados[cursor + usados]; if (r === undefined) return null
      usados++
      while (explode && r === faces) { r = resultados[cursor + usados]; if (r === undefined) break; usados++ }
    }
    out.push({ qtd, faces, fudge, explode, ...(m[4] ? { keep: { modo: m[4] as 'h' | 'l', qtd: parseInt(m[5], 10) } } : {}), inicio: cursor, usados })
    cursor += usados
  }
  return { grupos: out, modificador }
}

export function notacao3D(expressao: string, resultados: number[]): string | null {
  const g = grupos(expressao, resultados)
  if (!g) return null
  const partes: string[] = [], valores: number[] = []
  for (const x of g.grupos) {
    const meus = resultados.slice(x.inicio, x.inicio + x.usados)
    if (x.faces === 100 && !x.fudge) {
      partes.push(`${meus.length}d100`, `${meus.length}d10`)
      valores.push(...meus.map(v => v >= 100 || v < 10 ? 100 : Math.floor(v / 10) * 10), ...meus.map(v => v % 10 === 0 ? 10 : v % 10))
      continue
    }
    if (!x.fudge && !FACES_3D.has(x.faces)) continue
    partes.push(`${meus.length}d${x.fudge ? 'f' : x.faces}`)
    valores.push(...meus)
  }
  if (!partes.length || valores.length > MAX_DADOS_3D) return null
  return partes.join('+') + '@' + valores.join(',')
}

/**
 * Para o cartão da rolagem: o bônus fixo da expressão (ex.: +5 em “1d20+5”) e quais dados foram
 * descartados (vantagem/desvantagem, “4d6kh3”…), para o número do dado bater com o que aparece.
 */
export function detalheDaRolagem(expressao: string, resultados: number[]): { modificador: number; descartados: Set<number> } {
  const g = grupos(expressao, resultados)
  const descartados = new Set<number>()
  if (!g) return { modificador: 0, descartados }
  for (const x of g.grupos) {
    if (!x.keep || x.explode || x.usados !== x.qtd) continue
    const idx = Array.from({ length: x.qtd }, (_, i) => x.inicio + i)
      .sort((a, b) => x.keep!.modo === 'h' ? resultados[b] - resultados[a] || a - b : resultados[a] - resultados[b] || a - b)
    idx.slice(x.keep.qtd).forEach(i => descartados.add(i))
  }
  return { modificador: g.modificador, descartados }
}

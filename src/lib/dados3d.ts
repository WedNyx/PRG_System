/**
 * Notação para os dados 3D (dice-box-threejs) com o resultado JÁ sorteado pelo servidor:
 * "2d20kh1+3" com [4, 17] vira "2d20@4,17". Os dados caem exatamente nas faces sorteadas.
 * Explosões entram como dados extras; dados que o 3D não tem (ex.: d3, d1000) ficam só no cartão.
 */
const FACES_3D = new Set([4, 6, 8, 10, 12, 20, 100])
export const MAX_DADOS_3D = 20

export function notacao3D(expressao: string, resultados: number[]): string | null {
  const termos = expressao.toLowerCase().replace(/\s+/g, '').match(/[+-]?[^+-]+/g)
  if (!termos) return null
  const grupos: string[] = [], valores: number[] = []
  let cursor = 0
  for (const termo of termos) {
    const m = termo.replace(/^[+-]/, '').match(/^(\d*)d(\d+|f)(!)?/)
    if (!m) continue
    const qtd = parseInt(m[1] || '1', 10), fudge = m[2] === 'f', faces = fudge ? 3 : parseInt(m[2], 10), explode = !!m[3] && !fudge
    // Quantas faces sorteadas pertencem a este grupo (cada explosão acrescenta uma).
    let usados = 0
    for (let i = 0; i < qtd; i++) {
      let r = resultados[cursor + usados]; if (r === undefined) return null
      usados++
      while (explode && r === faces) { r = resultados[cursor + usados]; if (r === undefined) break; usados++ }
    }
    const meus = resultados.slice(cursor, cursor + usados)
    cursor += usados
    if (!fudge && !FACES_3D.has(faces)) continue
    grupos.push(`${meus.length}d${fudge ? 'f' : faces}`)
    valores.push(...meus)
  }
  if (!grupos.length || valores.length > MAX_DADOS_3D) return null
  return grupos.join('+') + '@' + valores.join(',')
}

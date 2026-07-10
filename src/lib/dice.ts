export type ResultadoRolagem = {
  expressao: string
  resultados: number[]
  total: number
  detalhes: string
}

const MAX_DADOS = 100
const MAX_FACES = 1000

/**
 * Interpreta expressões como "2d6+3", "1d20-1" ou "1d20+2d4+5".
 * Retorna null se a expressão for inválida.
 */
export function rolarExpressao(expressao: string): ResultadoRolagem | null {
  const limpa = expressao.toLowerCase().replace(/\s+/g, '')
  if (!limpa || !/^[0-9d+\-]+$/.test(limpa)) return null

  const termos = limpa.match(/[+-]?[^+-]+/g)
  if (!termos || termos.length === 0) return null

  const resultados: number[] = []
  const partes: string[] = []
  let total = 0

  for (const termo of termos) {
    const negativo = termo.startsWith('-')
    const corpo = termo.replace(/^[+-]/, '')
    const dado = corpo.match(/^(\d*)d(\d+)$/)

    if (dado) {
      const qtd = parseInt(dado[1] || '1', 10)
      const faces = parseInt(dado[2], 10)
      if (qtd < 1 || qtd > MAX_DADOS || faces < 2 || faces > MAX_FACES) return null

      const rolls: number[] = []
      for (let i = 0; i < qtd; i++) {
        const r = Math.floor(Math.random() * faces) + 1
        rolls.push(r)
        resultados.push(r)
        total += negativo ? -r : r
      }
      partes.push(`${negativo ? '-' : ''}${qtd}d${faces} [${rolls.join(', ')}]`)
    } else if (/^\d+$/.test(corpo)) {
      const v = parseInt(corpo, 10)
      total += negativo ? -v : v
      partes.push(`${negativo ? '-' : '+'} ${v}`)
    } else {
      return null
    }
  }

  return { expressao: limpa, resultados, total, detalhes: partes.join(' ') }
}

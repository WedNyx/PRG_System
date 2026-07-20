export type ResultadoRolagem = {
  expressao: string
  resultados: number[]
  total: number
  detalhes: string
}

const MAX_DADOS = 100
const MAX_FACES = 1000
const MAX_EXPLOSOES = 20

/**
 * Interpreta expressões de dados:
 *   2d6+3          → soma simples
 *   1d20+2d4-1     → múltiplos grupos
 *   2d20kh1        → vantagem (keep highest 1)
 *   2d20kl1        → desvantagem (keep lowest 1)
 *   4d6kh3         → gera atributo (mantém os 3 maiores)
 *   1d6!           → dado explosivo (máximo rola de novo)
 * Retorna null se a expressão for inválida.
 */
export function rolarExpressao(expressao: string): ResultadoRolagem | null {
  const limpa = expressao.toLowerCase().replace(/\s+/g, '')
  if (!limpa || !/^[0-9dkhl!+\-]+$/.test(limpa)) return null

  const termos = limpa.match(/[+-]?[^+-]+/g)
  if (!termos || termos.length === 0) return null

  const resultados: number[] = []
  const partes: string[] = []
  let total = 0

  for (const termo of termos) {
    const negativo = termo.startsWith('-')
    const corpo = termo.replace(/^[+-]/, '')
    const dado = corpo.match(/^(\d*)d(\d+)(!)?(?:k([hl])(\d+))?$/)

    if (dado) {
      const qtd = parseInt(dado[1] || '1', 10)
      const faces = parseInt(dado[2], 10)
      const explosivo = dado[3] === '!'
      const keepModo = dado[4] as 'h' | 'l' | undefined
      const keepQtd = dado[5] ? parseInt(dado[5], 10) : undefined

      if (qtd < 1 || qtd > MAX_DADOS || faces < 2 || faces > MAX_FACES) return null
      if (keepQtd !== undefined && (keepQtd < 1 || keepQtd > qtd)) return null

      const rolls: number[] = []
      for (let i = 0; i < qtd; i++) {
        let r = Math.floor(Math.random() * faces) + 1
        rolls.push(r)
        // Dado explosivo: máximo rola de novo e acumula
        let explosoes = 0
        while (explosivo && r === faces && explosoes < MAX_EXPLOSOES) {
          r = Math.floor(Math.random() * faces) + 1
          rolls.push(r)
          explosoes++
        }
      }

      let usados = [...rolls]
      let descartados: number[] = []
      if (keepModo && keepQtd !== undefined && !explosivo) {
        const ordenados = [...rolls].sort((a, b) => (keepModo === 'h' ? b - a : a - b))
        usados = ordenados.slice(0, keepQtd)
        descartados = ordenados.slice(keepQtd)
      }

      for (const r of rolls) resultados.push(r)
      const soma = usados.reduce((s, r) => s + r, 0)
      total += negativo ? -soma : soma

      let det = `${negativo ? '-' : ''}${qtd}d${faces}${explosivo ? '!' : ''}`
      if (keepModo && keepQtd !== undefined) det += `k${keepModo}${keepQtd}`
      det += ` [${usados.join(', ')}${descartados.length ? ` | descartou ${descartados.join(', ')}` : ''}]`
      partes.push(det)
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

/**
 * Detecta crítico/falha crítica em uma rolagem já feita:
 * se a expressão envolve d20 e algum resultado foi 20 (crítico) ou 1 (falha).
 */
export function detectarCritico(
  expressao: string,
  resultados: number[]
): 'critico' | 'falha' | null {
  if (!/(?:^|[+\-])\d*d20(?:$|[!k+\-])?/.test(expressao.toLowerCase())) return null
  if (resultados.includes(20)) return 'critico'
  if (resultados.includes(1)) return 'falha'
  return null
}

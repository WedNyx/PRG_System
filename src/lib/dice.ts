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
 *   1d6!           → dado explosivo (máximo rola de novo e soma no mesmo dado)
 *   5d10!kh2       → rola e mantém (explodindo), estilo Roll and Keep
 *   2d6r1          → rerrola os 1 (uma vez)
 *   6d6s5          → conta sucessos (dados com 5 ou mais)
 *   4df            → dados Fate/Fudge (−1, 0 ou +1 cada)
 * Ordem dos sufixos: ! r1 kh/kl s. Retorna null se a expressão for inválida.
 */
export function rolarExpressao(expressao: string): ResultadoRolagem | null {
  const limpa = expressao.toLowerCase().replace(/\s+/g, '')
  if (!limpa || limpa.length > 80 || !/^[0-9dkhlfrs!+\-]+$/.test(limpa)) return null

  const termos = limpa.match(/[+-]?[^+-]+/g)
  if (!termos || termos.length === 0 || termos.length > 12) return null

  const resultados: number[] = []
  const partes: string[] = []
  let total = 0
  let totalDados = 0

  for (const termo of termos) {
    const negativo = termo.startsWith('-')
    const corpo = termo.replace(/^[+-]/, '')
    const dado = corpo.match(/^(\d*)d(\d+|f)(!)?(r1)?(?:k([hl])(\d+))?(?:s(\d+))?$/)

    if (dado) {
      const qtd = parseInt(dado[1] || '1', 10)
      const fudge = dado[2] === 'f'
      const faces = fudge ? 3 : parseInt(dado[2], 10)
      const explosivo = dado[3] === '!' && !fudge
      const rerrola = dado[4] === 'r1' && !fudge
      const keepModo = dado[5] as 'h' | 'l' | undefined
      const keepQtd = dado[6] ? parseInt(dado[6], 10) : undefined
      const sucesso = dado[7] ? parseInt(dado[7], 10) : undefined

      if (qtd < 1 || qtd > MAX_DADOS || faces < 2 || faces > MAX_FACES) return null
      if (keepQtd !== undefined && (keepQtd < 1 || keepQtd > qtd)) return null
      if (sucesso !== undefined && (sucesso < 1 || sucesso > faces * (explosivo ? MAX_EXPLOSOES + 1 : 1))) return null
      if ((totalDados += qtd) > MAX_DADOS) return null

      const sorteia = () => fudge ? Math.floor(Math.random() * 3) - 1 : Math.floor(Math.random() * faces) + 1
      // Cada dado vira um valor (a soma da corrente, se explodir); todas as faces sorteadas vão para `resultados`.
      const porDado: number[] = []
      for (let i = 0; i < qtd; i++) {
        let r = sorteia()
        if (rerrola && r === 1) r = sorteia()
        resultados.push(r)
        let valor = r, explosoes = 0
        while (explosivo && r === faces && explosoes < MAX_EXPLOSOES) {
          r = sorteia(); resultados.push(r); valor += r; explosoes++
        }
        porDado.push(valor)
      }

      let usados = [...porDado]
      let descartados: number[] = []
      if (keepModo && keepQtd !== undefined) {
        const ordenados = [...porDado].sort((a, b) => (keepModo === 'h' ? b - a : a - b))
        usados = ordenados.slice(0, keepQtd)
        descartados = ordenados.slice(keepQtd)
      }

      const valor = sucesso !== undefined ? usados.filter(v => v >= sucesso).length : usados.reduce((s, r) => s + r, 0)
      total += negativo ? -valor : valor

      let det = `${negativo ? '-' : ''}${qtd}d${fudge ? 'F' : faces}${explosivo ? '!' : ''}${rerrola ? 'r1' : ''}`
      if (keepModo && keepQtd !== undefined) det += `k${keepModo}${keepQtd}`
      if (sucesso !== undefined) det += `s${sucesso}`
      det += ` [${usados.join(', ')}${descartados.length ? ` | descartou ${descartados.join(', ')}` : ''}]`
      if (sucesso !== undefined) det += ` = ${valor} sucesso${valor === 1 ? '' : 's'}`
      partes.push(det)
    } else if (/^\d+$/.test(corpo)) {
      const v = parseInt(corpo, 10)
      if (v > 1_000_000) return null
      total += negativo ? -v : v
      partes.push(`${negativo ? '-' : '+'} ${v}`)
    } else {
      return null
    }
  }

  return { expressao: limpa, resultados, total, detalhes: partes.join(' ') }
}

/**
 * Monta a expressão de um teste a partir da regra do sistema, trocando VALOR pelo número do atributo/perícia.
 * Onde VALOR é a quantidade de dados (VALORd6), vale no mínimo 1 e no máximo 100.
 * Ex.: "2d20kh1+VALOR" com 3 → "2d20kh1+3"; "VALORd10!kh2" com 5 → "5d10!kh2".
 */
export function montarRolagem(formula: string, valor: number): string {
  const v = Math.round(Number.isFinite(valor) ? valor : 0)
  return formula.toUpperCase().replace(/\s+/g, '')
    .replace(/VALORD/g, Math.max(1, Math.min(MAX_DADOS, v)) + 'D')
    .replace(/VALOR/g, String(v))
    .replace(/\+-/g, '-').replace(/--/g, '+').replace(/-\+/g, '-').replace(/\+\+/g, '+')
    .replace(/^\+/, '').toLowerCase()
    // Com poucos dados, "fica com os 2 maiores" vira "fica com todos" (ex.: VALOR=1 em VALORd10kh2).
    .replace(/(\d+)d(\d+|f)(!?)(r1)?k([hl])(\d+)/g, (_m, q, f, ex, r, m, k) => `${q}d${f}${ex}${r ?? ''}k${m}${Math.min(Number(k), Number(q))}`)
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

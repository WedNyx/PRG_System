/**
 * Avaliador de fórmulas seguro (sem eval). Usado pelos modelos de sistema e,
 * no futuro, pelo construtor de sistemas autorais.
 * Suporta: números, variáveis (ids de atributos/campos), + - * / ( ),
 * e funções piso(), teto(), min(), max(), arred().
 * Ex.: "25 + TEN * 5", "piso((FOR - 10) / 2)", "10 + mod_DES"
 */
type Token = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string }

function tokenizar(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t') { i++; continue }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++
      const n = Number(src.slice(i, j)); if (!Number.isFinite(n)) throw new Error('Número inválido')
      out.push({ t: 'num', v: n }); i = j; continue
    }
    if (/[A-Za-z_À-ÿ]/.test(c)) {
      let j = i; while (j < src.length && /[A-Za-z0-9_À-ÿ]/.test(src[j])) j++
      out.push({ t: 'id', v: src.slice(i, j) }); i = j; continue
    }
    if ('+-*/(),'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue }
    throw new Error(`Caractere inválido: ${c}`)
  }
  return out
}

const FUNCOES: Record<string, (a: number[]) => number> = {
  piso: a => Math.floor(a[0]), teto: a => Math.ceil(a[0]), arred: a => Math.round(a[0]),
  min: a => Math.min(...a), max: a => Math.max(...a),
}

export type Variaveis = Record<string, number>

export function avaliar(expr: string, vars: Variaveis): number {
  if (expr.length > 1000) throw new Error('Fórmula longa demais')
  const tk = tokenizar(expr)
  let p = 0
  const espiar = () => tk[p]
  const consumir = (v?: string) => {
    const t = tk[p++]
    if (!t || (v !== undefined && !(t.t === 'op' && t.v === v))) throw new Error('Fórmula incompleta')
    return t
  }
  function soma(): number {
    let v = produto()
    while (espiar()?.t === 'op' && (espiar()!.v === '+' || espiar()!.v === '-')) v = consumir().v === '+' ? v + produto() : v - produto()
    return v
  }
  function produto(): number {
    let v = unario()
    while (espiar()?.t === 'op' && (espiar()!.v === '*' || espiar()!.v === '/')) {
      if (consumir().v === '*') v *= unario()
      else { const d = unario(); v = d === 0 ? 0 : v / d }
    }
    return v
  }
  function unario(): number {
    const t = espiar()
    if (t?.t === 'op' && t.v === '-') { p++; return -unario() }
    if (t?.t === 'op' && t.v === '+') { p++; return unario() }
    return primario()
  }
  function primario(): number {
    const t = consumir()
    if (t.t === 'num') return t.v
    if (t.t === 'op' && t.v === '(') { const v = soma(); consumir(')'); return v }
    if (t.t === 'id') {
      const nome = t.v
      if (espiar()?.t === 'op' && espiar()!.v === '(') {
        const fn = FUNCOES[nome]; if (!fn) throw new Error(`Função desconhecida: ${nome}`)
        p++; const args = [soma()]
        while (espiar()?.t === 'op' && espiar()!.v === ',') { p++; args.push(soma()) }
        consumir(')'); return fn(args)
      }
      return Number.isFinite(vars[nome]) ? vars[nome] : 0
    }
    throw new Error('Fórmula inválida')
  }
  const v = soma()
  if (p !== tk.length) throw new Error('Fórmula inválida')
  return Number.isFinite(v) ? v : 0
}

/** Avalia sem lançar erro (para a interface). */
export function avaliarSeguro(expr: string, vars: Variaveis): number | null {
  try { return avaliar(expr, vars) } catch { return null }
}

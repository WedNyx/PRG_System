// Cores que acompanham o tema (v0.32.9).
// 1) Troca classes como bg-[#201a32] / text-[#b4aeca] (família roxa/rosa) por variáveis: bg-(--s-201a32), text-(--a-b4aeca).
// 2) Gera src/app/cores.css com cada variável em oklch, girando o matiz conforme o tema e a personalização.
//    --s-*: superfícies (fundos de cartões, entradas, cabeçalhos) → seguem --cartao-giro, --cartao-sat, --cartao-luz e --cartao-alfa.
//    --a-*: destaques, bordas e textos → seguem --giro e --sat.
// Uso: node scripts/cores/gerar.mjs   (rodar de novo depois de escrever cores novas em hexadecimal)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
export function oklch(hex) {
  let h = hex.replace('#', ''); if (h.length === 3) h = [...h].map(x => x + x).join('')
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(h.slice(i, i + 2), 16)))
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : null
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180 / Math.PI) + 360) % 360, a }
}
/** Só a família roxa/rosa da plataforma gira com o tema; verdes, âmbar e vermelhos (avisos) ficam iguais. */
const giratoria = ({ H }) => H >= 255 && H <= 340
const SUPERFICIE = new Set(['bg', 'from', 'to', 'via'])

const arquivos = []
const andar = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) andar(p); else if (/\.(tsx?|jsx?)$/.test(n)) arquivos.push(p) } }
andar('src')

const CLASSE = /(?<![\w-])((?:[a-z0-9]+:)*)([a-z]+)((?:-[a-z]+)*)-\[(#[0-9a-fA-F]{3,8})\]/g
let trocas = 0
for (const f of arquivos) {
  const t = readFileSync(f, 'utf8')
  const n = t.replace(CLASSE, (tudo, variantes, base, resto, hex) => {
    const k = oklch(hex); if (!giratoria(k)) return tudo
    const tipo = SUPERFICIE.has(base) && k.L < 0.4 ? 's' : 'a'
    trocas++
    return `${variantes}${base}${resto}-(--${tipo}-${hex.slice(1).toLowerCase()})`
  })
  if (n !== t) writeFileSync(f, n)
}

// Todas as variáveis usadas no código (inclusive as de execuções anteriores).
const usadas = new Set()
for (const f of arquivos) for (const m of readFileSync(f, 'utf8').matchAll(/--([sa])-([0-9a-f]{3,8})\b/g)) usadas.add(m[1] + '-' + m[2])
const fx = n => +n.toFixed(4)
const linhas = [...usadas].sort().map(v => {
  const [tipo, hex] = v.split('-'); const { L, C, H, a } = oklch(hex)
  const alfa = a === null ? '' : ` / ${fx(a)}`
  return tipo === 's'
    ? `  --s-${hex}: oklch(clamp(0, calc(${fx(L)} + var(--cartao-luz)), 1) calc(${fx(C)} * var(--cartao-sat)) calc(${fx(H)} + var(--cartao-giro)) / calc(${a === null ? 1 : fx(a)} * var(--cartao-alfa)));`
    : `  --a-${hex}: oklch(${fx(L)} calc(${fx(C)} * var(--sat)) calc(${fx(H)} + var(--giro))${alfa});`
})
writeFileSync('src/app/cores.css', `/* Gerado por scripts/cores/gerar.mjs — não editar à mão. */
/* As cores são definidas no <html>: o tema ([data-tema]) e a personalização (style) mudam --giro, --sat e --cartao-*. */
:root {
${linhas.join('\n')}
}
`)
console.log(`${trocas} classes trocadas, ${usadas.size} variáveis em src/app/cores.css`)

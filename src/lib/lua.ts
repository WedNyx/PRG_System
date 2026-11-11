/**
 * Lua dinâmica (v0.32.1): fase da lua de verdade, calculada pela data (sem internet).
 * Ciclo sinódico médio a partir de uma lua nova conhecida; erro de poucas horas, bom para o enfeite.
 * Funções puras (lua.test.ts).
 */
export const CICLO = 29.530588853 // dias
const LUA_NOVA_REF = Date.UTC(2000, 0, 6, 18, 14) // 6/1/2000 18:14 UTC
const DIA = 86_400_000

export type Fase = { id: string; nome: string; emoji: string; frase: string }
// No Brasil (hemisfério sul) a parte acesa aparece do lado esquerdo na lua crescente.
export const FASES: Fase[] = [
  { id: 'nova', nome: 'Lua nova', emoji: '🌑', frase: 'Céu escuro: noite boa para segredos e emboscadas.' },
  { id: 'crescente', nome: 'Lua crescente', emoji: '🌘', frase: 'Um fio de luz: boa hora para começar uma aventura.' },
  { id: 'quarto-crescente', nome: 'Quarto crescente', emoji: '🌗', frase: 'Meia lua subindo: os planos começam a dar certo.' },
  { id: 'crescente-gibosa', nome: 'Crescente gibosa', emoji: '🌖', frase: 'Quase cheia: algo grande está chegando.' },
  { id: 'cheia', nome: 'Lua cheia', emoji: '🌕', frase: 'Lua cheia: cuidado com lobisomens e magias selvagens.' },
  { id: 'minguante-gibosa', nome: 'Minguante gibosa', emoji: '🌔', frase: 'A luz começa a recuar: hora de contar os espólios.' },
  { id: 'quarto-minguante', nome: 'Quarto minguante', emoji: '🌓', frase: 'Meia lua descendo: descansem antes da próxima jornada.' },
  { id: 'minguante', nome: 'Lua minguante', emoji: '🌒', frase: 'Última luz: fantasmas e lembranças andam por aí.' },
]

/** Idade da lua em dias (0 = lua nova). */
export function idadeDaLua(data: Date): number {
  const d = ((data.getTime() - LUA_NOVA_REF) / DIA) % CICLO
  return d < 0 ? d + CICLO : d
}

export type InfoLua = { idade: number; fracao: number; iluminada: number; crescendo: boolean; fase: Fase; proximaCheia: Date; proximaNova: Date
  /** As próximas 4 fases principais, em ordem de data. */
  proximas: { fase: Fase; data: Date }[] }

export function infoLua(data: Date = new Date()): InfoLua {
  const idade = idadeDaLua(data), fracao = idade / CICLO
  const iluminada = (1 - Math.cos(2 * Math.PI * fracao)) / 2
  // 8 fases; as principais (nova, quartos, cheia) valem ~1 dia em volta do momento exato.
  const marcos = [0, 0.25, 0.5, 0.75, 1]
  const perto = marcos.findIndex(m => Math.abs(fracao - m) * CICLO <= 1)
  const i = perto >= 0 ? (perto * 2) % 8 : Math.floor(fracao * 4) * 2 + 1
  const ate = (alvo: number) => new Date(data.getTime() + (((alvo - fracao + 1) % 1) || 1) * CICLO * DIA)
  const proximas = [0, 0.25, 0.5, 0.75].map(m => ({ fase: FASES[m * 8], data: ate(m) })).sort((a, b) => a.data.getTime() - b.data.getTime())
  return { idade, fracao, iluminada, crescendo: fracao < 0.5, fase: FASES[i], proximaCheia: ate(0.5), proximaNova: ate(0), proximas }
}

/**
 * Caminho SVG da parte acesa num círculo de raio r centrado em (0,0).
 * `sul` espelha como se vê no hemisfério sul (crescente acesa à esquerda).
 */
export function caminhoIluminado(fracao: number, r: number, sul = true): string {
  const k = Math.cos(2 * Math.PI * fracao)            // 1 = nova, -1 = cheia
  const rx = Math.abs(k) * r
  const direita = (fracao < 0.5) !== sul               // lado aceso
  const s = direita ? 1 : 0
  const termo = k > 0 ? 1 - s : s                       // crescente/minguante: terminador curva para o lado aceso
  const f = (n: number) => +n.toFixed(2)
  return `M0 ${f(-r)} A${f(r)} ${f(r)} 0 0 ${s} 0 ${f(r)} A${f(rx)} ${f(r)} 0 0 ${termo} 0 ${f(-r)}Z`
}

/**
 * Forja de itens: arte própria da plataforma (desenhos em SVG, sem imagens de fora) para cada item,
 * montada com forma + cor principal + cor de detalhe + raridade. Itens sem arte ganham uma forma
 * sugerida pelo tipo e pelo nome (espada, poção…). Funções puras (itensArte.test.ts).
 */
export type Raridade = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'unico'
export type ArteItem = { forma: string; cor: string; cor2: string }

export const RARIDADES: { id: Raridade; nome: string; cor: string }[] = [
  { id: 'comum', nome: 'Comum', cor: '#9ca3af' }, { id: 'incomum', nome: 'Incomum', cor: '#22c55e' },
  { id: 'raro', nome: 'Raro', cor: '#3b82f6' }, { id: 'epico', nome: 'Épico', cor: '#a855f7' },
  { id: 'lendario', nome: 'Lendário', cor: '#f59e0b' }, { id: 'unico', nome: 'Único', cor: '#ec4899' },
]
export const CORES_FORJA = ['#cbd5e1', '#a78bfa', '#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#ec4899', '#78350f', '#1f2937', '#fde68a']

const L = 'stroke="#14101f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'
const madeira = '#7c4a21'
/** Cada forma devolve o miolo de um <svg viewBox="0 0 100 100">. a = cor principal, b = cor de detalhe. */
export const FORMAS: { id: string; nome: string; categoria: 'arma' | 'armadura' | 'consumivel' | 'equipamento' | 'tesouro'; desenho: (a: string, b: string) => string }[] = [
  { id: 'espada', nome: 'Espada', categoria: 'arma', desenho: (a, b) => `<path d="M50 6 L58 20 L56 64 L44 64 L42 20 Z" fill="${a}" ${L}/><path d="M50 12 L50 60" stroke="#ffffff88" stroke-width="2"/><rect x="30" y="63" width="40" height="8" rx="3" fill="${b}" ${L}/><rect x="46" y="71" width="8" height="16" fill="${madeira}" ${L}/><circle cx="50" cy="91" r="5" fill="${b}" ${L}/>` },
  { id: 'adaga', nome: 'Adaga', categoria: 'arma', desenho: (a, b) => `<path d="M50 18 L57 30 L55 60 L45 60 L43 30 Z" fill="${a}" ${L}/><path d="M36 60 Q50 54 64 60 L62 66 Q50 61 38 66 Z" fill="${b}" ${L}/><rect x="46" y="66" width="8" height="18" rx="2" fill="${madeira}" ${L}/><path d="M44 88 L56 88 L50 94 Z" fill="${b}" ${L}/>` },
  { id: 'machado', nome: 'Machado', categoria: 'arma', desenho: (a, b) => `<rect x="46" y="10" width="8" height="84" rx="3" fill="${madeira}" ${L}/><path d="M54 16 Q86 18 88 44 Q72 40 54 46 Z" fill="${a}" ${L}/><path d="M46 16 Q20 22 18 40 Q32 38 46 42 Z" fill="${a}" ${L}/><rect x="43" y="40" width="14" height="8" rx="2" fill="${b}" ${L}/>` },
  { id: 'martelo', nome: 'Martelo', categoria: 'arma', desenho: (a, b) => `<rect x="46" y="30" width="8" height="64" rx="3" fill="${madeira}" ${L}/><rect x="22" y="10" width="56" height="26" rx="5" fill="${a}" ${L}/><rect x="44" y="12" width="12" height="22" fill="${b}" ${L}/>` },
  { id: 'lanca', nome: 'Lança', categoria: 'arma', desenho: (a, b) => `<rect x="47" y="30" width="6" height="66" rx="3" fill="${madeira}" ${L}/><path d="M50 4 L62 30 L50 38 L38 30 Z" fill="${a}" ${L}/><path d="M42 40 L58 40 L56 46 L44 46 Z" fill="${b}" ${L}/>` },
  { id: 'arco', nome: 'Arco', categoria: 'arma', desenho: (a, b) => `<path d="M34 8 Q78 50 34 92" fill="none" stroke="#14101f" stroke-width="10" stroke-linecap="round"/><path d="M34 8 Q78 50 34 92" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round"/><path d="M34 8 L34 92" stroke="#e5e7eb" stroke-width="1.5"/><rect x="50" y="44" width="10" height="12" rx="2" fill="${b}" ${L}/>` },
  { id: 'cajado', nome: 'Cajado', categoria: 'arma', desenho: (a, b) => `<path d="M48 28 L46 96" stroke="#14101f" stroke-width="9" stroke-linecap="round"/><path d="M48 28 L46 96" stroke="${madeira}" stroke-width="5" stroke-linecap="round"/><path d="M48 30 Q30 22 36 8 Q50 0 62 10 Q70 22 56 30" fill="none" stroke="${madeira}" stroke-width="5" ${L}/><circle cx="50" cy="17" r="9" fill="${a}" ${L}/><circle cx="47" cy="14" r="3" fill="#ffffffcc"/><circle cx="50" cy="17" r="15" fill="${a}33"/><rect x="43" y="36" width="10" height="6" rx="2" fill="${b}" ${L}/>` },
  { id: 'besta', nome: 'Besta', categoria: 'arma', desenho: (a, b) => `<path d="M10 31 Q50 70 90 31" fill="none" stroke="#241824" stroke-width="10" stroke-linecap="round"/><path d="M10 31 Q50 70 90 31" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round"/><path d="M10 31 L90 31" stroke="#f3e2bd" stroke-width="2"/><path d="M47 27 L60 92 L48 95 L38 32 Z" fill="${b}" ${L}/><path d="M43 49 L62 49" stroke="#ffe9b1" stroke-width="3"/><path d="M50 4 L50 68" stroke="#ddd5c8" stroke-width="3"/><path d="M50 4 L46 13 L54 13 Z" fill="#fde68a"/>` },
  { id: 'pistola', nome: 'Pistola', categoria: 'arma', desenho: (a, b) => `<path d="M8 31 L76 31 L84 43 L72 53 L47 53 L39 89 L24 85 L30 52 L8 52 Z" fill="${a}" ${L}/><path d="M28 53 L43 58 L39 84 L26 81 Z" fill="${b}" ${L}/><path d="M51 54 Q52 72 40 71" fill="none" stroke="#fde68a" stroke-width="3"/><path d="M12 37 L69 37" stroke="#fff8" stroke-width="2"/><circle cx="71" cy="44" r="3" fill="${b}"/>` },
  { id: 'rifle', nome: 'Rifle', categoria: 'arma', desenho: (a, b) => `<path d="M6 36 L62 36 L88 44 L88 54 L60 57 L45 66 L20 92 L11 78 L32 56 L6 55 Z" fill="${a}" ${L}/><path d="M17 78 L43 55 L57 58 L27 87 Z" fill="${b}" ${L}/><path d="M9 37 L69 37" stroke="#f9fafb88" stroke-width="3"/><rect x="38" y="26" width="26" height="9" rx="3" fill="${b}" ${L}/><path d="M48 58 Q53 74 37 70" stroke="#fef3c7" stroke-width="3" fill="none"/>` },
  { id: 'chicote', nome: 'Chicote', categoria: 'arma', desenho: (a, b) => `<path d="M20 79 Q14 40 36 26 Q58 11 78 25 Q98 39 76 58 Q61 70 61 49" fill="none" stroke="#15101e" stroke-width="10" stroke-linecap="round"/><path d="M20 79 Q14 40 36 26 Q58 11 78 25 Q98 39 76 58 Q61 70 61 49" fill="none" stroke="${a}" stroke-width="5" stroke-linecap="round"/><rect x="14" y="72" width="12" height="22" rx="4" fill="${b}" ${L}/><path d="M15 83 L25 83" stroke="#fef3c7" stroke-width="2"/>` },
  { id: 'tridente', nome: 'Tridente', categoria: 'arma', desenho: (a, b) => `<rect x="47" y="28" width="6" height="67" rx="3" fill="${b}" ${L}/><path d="M50 5 L56 25 L52 38 L48 38 L44 25 Z" fill="${a}" ${L}/><path d="M28 8 L38 27 L44 28 L40 41 Q25 40 25 28 Z" fill="${a}" ${L}/><path d="M72 8 L62 27 L56 28 L60 41 Q75 40 75 28 Z" fill="${a}" ${L}/><path d="M25 46 L75 46" stroke="${a}" stroke-width="5"/><circle cx="50" cy="49" r="5" fill="#fde68a"/>` },
  { id: 'mangual', nome: 'Mangual', categoria: 'arma', desenho: (a, b) => `<path d="M33 51 L47 14" stroke="#16101d" stroke-width="12" stroke-linecap="round"/><path d="M33 51 L47 14" stroke="${b}" stroke-width="7" stroke-linecap="round"/><path d="M33 51 Q44 65 53 59 Q65 56 67 68" fill="none" stroke="${a}" stroke-width="5" stroke-dasharray="6 5"/><circle cx="70" cy="76" r="17" fill="${a}" ${L}/><path d="M70 51 L75 59 L68 62 Z M88 67 L98 72 L88 77 Z M66 93 L72 101 L78 91 Z" fill="${b}" ${L}/><circle cx="66" cy="71" r="4" fill="#fff9"/>` },
  { id: 'alabarda', nome: 'Alabarda', categoria: 'arma', desenho: (a, b) => `<path d="M48 17 L52 94" stroke="#16101d" stroke-width="10" stroke-linecap="round"/><path d="M48 17 L52 94" stroke="${b}" stroke-width="6" stroke-linecap="round"/><path d="M48 8 L53 25 L50 40 L43 25 Z" fill="${a}" ${L}/><path d="M47 27 Q14 15 13 42 Q15 61 43 55 L38 43 Z" fill="${a}" ${L}/><path d="M55 29 L80 36 L59 58 Z" fill="${a}" ${L}/><path d="M22 35 Q25 31 34 33" stroke="#ffffffaa" stroke-width="2" fill="none"/>` },
  { id: 'cimitarra', nome: 'Cimitarra', categoria: 'arma', desenho: (a, b) => `<path d="M37 77 Q84 50 66 7 Q91 35 71 62 Q60 77 42 81 Z" fill="${a}" ${L}/><path d="M68 17 Q76 53 42 74" stroke="#fff8" stroke-width="2" fill="none"/><path d="M20 75 L50 75" stroke="${b}" stroke-width="8" stroke-linecap="round"/><path d="M36 77 L25 93" stroke="${b}" stroke-width="8" stroke-linecap="round"/><circle cx="24" cy="94" r="5" fill="#fbbf24" ${L}/>` },
  { id: 'foice-arma', nome: 'Foice', categoria: 'arma', desenho: (a, b) => `<path d="M51 30 L49 94" stroke="#15101e" stroke-width="12" stroke-linecap="round"/><path d="M51 30 L49 94" stroke="${b}" stroke-width="7" stroke-linecap="round"/><path d="M49 33 Q32 -1 14 17 Q8 35 21 44 Q15 25 34 30 Q46 37 49 33 Z" fill="${a}" ${L}/><path d="M16 25 Q18 17 29 19" stroke="#fff8" stroke-width="2" fill="none"/><rect x="42" y="37" width="16" height="7" rx="2" fill="${a}" ${L}/>` },
  { id: 'lamina-radiante', nome: 'Lâmina radiante', categoria: 'arma', desenho: (a, b) => `<path d="M50 6 L61 22 L56 64 L44 64 L39 22 Z" fill="${a}" opacity=".35"/><path d="M50 11 L56 25 L52 64 L48 64 L44 25 Z" fill="${a}" stroke="#fff8" stroke-width="2"/><path d="M50 10 L50 61" stroke="white" stroke-width="3"/><path d="M25 65 L75 65" stroke="${b}" stroke-width="9" stroke-linecap="round"/><path d="M50 67 L50 91" stroke="${b}" stroke-width="9" stroke-linecap="round"/><path d="M50 16 L57 29 L50 23 L43 29 Z" fill="#fff6"/><circle cx="50" cy="66" r="6" fill="#fde68a"/>` },
  { id: 'escudo', nome: 'Escudo', categoria: 'armadura', desenho: (a, b) => `<path d="M50 6 L86 18 Q86 66 50 94 Q14 66 14 18 Z" fill="${a}" ${L}/><path d="M50 18 L74 26 Q74 60 50 80 Q26 60 26 26 Z" fill="${b}" opacity=".9"/><circle cx="50" cy="46" r="8" fill="#fde68a" ${L}/>` },
  { id: 'armadura', nome: 'Armadura', categoria: 'armadura', desenho: (a, b) => `<path d="M30 14 L42 10 Q50 18 58 10 L70 14 L86 28 L78 42 L72 38 L72 88 L28 88 L28 38 L22 42 L14 28 Z" fill="${a}" ${L}/><path d="M50 22 L50 86" stroke="#14101f" stroke-width="2"/><path d="M30 56 L70 56" stroke="${b}" stroke-width="6"/><circle cx="50" cy="56" r="5" fill="#fde68a" ${L}/>` },
  { id: 'elmo', nome: 'Elmo', categoria: 'armadura', desenho: (a, b) => `<path d="M18 62 Q16 14 50 12 Q84 14 82 62 L82 86 L60 86 L60 62 L40 62 L40 86 L18 86 Z" fill="${a}" ${L}/><path d="M28 48 L72 48" stroke="#14101f" stroke-width="5"/><path d="M50 6 Q60 0 66 8 Q56 8 50 16" fill="${b}" ${L}/>` },
  { id: 'pocao', nome: 'Poção', categoria: 'consumivel', desenho: (a, b) => `<rect x="42" y="8" width="16" height="12" rx="2" fill="#c9a26b" ${L}/><path d="M42 20 L42 32 Q18 44 18 66 Q20 92 50 92 Q80 92 82 66 Q82 44 58 32 L58 20 Z" fill="#ffffff22" ${L}/><path d="M22 62 Q50 54 78 62 Q78 88 50 88 Q22 88 22 62 Z" fill="${a}"/><circle cx="36" cy="70" r="4" fill="${b}"/><circle cx="58" cy="76" r="3" fill="${b}"/><path d="M30 44 Q26 52 26 58" stroke="#ffffff99" stroke-width="3" fill="none"/>` },
  { id: 'pergaminho', nome: 'Pergaminho', categoria: 'consumivel', desenho: (a, b) => `<rect x="22" y="18" width="56" height="64" fill="#f3e3c3" ${L}/><rect x="16" y="10" width="68" height="12" rx="6" fill="#d9c09a" ${L}/><rect x="16" y="78" width="68" height="12" rx="6" fill="#d9c09a" ${L}/><path d="M32 36 L68 36 M32 48 L64 48 M32 60 L68 60" stroke="${a}" stroke-width="3"/><circle cx="66" cy="70" r="7" fill="${b}" ${L}/>` },
  { id: 'livro', nome: 'Livro', categoria: 'equipamento', desenho: (a, b) => `<rect x="20" y="10" width="60" height="80" rx="5" fill="${a}" ${L}/><rect x="28" y="18" width="44" height="64" rx="3" fill="none" stroke="${b}" stroke-width="3"/><circle cx="50" cy="50" r="11" fill="none" stroke="${b}" stroke-width="3"/><path d="M50 39 L53 47 L61 50 L53 53 L50 61 L47 53 L39 50 L47 47 Z" fill="${b}"/><rect x="74" y="44" width="10" height="12" rx="2" fill="#fde68a" ${L}/>` },
  { id: 'tocha', nome: 'Tocha', categoria: 'equipamento', desenho: (a, b) => `<path d="M44 46 L56 46 L54 94 L46 94 Z" fill="${madeira}" ${L}/><rect x="40" y="42" width="20" height="8" rx="2" fill="${b}" ${L}/><path d="M50 6 Q70 24 62 38 Q58 44 50 44 Q40 44 38 36 Q34 22 50 6 Z" fill="${a}" ${L}/><path d="M50 20 Q58 30 54 38 Q50 40 46 36 Q44 28 50 20 Z" fill="#fde68a"/>` },
  { id: 'chave', nome: 'Chave', categoria: 'equipamento', desenho: (a, b) => `<circle cx="50" cy="24" r="16" fill="${a}" ${L}/><circle cx="50" cy="24" r="7" fill="#14101f"/><rect x="46" y="38" width="8" height="52" fill="${a}" ${L}/><rect x="54" y="72" width="14" height="7" fill="${a}" ${L}/><rect x="54" y="82" width="10" height="7" fill="${a}" ${L}/><circle cx="50" cy="24" r="3" fill="${b}"/>` },
  { id: 'anel', nome: 'Anel', categoria: 'tesouro', desenho: (a, b) => `<ellipse cx="50" cy="62" rx="28" ry="24" fill="none" stroke="#14101f" stroke-width="13"/><ellipse cx="50" cy="62" rx="28" ry="24" fill="none" stroke="${a}" stroke-width="8"/><path d="M38 34 L50 18 L62 34 L50 46 Z" fill="${b}" ${L}/><path d="M44 30 L50 22 L52 30" stroke="#ffffffaa" stroke-width="2" fill="none"/>` },
  { id: 'amuleto', nome: 'Amuleto', categoria: 'tesouro', desenho: (a, b) => `<path d="M24 8 Q50 50 76 8" fill="none" stroke="#14101f" stroke-width="6"/><path d="M24 8 Q50 50 76 8" fill="none" stroke="#fde68a" stroke-width="3"/><circle cx="50" cy="62" r="24" fill="${a}" ${L}/><circle cx="50" cy="62" r="13" fill="${b}" ${L}/><circle cx="45" cy="57" r="4" fill="#ffffffaa"/>` },
  { id: 'gema', nome: 'Gema', categoria: 'tesouro', desenho: (a, b) => `<path d="M24 34 L36 16 L64 16 L76 34 L50 88 Z" fill="${a}" ${L}/><path d="M24 34 L76 34 M36 16 L44 34 L50 88 L56 34 L64 16" stroke="#14101f" stroke-width="2" fill="none"/><path d="M36 16 L44 34 L24 34 Z" fill="#ffffff55"/><circle cx="68" cy="20" r="3" fill="${b}"/>` },
  { id: 'bolsa', nome: 'Bolsa de moedas', categoria: 'tesouro', desenho: (a, b) => `<path d="M34 30 Q20 46 20 66 Q22 92 50 92 Q78 92 80 66 Q80 46 66 30 Z" fill="${a}" ${L}/><path d="M34 30 L40 14 L60 14 L66 30 Z" fill="${a}" ${L}/><path d="M32 30 L68 30" stroke="${b}" stroke-width="5"/><circle cx="50" cy="64" r="11" fill="#fbbf24" ${L}/><text x="50" y="69" text-anchor="middle" font-size="13" font-weight="900" fill="#78350f">$</text>` },
]
const NOME_PARA_FORMA: [RegExp, string][] = [
  [/sun blade|sunsword|lâmina solar|lamina solar|lightbringer|ashbringer/i, 'lamina-radiante'],
  [/besta|crossbow|starshot/i, 'besta'], [/rifle|mosquete|musket|thunderbuss/i, 'rifle'],
  [/pistola|revolver|revólver|pistol/i, 'pistola'],
  [/chicote|whip|lash/i, 'chicote'], [/tridente|trident|bident/i, 'tridente'],
  [/mangual|flail/i, 'mangual'], [/alabarda|halberd|glaive|pique|pike/i, 'alabarda'],
  [/cimitarra|scimitar|sabre/i, 'cimitarra'], [/foice|sickle|scythe/i, 'foice-arma'],
  [/adaga|punhal|faca|dagger|knife|kukri/i, 'adaga'],
  [/machad|axe|ax(e|is)/i, 'machado'], [/martelo|maça|maca|clava|marreta|hammer|mace|maul/i, 'martelo'],
  [/lança|lanca|spear|javelin|lance/i, 'lanca'],
  [/arco|bow|longbow|shortbow/i, 'arco'], [/cajado|bord[aã]o|varinha|cetro|staff|wand/i, 'cajado'], [/escudo/i, 'escudo'], [/elmo|capacete/i, 'elmo'],
  [/armadura|cota|couraça|gibão|peitoral|colete/i, 'armadura'], [/po[çc][aã]o|elixir|frasco|ant[ií]doto/i, 'pocao'], [/pergaminho|carta|mapa/i, 'pergaminho'],
  [/livro|grim[oó]rio|tomo|di[aá]rio/i, 'livro'], [/tocha|lanterna|vela/i, 'tocha'], [/chave/i, 'chave'], [/anel/i, 'anel'],
  [/amuleto|colar|talism[aã]|medalh/i, 'amuleto'], [/gema|joia|j[oó]ia|rubi|safira|esmeralda|diamante|cristal/i, 'gema'], [/moeda|bolsa|ouro|tesouro/i, 'bolsa'],
  [/espada|l[aâ]mina|sabre|katana|rapieira|cimitarra/i, 'espada'],
]
const POR_CATEGORIA: Record<string, string> = { arma: 'espada', armadura: 'armadura', consumivel: 'pocao', equipamento: 'livro', tesouro: 'gema', outro: 'bolsa' }
const COR_POR_FORMA: Record<string, [string, string]> = {
  espada: ['#cbd5e1', '#a78bfa'], adaga: ['#cbd5e1', '#ef4444'], machado: ['#cbd5e1', '#78350f'], martelo: ['#94a3b8', '#f59e0b'], lanca: ['#cbd5e1', '#10b981'],
  besta: ['#9ca3af', '#b45309'], pistola: ['#cbd5e1', '#9d7447'], rifle: ['#94a3b8', '#a16207'],
  chicote: ['#b45309', '#eab308'], tridente: ['#a5f3fc', '#b45309'], mangual: ['#cbd5e1', '#a78bfa'],
  alabarda: ['#cbd5e1', '#d97706'], cimitarra: ['#e2e8f0', '#f59e0b'],
  'foice-arma': ['#cbd5e1', '#854d0e'], 'lamina-radiante': ['#fde68a', '#fbbf24'],
  arco: ['#a16207', '#38bdf8'], cajado: ['#a78bfa', '#f59e0b'], escudo: ['#38bdf8', '#cbd5e1'], armadura: ['#94a3b8', '#ef4444'], elmo: ['#94a3b8', '#ef4444'],
  pocao: ['#ef4444', '#fde68a'], pergaminho: ['#78350f', '#ef4444'], livro: ['#78350f', '#fde68a'], tocha: ['#f59e0b', '#94a3b8'], chave: ['#fbbf24', '#38bdf8'],
  anel: ['#fbbf24', '#ec4899'], amuleto: ['#fbbf24', '#38bdf8'], gema: ['#10b981', '#ffffff'], bolsa: ['#a16207', '#fbbf24'],
}
export const formaPorId = (id: string) => FORMAS.find(f => f.id === id) ?? FORMAS[0]
const HEX = /^#[0-9a-f]{6}$/i

/** Arte do item: a escolhida na forja, ou uma sugerida pelo nome e pelo tipo. */
export function arteDoItem(it: { nome: string; categoria: string; arte?: unknown }): ArteItem {
  const a = lerArte(it.arte)
  if (a) return a
  const forma = NOME_PARA_FORMA.find(([re]) => re.test(it.nome))?.[1] ?? POR_CATEGORIA[it.categoria] ?? 'bolsa'
  const [cor, cor2] = COR_POR_FORMA[forma] ?? ['#cbd5e1', '#a78bfa']
  return { forma, cor, cor2 }
}
export function lerArte(v: unknown): ArteItem | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.forma !== 'string' || !FORMAS.some(f => f.id === o.forma)) return null
  return { forma: o.forma, cor: typeof o.cor === 'string' && HEX.test(o.cor) ? o.cor : '#cbd5e1', cor2: typeof o.cor2 === 'string' && HEX.test(o.cor2) ? o.cor2 : '#a78bfa' }
}
export const lerRaridade = (v: unknown): Raridade | undefined => RARIDADES.some(r => r.id === v) ? v as Raridade : undefined
export const corDaRaridade = (r?: Raridade) => RARIDADES.find(x => x.id === r)?.cor ?? '#5e4b78'

/** Nome aleatório no estilo “Lâmina do Crepúsculo” para quem quer inspiração. */
export function nomeAleatorio(forma: string, sorte: () => number = Math.random): string {
  const pega = <T,>(l: T[]) => l[Math.floor(sorte() * l.length)]
  const base: Record<string, string[]> = {
    besta: ['Besta', 'Dardo', 'Olho'], pistola: ['Pistola', 'Disparo'], rifle: ['Rifle', 'Trovão'],
    chicote: ['Chicote', 'Laço'], tridente: ['Tridente', 'Maré'], mangual: ['Mangual', 'Flagelo'],
    alabarda: ['Alabarda', 'Lança'], cimitarra: ['Cimitarra', 'Lâmina'],
    'foice-arma': ['Foice', 'Colheita'], 'lamina-radiante': ['Lâmina solar', 'Raio'],
    espada: ['Lâmina', 'Espada', 'Fio'], adaga: ['Presa', 'Adaga', 'Ferrão'], machado: ['Machado', 'Fende-Ossos'], martelo: ['Martelo', 'Malho'],
    lanca: ['Lança', 'Ponta'], arco: ['Arco', 'Corda'], cajado: ['Cajado', 'Bordão'], escudo: ['Escudo', 'Égide', 'Muralha'], armadura: ['Couraça', 'Armadura'],
    elmo: ['Elmo', 'Coroa de Ferro'], pocao: ['Poção', 'Elixir', 'Tônico'], pergaminho: ['Pergaminho', 'Selo'], livro: ['Tomo', 'Grimório', 'Diário'],
    tocha: ['Tocha', 'Chama'], chave: ['Chave', 'Segredo'], anel: ['Anel', 'Aliança'], amuleto: ['Amuleto', 'Talismã'], gema: ['Gema', 'Coração', 'Lágrima'], bolsa: ['Bolsa', 'Tesouro'],
  }
  const de = ['do Crepúsculo', 'da Lua Torta', 'das Cinzas', 'do Rei Esquecido', 'da Aurora', 'do Abismo', 'das Estrelas', 'do Lobo Branco', 'da Tempestade', 'do Último Juramento', 'da Névoa', 'do Dragão Adormecido']
  return `${pega(base[forma] ?? ['Relíquia'])} ${pega(de)}`
}

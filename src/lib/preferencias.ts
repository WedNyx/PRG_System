/**
 * Preferências de jogo e de avisos (v0.36.5, Perfil › Jogabilidade e Notificações).
 * Valem para este aparelho (ficam no navegador): cada pessoa escolhe como quer ouvir e ver a mesa onde estiver jogando.
 */
import { useSyncExternalStore } from 'react'

export type Preferencias = {
  /** Dados 3D caindo na tela ao rolar (desligado: aparece só o cartão com o resultado). */
  dados3d: boolean
  /** Barulho dos dados e fanfarra do crítico. */
  somDados: boolean
  /** Confetes no crítico. */
  confetes: boolean
  /** Ouvir os efeitos e ambientes que o mestre toca na Mesa de Som. */
  sonsMesa: boolean
  /** Volume dos efeitos da Mesa de Som (0–1), só para você. */
  volumeSons: number
  /** Sons de susto (grito, explosão, rugido…). Desligado: esses não tocam para você. */
  sonsRepentinos: boolean
  /** Balão rápido quando chega um aviso no sininho. */
  baloesAvisos: boolean
  /** Na mesa, abrir o chat sozinho no computador. */
  chatAbertoPc: boolean
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  dados3d: true, somDados: true, confetes: true, sonsMesa: true, volumeSons: 0.8, sonsRepentinos: true, baloesAvisos: true, chatAbertoPc: true,
}

const CHAVE = 'prg-preferencias-v1'
const ouvintes = new Set<() => void>()
let cache: Preferencias | null = null

/** Confere o que veio guardado: campos inválidos voltam ao padrão. */
export function limparPreferencias(v: unknown): Preferencias {
  const r = { ...PREFERENCIAS_PADRAO }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return r
  const o = v as Record<string, unknown>
  for (const k of ['dados3d', 'somDados', 'confetes', 'sonsMesa', 'sonsRepentinos', 'baloesAvisos', 'chatAbertoPc'] as const) if (typeof o[k] === 'boolean') r[k] = o[k] as boolean
  if (typeof o.volumeSons === 'number' && Number.isFinite(o.volumeSons)) r.volumeSons = Math.min(1, Math.max(0, Math.round(o.volumeSons * 100) / 100))
  return r
}

export function lerPreferencias(): Preferencias {
  if (cache) return cache
  if (typeof window === 'undefined') return PREFERENCIAS_PADRAO
  try { cache = limparPreferencias(JSON.parse(localStorage.getItem(CHAVE) || 'null')) } catch { cache = { ...PREFERENCIAS_PADRAO } }
  return cache
}

export function mudarPreferencias(p: Partial<Preferencias>) {
  cache = limparPreferencias({ ...lerPreferencias(), ...p })
  try { localStorage.setItem(CHAVE, JSON.stringify(cache)) } catch { /* navegador sem espaço: vale só nesta aba */ }
  ouvintes.forEach(f => f())
}

function assinar(f: () => void) {
  ouvintes.add(f)
  const outraAba = (e: StorageEvent) => { if (e.key === CHAVE) { cache = null; f() } }
  window.addEventListener('storage', outraAba)
  return () => { ouvintes.delete(f); window.removeEventListener('storage', outraAba) }
}

/** As preferências atuais (atualiza quando mudam, inclusive em outra aba). */
export function usePreferencias(): Preferencias {
  return useSyncExternalStore(assinar, lerPreferencias, () => PREFERENCIAS_PADRAO)
}

/** Movimento reduzido: escolha do perfil (Aparência) ou do sistema do aparelho. */
export function movimentoReduzido(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.dataset.movimento === 'reduzido' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

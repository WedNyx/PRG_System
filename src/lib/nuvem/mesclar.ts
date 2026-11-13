/**
 * Junta mudanças feitas ao mesmo tempo na mesma ficha (v0.33.8). Ex.: a mesa tirou vida enquanto o jogador
 * adicionava um item — antes, o salvamento do jogador dava “alterada em outro aparelho” e o item sumia.
 *
 * base = como a ficha estava quando eu comecei a mexer; minha = como eu deixei; servidor = como está agora no banco.
 * Vale o que EU mudei (por campo, e um nível dentro de objetos como recursos/atributos/uso); o resto vem do servidor.
 */
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export function mesclarFicha<T extends Record<string, unknown>>(base: T, minha: T, servidor: T): T {
  const out: Record<string, unknown> = { ...servidor }
  for (const k of new Set([...Object.keys(base), ...Object.keys(minha)])) {
    const b = base[k], m = minha[k], s = servidor[k]
    if (igual(b, m)) continue // eu não mexi: fica o do servidor
    if (objeto(b) && objeto(m) && objeto(s)) {
      const sub: Record<string, unknown> = { ...s }
      for (const j of new Set([...Object.keys(b), ...Object.keys(m)])) {
        if (igual(b[j], m[j])) continue
        if (m[j] === undefined) delete sub[j]; else sub[j] = m[j]
      }
      out[k] = sub
    } else if (m === undefined) delete out[k]
    else out[k] = m
  }
  return out as T
}

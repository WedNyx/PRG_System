/**
 * Ordem do combate (v0.33.8): mexer na iniciativa no meio da luta sem perder de quem é a vez.
 * Todas as funções devolvem a lista nova e o índice do turno, que continua apontando para quem estava jogando.
 */
export type Entrada = { id: string; nome: string; valor: number; tokenId?: string | null }
type Ordem = { lista: Entrada[]; turno: number }

const manterVez = (lista: Entrada[], idDaVez: string | undefined, turnoAntigo: number): number => {
  const i = idDaVez ? lista.findIndex(x => x.id === idDaVez) : -1
  return i >= 0 ? i : Math.max(0, Math.min(turnoAntigo, lista.length - 1))
}

/** Alguém entra no combate já começado: vai para a posição do valor (depois dos empates), e a vez não muda. */
export function entrarNaOrdem(lista: Entrada[], nova: Entrada, turno: number): Ordem {
  const daVez = lista[turno]?.id
  let i = lista.findIndex(x => x.valor < nova.valor)
  if (i < 0) i = lista.length
  const l = [...lista.slice(0, i), nova, ...lista.slice(i)]
  return { lista: l, turno: lista.length ? manterVez(l, daVez, turno) : 0 }
}

/** Sobe (-1) ou desce (+1) uma posição (para desempatar ou corrigir a ordem). */
export function moverNaOrdem(lista: Entrada[], id: string, direcao: -1 | 1, turno: number): Ordem {
  const i = lista.findIndex(x => x.id === id), j = i + direcao
  if (i < 0 || j < 0 || j >= lista.length) return { lista, turno }
  const daVez = lista[turno]?.id, l = [...lista];
  [l[i], l[j]] = [l[j], l[i]]
  return { lista: l, turno: manterVez(l, daVez, turno) }
}

/** Muda o valor de alguém e reordena (empates mantêm a ordem atual); a vez não muda. */
export function mudarValor(lista: Entrada[], id: string, valor: number, turno: number): Ordem {
  const daVez = lista[turno]?.id
  const l = lista.map((x, k) => ({ x: x.id === id ? { ...x, valor } : x, k })).sort((a, b) => b.x.valor - a.x.valor || a.k - b.k).map(y => y.x)
  return { lista: l, turno: manterVez(l, daVez, turno) }
}

/** Sai do combate: se era a vez dele, a vez vai para o próximo. */
export function sairDaOrdem(lista: Entrada[], id: string, turno: number): Ordem {
  const i = lista.findIndex(x => x.id === id)
  if (i < 0) return { lista, turno }
  const l = lista.filter(x => x.id !== id)
  if (!l.length) return { lista: l, turno: 0 }
  if (i < turno) return { lista: l, turno: turno - 1 }
  return { lista: l, turno: turno % l.length }
}

/** Adiar: quem está na vez troca de lugar com o próximo (o próximo joga agora, e ele logo depois). */
export function adiarNaOrdem(lista: Entrada[], turno: number): Ordem & { adiou: Entrada | null } {
  if (lista.length < 2 || turno >= lista.length - 1) return { lista, turno, adiou: null }
  const l = [...lista];
  [l[turno], l[turno + 1]] = [l[turno + 1], l[turno]]
  return { lista: l, turno, adiou: lista[turno] }
}

/** Empates: ids que têm o mesmo valor de outro (a mesa mostra ↑↓ para desempatar). */
export function empatados(lista: Entrada[]): Set<string> {
  const conta = new Map<number, number>()
  for (const x of lista) conta.set(x.valor, (conta.get(x.valor) ?? 0) + 1)
  return new Set(lista.filter(x => (conta.get(x.valor) ?? 0) > 1).map(x => x.id))
}

export const MOLDURAS = [
  { id: 'nenhuma', nome: 'Nenhuma', emoji: '⚪' },
  { id: 'dourada', nome: 'Dourada', emoji: '✨' },
  { id: 'arcana', nome: 'Arcana', emoji: '🔮' },
  { id: 'gelo', nome: 'Gelo', emoji: '❄️' },
  { id: 'chamas', nome: 'Chamas', emoji: '🔥' },
  { id: 'dragao', nome: 'Dragão', emoji: '🐉' },
] as const

export type MolduraId = (typeof MOLDURAS)[number]['id']

function ehMolduraValida(v: string | null | undefined): v is MolduraId {
  return !!v && MOLDURAS.some((m) => m.id === v)
}

/**
 * Anel decorativo animado — use como irmão de um avatar circular dentro
 * de um container `relative` do mesmo tamanho (ex: `<div className="relative w-16 h-16">`).
 */
export function MolduraRing({ moldura }: { moldura?: string | null }) {
  const m = ehMolduraValida(moldura) ? moldura : 'nenhuma'
  if (m === 'nenhuma') return null
  return (
    <>
      <div className={`moldura-anel moldura-${m}`} aria-hidden />
      {m === 'dragao' && (
        <span className="moldura-dragao-badge" aria-hidden>
          🐉
        </span>
      )}
    </>
  )
}

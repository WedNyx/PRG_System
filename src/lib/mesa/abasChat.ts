/** Abas do chat da mesa (v0.34.9). Sem dependências de tela: testado em abasChat.test.ts. */
export type EventoChat = { id: number; tipo: 'chat' | 'rolagem' | 'sistema' | 'ataque'; autor_id: string | null; texto: string | null }

/** Em que aba do chat o evento aparece (v0.34.9): conversa, dados, combate ou mestre. */
export type AbaChat = 'conversa' | 'dados' | 'combate' | 'mestre'
const INICIO_COMBATE = /^⚔️ O combate começou/, FIM_COMBATE = /^🏳️ Fim do combate/, SESSAO = /^(🟢|🔴) O mestre/
/**
 * Combate: ataques, e tudo o que aconteceu entre “O combate começou” e “Fim do combate” (rolagens, turnos, dano).
 * Mestre: rolagens, tabelas e avisos do mestre fora do combate. Dados: o resto (rolagens dos jogadores, abrir/fechar sessão).
 */
export function separarEventos(eventos: EventoChat[], papelDe: Record<string, string>, combateAgora: boolean): Map<number, AbaChat> {
  const out = new Map<number, AbaChat>()
  let emCombate = combateAgora
  for (let i = eventos.length - 1; i >= 0; i--) {
    const ev = eventos[i]
    const fim = ev.tipo === 'sistema' && FIM_COMBATE.test(ev.texto ?? ''), ini = ev.tipo === 'sistema' && INICIO_COMBATE.test(ev.texto ?? '')
    if (fim) emCombate = true
    const papel = papelDe[ev.autor_id ?? '']
    out.set(ev.id, ev.tipo === 'chat' ? 'conversa' : ev.tipo === 'ataque' || emCombate ? 'combate'
      : (papel === 'mestre' || papel === 'comestre') && !SESSAO.test(ev.texto ?? '') ? 'mestre' : 'dados')
    if (ini) emCombate = false
  }
  return out
}


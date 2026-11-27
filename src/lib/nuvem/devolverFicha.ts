// Somente servidor.
import { q, rest, type FichaRow } from './servidor'

/**
 * Tira uma ficha de jogador da campanha (v0.37.0) sem perder nada:
 * - cópia enviada que ainda não foi mexida (aguardando, recusada ou nunca salva) e cuja original existe → a cópia some,
 *   porque a original continua nas fichas avulsas do jogador (evita personagem repetido);
 * - o resto volta como ficha avulsa, com “(de <campanha>)” no nome.
 * Usado pelo mestre (“Tirar da campanha”), pelo próprio jogador (“Desvincular”) e ao sair/ser removido da campanha.
 */
export async function devolverFicha(f: FichaRow, nomeCampanha: string): Promise<'removida' | 'devolvida'> {
  if (f.origem_id && (f.status === 'pendente' || f.status === 'recusada' || f.versao <= 1)) {
    const [orig] = await rest<{ id: string }[]>(`prg_fichas?select=id&id=eq.${q(f.origem_id)}&dono_id=eq.${q(f.dono_id)}&limit=1`)
    if (orig) {
      await rest(`prg_tokens?ficha_id=eq.${q(f.id)}`, { method: 'PATCH', body: JSON.stringify({ ficha_id: null }) })
      await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'DELETE' })
      return 'removida'
    }
  }
  await rest(`prg_alteracoes?ficha_id=eq.${q(f.id)}&estado=eq.pendente`, { method: 'DELETE' })
  await rest(`prg_tokens?ficha_id=eq.${q(f.id)}`, { method: 'PATCH', body: JSON.stringify({ ficha_id: null }) })
  await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'PATCH', body: JSON.stringify({
    campanha_id: null, status: 'ativa', bloqueada: false, areas_bloqueadas: [], observacao_mestre: '', oculta: false,
    nome: `${f.nome || 'Personagem'} (de ${nomeCampanha})`.slice(0, 90),
  }) })
  return 'devolvida'
}

/** Todas as fichas de jogador de alguém numa campanha (ao sair ou ser removido). NPCs ficam com o mestre. */
export async function devolverFichasDe(campanhaId: string, donoId: string, nomeCampanha: string) {
  const fichas = await rest<FichaRow[]>(`prg_fichas?select=*&campanha_id=eq.${q(campanhaId)}&dono_id=eq.${q(donoId)}&npc=eq.false`)
  let devolvidas = 0
  for (const f of fichas) if (await devolverFicha(f, nomeCampanha) === 'devolvida') devolvidas++
  return devolvidas
}

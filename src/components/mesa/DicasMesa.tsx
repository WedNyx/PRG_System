'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CHAVE_VISITOU_MESA } from '@/components/central/ComecePorAqui'

export type PapelDicas = 'mestre' | 'jogador' | 'espectador'
type Dica = { icone: string; titulo: string; texto: string }

const DICAS: Record<PapelDicas, Dica[]> = {
  jogador: [
    { icone: '👆', titulo: 'Seu personagem', texto: 'Toque no seu token no mapa para ver a vida, as condições e o botão de atacar. Arraste (ou toque e depois toque na casa) para andar.' },
    { icone: '⚔️', titulo: 'Atacar', texto: 'Toque no seu token → “Atacar” → escolha a arma ou o poder → toque no inimigo. Os dados rolam no servidor e o dano aparece para todo mundo.' },
    { icone: '⏳', titulo: 'Turnos', texto: 'No combate, quando for a sua vez aparece “⚔️ Sua vez”. Quando terminar, toque em “✅ Terminar meu turno”.' },
    { icone: '💬', titulo: 'Painel', texto: 'No painel ficam o Chat (com dados: 1d20+5, 2d6…), a sua Ficha e a Iniciativa. “Só o mapa” esconde o painel no celular.' },
  ],
  mestre: [
    { icone: '🗺️', titulo: 'Cena e mapa', texto: 'Na aba “Mestre → Controles”, crie a cena, envie o mapa e use a névoa para esconder o que os jogadores ainda não viram.' },
    { icone: '📜', titulo: 'Personagens na mesa', texto: 'Na aba “Jogo → Fichas”, toque numa ficha e em “📍 Colocar na mesa”. NPCs entram do mesmo jeito.' },
    { icone: '⚔️', titulo: 'Combate', texto: 'Na aba “Jogo → Iniciativa”, toque em “Preparar combate”, marque quem luta e role tudo de uma vez. Em “Mestre → Regras de combate” você escolhe se confirma cada dano.' },
    { icone: '🎲', titulo: 'Tabelas e sessão', texto: 'A aba “Mestre → Tabelas” rola nomes, encontros e tesouros na hora. Lembre de “▶ Abrir sessão” para o grupo entrar.' },
  ],
  espectador: [
    { icone: '👁️', titulo: 'Assistindo', texto: 'Você vê o mapa, ouve a música e conversa no chat. Os dados e os tokens ficam com o mestre e os jogadores.' },
  ],
}
const chave = (p: PapelDicas) => 'prg-dicas-mesa-v1-' + p

/** Dicas rápidas na primeira vez que a pessoa entra na mesa (dá para rever pelo botão “❔ Dicas”). */
export default function DicasMesa({ papel, aberto, fechar }: { papel: PapelDicas; aberto: boolean; fechar: () => void }) {
  const [i, setI] = useState(0)
  const lista = DICAS[papel]
  useEffect(() => { try { localStorage.setItem(CHAVE_VISITOU_MESA, '1') } catch {} }, [])
  if (!aberto) return null
  const d = lista[Math.min(i, lista.length - 1)]
  const terminar = () => { try { localStorage.setItem(chave(papel), '1') } catch {} ; setI(0); fechar() }
  return <div role="dialog" aria-modal="false" aria-labelledby="dica-titulo" className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-[#b99bff] bg-[#1d1730]/97 p-4 text-[#f2ebff] shadow-2xl backdrop-blur sm:bottom-6">
    <div className="flex items-start gap-3">
      <span className="text-3xl" aria-hidden>{d.icone}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-widest text-[#d3adf0]">Dica {i + 1} de {lista.length}</p>
        <h2 id="dica-titulo" className="font-bold">{d.titulo}</h2>
        <p className="mt-1 text-sm text-[#d6c8e8]">{d.texto}</p>
      </div>
      <button type="button" onClick={terminar} aria-label="Fechar dicas" className="rounded-lg p-1 text-[#b4aeca] hover:bg-white/10"><X size={18} /></button>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <div className="flex flex-1 gap-1" aria-hidden>{lista.map((_, k) => <span key={k} className={'h-1.5 flex-1 rounded-full ' + (k <= i ? 'bg-[#b99bff]' : 'bg-[#3b3054]')} />)}</div>
      {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="inline-flex items-center rounded-lg border border-[#5e4b78] px-2 py-1 text-xs" aria-label="Dica anterior"><ChevronLeft size={14} /></button>}
      {i < lista.length - 1
        ? <button type="button" onClick={() => setI(i + 1)} className="inline-flex items-center gap-1 rounded-lg bg-[#7652ac] px-3 py-1 text-xs font-semibold">Próxima <ChevronRight size={14} /></button>
        : <button type="button" onClick={terminar} className="rounded-lg bg-[#7652ac] px-3 py-1 text-xs font-semibold">Entendi!</button>}
    </div>
  </div>
}

/** A pessoa ainda não viu as dicas deste papel? */
export function deveMostrarDicas(papel: PapelDicas): boolean {
  try { return localStorage.getItem(chave(papel)) !== '1' } catch { return false }
}

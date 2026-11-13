'use client'

import type { DadosFicha } from '@/lib/sistemas/tipos'
import { etapasCriacaoDnd2024 } from '@/lib/sistemas/guiaCriacaoDnd2024'

const ESTADO = {
  registrado: { texto: 'Registrado · conferir regras', estilo: 'text-emerald-200 border-emerald-500/40' },
  pendente: { texto: 'Pendente', estilo: 'text-amber-200 border-amber-500/40' },
  revisar: { texto: 'Revisão do mestre', estilo: 'text-violet-200 border-violet-500/40' },
  'nao-aplica': { texto: 'Não se aplica agora', estilo: 'text-(--a-a998bd) border-(--a-4a3d63)' },
} as const

/** Checklist reativo à ficha: não concede habilidades nem altera regras. */
export default function GuiaCriacaoDnd2024({ dados, irPara }: { dados: DadosFicha; irPara?: (aba: string) => void }) {
  const etapas = etapasCriacaoDnd2024(dados)
  const pendentes = etapas.filter(e => e.estado === 'pendente').length
  return <section aria-label="Acompanhamento da criação D&D 2024" className="space-y-3 rounded-xl border border-(--a-62527e) bg-(--s-171325) p-3">
    <h3 className="font-semibold text-(--a-ed9cd8)">Criação acompanhada — D&D 2024</h3>
    <p className="text-xs text-(--a-cfc0df)">O guia mostra quais campos foram registrados e o que precisa de conferência. Não substitui o SRD nem aprova a ficha sozinho.</p>
    {pendentes > 0 && <p className="text-sm text-amber-200">{pendentes} etapa(s) ainda com informações pendentes.</p>}
    <ol className="space-y-2">
      {etapas.map(etapa => {
        const status = ESTADO[etapa.estado]
        return <li key={etapa.id} className="rounded-lg border border-(--a-3d3152) p-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="flex-1">{etapa.titulo}</strong>
            <span className={'rounded-full border px-2 py-0.5 text-[11px] ' + status.estilo}>{status.texto}</span>
          </div>
          <p className="mt-1 text-xs text-(--a-cfc0df)">{etapa.descricao}</p>
          {irPara && <button type="button" onClick={() => irPara(etapa.aba)}
            className="mt-2 rounded-md border border-(--a-62527e) px-2 py-1 text-xs hover:bg-(--s-38294d)">Abrir seção da ficha</button>}
        </li>
      })}
    </ol>
    <p className="text-xs text-(--a-a998bd)">Referência: SRD 5.2.1 (CC BY 4.0). Opções de livros comerciais exigem consulta à obra original.</p>
  </section>
}

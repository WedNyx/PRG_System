'use client'

/**
 * Ficha inteira dentro da mesa (v0.33.8): a mesma página da ficha, aberta ao lado do mapa (no celular, por cima).
 * Rolagens vão para o chat da mesa e aparecem no meio da tela; o que mudar salva como na ficha normal.
 */
import { forwardRef, useState } from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'

type Ficha = { id: string; nome: string; dono_id: string; npc: boolean }

const FichaNaMesa = forwardRef<HTMLIFrameElement, { fichas: Ficha[]; aberta: string; trocar: (id: string) => void; fechar: () => void }>(function FichaNaMesa({ fichas, aberta, trocar, fechar }, ref) {
  const [carregada, setCarregada] = useState<string | null>(null)
  const atual = fichas.find(f => f.id === aberta)
  return <aside role="dialog" aria-label={'Ficha: ' + (atual?.nome || 'personagem')} onKeyDown={e => { if (e.key === 'Escape') fechar() }}
    className="fixed inset-x-0 bottom-0 top-12 z-[60] flex flex-col border-l border-(--a-55456e) bg-(--s-14121f) shadow-2xl lg:left-auto lg:w-[560px]">
    <div className="flex shrink-0 items-center gap-2 border-b border-(--a-373251) bg-(--s-17142a) px-2 py-1.5">
      {fichas.length > 1 ? <select aria-label="Qual ficha" value={aberta} onChange={x => trocar(x.target.value)} className="min-w-0 flex-1 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1.5 text-sm text-white">
        {fichas.map(f => <option key={f.id} value={f.id}>{f.npc ? '👹 ' : '🛡️ '}{f.nome || 'Sem nome'}</option>)}</select>
        : <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">📜 {atual?.nome || 'Ficha'}</p>}
      <a href={'/ficha?nuvem=' + aberta} target="_blank" rel="noopener" className="rounded-lg p-1.5 text-(--a-b99bff) hover:bg-(--s-34294f)" title="Abrir em outra aba" aria-label="Abrir a ficha em outra aba"><ExternalLink size={16} /></a>
      <button type="button" onClick={fechar} aria-label="Fechar a ficha" className="rounded-lg p-1.5 hover:bg-(--s-34294f)"><X size={18} /></button>
    </div>
    <div className="relative min-h-0 flex-1">
      {carregada !== aberta && <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-(--a-b4aeca)"><Loader2 className="animate-spin" size={16} /> Abrindo a ficha…</p>}
      <iframe ref={ref} key={aberta} src={`/ficha?nuvem=${aberta}&mesa=1`} title={'Ficha de ' + (atual?.nome || 'personagem')} onLoad={() => setCarregada(aberta)}
        className={'h-full w-full border-0 ' + (carregada === aberta ? '' : 'opacity-0')} />
    </div>
  </aside>
})
export default FichaNaMesa

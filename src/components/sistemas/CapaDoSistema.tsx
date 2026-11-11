'use client'

import { useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { enviarImagemNuvem, ErroNuvem } from '@/lib/nuvem/cliente'
import { capaDoSistema } from '@/lib/sistemas/capas'

/** Imagem da capa (com o matiz das capas genéricas). */
export function ImagemCapa({ id, nome, capa, className = '' }: { id: string; nome: string; capa?: string | null; className?: string }) {
  const c = capaDoSistema(id, nome, capa)
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={c.src} alt="" loading="lazy" draggable={false} className={'h-full w-full object-cover ' + className} style={c.matiz ? { filter: `hue-rotate(${c.matiz}deg)` } : undefined} />
}

/** No construtor: o autor envia (ou tira) a capa do sistema autoral. */
export function CapaDoSistema({ nome, capa, mudar }: { nome: string; capa?: string; mudar: (capa: string | undefined) => void }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  async function enviar(f: File) {
    setOcupado(true); setErro('')
    try { mudar(await enviarImagemNuvem('imagens', f, 1600)) } catch (e) { setErro(e instanceof ErroNuvem ? e.message : 'Falha ao enviar a imagem.') } finally { setOcupado(false) }
  }
  return <div>
    <p className="text-sm">Capa do sistema</p>
    <div className="relative mt-1 aspect-[16/7] overflow-hidden rounded-xl border border-(--a-5e4b78) bg-(--s-151123)">
      <ImagemCapa id="autoral" nome={nome || 'Sistema'} capa={capa} />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-sm font-bold">{nome || 'Nome do sistema'}</span>
      <div className="absolute right-2 top-2 flex gap-1.5">
        <label className={'inline-flex cursor-pointer items-center gap-1 rounded-lg bg-black/65 px-2.5 py-1.5 text-xs font-semibold backdrop-blur hover:bg-black/80 ' + (ocupado ? 'pointer-events-none opacity-60' : '')}>
          {ocupado ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {capa ? 'Trocar' : 'Enviar capa'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar(f) }} /></label>
        {capa && <button type="button" onClick={() => mudar(undefined)} className="rounded-lg bg-black/65 px-2.5 py-1.5 text-xs backdrop-blur hover:bg-black/80">Tirar</button>}
      </div>
    </div>
    <p className="mt-1 text-xs text-(--a-b4aeca)">{capa ? 'Aparece no cartão do sistema.' : 'Sem imagem, o sistema usa uma capa de constelação com uma cor só dele.'} Use uma imagem sua (sem arte de livros ou de outras pessoas).</p>
    {erro && <p role="alert" className="mt-1 text-xs text-red-200">{erro}</p>}
  </div>
}

'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'

type Perfil = { id: string; apelido: string; avatar?: string | null }
const CROP = 256, SAIDA = 320

/** Janela para o aventureiro mudar o próprio nome e foto (salva na nuvem). */
export default function EditarPerfil({ perfil, fechar, salvo }: { perfil: Perfil; fechar: () => void; salvo: (p: Perfil) => void }) {
  const [apelido, setApelido] = useState(perfil.apelido)
  const [avatar, setAvatar] = useState<string | null>(perfil.avatar ?? null)
  const [crop, setCrop] = useState<string | null>(null)
  const [tam, setTam] = useState({ w: 1, h: 1 })
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const arrasto = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const arquivo = useRef<HTMLInputElement>(null)

  const escala = (z = zoom) => Math.max(CROP / tam.w, CROP / tam.h) * z
  const limitar = (x: number, y: number, z = zoom) => {
    const mx = Math.max(0, (tam.w * escala(z) - CROP) / 2), my = Math.max(0, (tam.h * escala(z) - CROP) / 2)
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) }
  }

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setErro('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setErro('Use JPG, PNG ou WebP.'); return }
    if (f.size > 5 * 1024 * 1024) { setErro('Limite de 5 MB por foto.'); return }
    const src = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f) }).catch(() => '')
    if (!src) { setErro('Erro ao ler a imagem.'); return }
    const img = new Image()
    img.onload = () => { setTam({ w: img.naturalWidth, h: img.naturalHeight }); setZoom(1); setPos({ x: 0, y: 0 }); setCrop(src) }
    img.onerror = () => setErro('Imagem inválida.')
    img.src = src
  }

  async function confirmarFoto() {
    if (!crop) return
    const img = new Image()
    await new Promise<void>(res => { img.onload = () => res(); img.src = crop })
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = SAIDA
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const k = SAIDA / CROP, sc = Math.max(SAIDA / img.width, SAIDA / img.height) * zoom, p = limitar(pos.x, pos.y)
    ctx.drawImage(img, (SAIDA - img.width * sc) / 2 + p.x * k, (SAIDA - img.height * sc) / 2 + p.y * k, img.width * sc, img.height * sc)
    let q = 0.8, url = canvas.toDataURL('image/jpeg', q)
    while (url.length > 110_000 && q > 0.4) { q -= 0.1; url = canvas.toDataURL('image/jpeg', q) }
    setAvatar(url); setCrop(null)
  }

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (crop) { setErro('Confirme o recorte da foto primeiro.'); return }
    const v = validarApelidoAventureiro(apelido)
    if (!v.ok) { setErro(v.erro); return }
    setOcupado(true); setErro('')
    try {
      const r = await fetch('/api/aventureiros/' + perfil.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-prg-aventureiro': perfil.id },
        body: JSON.stringify({ apelido: v.apelido, avatar }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.erro || 'Não foi possível salvar.')
      salvo(d.perfil); fechar()
    } catch (er) { setErro(er instanceof Error ? er.message : 'Falha ao salvar.') } finally { setOcupado(false) }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <form onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="editar-perfil-titulo" onKeyDown={e => { if (e.key === 'Escape') fechar() }}
      className="my-auto w-full max-w-md space-y-4 rounded-2xl border border-[var(--borda-forte,#62527e)] bg-[var(--painel,#19172c)] p-5 shadow-2xl sm:p-7">
      <div className="flex items-center justify-between"><h2 id="editar-perfil-titulo" className="text-xl font-bold">Editar perfil</h2>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 hover:bg-white/10"><X size={20} /></button></div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border-2 border-[#62527e] bg-[#28233e] text-4xl font-bold text-[#b99bff]">
          {avatar ? <img src={avatar} alt="Prévia da foto de perfil" className="h-full w-full object-cover" /> : (apelido.trim()[0] || '✦').toUpperCase()}
        </div>
        <input ref={arquivo} type="file" accept="image/png,image/jpeg,image/webp" onChange={escolher} className="sr-only" aria-label="Escolher nova foto" />
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => arquivo.current?.click()} className="rounded-lg border border-[#62527e] bg-[#34294f] px-3 py-2 text-sm hover:bg-[#4b396f]">📷 Trocar foto</button>
          {avatar && <button type="button" onClick={() => setAvatar(null)} className="rounded-lg border border-[#62527e] px-3 py-2 text-sm">Remover foto</button>}
        </div>
        {crop && <div className="w-full rounded-xl border border-[#62527e] bg-[#100f20] p-3">
          <p className="mb-3 text-center text-sm text-[#ed9cd8]">Arraste e ajuste sua foto</p>
          <div className="relative mx-auto h-64 w-64 touch-none overflow-hidden rounded-xl border-2 border-[#b99bff]"
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); arrasto.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y } }}
            onPointerMove={e => { const a = arrasto.current; if (a) setPos(limitar(a.px + e.clientX - a.x, a.py + e.clientY - a.y)) }}
            onPointerUp={() => { arrasto.current = null }} onPointerCancel={() => { arrasto.current = null }}>
            <img src={crop} alt="Prévia do recorte" draggable={false} className="pointer-events-none absolute max-w-none select-none"
              style={{ width: tam.w * escala(), height: tam.h * escala(), left: '50%', top: '50%', transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }} />
          </div>
          <label className="mt-3 block text-sm text-[#b4aeca]">Zoom: {Math.round(zoom * 100)}%
            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => { const z = Number(e.target.value); setZoom(z); setPos(limitar(pos.x, pos.y, z)) }} className="w-full accent-[#b99bff]" /></label>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setCrop(null)} className="flex-1 rounded-lg border border-[#62527e] p-2 text-sm">Cancelar</button>
            <button type="button" onClick={confirmarFoto} className="flex-1 rounded-lg bg-[#7654bb] p-2 text-sm font-semibold">Usar esta foto</button>
          </div>
        </div>}
      </div>
      <label className="block text-sm text-[#b4aeca]">Nome do aventureiro
        <input value={apelido} onChange={e => setApelido(e.target.value)} maxLength={40} required className="mt-2 w-full rounded-lg border border-[#4a4267] bg-[#100f20] p-3 text-white outline-none focus:border-[#b99bff]" /></label>
      {erro && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-200">{erro}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={fechar} className="flex-1 rounded-lg border border-[#62527e] px-3 py-3">Cancelar</button>
        <button type="submit" disabled={ocupado || !!crop} className="flex-1 rounded-lg bg-[#7654bb] px-3 py-3 font-semibold hover:bg-[#8a67ce] disabled:opacity-50">{ocupado ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  </div>
}

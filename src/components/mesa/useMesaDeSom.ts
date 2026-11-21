'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePreferencias } from '@/lib/preferencias'
import { CENAS_PRONTAS, definirCamadas, definirVolumeLocal, efeitoRepentino, ehEfeito, limparCamadas, limparCena, pararSons, retomarSom, tocarEfeito, type Camadas, type CenaSonora } from '@/lib/mesa/somMesa'

export type MesaDeSom = {
  camadas: Camadas
  cena: string | null
  intensidade: number
  setIntensidade: (v: number) => void
  /** Mestre: toca para todos (e para ele mesmo). */
  tocar: (id: string) => void
  /** Mestre: troca as camadas de ambiente (para todos). */
  definirAmbiente: (c: Camadas, cena?: string | null) => void
  aplicarCena: (c: CenaSonora) => void
  silenciarTudo: () => void
  cenasSalvas: CenaSonora[]
  salvarCena: (nome: string) => void
  apagarCena: (id: string) => void
  /** Testa o som só no próprio aparelho. */
  testar: () => void
  /** Chamados pelo canal da mesa. */
  receberSom: (p: unknown) => void
  receberAmbiente: (p: unknown) => void
}

const chaveCenas = (cid: string) => 'prg-cenas-som-' + cid

/**
 * Estado da Mesa de Som (v0.36.5). Fica na mesa (não no painel) para o ambiente continuar tocando com o painel fechado.
 * O mestre manda comandos pelo canal ao vivo; quem entrar depois recebe o ambiente na próxima repetição (a cada 15 s).
 */
export function useMesaDeSom({ campanhaId, admin, enviar }: { campanhaId: string; admin: boolean; enviar: (evento: string, payload: Record<string, unknown>) => void }): MesaDeSom {
  const pref = usePreferencias()
  const [camadas, setCamadas] = useState<Camadas>({})
  const [cena, setCena] = useState<string | null>(null)
  const [intensidade, setIntensidade] = useState(0.9)
  const [cenasSalvas, setCenasSalvas] = useState<CenaSonora[]>(() => {
    try { const l: unknown = JSON.parse(localStorage.getItem(chaveCenas(campanhaId)) || '[]'); return (Array.isArray(l) ? l : []).map(limparCena).filter((x): x is CenaSonora => !!x).slice(0, 12) } catch { return [] }
  })
  const prefRef = useRef(pref)
  const estado = useRef({ camadas, cena })
  useEffect(() => { prefRef.current = pref; estado.current = { camadas, cena } }, [pref, camadas, cena])

  // Volume e camadas no aparelho desta pessoa (respeita “Ouvir os sons da mesa”).
  useEffect(() => { definirVolumeLocal(pref.volumeSons) }, [pref.volumeSons])
  useEffect(() => { definirCamadas(pref.sonsMesa ? camadas : {}) }, [camadas, pref.sonsMesa])
  useEffect(() => () => pararSons(), [])
  // O navegador só libera o som depois de um toque na página.
  useEffect(() => {
    const liberar = () => retomarSom()
    document.addEventListener('pointerdown', liberar, { passive: true }); document.addEventListener('keydown', liberar)
    return () => { document.removeEventListener('pointerdown', liberar); document.removeEventListener('keydown', liberar) }
  }, [])

  const tocarLocal = useCallback((id: string, vol: number) => {
    const p = prefRef.current
    if (!p.sonsMesa || (efeitoRepentino(id) && !p.sonsRepentinos)) return
    tocarEfeito(id, vol)
  }, [])

  const tocar = useCallback((id: string) => {
    if (!admin || !ehEfeito(id)) return
    retomarSom(); tocarLocal(id, intensidade)
    enviar('som', { id, vol: intensidade })
  }, [admin, enviar, intensidade, tocarLocal])

  const definirAmbiente = useCallback((c: Camadas, novaCena: string | null = null) => {
    if (!admin) return
    retomarSom()
    const limpas = limparCamadas(c)
    setCamadas(limpas); setCena(novaCena)
    enviar('ambiente', { camadas: limpas, cena: novaCena })
  }, [admin, enviar])

  const aplicarCena = useCallback((c: CenaSonora) => definirAmbiente(c.camadas, c.id), [definirAmbiente])
  const silenciarTudo = useCallback(() => definirAmbiente({}, null), [definirAmbiente])

  const guardar = (l: CenaSonora[]) => { setCenasSalvas(l); try { localStorage.setItem(chaveCenas(campanhaId), JSON.stringify(l)) } catch { /* sem espaço */ } }
  const salvarCena = (nome: string) => {
    const id = 'minha-' + Date.now().toString(36)
    const nova = limparCena({ id, nome: nome.trim() || 'Minha cena', icone: '🎧', descricao: 'Cena salva por você', camadas })
    if (nova) guardar([nova, ...cenasSalvas].slice(0, 12))
  }
  const apagarCena = (id: string) => guardar(cenasSalvas.filter(c => c.id !== id))

  const receberSom = useCallback((p: unknown) => {
    const o = p as { id?: unknown; vol?: unknown }
    if (!ehEfeito(o?.id)) return
    tocarLocal(o.id, typeof o.vol === 'number' && Number.isFinite(o.vol) ? Math.min(1, Math.max(0.05, o.vol)) : 0.9)
  }, [tocarLocal])
  const receberAmbiente = useCallback((p: unknown) => {
    const o = p as { camadas?: unknown; cena?: unknown }
    setCamadas(limparCamadas(o?.camadas)); setCena(typeof o?.cena === 'string' ? o.cena.slice(0, 40) : null)
  }, [])

  // Mestre: repete o ambiente de tempos em tempos (para quem entrou depois) e toca os sons aleatórios da cena.
  useEffect(() => {
    if (!admin || !Object.keys(camadas).length) return
    const t = setInterval(() => enviar('ambiente', { camadas: estado.current.camadas, cena: estado.current.cena }), 15000)
    return () => clearInterval(t)
  }, [admin, camadas, enviar])
  const tocarRef = useRef(tocar)
  useEffect(() => { tocarRef.current = tocar }, [tocar])
  useEffect(() => {
    if (!admin || !cena) return
    const c = [...CENAS_PRONTAS, ...cenasSalvas].find(x => x.id === cena)
    if (!c?.aleatorios?.length) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let vivo = true
    for (const a of c.aleatorios) {
      const prox = () => { timers.push(setTimeout(() => { if (!vivo) return; tocarRef.current(a.efeito); prox() }, (a.min + Math.random() * (a.max - a.min)) * 1000)) }
      prox()
    }
    return () => { vivo = false; timers.forEach(clearTimeout) }
  }, [admin, cena, cenasSalvas])

  const testar = useCallback(() => { retomarSom(); tocarEfeito('sino', 0.6) }, [])

  return { camadas, cena, intensidade, setIntensidade, tocar, definirAmbiente, aplicarCena, silenciarTudo, cenasSalvas, salvarCena, apagarCena, testar, receberSom, receberAmbiente }
}

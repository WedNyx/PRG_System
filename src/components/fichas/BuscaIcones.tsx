'use client'

import { useEffect, useMemo, useState } from 'react'
import { buscarIconesGi, carregarIndiceGi, nomeLegivel, partesIconeGi, PREFIXO_GI, TEMAS_GI, urlIconeGi, type IndiceGi } from '@/lib/iconesGi'

const PASSO = 120

/** Desenho de um ícone do acervo, pintado na cor pedida (máscara sobre o arquivo SVG). */
export function IconeGi({ id, tamanho = 40, cor = '#ece6f7' }: { id: string; tamanho?: number; cor?: string }) {
  const url = urlIconeGi(id)
  if (!url) return null
  return <span aria-hidden className="inline-block shrink-0" style={{ width: tamanho, height: tamanho, backgroundColor: cor,
    WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`, WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
}

/**
 * Busca no acervo completo do Game-Icons (v0.35.3): 4.170 ícones, com busca em português e filtros por tema.
 * Carrega o índice só quando abre e mostra os ícones aos poucos.
 */
export default function BuscaIcones({ valor, escolher }: { valor?: string; escolher: (id: string) => void }) {
  const [indice, setIndice] = useState<IndiceGi | null>(null)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [tema, setTema] = useState('todos')
  const [mostrar, setMostrar] = useState(PASSO)
  useEffect(() => { let vivo = true; carregarIndiceGi().then(i => { if (vivo) setIndice(i) }).catch(e => { if (vivo) setErro(e instanceof Error ? e.message : 'Falha ao carregar.') }); return () => { vivo = false } }, [])
  const lista = useMemo(() => indice ? buscarIconesGi(indice, busca, tema) : [], [indice, busca, tema])
  const atual = valor ? partesIconeGi(valor) : null
  if (erro) return <p className="text-xs text-amber-200">{erro}</p>
  if (!indice) return <p className="text-xs text-(--a-c4b6d4)">Carregando os ícones…</p>
  return <div className="space-y-2">
    <input type="search" value={busca} onChange={e => { setBusca(e.target.value); setMostrar(PASSO) }} aria-label="Buscar ícone"
      placeholder="Buscar: espada, pistola, poção, laser, caveira…" className="w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white" />
    <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar por tema">
      {TEMAS_GI.map(t => <button key={t.id} type="button" aria-pressed={tema === t.id} onClick={() => { setTema(t.id); setMostrar(PASSO) }}
        className={'shrink-0 rounded-full border px-2.5 py-1 text-xs ' + (tema === t.id ? 'border-amber-300 bg-amber-300 font-semibold text-black' : 'border-(--a-55456e)')}>{t.nome}</button>)}
    </div>
    <p className="text-[11px] text-(--a-c4b6d4)">{lista.length.toLocaleString('pt-BR')} de {indice.total.toLocaleString('pt-BR')} ícones. Os nomes estão em inglês.</p>
    <div className="grid max-h-80 grid-cols-4 gap-1.5 overflow-y-auto pr-1 min-[400px]:grid-cols-5 sm:grid-cols-7" role="group" aria-label="Ícones do acervo">
      {lista.slice(0, mostrar).map(([autor, nome]) => { const id = `${PREFIXO_GI}${autor}/${nome}`, ativo = valor === id
        return <button key={id} type="button" title={`${nomeLegivel(nome)} · ${indice.autores[autor] ?? autor}`} aria-label={'Usar o ícone ' + nomeLegivel(nome)} aria-pressed={ativo} onClick={() => escolher(id)}
          className={'flex min-w-0 flex-col items-center gap-1 rounded-lg border p-1.5 hover:bg-(--s-34294f) ' + (ativo ? 'border-(--a-ed9cd8) bg-(--s-3a2c58)' : 'border-(--a-55456e)')}>
          <IconeGi id={id} tamanho={34} />
          <span className="w-full truncate text-[9px] text-(--a-c4b6d4)">{nomeLegivel(nome)}</span>
        </button> })}
    </div>
    {mostrar < lista.length && <button type="button" onClick={() => setMostrar(m => m + PASSO)} className="w-full rounded-lg border border-(--a-55456e) py-1.5 text-xs hover:bg-(--s-34294f)">Mostrar mais ({(lista.length - mostrar).toLocaleString('pt-BR')})</button>}
    {atual && <p className="text-[11px] text-(--a-c4b6d4)">Ícone escolhido: <strong>{nomeLegivel(atual.nome)}</strong> · feito por {indice.autores[atual.autor] ?? atual.autor} (<a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline">game-icons.net</a>, CC BY 3.0).</p>}
  </div>
}

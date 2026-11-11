'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import HistoricoRolagens from '@/components/mesa/HistoricoRolagens'
import AjudaTela from '@/components/AjudaTela'

type Campanha = { campanha: { id: string; nome: string }; membros: { aventureiro_id: string; aventureiro: { apelido: string } | null }[] }

/** Histórico de rolagens de uma campanha em tela cheia (também com a sessão fechada). */
function Conteudo() {
  const cid = useSearchParams().get('campanha') ?? ''
  const [c, setC] = useState<Campanha | null>(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let vivo = true
    api<Campanha>('campanhas/' + encodeURIComponent(cid)).then(r => { if (vivo) setC(r) }).catch(e => { if (vivo) setErro(e instanceof ErroNuvem ? e.message : 'Falha de conexão.') })
    return () => { vivo = false }
  }, [cid])
  return <main className="flex min-h-screen flex-col fundo-tema px-4 py-5 text-[#f2ebff]">
    <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3"><Link href="/central?secao=historico" className="text-sm text-[#b99bff] hover:underline">← Voltar</Link>
        {c && <Link href={'/mesa?campanha=' + cid} className="ml-auto text-sm text-[#b99bff] hover:underline">Ir para a mesa →</Link>}
        <AjudaTela titulo="Ajuda do histórico" intro="Tudo o que foi rolado nesta campanha, mesmo com a sessão fechada." className={c ? '' : 'ml-auto'} passos={[
          { icone: '📅', titulo: 'Período', texto: '“Esta sessão” mostra desde que o mestre abriu a sessão atual; dá para ver hoje, 7 dias ou tudo.' },
          { icone: '🎲', titulo: 'Tipo', texto: 'Dados, ataques, mensagens do chat ou avisos da mesa. “Tudo” junta todos.' },
          { icone: '🔎', titulo: 'Quem e o quê', texto: 'Filtre por pessoa, por personagem ou procure um texto (ex.: Furtividade).' },
          { icone: '🎯', titulo: 'Críticos e falhas', texto: '“Só críticos” mostra os 20 naturais; “Só falhas”, os 1. Eles aparecem em verde e vermelho na lista.' },
          { icone: '📊', titulo: 'Resumo', texto: 'Conta rolagens, acertos, maior dano e a média do d20 de cada personagem no período escolhido.' },
          { icone: '🔒', titulo: 'Rolagens secretas', texto: 'Rolagens “só o mestre” aparecem apenas para o mestre e co-mestres.' },
        ]} /></div>
      <h1 className="mt-3 text-2xl font-bold">🎲 Rolagens{c ? ' — ' + c.campanha.nome : ''}</h1>
      {erro && <p role="alert" className="mt-4 text-red-200">{erro}</p>}
      {!c && !erro && <p className="mt-4 text-[#b4aeca]">Carregando…</p>}
      {c && <div className="mt-4 flex min-h-[70vh] flex-1 flex-col rounded-2xl border border-[#55456e] bg-[#19172c]/95 p-4"><HistoricoRolagens campanhaId={cid} membros={c.membros} /></div>}
    </div>
  </main>
}
export default function RolagensPage() { return <Suspense fallback={<p className="p-6 text-violet-200">Carregando…</p>}><Conteudo /></Suspense> }

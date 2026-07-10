import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sistemaLabel } from '@/lib/fichas'
import CriarPersonagemForm from '@/components/campanhas/CriarPersonagemForm'
import NpcPanel from '@/components/campanhas/NpcPanel'
import NotasMestre from '@/components/campanhas/NotasMestre'

export const metadata = {
  title: 'Campanha — PRG System',
}

export default async function CampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campanha } = await supabase.from('campanhas').select('*').eq('id', id).single()
  if (!campanha) notFound()

  const souMestre = campanha.mestre_id === user!.id

  const [{ data: membros }, { data: personagens }, { data: mestreProfile }] = await Promise.all([
    supabase.from('campanha_players').select('player_id').eq('campanha_id', id),
    supabase.from('personagens').select('*').eq('campanha_id', id).order('created_at'),
    supabase.from('profiles').select('username').eq('id', campanha.mestre_id).single(),
  ])

  const memberIds = [campanha.mestre_id, ...(membros?.map((m) => m.player_id) ?? [])]
  const { data: perfis } = await supabase.from('profiles').select('id, username').in('id', memberIds)
  const nomePor = new Map(perfis?.map((p) => [p.id, p.username]) ?? [])

  const pcs = personagens?.filter((p) => !p.is_npc) ?? []
  const npcs = personagens?.filter((p) => p.is_npc) ?? []
  const meusPersonagens = pcs.filter((p) => p.player_id === user!.id)

  const { data: nota } = souMestre
    ? await supabase.from('notas').select('conteudo').eq('campanha_id', id).maybeSingle()
    : { data: null }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              ← Campanhas
            </Link>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">{campanha.nome}</h1>
            <p className="text-sm text-slate-400 mt-1">
              {sistemaLabel[campanha.sistema] ?? campanha.sistema} · Mestre:{' '}
              {mestreProfile?.username ?? '?'}
            </p>
            {campanha.descricao && <p className="text-sm text-slate-400 mt-2 max-w-xl">{campanha.descricao}</p>}
          </div>
          <div className="flex flex-col items-end gap-3">
            <Link
              href={`/mesa/${campanha.id}`}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              🎲 Abrir Mesa
            </Link>
            <div className="text-xs text-slate-500">
              Código de convite:{' '}
              <span className="font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                {campanha.codigo_convite}
              </span>
            </div>
          </div>
        </div>

        {/* Jogadores */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Jogadores ({memberIds.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {memberIds.map((mid) => (
              <span
                key={mid}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  mid === campanha.mestre_id
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {mid === campanha.mestre_id && '👑 '}
                {nomePor.get(mid) ?? '?'}
              </span>
            ))}
          </div>
        </section>

        {/* Personagens */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Personagens
          </h2>
          {pcs.length === 0 && (
            <p className="text-sm text-slate-500 mb-4">Nenhum personagem criado ainda.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {pcs.map((p) => {
              const dono = p.player_id === user!.id
              const podeAbrir = dono || souMestre
              const card = (
                <div
                  className={`flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 ${
                    podeAbrir ? 'hover:border-slate-600 transition-colors' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0"
                    style={{ backgroundColor: p.cor }}
                  >
                    {p.nome[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100 truncate">{p.nome}</p>
                    <p className="text-xs text-slate-500">
                      {nomePor.get(p.player_id) ?? '?'} · HP {p.hp_atual}/{p.hp_max}
                    </p>
                  </div>
                  {podeAbrir && <span className="text-slate-600 text-sm">✏️</span>}
                </div>
              )
              return podeAbrir ? (
                <Link key={p.id} href={`/campanha/${id}/ficha/${p.id}`}>
                  {card}
                </Link>
              ) : (
                <div key={p.id}>{card}</div>
              )
            })}
          </div>
          {meusPersonagens.length === 0 && <CriarPersonagemForm campanhaId={id} isNpc={false} />}
        </section>

        {/* Painel do Mestre */}
        {souMestre && (
          <>
            <section>
              <h2 className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-3">
                👑 NPCs (só você vê os escondidos)
              </h2>
              <NpcPanel campanhaId={id} npcs={npcs} />
            </section>

            <section>
              <h2 className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-3">
                👑 Notas Secretas do Mestre
              </h2>
              <NotasMestre campanhaId={id} conteudoInicial={nota?.conteudo ?? ''} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

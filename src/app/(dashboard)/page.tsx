import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const metadata = {
  title: 'Campanhas — PRG System',
}

type Campanha = Database['public']['Tables']['campanhas']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mestresCampanhas } = await supabase
    .from('campanhas')
    .select('*')
    .eq('mestre_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: playerEntries } = await supabase
    .from('campanha_players')
    .select('campanha_id')
    .eq('player_id', user!.id)

  const playerCampanhaIds = playerEntries?.map((e) => e.campanha_id) ?? []

  const { data: playerCampanhas } =
    playerCampanhaIds.length > 0
      ? await supabase.from('campanhas').select('*').in('id', playerCampanhaIds)
      : { data: [] as Campanha[] }

  const totalCampanhas = (mestresCampanhas?.length ?? 0) + (playerCampanhas?.length ?? 0)

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Minhas Campanhas</h1>
          <div className="flex gap-3">
            <button className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 px-4 py-2 rounded-lg text-sm transition-colors">
              Entrar com código
            </button>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              + Nova Campanha
            </button>
          </div>
        </div>

        {totalCampanhas === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-700 rounded-xl">
            <p className="text-5xl mb-4">🎲</p>
            <p className="text-slate-200 text-lg font-medium mb-2">Nenhuma campanha ainda</p>
            <p className="text-slate-500 text-sm">
              Crie sua primeira campanha ou entre em uma com código de convite
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(mestresCampanhas?.length ?? 0) > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Sou o Mestre
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {mestresCampanhas!.map((c) => (
                    <CampanhaCard key={c.id} campanha={c} role="mestre" />
                  ))}
                </div>
              </section>
            )}

            {(playerCampanhas?.length ?? 0) > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Sou Player
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playerCampanhas!.map((c) => (
                    <CampanhaCard key={c.id} campanha={c} role="player" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const sistemaLabel: Record<string, string> = {
  dnd5e: 'D&D 5e',
  tormenta20: 'Tormenta 20',
  coc: 'Call of Cthulhu',
  vtm: 'Vampire: The Masquerade',
  pathfinder2e: 'Pathfinder 2e',
  custom: 'Sistema Customizado',
}

function CampanhaCard({ campanha, role }: { campanha: Campanha; role: 'mestre' | 'player' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
          {campanha.nome}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
            role === 'mestre'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
        >
          {role === 'mestre' ? 'Mestre' : 'Player'}
        </span>
      </div>
      {campanha.descricao && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{campanha.descricao}</p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{sistemaLabel[campanha.sistema] ?? campanha.sistema}</span>
        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded">
          {campanha.codigo_convite}
        </span>
      </div>
    </div>
  )
}

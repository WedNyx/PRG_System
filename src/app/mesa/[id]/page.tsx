import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MesaClient from '@/components/mesa/MesaClient'
import type { Cena } from '@/types/database'

export const metadata = {
  title: 'Mesa — PRG System',
}

export default async function MesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campanha } = await supabase.from('campanhas').select('*').eq('id', id).single()
  if (!campanha) notFound()

  const souMestre = campanha.mestre_id === user!.id

  const [{ data: personagens }, { data: mensagens }, { data: rolagens }, { data: membrosRaw }, { data: cenas }] =
    await Promise.all([
      supabase.from('personagens').select('*').eq('campanha_id', id),
      supabase
        .from('mensagens')
        .select('*')
        .eq('campanha_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('rolagens')
        .select('*')
        .eq('campanha_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('campanha_players').select('player_id').eq('campanha_id', id),
      souMestre
        ? supabase.from('cenas').select('*').eq('campanha_id', id).order('created_at')
        : Promise.resolve({ data: [] as Cena[] }),
    ])

  const memberIds = [campanha.mestre_id, ...(membrosRaw?.map((m) => m.player_id) ?? [])]
  const { data: perfis } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', memberIds)

  return (
    <MesaClient
      campanhaInicial={campanha}
      personagensIniciais={personagens ?? []}
      mensagensIniciais={(mensagens ?? []).reverse()}
      rolagensIniciais={(rolagens ?? []).reverse()}
      cenasIniciais={cenas ?? []}
      membros={perfis ?? []}
      meuId={user!.id}
      souMestre={souMestre}
    />
  )
}

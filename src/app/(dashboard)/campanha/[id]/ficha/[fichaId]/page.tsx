import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { templatesFicha } from '@/lib/fichas'
import FichaEditor from '@/components/fichas/FichaEditor'

export const metadata = {
  title: 'Ficha — PRG System',
}

export default async function FichaPage({
  params,
}: {
  params: Promise<{ id: string; fichaId: string }>
}) {
  const { id, fichaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campanha }, { data: personagem }] = await Promise.all([
    supabase.from('campanhas').select('*').eq('id', id).single(),
    supabase.from('personagens').select('*').eq('id', fichaId).single(),
  ])

  if (!campanha || !personagem || personagem.campanha_id !== id) notFound()

  const souMestre = campanha.mestre_id === user!.id
  const souDono = personagem.player_id === user!.id
  const podeEditar = souDono || souMestre

  const template = templatesFicha[campanha.sistema] ?? templatesFicha.custom

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/campanha/${id}`}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← {campanha.nome}
        </Link>
        <FichaEditor
          personagem={personagem}
          campanhaId={id}
          template={template}
          podeEditar={podeEditar}
        />
      </div>
    </div>
  )
}

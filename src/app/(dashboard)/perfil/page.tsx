import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditorPerfil from '@/components/perfil/EditorPerfil'

export const metadata = { title: 'Meu perfil — PRG System' }

export default async function MeuPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('profiles')
    .select('username, avatar_url').eq('id', user.id).single()

  const { data: { publicUrl } } = supabase.storage.from('profile-avatars').getPublicUrl('placeholder')

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-violet-200">Meu perfil de aventureiro</h1>
        <p className="text-slate-400 mt-2">Sua identidade na plataforma é independente das fichas de RPG.</p>
      </div>
      <EditorPerfil userId={user.id} apelidoInicial={perfil?.username ?? 'Aventureiro'}
        avatarInicial={perfil?.avatar_url ?? null}
        avatarBaseUrl={publicUrl.slice(0, -'/placeholder'.length)} />
    </div>
  )
}

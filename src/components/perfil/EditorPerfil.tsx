'use client'

import { useState, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { atualizarApelido, atualizarAvatar } from '@/app/actions/perfil'

type Props = { userId: string; apelidoInicial: string; avatarInicial: string | null; avatarBaseUrl: string }

export default function EditorPerfil({ userId, apelidoInicial, avatarInicial, avatarBaseUrl }: Props) {
  const [apelido, setApelido] = useState(apelidoInicial)
  const [avatar, setAvatar] = useState(avatarInicial)
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const urlAvatar = avatar ? avatarBaseUrl + '/' + avatar : null

  async function salvarApelido() {
    setCarregando(true); setMensagem('')
    try {
      const resultado = await atualizarApelido(apelido)
      setMensagem(resultado.error ?? 'Apelido atualizado!')
    } catch { setMensagem('Não foi possível salvar o apelido.') }
    finally { setCarregando(false) }
  }

  async function escolherImagem(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const formatos = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const
    const extensao = formatos[file.type as keyof typeof formatos]
    if (!extensao || file.size > 2 * 1024 * 1024) {
      setMensagem('Use PNG, JPG ou WebP com até 2 MB.')
      event.target.value = ''
      return
    }
    setCarregando(true); setMensagem('')
    try {
      const supabase = createClient()
      const caminho = `${userId}/avatar-${crypto.randomUUID()}.${extensao}`
      const { error: uploadError } = await supabase.storage.from('profile-avatars').upload(caminho, file, {
        contentType: file.type, upsert: false, cacheControl: '3600',
      })
      if (uploadError) throw new Error('Falha ao enviar imagem. Verifique a configuração do armazenamento.')
      const resultado = await atualizarAvatar(caminho)
      if (resultado.error) {
        await supabase.storage.from('profile-avatars').remove([caminho])
        throw new Error(resultado.error)
      }
      setAvatar(caminho)
      setMensagem('Imagem do perfil atualizada!')
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : 'Não foi possível salvar a imagem.')
    } finally { setCarregando(false); event.target.value = '' }
  }

  return (
    <section className="bg-slate-900 border border-violet-900/60 rounded-2xl p-6 space-y-6">
      <h2 className="text-xl font-semibold text-violet-200">Personalizar meu perfil</h2>
      <div className="flex flex-wrap items-center gap-5">
        <div className="w-24 h-24 rounded-2xl bg-violet-950 border border-violet-600 overflow-hidden flex items-center justify-center">
          {urlAvatar ? <img src={urlAvatar} alt="Avatar do perfil" className="w-full h-full object-cover" /> :
            <span className="text-4xl text-violet-200">{apelido.charAt(0).toUpperCase() || '?'}</span>}
        </div>
        <div className="space-y-2">
          <label className="block cursor-pointer bg-violet-700 hover:bg-violet-600 text-white rounded-lg px-4 py-2 text-sm">
            {carregando ? 'Aguarde...' : 'Escolher imagem'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherImagem}
              disabled={carregando} className="sr-only" />
          </label>
          <p className="text-xs text-slate-400">PNG, JPG ou WebP, até 2 MB. Imagem pública.</p>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="apelido-perfil" className="block text-sm text-slate-300">Nome ou apelido</label>
        <div className="flex flex-wrap gap-2">
          <input id="apelido-perfil" value={apelido} maxLength={30} minLength={3}
            onChange={event => setApelido(event.target.value)}
            className="min-w-0 flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-400" />
          <button onClick={salvarApelido} disabled={carregando || apelido.trim().length < 3}
            className="rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white px-4 py-2">
            Salvar
          </button>
        </div>
      </div>
      {mensagem && <p role="status" className="text-sm text-violet-200">{mensagem}</p>}
    </section>
  )
}

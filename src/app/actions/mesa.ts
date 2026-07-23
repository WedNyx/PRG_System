'use server'

import { createClient } from '@/lib/supabase/server'
import { rolarExpressao } from '@/lib/dice'

const TIPOS_VALIDOS = ['fala', 'ooc', 'emote', 'sussurro']

export async function enviarMensagem(
  campanhaId: string,
  conteudo: string,
  tipo: string = 'fala',
  destinatarioId: string | null = null
) {
  const texto = conteudo.trim()
  if (!texto) return { error: 'Mensagem vazia.' }
  if (!TIPOS_VALIDOS.includes(tipo)) return { error: 'Tipo de mensagem inválido.' }
  if (tipo === 'sussurro' && !destinatarioId) return { error: 'Sussurro precisa de destinatário.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('mensagens').insert({
    campanha_id: campanhaId,
    player_id: user.id,
    conteudo: texto.slice(0, 2000),
    tipo,
    destinatario_id: tipo === 'sussurro' ? destinatarioId : null,
  })

  if (error) return { error: error.message }
  return {}
}

export async function rolarDados(campanhaId: string, expressao: string, secreta: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // A rolagem acontece no servidor para ninguém "ajeitar" o resultado 😉
  const resultado = rolarExpressao(expressao)
  if (!resultado) return { error: 'Expressão inválida. Use algo como 2d6+3 ou 1d20.' }

  const { error } = await supabase.from('rolagens').insert({
    campanha_id: campanhaId,
    player_id: user.id,
    expressao: resultado.expressao,
    resultados: resultado.resultados,
    total: resultado.total,
    is_secreta: secreta,
  })

  if (error) return { error: error.message }
  return { resultado }
}

export async function criarDesenho(campanhaId: string, cor: string, pontos: number[]) {
  if (pontos.length < 4 || pontos.length > 2000) return { error: 'Traço inválido.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('desenhos').insert({
    campanha_id: campanhaId,
    autor_id: user.id,
    cor,
    pontos,
  })
  if (error) return { error: error.message }
  return {}
}

export async function limparDesenhos(campanhaId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('desenhos').delete().eq('campanha_id', campanhaId)
  if (error) return { error: error.message }
  return {}
}

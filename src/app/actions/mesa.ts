'use server'

import { createClient } from '@/lib/supabase/server'
import { rolarExpressao } from '@/lib/dice'

export async function enviarMensagem(campanhaId: string, conteudo: string) {
  const texto = conteudo.trim()
  if (!texto) return { error: 'Mensagem vazia.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('mensagens').insert({
    campanha_id: campanhaId,
    player_id: user.id,
    conteudo: texto.slice(0, 2000),
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

import { describe, expect, it } from 'vitest'
import { limparUsuario, sugerirUsuario, termoDeBusca, validarUsuario } from './usuario'
import { mensagemDiscord, validarFeedback, webhookValido } from './feedback'

describe('@usuario (v0.37.0)', () => {
  it('limpa o @ e deixa minúsculo', () => {
    expect(limparUsuario('  @@LesteDraco ')).toBe('lestedraco')
    expect(validarUsuario('@Leste_Draco.2')).toEqual({ ok: true, usuario: 'leste_draco.2' })
  })
  it('recusa formatos inválidos', () => {
    for (const v of ['ab', 'a'.repeat(21), 'leste draco', 'ação', '.leste', 'leste.', 'les..te', 'le$te', 42]) expect(validarUsuario(v).ok).toBe(false)
  })
  it('sugere um @ igual ao do banco', () => {
    expect(sugerirUsuario('Ação Ñandú  Teste')).toBe('acao_nandu_teste')
    expect(sugerirUsuario('Leste🐉 Draco')).toBe('leste_draco')
    expect(sugerirUsuario('⭑☽𝔚𝔢𝔡☾⭑')).toBe('aventureiro')
    expect(sugerirUsuario('abcdefghijklmnopqrstuvwxyz')).toHaveLength(20)
  })
  it('a busca só deixa passar caracteres do @ (o filtro do banco não quebra)', () => {
    expect(termoDeBusca('@Le,ste)(*')).toBe('leste')
    expect(termoDeBusca(null)).toBe('')
  })
})

describe('feedback (v0.37.0)', () => {
  it('valida texto, tipo e página', () => {
    expect(validarFeedback({ texto: 'oi' }).ok).toBe(false)
    expect(validarFeedback({ texto: 'x'.repeat(1501) }).ok).toBe(false)
    const v = validarFeedback({ tipo: 'nao-existe', texto: '  Boa ideia!  ', pagina: '/central?secao=perfil#x' })
    expect(v).toEqual({ ok: true, valor: { tipo: 'outro', texto: 'Boa ideia!', pagina: '/central' } })
    expect(validarFeedback({ texto: 'abc', pagina: 'https://outro.site/x' })).toEqual({ ok: true, valor: { tipo: 'outro', texto: 'abc', pagina: '' } })
  })
  it('só aceita webhook do Discord', () => {
    expect(webhookValido('https://discord.com/api/webhooks/123456/abc_DEF-9')).toBe(true)
    expect(webhookValido('https://discordapp.com/api/webhooks/1/x')).toBe(true)
    expect(webhookValido('https://evil.com/api/webhooks/1/x')).toBe(false)
    expect(webhookValido('http://discord.com/api/webhooks/1/x')).toBe(false)
  })
  it('a mensagem não deixa marcar ninguém (@everyone) e mostra quem mandou', () => {
    const m = mensagemDiscord({ tipo: 'problema', texto: '@everyone caiu tudo', pagina: '/mesa' }, { apelido: 'Leste', usuario: 'lestedraco' })
    expect(m.allowed_mentions).toEqual({ parse: [] })
    expect(m.embeds[0].title).toBe('🐞 Problema')
    expect(m.embeds[0].fields[0].value).toBe('Leste (@lestedraco)')
    expect(m.embeds[0].fields[1].value).toBe('/mesa')
  })
})

describe('busca pelo nome (v0.37.0)', () => {
  it('mantém acentos e espaços, tira o que quebraria o filtro', async () => {
    const { termoDeNome } = await import('./usuario')
    expect(termoDeNome('  @Jogador   Sól ')).toBe('Jogador Sól')
    expect(termoDeNome('a,b)(c"*d')).toBe('abcd')
  })
})

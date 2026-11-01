# PRG System — autenticação de aventureiros (planejamento de implementação)

## Decisões de produto
- Cada perfil é **uma conta independente**, com ID imutável.
- Apelido e avatar são dados de apresentação, não credenciais nem prova de identidade.
- Acesso imediato a fichas e campanhas depois de autenticação válida.
- Um dispositivo pode lembrar vários perfis, **sem compartilhar sessão** entre eles.
- Cadastro e login finais sem e-mail, via passkeys/WebAuthn.
- Recuperação com passkey adicional e códigos de uso único.

## Estado do código em main (01/11/2026)
- `src/app/actions/auth.ts` usa Supabase Auth por e-mail/senha.
- `src/middleware.ts` e `@supabase/ssr` exigem sessão Supabase.
- As políticas RLS e tabelas relacionam dados a `auth.uid()`.
- A PR #6 trata da edição de avatar/apelido e ainda não implementa passkeys.

## Bloqueio técnico antes de liberar o novo cadastro
WebAuthn valida uma credencial no servidor, mas **não cria automaticamente uma sessão do Supabase Auth**. É obrigatório escolher e validar uma ponte de identidade confiável. Não emitir JWT improvisado no cliente nem usar service_role no navegador. Não tratar Supabase anonymous sign-in como conta recuperável sem vincular credencial autenticada. Não criar e-mails falsos.

## Contrato de segurança da futura integração
1. Servidor gera challenge aleatório de uso único, com expiração, vinculado à cerimônia e à origem/RP ID.
2. Verifica no servidor o retorno WebAuthn: challenge, origin, RP ID, assinatura, flags de presença/verificação, contador quando aplicável; impede replay.
3. Vincula credencial pública a um ID de conta único. Guarda identificador da credencial e chave pública; nunca armazena biometria ou chave privada.
4. Somente após autenticação verificada, cria sessão validada pelo Supabase e testa `auth.uid()` com RLS existente.
5. Cria perfil de forma transacional/segura; impede perfis órfãos e duplicação.
6. Códigos de recuperação: aleatórios de alta entropia, hashes no servidor, uso único, rate limit, rotação e invalidação; exigir verificação forte para cadastrar novas passkeys.
7. Suporte a segundo dispositivo e múltiplos perfis lembrados, com seleção local apenas como UI.
8. Logs sem segredos, proteção contra enumeração e rate limit em registro/login/recuperação.

## Critérios de aceite
- Dois jogadores com mesmo apelido têm contas e dados isolados.
- Sem passkey válida não se entra escolhendo apenas avatar.
- Criar/ler/editar fichas respeita RLS; nenhuma conta acessa dados privados de outra.
- Cadastro sem e-mail funciona em Android e desktop compatíveis.
- Login em segundo dispositivo, segunda passkey e recuperação testados.
- Migração das contas antigas definida e testada antes de remover login atual.
- Não fazer merge da PR #6 nem desta branch com base apenas no build.

## Etapas
- [x] Branch isolada criada.
- [x] Modelo público de aventureiro e validação inicial do apelido com testes.
- [ ] Escolher provedor/arquitetura de identidade com integração comprovada ao Supabase.
- [ ] Implementar desafios e verificação WebAuthn no servidor.
- [ ] Implementar sessões compatíveis com Supabase e testes RLS.
- [ ] Criar UI de cadastro e login sem e-mail.
- [ ] Implementar recuperação e seleção de múltiplos perfis.
- [ ] Validar Preview, migração e revisão de segurança.

**Esta etapa não habilita passkeys nem modifica o banco de produção.**

# Perfis compartilhados — plano de implantação segura

## Decisões confirmadas
- Todos os aventureiros aparecem em qualquer dispositivo.
- Cadastro somente com apelido e foto; sem senha, e-mail ou passkey nesta fase.
- Selecionar um perfil não equivale a autenticação.
- Senha opcional poderá ser considerada futuramente.
- Não modificar ou apagar os dados locais nem as fichas V8 durante a preparação.

## Estado verificado (2026-11-02)
- Supabase ativo; tabela pública existente `profiles` tem `id`, `username`, `avatar_url`, `created_at`.
- Políticas de SELECT e UPDATE dessa tabela destinam-se a usuários autenticados.
- Portal atual guarda perfis em `localStorage` sob `prg-aventureiros-demo-v1`.
- A Ficha V8 também usa armazenamento local e ainda não está isolada por aventureiro.

## Arquitetura proposta
1. Criar um catálogo **separado** para perfis públicos, sem substituir a tabela `profiles` existente.
2. Expor leitura pública somente de ID, apelido e URL da imagem; não expor informações privadas ou fichas.
3. Usar API Next.js para criação com validação, limites de tamanho e limitação de taxa; não colocar chave service-role no navegador.
4. Guardar fotos em Storage com caminhos gerados pelo servidor, validação de tipo/tamanho e cotas. Revisar custos e proteção contra abuso.
5. Não habilitar UPDATE/DELETE anônimos sem autorização. A edição e a exclusão de perfis compartilhados ficam pendentes de um modelo de autorização apropriado.
6. Importação dos perfis locais somente com confirmação do usuário, prévia e backup. Tratar IDs repetidos e apelidos duplicados; não executar importação automática.
7. Migrar as fichas apenas após definir IDs estáveis e estratégia de isolamento; criar cópia de segurança antes.
8. Testar dois navegadores e dois dispositivos, RLS, upload, duplicatas, indisponibilidade do Supabase e restauração de backup antes de ativar a nuvem.

## Checklist de aprovação
- [ ] Aprovar o modelo de edição de perfis sem senha (risco de alterações por terceiros).
- [ ] Aprovar limites de cadastro e fotos para evitar abuso/custos.
- [ ] Implementar e testar catálogo de perfis compartilhados em ambiente de teste.
- [ ] Criar fluxo explícito de importação com backup.
- [ ] Integrar portal em modo progressivo, mantendo rollback para dados locais.
- [ ] Somente então ativar sincronização na produção.

**Importante:** esta PR é de preparação. Não ativa sincronização, não executa SQL e não altera as políticas existentes.

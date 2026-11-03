# Teste do catálogo de aventureiros (PR de implementação)
- O portal mantém o armazenamento local quando `NEXT_PUBLIC_PRG_SHARED_PROFILES` não está ativado.
- A API exige `PRG_SHARED_PROFILES=true`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- Antes de ativar, executar SQL de `docs/sql/catalogo-aventureiros.sql` em ambiente de teste e configurar **limitação de taxa persistente** e mitigação de abuso. Checagem de Origin não basta.
- Foto de perfil em base64 (JPEG até ~90 KB) é uma solução transitória; migrar para Storage antes de uso amplo.
- Ao ativar, o catálogo é compartilhado e os perfis locais permanecem intactos, mas não são importados automaticamente.
- Edição e exclusão de perfis compartilhados estão bloqueadas. Ficha V8 permanece local e não sincronizada.
- Validar build, testes, duplicidade, quota e dois dispositivos antes de merge. **Não ativar em produção sem testes e antiabuso.**

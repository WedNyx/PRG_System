# Portal simplificado de aventureiros — PRG System

## Decisão atual
- A seleção de perfis será compartilhada, sem e-mail, senha ou passkey.
- Qualquer visitante poderá selecionar qualquer perfil: **não há identidade verificada**.
- O proprietário aceita essa limitação para um grupo de amigos.
- O destino é o editor **Ficha V8** já existente.

## Etapa implementada na PR #7
- Rota pública `/portal` com criação e seleção de perfis de demonstração no navegador.
- A rota `/ficha-v8` fica acessível sem autenticação, pois usa salvamento local e não consulta fichas privadas.
- O login antigo e o painel de campanhas continuam intactos.
- **Não há perfis globais, avatares enviados, sincronização entre aparelhos ou escrita no Supabase nesta etapa.**
- A Ficha V8 continua com salvamento local e backup JSON. Perfis da demonstração não isolam o armazenamento da ficha V8.

## Próxima etapa: persistência compartilhada
- Definir tabelas próprias de perfis de jogo (separadas de `auth.users` e `profiles`).
- Revisar as políticas RLS, consultas e mutações do sistema de campanhas/fichas antes de trocar a identidade.
- Criar API server-side limitada para lista/criação/seleção e gravação de fichas; nunca expor service_role.
- Implementar associação real entre perfil e fichas V8, com armazenamento por perfil.
- Documentar que qualquer visitante com acesso ao site poderá editar os dados de qualquer perfil.
- Fazer backup antes de qualquer migração e testar em Preview.

Não fazer merge antes de testar o fluxo e decidir como os dados de campanhas existentes serão preservados.

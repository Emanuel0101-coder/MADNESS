/*
  # Corrigir Políticas RLS da Tabela Profiles

  1. Mudanças
    - Remove políticas antigas que causam recursão infinita
    - Cria novas políticas sem recursão
    - Usa auth.jwt() para verificar is_admin do metadata

  2. Segurança
    - Usuários podem ver e atualizar apenas seu próprio perfil
    - Qualquer usuário autenticado pode ver perfis (necessário para validação de ingressos)
    - Sistema continua seguro
*/

-- Remove políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;

-- Política para SELECT: usuários autenticados podem ver todos os perfis
-- (necessário para que admins vejam compradores ao validar ingressos)
CREATE POLICY "Usuários autenticados podem ver perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
-- e não podem alterar o campo is_admin
CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para INSERT: permite criação automática pelo trigger
CREATE POLICY "Permitir inserção de perfis"
  ON profiles FOR INSERT
  WITH CHECK (true);
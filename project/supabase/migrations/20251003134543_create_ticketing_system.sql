/*
  # Sistema de Venda de Ingressos

  1. Novas Tabelas
    - `profiles`
      - `id` (uuid, chave primária, referência para auth.users)
      - `email` (text, único)
      - `nome` (text)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
    
    - `eventos`
      - `id` (uuid, chave primária)
      - `titulo` (text)
      - `descricao` (text)
      - `local` (text)
      - `data_evento` (timestamp)
      - `imagem_url` (text)
      - `ativo` (boolean, default true)
      - `created_by` (uuid, referência para profiles)
      - `created_at` (timestamp)
    
    - `lotes`
      - `id` (uuid, chave primária)
      - `evento_id` (uuid, referência para eventos)
      - `nome` (text, ex: "1º Lote", "2º Lote")
      - `preco` (decimal)
      - `quantidade_total` (integer)
      - `quantidade_vendida` (integer, default 0)
      - `data_inicio` (timestamp)
      - `data_fim` (timestamp)
      - `ordem` (integer, para ordenar os lotes)
    
    - `ingressos`
      - `id` (uuid, chave primária)
      - `evento_id` (uuid, referência para eventos)
      - `lote_id` (uuid, referência para lotes)
      - `comprador_id` (uuid, referência para profiles)
      - `codigo_qr` (text, único - código para validação)
      - `valor_pago` (decimal)
      - `status` (text: 'pendente', 'confirmado', 'usado', 'cancelado')
      - `validado_em` (timestamp, nullable)
      - `validado_por` (uuid, nullable, referência para profiles)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados lerem seus próprios dados
    - Políticas para admins gerenciarem eventos
    - Políticas públicas para visualizar eventos ativos
*/

-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL,
  local text NOT NULL,
  data_evento timestamptz NOT NULL,
  imagem_url text,
  ativo boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver eventos ativos"
  ON eventos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins podem ver todos os eventos"
  ON eventos FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem criar eventos"
  ON eventos FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem atualizar eventos"
  ON eventos FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem deletar eventos"
  ON eventos FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  preco decimal(10,2) NOT NULL,
  quantidade_total integer NOT NULL,
  quantidade_vendida integer DEFAULT 0,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,
  ordem integer NOT NULL DEFAULT 0
);

ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode ver lotes de eventos ativos"
  ON lotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM eventos 
      WHERE eventos.id = lotes.evento_id 
      AND eventos.ativo = true
    )
  );

CREATE POLICY "Admins podem ver todos os lotes"
  ON lotes FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem criar lotes"
  ON lotes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem atualizar lotes"
  ON lotes FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem deletar lotes"
  ON lotes FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Tabela de Ingressos
CREATE TABLE IF NOT EXISTS ingressos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  lote_id uuid REFERENCES lotes(id) NOT NULL,
  comprador_id uuid REFERENCES profiles(id) NOT NULL,
  codigo_qr text UNIQUE NOT NULL,
  valor_pago decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'confirmado' CHECK (status IN ('pendente', 'confirmado', 'usado', 'cancelado')),
  validado_em timestamptz,
  validado_por uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ingressos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprios ingressos"
  ON ingressos FOR SELECT
  TO authenticated
  USING (auth.uid() = comprador_id);

CREATE POLICY "Admins podem ver todos os ingressos"
  ON ingressos FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Admins podem atualizar status dos ingressos"
  ON ingressos FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_eventos_ativo ON eventos(ativo);
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data_evento);
CREATE INDEX IF NOT EXISTS idx_lotes_evento ON lotes(evento_id);
CREATE INDEX IF NOT EXISTS idx_ingressos_comprador ON ingressos(comprador_id);
CREATE INDEX IF NOT EXISTS idx_ingressos_codigo_qr ON ingressos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_ingressos_evento ON ingressos(evento_id);
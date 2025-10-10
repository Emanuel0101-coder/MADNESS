import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  nome: string;
  is_admin: boolean;
  created_at: string;
};

export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  local: string;
  data_evento: string;
  imagem_url: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
};

export type Lote = {
  id: string;
  evento_id: string;
  nome: string;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  data_inicio: string;
  data_fim: string;
  ordem: number;
};

export type Ingresso = {
  id: string;
  evento_id: string;
  lote_id: string;
  comprador_id: string;
  codigo_qr: string;
  valor_pago: number;
  status: 'pendente' | 'confirmado' | 'usado' | 'cancelado';
  validado_em: string | null;
  validado_por: string | null;
  created_at: string;
};

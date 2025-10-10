import { useState } from 'react';
import { X, Check, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ValidateTicketProps {
  eventoId: string;
  onClose: () => void;
}

export function ValidateTicket({ eventoId, onClose }: ValidateTicketProps) {
  const [codigoQr, setCodigoQr] = useState('');
  const [validating, setValidating] = useState(false);
  const [resultado, setResultado] = useState<{
    tipo: 'sucesso' | 'erro' | 'usado';
    mensagem: string;
    detalhes?: any;
  } | null>(null);

  async function handleValidate() {
    if (!codigoQr.trim()) {
      setResultado({
        tipo: 'erro',
        mensagem: 'Por favor, insira o código do ingresso',
      });
      return;
    }

    setValidating(true);
    setResultado(null);

    try {
      const { data: ingresso, error } = await supabase
        .from('ingressos')
        .select('*, eventos(*), profiles!ingressos_comprador_id_fkey(*)')
        .eq('codigo_qr', codigoQr.toUpperCase().trim())
        .eq('evento_id', eventoId)
        .maybeSingle();

      if (error || !ingresso) {
        setResultado({
          tipo: 'erro',
          mensagem: 'Ingresso não encontrado ou inválido para este evento',
        });
        return;
      }

      if (ingresso.status === 'usado') {
        setResultado({
          tipo: 'usado',
          mensagem: 'Este ingresso já foi utilizado',
          detalhes: {
            validado_em: ingresso.validado_em,
            comprador: ingresso.profiles.nome,
          },
        });
        return;
      }

      if (ingresso.status === 'cancelado') {
        setResultado({
          tipo: 'erro',
          mensagem: 'Este ingresso foi cancelado',
        });
        return;
      }

     const { data: userData, error: userError } = await supabase.auth.getUser();

if (userError || !userData?.user) {
  throw new Error('Erro ao obter usuário autenticado');
}

const { error: updateError } = await supabase
  .from('ingressos')
  .update({
    status: 'usado',
    validado_em: new Date().toISOString(),
    validado_por: userData.user.id,
  })
  .eq('id', ingresso.id);


      if (updateError) {
        throw updateError;
      }

      setResultado({
        tipo: 'sucesso',
        mensagem: 'Ingresso validado com sucesso!',
        detalhes: {
          comprador: ingresso.profiles.nome,
          lote: ingresso.lote_id,
          valor: ingresso.valor_pago,
        },
      });

      setCodigoQr('');
    } catch (error) {
      setResultado({
        tipo: 'erro',
        mensagem: 'Erro ao validar ingresso. Tente novamente.',
      });
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Validar Ingresso</h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código do Ingresso (QR Code)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={codigoQr}
                onChange={(e) => setCodigoQr(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
                placeholder="Digite ou escaneie o código"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
                autoFocus
              />
              <button
                onClick={handleValidate}
                disabled={validating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {validating ? (
                  'Validando...'
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Validar
                  </>
                )}
              </button>
            </div>
          </div>

          {resultado && (
            <div
              className={`p-6 rounded-lg border-2 ${
                resultado.tipo === 'sucesso'
                  ? 'bg-green-50 border-green-500'
                  : resultado.tipo === 'usado'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start gap-4">
                {resultado.tipo === 'sucesso' ? (
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      resultado.tipo === 'usado' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  >
                    <AlertCircle className="w-7 h-7 text-white" />
                  </div>
                )}

                <div className="flex-1">
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      resultado.tipo === 'sucesso'
                        ? 'text-green-900'
                        : resultado.tipo === 'usado'
                        ? 'text-yellow-900'
                        : 'text-red-900'
                    }`}
                  >
                    {resultado.mensagem}
                  </h3>

                  {resultado.detalhes && (
                    <div className="space-y-1 text-sm">
                      {resultado.detalhes.comprador && (
                        <p className="text-gray-700">
                          <span className="font-semibold">Comprador:</span>{' '}
                          {resultado.detalhes.comprador}
                        </p>
                      )}
                      {resultado.detalhes.valor && (
                        <p className="text-gray-700">
                          <span className="font-semibold">Valor:</span> R${' '}
                          {Number(resultado.detalhes.valor).toFixed(2)}
                        </p>
                      )}
                      {resultado.detalhes.validado_em && (
                        <p className="text-gray-700">
                          <span className="font-semibold">Validado em:</span>{' '}
                          {new Date(resultado.detalhes.validado_em).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Instruções:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Digite ou escaneie o código QR do ingresso</li>
              <li>2. Pressione Enter ou clique em Validar</li>
              <li>3. O sistema verificará a validade do ingresso</li>
              <li>4. Ingressos só podem ser validados uma vez</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

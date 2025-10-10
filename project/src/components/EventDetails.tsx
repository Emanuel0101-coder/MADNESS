import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, ShoppingCart } from 'lucide-react';
import { supabase, Evento, Lote } from '../lib/supabase';
import { PixPayment } from './PixPayment';

interface EventDetailsProps {
  evento: Evento;
  onClose: () => void;
}

export function EventDetails({ evento, onClose }: EventDetailsProps) {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLotes();
  }, []);

  async function loadLotes() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('evento_id', evento.id)
      .lte('data_inicio', now)
      .gte('data_fim', now)
      .order('ordem');

    if (!error && data) {
      const lotesDisponiveis = data.filter(
        (lote) => lote.quantidade_vendida < lote.quantidade_total
      );
      setLotes(lotesDisponiveis);
      if (lotesDisponiveis.length > 0) {
        setSelectedLote(lotesDisponiveis[0]);
      }
    }
  }

  function handleInitiatePurchase() {
    if (!selectedLote) return;

    const disponivel = selectedLote.quantidade_total - selectedLote.quantidade_vendida;
    if (quantidade > disponivel) {
      alert(`Apenas ${disponivel} ingressos disponíveis neste lote`);
      return;
    }

    setShowPixPayment(true);
  }

  function handlePaymentSuccess() {
    setShowPixPayment(false);
    alert('🎉 Pagamento realizado com sucesso! Seus ingressos foram enviados para seu email e já estão disponíveis em "Meus Ingressos".');
    onClose();
  }

  if (showPixPayment && selectedLote) {
    return (
      <PixPayment
        amount={Number(selectedLote.preco) * quantidade}
        eventName={evento.titulo}
        loteId={selectedLote.id}
        quantidade={quantidade}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPixPayment(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="relative">
          {evento.imagem_url && (
            <img
              src={evento.imagem_url}
              alt={evento.titulo}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{evento.titulo}</h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5" />
              <span>
                {new Date(evento.data_evento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5" />
              <span>{evento.local}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre o Evento</h3>
            <p className="text-gray-600 whitespace-pre-line">{evento.descricao}</p>
          </div>

          {lotes.length > 0 ? (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingressos Disponíveis</h3>

              <div className="space-y-3 mb-6">
                {lotes.map((lote) => {
                  const disponivel = lote.quantidade_total - lote.quantidade_vendida;
                  return (
                    <div
                      key={lote.id}
                      onClick={() => setSelectedLote(lote)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedLote?.id === lote.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{lote.nome}</h4>
                          <p className="text-sm text-gray-600">
                            {disponivel} ingressos disponíveis
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {Number(lote.preco).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedLote && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Quantidade</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold w-12 text-center">{quantidade}</span>
                      <button
                        onClick={() =>
                          setQuantidade(
                            Math.min(
                              selectedLote.quantidade_total - selectedLote.quantidade_vendida,
                              quantidade + 1
                            )
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 text-center">
                      Pagamento via <strong>PIX</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-lg border-t">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      R$ {(Number(selectedLote.preco) * quantidade).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleInitiatePurchase}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Processando...'
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Comprar com PIX
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-medium">
                  Ingressos esgotados ou vendas encerradas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, QrCode, XCircle } from 'lucide-react';
import { supabase, Ingresso, Evento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MyTicketsProps {
  onClose: () => void;
}

interface IngressoComEvento extends Ingresso {
  eventos: Evento;
}

export function MyTickets({ onClose }: MyTicketsProps) {
  const [ingressos, setIngressos] = useState<IngressoComEvento[]>([]);
  const [selectedIngresso, setSelectedIngresso] = useState<IngressoComEvento | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    loadIngressos();
  }, []);

  async function loadIngressos() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('ingressos')
      .select('*, eventos(*)')
      .eq('comprador_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setIngressos(data as IngressoComEvento[]);
    }
  }

  async function handleCancelTicket(ingresso: IngressoComEvento) {
    if (ingresso.status === 'usado') {
      alert('Não é possível cancelar um ingresso já utilizado.');
      return;
    }

    if (ingresso.status === 'cancelado') {
      alert('Este ingresso já está cancelado.');
      return;
    }

    if (!confirm('Tem certeza que deseja cancelar este ingresso? Esta ação não pode ser desfeita.')) {
      return;
    }

    const { error } = await supabase
      .from('ingressos')
      .update({ status: 'cancelado' })
      .eq('id', ingresso.id);

    if (!error) {
      const { error: loteError } = await supabase.rpc('devolver_ingresso_lote', {
        p_lote_id: ingresso.lote_id,
      });

      if (loteError) {
        console.error('Erro ao devolver ingresso ao lote:', loteError);
      }

      alert('Ingresso cancelado com sucesso!');
      loadIngressos();
    } else {
      alert('Erro ao cancelar ingresso. Tente novamente.');
    }
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, { text: string; class: string }> = {
      confirmado: { text: 'Confirmado', class: 'bg-green-100 text-green-800' },
      usado: { text: 'Usado', class: 'bg-gray-100 text-gray-800' },
      cancelado: { text: 'Cancelado', class: 'bg-red-100 text-red-800' },
      pendente: { text: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
    };
    return labels[status] || labels.confirmado;
  }

  if (selectedIngresso) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">QR Code do Ingresso</h3>
            <button
              onClick={() => setSelectedIngresso(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center">
            <div className="bg-white p-6 rounded-lg mb-4 inline-block">
              <div className="text-6xl font-mono bg-gray-100 p-8 rounded-lg">
                <QrCode className="w-32 h-32 mx-auto text-gray-400" />
                <p className="text-xs mt-4 text-gray-600 break-all">{selectedIngresso.codigo_qr}</p>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedIngresso.eventos.titulo}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Código: {selectedIngresso.codigo_qr.slice(0, 8).toUpperCase()}
            </p>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                getStatusLabel(selectedIngresso.status).class
              }`}
            >
              {getStatusLabel(selectedIngresso.status).text}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Meus Ingressos</h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ingressos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Você ainda não possui ingressos
            </h3>
            <p className="text-gray-600">Compre ingressos para eventos e eles aparecerão aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ingressos.map((ingresso) => (
              <div
                key={ingresso.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {ingresso.eventos.imagem_url && (
                  <img
                    src={ingresso.eventos.imagem_url}
                    alt={ingresso.eventos.titulo}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ingresso.eventos.titulo}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        getStatusLabel(ingresso.status).class
                      }`}
                    >
                      {getStatusLabel(ingresso.status).text}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(ingresso.eventos.data_evento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {ingresso.eventos.local}
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Valor Pago</p>
                        <p className="text-lg font-bold text-gray-900">
                          R$ {Number(ingresso.valor_pago).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedIngresso(ingresso)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <QrCode className="w-4 h-4" />
                        Ver QR Code
                      </button>
                    </div>
                    {ingresso.status !== 'cancelado' && ingresso.status !== 'usado' && (
                      <button
                        onClick={() => handleCancelTicket(ingresso)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar Ingresso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Users, Ticket, DollarSign } from 'lucide-react';
import { supabase, Ingresso, Evento } from '../lib/supabase';

interface EventBuyersProps {
  evento: Evento;
  onClose: () => void;
}

interface IngressoCompleto extends Ingresso {
  profiles: {
    nome: string;
    email: string;
  };
  lotes: {
    nome: string;
  };
}

export function EventBuyers({ evento, onClose }: EventBuyersProps) {
  const [ingressos, setIngressos] = useState<IngressoCompleto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIngressos();
  }, []);

  async function loadIngressos() {
    const { data, error } = await supabase
      .from('ingressos')
      .select('*, profiles!ingressos_comprador_id_fkey(nome, email), lotes(nome)')
      .eq('evento_id', evento.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setIngressos(data as IngressoCompleto[]);
    }
    setLoading(false);
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

  const totalVendido = ingressos.reduce((acc, ing) => acc + Number(ing.valor_pago), 0);
  const totalIngressos = ingressos.length;
  const ingressosUsados = ingressos.filter(i => i.status === 'usado').length;

  const compradoresPorEmail = ingressos.reduce((acc, ing) => {
    const email = ing.profiles.email;
    if (!acc[email]) {
      acc[email] = {
        nome: ing.profiles.nome,
        email: email,
        quantidade: 0,
        valor_total: 0,
      };
    }
    acc[email].quantidade += 1;
    acc[email].valor_total += Number(ing.valor_pago);
    return acc;
  }, {} as Record<string, { nome: string; email: string; quantidade: number; valor_total: number }>);

  const compradores = Object.values(compradoresPorEmail);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compradores do Evento</h2>
            <p className="text-gray-600">{evento.titulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total de Ingressos</p>
                      <p className="text-2xl font-bold text-gray-900">{totalIngressos}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Arrecadado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {totalVendido.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ingressos Usados</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {ingressosUsados}/{totalIngressos}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo por Comprador</h3>
                {compradores.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhum ingresso vendido ainda</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Nome
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Email
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                            Quantidade
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Valor Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {compradores.map((comprador) => (
                          <tr key={comprador.email} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {comprador.nome}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {comprador.email}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {comprador.quantidade} {comprador.quantidade === 1 ? 'ingresso' : 'ingressos'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              R$ {comprador.valor_total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos os Ingressos</h3>
                {ingressos.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhum ingresso vendido ainda</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Código
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Comprador
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Lote
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Valor
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                            Data Compra
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ingressos.map((ingresso) => (
                          <tr key={ingresso.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">
                              {ingresso.codigo_qr.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="text-gray-900">{ingresso.profiles.nome}</div>
                              <div className="text-gray-500 text-xs">{ingresso.profiles.email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {ingresso.lotes.nome}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                  getStatusLabel(ingresso.status).class
                                }`}
                              >
                                {getStatusLabel(ingresso.status).text}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              R$ {Number(ingresso.valor_pago).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(ingresso.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Trash2, CreditCard as Edit2, Ticket, QrCode, Layers, Users, LogOut } from 'lucide-react';
import { supabase, Evento, Lote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EventForm } from './EventForm';
import { ValidateTicket } from './ValidateTicket';
import { EventBuyers } from './EventBuyers';

interface EventoComLotes extends Evento {
  lotes?: Lote[];
}

export function AdminDashboard() {
  const [eventos, setEventos] = useState<EventoComLotes[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [showValidator, setShowValidator] = useState(false);
  const [showBuyers, setShowBuyers] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const { profile, signOut } = useAuth();

  useEffect(() => {
    loadEventos();
  }, []);

  async function loadEventos() {
    const { data: eventosData, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true });

    if (!error && eventosData) {
      const eventosComLotes = await Promise.all(
        eventosData.map(async (evento) => {
          const { data: lotes } = await supabase
            .from('lotes')
            .select('*')
            .eq('evento_id', evento.id)
            .order('ordem');
          return { ...evento, lotes: lotes || [] };
        })
      );
      setEventos(eventosComLotes);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (!error) loadEventos();
  }

  function handleEdit(evento: Evento) {
    setEditingEvent(evento);
    setShowEventForm(true);
  }

  function handleValidate(evento: Evento) {
    setSelectedEvent(evento);
    setShowValidator(true);
  }

  function handleViewBuyers(evento: Evento) {
    setSelectedEvent(evento);
    setShowBuyers(true);
  }

  function handleGoHome() {
    setShowEventForm(false);
    setEditingEvent(null);
    setShowValidator(false);
    setShowBuyers(false);
    setSelectedEvent(null);
  }

  const renderBackButton = (label = '← Voltar para Painel') => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <button
        onClick={handleGoHome}
        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
      >
        {label}
      </button>
    </div>
  );

  if (showBuyers && selectedEvent) {
    return (
      <>
        {renderBackButton()}
        <EventBuyers evento={selectedEvent} onClose={handleGoHome} />
      </>
    );
  }

  if (showValidator && selectedEvent) {
    return (
      <>
        {renderBackButton()}
        <ValidateTicket eventoId={selectedEvent.id} onClose={handleGoHome} />
      </>
    );
  }

  if (showEventForm) {
    return (
      <>
        {renderBackButton('← Voltar para Eventos')}
        <EventForm evento={editingEvent} onClose={handleGoHome} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-600 mt-1">Bem-vindo, {profile?.nome}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Criar Evento
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {eventos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento cadastrado</h3>
            <p className="text-gray-600 mb-4">Crie seu primeiro evento para começar a vender ingressos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => {
              const totalIngressos = evento.lotes?.reduce((acc, lote) => acc + lote.quantidade_total, 0) || 0;
              const totalVendidos = evento.lotes?.reduce((acc, lote) => acc + lote.quantidade_vendida, 0) || 0;
              const precoMinimo = evento.lotes && evento.lotes.length > 0
                ? Math.min(...evento.lotes.map(l => Number(l.preco)))
                : 0;

              return (
                <div key={evento.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {evento.imagem_url && (
                    <img src={evento.imagem_url} alt={evento.titulo} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{evento.titulo}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          evento.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {evento.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{evento.descricao}</p>

                    <div className="space-y-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(evento.data_evento).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {evento.local}
                      </div>
                    </div>

                    {evento.lotes && evento.lotes.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-700">
                            <Layers className="w-4 h-4" />
                            <strong>{evento.lotes.length}</strong> {evento.lotes.length === 1 ? 'Lote' : 'Lotes'}
                          </span>
                          <span className="text-blue-700 font-bold">
                            A partir de R$ {precoMinimo.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            <Ticket className="w-4 h-4 inline mr-1" />
                            {totalVendidos}/{totalIngressos} vendidos
                          </span>
                          <span className="text-gray-700 font-medium">
                            {totalIngressos - totalVendidos} disponíveis
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewBuyers(evento)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          <Users className="w-4 h-4" />
                          Compradores
                        </button>
                        <button
                          onClick={() => handleValidate(evento)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <QrCode className="w-4 h-4" />
                          Validar
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(evento)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(evento.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

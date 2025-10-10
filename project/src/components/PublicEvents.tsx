import { useState, useEffect } from 'react';
import { Calendar, MapPin, LogOut, Ticket, User } from 'lucide-react';
import { supabase, Evento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EventDetails } from './EventDetails';
import { MyTickets } from './MyTickets';

export function PublicEvents() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const { signOut, profile } = useAuth();

  useEffect(() => {
    loadEventos();
  }, []);

  async function loadEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('ativo', true)
      .gte('data_evento', new Date().toISOString())
      .order('data_evento', { ascending: true });

    if (!error && data) {
      setEventos(data);
    }
  }

  if (showMyTickets) {
    return <MyTickets onClose={() => setShowMyTickets(false)} />;
  }

  if (selectedEvent) {
    return (
      <EventDetails
        evento={selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          loadEventos();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMyTickets(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Ticket className="w-5 h-5" />
                Meus Ingressos
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{profile?.nome}</span>
              </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento disponível</h3>
            <p className="text-gray-600">Volte mais tarde para conferir novos eventos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                onClick={() => setSelectedEvent(evento)}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
              >
                {evento.imagem_url && (
                  <img
                    src={evento.imagem_url}
                    alt={evento.titulo}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{evento.titulo}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{evento.descricao}</p>

                  <div className="space-y-2 text-sm text-gray-600">
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

                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

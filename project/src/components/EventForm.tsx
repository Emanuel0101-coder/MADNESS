import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase, Evento, Lote } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EventFormProps {
  evento: Evento | null;
  onClose: () => void;
}

interface LoteForm {
  id?: string;
  nome: string;
  preco: string;
  quantidade_total: string;
  data_inicio: string;
  data_fim: string;
}

export function EventForm({ evento, onClose }: EventFormProps) {
  const { profile } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [lotes, setLotes] = useState<LoteForm[]>([
    {
      nome: '1º Lote',
      preco: '',
      quantidade_total: '',
      data_inicio: '',
      data_fim: '',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setDescricao(evento.descricao);
      setLocal(evento.local);
      setDataEvento(evento.data_evento.slice(0, 16));
      setImagemUrl(evento.imagem_url || '');
      setAtivo(evento.ativo);
      loadLotes(evento.id);
    }
  }, [evento]);

  async function loadLotes(eventoId: string) {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('evento_id', eventoId)
      .order('ordem');

    if (!error && data) {
      setLotes(
        data.map((lote) => ({
          id: lote.id,
          nome: lote.nome,
          preco: lote.preco.toString(),
          quantidade_total: lote.quantidade_total.toString(),
          data_inicio: lote.data_inicio.slice(0, 16),
          data_fim: lote.data_fim.slice(0, 16),
        }))
      );
    }
  }

  function addLote() {
    setLotes([
      ...lotes,
      {
        nome: `${lotes.length + 1}º Lote`,
        preco: '',
        quantidade_total: '',
        data_inicio: '',
        data_fim: '',
      },
    ]);
  }

  function removeLote(index: number) {
    setLotes(lotes.filter((_, i) => i !== index));
  }

  function updateLote(index: number, field: keyof LoteForm, value: string) {
    const newLotes = [...lotes];
    newLotes[index] = { ...newLotes[index], [field]: value };
    setLotes(newLotes);
  }

  // 🧩 Função para fazer upload da imagem no Supabase
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('imagens_eventos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('imagens_eventos')
        .getPublicUrl(fileName);

      setImagemUrl(publicUrlData.publicUrl);
    } catch (error) {
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (evento) {
        const { error: eventoError } = await supabase
          .from('eventos')
          .update({
            titulo,
            descricao,
            local,
            data_evento: dataEvento,
            imagem_url: imagemUrl,
            ativo,
          })
          .eq('id', evento.id);

        if (eventoError) throw eventoError;

        const { error: deleteLotesError } = await supabase
          .from('lotes')
          .delete()
          .eq('evento_id', evento.id);

        if (deleteLotesError) throw deleteLotesError;

        for (let i = 0; i < lotes.length; i++) {
          const lote = lotes[i];
          const { error: loteError } = await supabase.from('lotes').insert({
            evento_id: evento.id,
            nome: lote.nome,
            preco: parseFloat(lote.preco),
            quantidade_total: parseInt(lote.quantidade_total),
            quantidade_vendida: 0,
            data_inicio: lote.data_inicio,
            data_fim: lote.data_fim,
            ordem: i,
          });

          if (loteError) throw loteError;
        }
      } else {
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .insert({
            titulo,
            descricao,
            local,
            data_evento: dataEvento,
            imagem_url: imagemUrl || null,
            ativo,
            created_by: profile?.id,
          })
          .select()
          .single();

        if (eventoError) throw eventoError;

        for (let i = 0; i < lotes.length; i++) {
          const lote = lotes[i];
          const { error: loteError } = await supabase.from('lotes').insert({
            evento_id: eventoData.id,
            nome: lote.nome,
            preco: parseFloat(lote.preco),
            quantidade_total: parseInt(lote.quantidade_total),
            quantidade_vendida: 0,
            data_inicio: lote.data_inicio,
            data_fim: lote.data_fim,
            ordem: i,
          });

          if (loteError) throw loteError;
        }
      }

      onClose();
    } catch (error) {
      alert('Erro ao salvar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {evento ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Evento
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora do Evento
              </label>
              <input
                type="datetime-local"
                value={dataEvento}
                onChange={(e) => setDataEvento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Upload de imagem */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem do Evento
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {uploading && <p className="text-sm text-gray-500 mt-2">Enviando imagem...</p>}
              {imagemUrl && (
                <img
                  src={imagemUrl}
                  alt="Pré-visualização"
                  className="mt-3 w-48 h-32 object-cover rounded-lg border"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Evento ativo</span>
              </label>
            </div>
          </div>

          {/* Lotes */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lotes</h3>
              <button
                type="button"
                onClick={addLote}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Adicionar Lote
              </button>
            </div>

            <div className="space-y-4">
              {lotes.map((lote, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-900">Lote {index + 1}</span>
                    {lotes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLote(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Lote
                      </label>
                      <input
                        type="text"
                        value={lote.nome}
                        onChange={(e) => updateLote(index, 'nome', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={lote.preco}
                        onChange={(e) => updateLote(index, 'preco', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={lote.quantidade_total}
                        onChange={(e) => updateLote(index, 'quantidade_total', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Início das Vendas
                      </label>
                      <input
                        type="datetime-local"
                        value={lote.data_inicio}
                        onChange={(e) => updateLote(index, 'data_inicio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fim das Vendas
                      </label>
                      <input
                        type="datetime-local"
                        value={lote.data_fim}
                        onChange={(e) => updateLote(index, 'data_fim', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : uploading ? 'Enviando imagem...' : 'Salvar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicEvents } from './components/PublicEvents';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [pixData, setPixData] = useState<any>(null);
  const [loadingPix, setLoadingPix] = useState(false);

  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Usuário não logado → mostra tela de login
  if (!user || !profile) {
    return <AuthForm />;
  }

  // Função para gerar PIX
  const gerarPix = async () => {
    setLoadingPix(true);
    try {
      const res = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: 100,
          descricao: 'Ingresso Madness',
          email: user.email || 'teste@exemplo.com'
        })
      });
      if (!res.ok) throw new Error('Erro ao gerar PIX');
      const data = await res.json();
      setPixData(data); // Salva os dados do PIX no estado
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PIX. Confira o console.');
    } finally {
      setLoadingPix(false);
    }
  };

  // Usuário logado → renderiza painel
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            {profile.is_admin ? 'Painel Administrativo' : 'Painel de Usuário'}
          </h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="p-4">
        {profile.is_admin ? (
          <AdminDashboard />
        ) : (
          <>
            <PublicEvents />
            {/* Botão para gerar PIX */}
            <div className="mt-6">
              <button
                onClick={gerarPix}
                disabled={loadingPix}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {loadingPix ? 'Gerando PIX...' : 'Gerar PIX'}
              </button>

              {/* Mostra QR Code se gerado */}
              {pixData && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">PIX Gerado:</p>
                  <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="PIX QR Code" />
                  <p className="mt-2 text-sm text-gray-600">ID do pagamento: {pixData.payment_id}</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicEvents } from './components/PublicEvents';
import { LogOut } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();

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

      <main>
        {profile.is_admin ? <AdminDashboard /> : <PublicEvents />}
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

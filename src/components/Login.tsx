import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Loader2, X, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  isPendingUser?: boolean;
  pendingEmail?: string;
}

export const Login = ({ isPendingUser, pendingEmail }: LoginProps) => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      if (isRegister && err?.message?.includes('Failed to fetch')) {
        // Network error might mean server is down, but creds could still work
        setError('Server PocketBase non raggiungibile. Verifica che sia in esecuzione.');
      } else if (isRegister && err?.status === 400) {
        setError('Email o password non validi.');
      } else if (!isRegister && err?.status === 400) {
        setError('Credenziali non corrette.');
      } else {
        setError(err?.message || 'Errore di connessione.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="bg-primary/20 p-4 rounded-full mb-4"
            >
              <Dumbbell className="w-12 h-12 text-blue-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Cross2</h1>
            <p className="text-gray-400 text-center">
              {isRegister ? 'Crea un account' : 'Accedi al tuo account'}
            </p>
          </div>

          {isPendingUser && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-500 text-center text-sm">
                Il tuo account non è ancora abilitato.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={5}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegister ? 'Creando account...' : 'Accesso...'}
                </>
              ) : (
                isRegister ? 'Crea Account' : 'Accedi'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {isRegister ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
            </button>
          </div>

          {pendingEmail && (
            <div className="mt-4 p-3 bg-dark-bg rounded-lg">
              <p className="text-gray-400 text-xs text-center">
                Accesso richiesto da: {pendingEmail}
              </p>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-xs text-center mt-4">
          Powered by PocketBase
        </p>
      </motion.div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Trash2, RefreshCw } from 'lucide-react';
import { pb } from '../pbService';

interface PendingUser {
  id: string;
  email: string;
  role: string;
  displayName?: string;
  created?: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all users with pending role
      const pending = await pb.collection('user_profiles').getFullList({
        filter: `role="pending"`,
      });
      setPendingUsers(pending as any);

      // Get all users
      const all = await pb.collection('user_profiles').getFullList();
      setAllUsers(all as any);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await pb.collection('user_profiles').update(userId, { role });
      loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const enableUser = async (userId: string) => {
    await updateUserRole(userId, 'enabled');
  };

  const deleteUserProfile = async (userId: string) => {
    if (!confirm('Eliminare questo profilo?')) return;
    try {
      await pb.collection('user_profiles').delete(userId);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button onClick={loadUsers} className="ml-auto text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Pending Users */}
        <section>
          <h2 className="text-white font-semibold mb-3">Utenti in attesa ({pendingUsers.length})</h2>
          {loading ? (
            <p className="text-gray-500">Caricamento...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun utente in attesa</p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{user.displayName || user.email}</p>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => enableUser(user.id)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      title="Approva"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUserProfile(user.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      title="Rifiuta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Users */}
        <section>
          <h2 className="text-white font-semibold mb-3">Tutti gli utenti ({allUsers.length})</h2>
          <div className="space-y-2">
            {allUsers.map(user => (
              <div key={user.id} className="bg-dark-card border border-dark-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{user.displayName || user.email}</p>
                  <p className="text-gray-500 text-sm">
                    {user.email} · <span className="capitalize">{user.role}</span>
                  </p>
                </div>
                <select
                  value={user.role}
                  onChange={e => updateUserRole(user.id, e.target.value)}
                  className="px-3 py-1 bg-dark-bg border border-dark-border rounded text-white text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="enabled">Enabled</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

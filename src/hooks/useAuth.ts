import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut, 
  createPendingUser,
  createPendingAccessRequest,
  ADMIN_EMAIL,
  APP_ACCESS_SLUG,
  auth,
  getUserRole as getUserRoleFromFirebase
} from '../firebase/auth';
import { pb } from '../pbService';

export type UserRole = 'admin' | 'enabled' | 'pending' | null;

interface UseAuthReturn {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (requestEmail?: string, requestMessage?: string) => Promise<void>;
  chooseGoogleAccountForRequest: () => Promise<{ email: string; name: string; photoURL: string | null }>;
  submitAccessRequest: (payload: { email: string; name?: string; photoURL?: string | null; message: string }) => Promise<{ emailSent: boolean }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

// Get user role from PocketBase
async function getUserRole(email: string): Promise<'enabled' | 'pending' | null> {
  try {
    const records = await pb.collection('user_profiles').getFullList({
      filter: `email = '${email.toLowerCase()}'`,
    });
    if (records.length > 0) {
      const apps = Array.isArray(records[0].apps) ? records[0].apps : [];
      if (apps.length > 0 && !apps.includes(APP_ACCESS_SLUG)) {
        return getUserRoleFromFirebase(email);
      }
      return records[0].role || 'pending';
    }
    return getUserRoleFromFirebase(email);
  } catch {
    // Fallback to Firebase
    return getUserRoleFromFirebase(email);
  }
}

// Save user to PocketBase
async function saveUserToPocketBase(email: string, role: string, extraData: any = {}) {
  try {
    const existing = await pb.collection('user_profiles').getFullList({
      filter: `email = '${email.toLowerCase()}'`,
    });
    
    if (existing.length > 0) {
      await pb.collection('user_profiles').update(existing[0].id, {
        role,
        apps: Array.from(new Set([...(Array.isArray(existing[0].apps) ? existing[0].apps : []), APP_ACCESS_SLUG])),
        ...extraData
      });
    } else {
      await pb.collection('user_profiles').create({
        email: email.toLowerCase(),
        role,
        apps: [APP_ACCESS_SLUG],
        name: extraData.name || '',
        ...extraData
      });
    }
  } catch (e) {
    console.error('Error saving user to PocketBase:', e);
  }
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (user: User | null) => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    
    // Admin always has access (case-insensitive)
    if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setRole('admin');
      setLoading(false);
      return;
    }
    
    try {
      // Timeout for role fetch
      const timeoutPromise = new Promise<'pending'>((resolve) => {
        setTimeout(() => resolve('pending'), 5000);
      });
      
      const userRole = await Promise.race([
        getUserRole(user.email!),
        timeoutPromise
      ]);
      
      if (userRole === 'enabled' || userRole === 'admin') {
        setRole(userRole);
      } else {
        setRole('pending');
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole('pending');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('[useAuth] Auth timeout - forcing loading false');
      setLoading(false);
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      await fetchRole(firebaseUser);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = async (requestEmail?: string, requestMessage?: string) => {
    try {
      // Legacy request-access path. New UI uses submitAccessRequest + chooseGoogleAccountForRequest.
      if (requestEmail && requestMessage) {
        await createPendingAccessRequest({
          email: requestEmail,
          name: requestEmail.split('@')[0],
          message: requestMessage
        });
      }
      
      const firebaseUser = await signInWithGoogle();
      setUser(firebaseUser);
      
      // Admin always has access (case-insensitive)
      if (firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setRole('admin');
        return;
      }
      
      // Check if user exists in PocketBase
      const userRole = await getUserRole(firebaseUser.email!);
      
      if (userRole === 'enabled' || userRole === 'admin') {
        setRole(userRole);
      } else {
        // New user - create pending request
        try {
          await saveUserToPocketBase(firebaseUser.email!, 'pending', {
            name: firebaseUser.displayName || '',
          });
        } catch (e) {
          console.error('Error creating pending user:', e);
        }
        setRole('pending');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const chooseGoogleAccountForRequest = async () => {
    const firebaseUser = await signInWithGoogle(true);
    const selected = {
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || null,
    };

    await logOut();
    setUser(null);
    setRole(null);

    if (!selected.email) {
      throw new Error('Nessun account Google valido selezionato');
    }

    return selected;
  };

  const submitAccessRequest = async (payload: { email: string; name?: string; photoURL?: string | null; message: string }) => {
    return createPendingAccessRequest(payload);
  };

  const signOut = async () => {
    await logOut();
    setUser(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (user) {
      await fetchRole(user);
    }
  };

  return { user, role, loading, signIn, chooseGoogleAccountForRequest, submitAccessRequest, signOut, refreshRole };
};

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Subscription {
  tier: string;
  status: string;
  trial_end?: string;
  subscription_end?: string;
  days_left?: number;
  is_trial?: boolean;
  is_expired?: boolean;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture?: string | null;
  is_verified?: number;
  subscription?: Subscription;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshSubscription: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('teacherhub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('teacherhub_token');
  });

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('teacherhub_token', newToken);
    localStorage.setItem('teacherhub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: AuthUser) => {
    localStorage.setItem('teacherhub_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshSubscription = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, subscription: data.subscription } as AuthUser;
        updateUser(updatedUser);
      }
    } catch (e) {
      console.error('Failed to refresh subscription:', e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshSubscription();
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('teacherhub_token');
    localStorage.removeItem('teacherhub_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

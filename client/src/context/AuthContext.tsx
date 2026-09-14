import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthRole = 'guest' | 'user' | 'admin';

type AuthContextValue = {
  identifier: string;
  role: AuthRole;
  login: (identifier: string) => AuthRole;
  logout: () => void;
};

const adminCode = 'knda123';
const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<AuthRole>('guest');

  function login(nextIdentifier: string) {
    const trimmedIdentifier = nextIdentifier.trim();
    const nextRole: AuthRole = trimmedIdentifier === adminCode ? 'admin' : 'user';

    setIdentifier(trimmedIdentifier);
    setRole(nextRole);

    return nextRole;
  }

  function logout() {
    setIdentifier('');
    setRole('guest');
  }

  const value = useMemo(
    () => ({
      identifier,
      role,
      login,
      logout
    }),
    [identifier, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  }

  return context;
}

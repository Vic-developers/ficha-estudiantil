import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchProfile,
  signIn as signInService,
  signOut as signOutService,
  signUp as signUpService,
  toAuthUser,
} from "@/services/auth";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await supabase.auth.getSession();
    const currentUser = session.data.session?.user;
    if (!currentUser) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(currentUser.id);
    setUser(toAuthUser(profile, currentUser.email));
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      await refreshUser();
      if (active) setLoading(false);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void refreshUser();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      loading,
      signIn: signInService,
      signUp: signUpService,
      signOut: signOutService,
      refreshUser,
    }),
    [user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
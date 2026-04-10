import NetInfo from "@react-native-community/netinfo";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  hasProfile: boolean;
  checkProfileStatus: (userId?: string) => Promise<void>;
}

/**
 * Provee un contexto de autenticación para manejar el estado del usuario, sesión y perfil en la aplicación
 * Permite a los componentes hijos acceder a la información de autenticación y verificar el estado del perfil del usuario
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  hasProfile: false,
  checkProfileStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  const checkProfileStatus = async (userId?: string) => {
    const idToCheck = userId || user?.id;
    if (!idToCheck) {
      setHasProfile(false);
      return;
    }

    /**
     * Verifica la conexión a internet antes de intentar consultar el perfil del usuario en Supabase.
     * Si no hay conexión, asume que el perfil existe para evitar bloquear la experiencia del usuario.
     */
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      setHasProfile(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, height")
        .eq("id", idToCheck)
        .single();

      if (data && data.height && !error) {
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      setHasProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await checkProfileStatus(session.user.id);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        debugError("Error loading session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await checkProfileStatus(currentSession.user.id);
      } else {
        setHasProfile(false);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        hasProfile,
        checkProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

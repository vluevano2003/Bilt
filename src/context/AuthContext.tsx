import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

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

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", idToCheck)
        .single();

      if (data && !error) {
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      setHasProfile(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkProfileStatus(session.user.id).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkProfileStatus(session.user.id);
      } else {
        setHasProfile(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, hasProfile, checkProfileStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};

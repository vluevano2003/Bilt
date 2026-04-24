import NetInfo from "@react-native-community/netinfo";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../config/supabase";

const debugError = (...args: any[]) => {
  if (__DEV__) console.error(...args);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  hasProfile: boolean;
  isError: boolean;
  retryInit: () => void;
  checkProfileStatus: (userId?: string) => Promise<void>;
}

/**
 * Contexto de autenticación que maneja el estado del usuario, sesión, carga y errores.
 * Proporciona funciones para inicializar la autenticación y verificar el estado del perfil.
 * Se asegura de manejar correctamente los estados de carga y errores, especialmente en situaciones de red inestable.
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  hasProfile: false,
  isError: false,
  retryInit: () => {},
  checkProfileStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * Proveedor de autenticación que envuelve la aplicación y proporciona el contexto de autenticación a sus hijos.
 * @param param0
 * @returns
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isError, setIsError] = useState(false);

  /**
   * Verifica el estado del perfil del usuario consultando la base de datos.
   * Si el usuario no tiene un perfil completo, se establece hasProfile en false.
   * Si no hay conexión a internet, se asume que el perfil existe para evitar bloqueos.
   * @param userId
   * @returns
   */
  const checkProfileStatus = async (userId?: string) => {
    const idToCheck = userId || user?.id;
    if (!idToCheck) {
      setHasProfile(false);
      return;
    }

    /**
     * Verificar el estado de la red antes de intentar consultar la base de datos.
     * Si no hay conexión, asumimos que el perfil existe para evitar bloquear al usuario.
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

      if (error) {
        if (error.code === "PGRST116") {
          setHasProfile(false);
        } else {
          setHasProfile(true);
        }
      } else if (data && data.height) {
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      setHasProfile(true);
    }
  };

  /**
   * Inicializa la autenticación verificando la sesión actual y configurando el estado del usuario.
   * Maneja un timeout de seguridad para evitar bloqueos prolongados en caso de problemas de red.
   * Si la sesión es válida, verifica el estado del perfil del usuario.
   * Si ocurre un error durante la inicialización, se establece isError en true.
   */
  const initializeAuth = useCallback(async () => {
    setIsError(false);
    setIsLoading(true);

    /**
     * Timeout de seguridad para evitar bloqueos prolongados en caso de problemas de red o respuestas lentas del servidor.
     * Si la conexión tarda más de 6 segundos, se asume que hay un problema y se muestra un error.
     */
    const fallbackTimeout = setTimeout(() => {
      debugError("Timeout de seguridad: La conexión tardó demasiado.");
      setIsError(true);
      setIsLoading(false);
    }, 6000);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkProfileStatus(session.user.id);
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      debugError("Error loading session:", error);
      setIsError(true);
    } finally {
      clearTimeout(fallbackTimeout);
      setIsLoading(false);
    }
  }, []);

  // Efecto para inicializar la autenticación y configurar el listener de cambios de estado de autenticación.
  useEffect(() => {
    let mounted = true;

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        checkProfileStatus(currentSession.user.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setHasProfile(false);
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        hasProfile,
        isError,
        retryInit: initializeAuth,
        checkProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isError, setIsError] = useState(false);

  const checkProfileStatus = async (userId?: string) => {
    const idToCheck = userId || user?.id;
    if (!idToCheck) {
      setHasProfile(false);
      return;
    }

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

  const initializeAuth = useCallback(async () => {
    setIsError(false);
    setIsLoading(true);

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

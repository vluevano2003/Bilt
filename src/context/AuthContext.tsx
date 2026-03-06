import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";

/**
 * AuthContextType define la estructura del contexto de autenticación, incluyendo el usuario autenticado y el estado de carga
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

/**
 * AuthContext es el contexto de autenticación que se utiliza para compartir el estado de autenticación en toda la aplicación
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

/**
 * useAuth es un hook personalizado que permite acceder al contexto de autenticación en cualquier componente de la aplicación
 * @returns
 */
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider es un componente que envuelve a la aplicación y proporciona el contexto de autenticación a todos los componentes hijos. Utiliza el hook onAuthStateChanged para escuchar los cambios en el estado de autenticación y actualizar el contexto en consecuencia.
 * @param param0
 * @returns
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../src/config/firebase";

export const useUserActivity = (userId?: string) => {
  const [userRoutines, setUserRoutines] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchActivity = async () => {
      setIsLoadingActivity(true);
      try {
        // 1. Obtener Rutinas de la subcolección del usuario
        const routinesQuery = query(
          collection(db, "users", userId, "routines"),
        );
        const routinesSnap = await getDocs(routinesQuery);
        const routinesData = routinesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserRoutines(routinesData);

        // 2. Obtener Historial de la subcolección del usuario
        const historyQuery = query(
          collection(db, "users", userId, "history"),
          orderBy("completedAt", "desc"),
        );
        const historySnap = await getDocs(historyQuery);
        const historyData = historySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserHistory(historyData);
      } catch (error) {
        console.error("Error obteniendo actividad del usuario:", error);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [userId]);

  return { userRoutines, userHistory, isLoadingActivity };
};

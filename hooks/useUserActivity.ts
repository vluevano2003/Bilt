import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../src/config/firebase";

/**
 * Hook personalizado para escuchar en tiempo real las rutinas y el historial de un usuario
 * @param userId
 * @returns
 */
export const useUserActivity = (userId?: string) => {
  const [userRoutines, setUserRoutines] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoadingActivity(false);
      return;
    }

    setIsLoadingActivity(true);

    const routinesQuery = query(collection(db, "users", userId, "routines"));

    const unsubscribeRoutines = onSnapshot(
      routinesQuery,
      (snapshot) => {
        const routinesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserRoutines(routinesData);
      },
      (error) => {
        console.error("Error escuchando rutinas del usuario:", error);
      },
    );

    const historyQuery = query(
      collection(db, "users", userId, "history"),
      orderBy("completedAt", "desc"),
    );

    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserHistory(historyData);
        setIsLoadingActivity(false);
      },
      (error) => {
        console.error("Error escuchando historial del usuario:", error);
        setIsLoadingActivity(false);
      },
    );
    return () => {
      unsubscribeRoutines();
      unsubscribeHistory();
    };
  }, [userId]);

  return { userRoutines, userHistory, isLoadingActivity };
};

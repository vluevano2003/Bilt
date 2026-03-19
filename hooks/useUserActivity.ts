import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../src/config/firebase";
import { WeeklyPack } from "./useWeeklyPacks";

/**
 * Hook personalizado para escuchar en tiempo real las rutinas, historial y packs de un usuario
 * @param userId
 * @returns
 */
export const useUserActivity = (userId?: string) => {
  const [userRoutines, setUserRoutines] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userPacks, setUserPacks] = useState<WeeklyPack[]>([]);
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
      (error) => console.error("Error escuchando rutinas del usuario:", error),
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

    const packsQuery = query(collection(db, "users", userId, "weekly_packs"));
    const unsubscribePacks = onSnapshot(
      packsQuery,
      (snapshot) => {
        const packsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WeeklyPack[];
        packsData.sort((a, b) => b.createdAt - a.createdAt);
        setUserPacks(packsData);
      },
      (error) => console.error("Error escuchando packs del usuario:", error),
    );

    return () => {
      unsubscribeRoutines();
      unsubscribeHistory();
      unsubscribePacks();
    };
  }, [userId]);

  return { userRoutines, userHistory, userPacks, isLoadingActivity };
};

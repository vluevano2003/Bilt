import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { auth, db } from "../src/config/firebase";

export interface FeedItem {
  id: string;
  type: "routine" | "history";
  userId: string;
  username: string;
  userAvatar?: string;
  timestamp: number;
  title: string;
  details: {
    duration?: number;
    volume?: number;
    exerciseCount?: number;
  };
}

/**
 * Custom hook para manejar el feed social de la aplicación. Este hook se encarga de:
 * 1. Obtener la lista de usuarios que el usuario actual sigue.
 * 2. Para cada usuario seguido, obtener sus entrenamientos completados (historial) y rutinas creadas.
 * 3. Combinar y ordenar estos items por fecha para mostrar un feed cronológico.
 * 4. Proporcionar estados de carga y refresco para mejorar la experiencia del usuario.
 */
export const useSocialFeed = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    try {
      const followingRef = collection(db, "users", currentUserId, "following");
      const followingSnap = await getDocs(followingRef);
      const followedIds: string[] = [];

      followingSnap.forEach((doc) => {
        if (doc.data().status === "accepted") {
          followedIds.push(doc.id);
        }
      });

      if (followedIds.length === 0) {
        setFeed([]);
        return;
      }

      let allItems: FeedItem[] = [];

      for (const targetId of followedIds) {
        const userDoc = await getDoc(doc(db, "users", targetId));
        if (!userDoc.exists()) continue;

        const userData = userDoc.data();

        const historyQ = query(
          collection(db, "users", targetId, "history"),
          orderBy("completedAt", "desc"),
          limit(3),
        );
        const historySnap = await getDocs(historyQ);

        historySnap.forEach((docItem) => {
          const data = docItem.data();
          let totalVolume = 0;
          data.exercises?.forEach((ex: any) => {
            ex.sets?.forEach((set: any) => {
              if (set.completed)
                totalVolume += (set.weight || 0) * (set.reps || 0);
            });
          });

          allItems.push({
            id: `hist_${docItem.id}`,
            type: "history",
            userId: targetId,
            username: userData.username,
            userAvatar: userData.profilePictureUrl,
            timestamp: data.completedAt,
            title: data.routineName || "",
            details: {
              duration: data.durationSeconds,
              volume: Math.round(totalVolume),
            },
          });
        });

        const routinesQ = query(
          collection(db, "users", targetId, "routines"),
          orderBy("createdAt", "desc"),
          limit(3),
        );
        const routinesSnap = await getDocs(routinesQ);

        routinesSnap.forEach((docItem) => {
          const data = docItem.data();
          if (!data.originalCreatorId || data.originalCreatorId === targetId) {
            allItems.push({
              id: `rout_${docItem.id}`,
              type: "routine",
              userId: targetId,
              username: userData.username,
              userAvatar: userData.profilePictureUrl,
              timestamp: data.createdAt,
              title: data.name,
              details: {
                exerciseCount: data.exercises?.length || 0,
              },
            });
          }
        });
      }
      allItems.sort((a, b) => b.timestamp - a.timestamp);
      setFeed(allItems);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
  }, []);

  useEffect(() => {
    setLoadingFeed(true);
    fetchFeed().then(() => setLoadingFeed(false));
  }, [fetchFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  return { feed, loadingFeed, refreshing, onRefresh };
};

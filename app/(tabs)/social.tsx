import { AntDesign, Feather, FontAwesome5 } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, verticalScale, scale } from "../../src/utils/Responsive";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSocialFeed } from "../../hooks/useSocialFeed";
import { useAchievements, ACHIEVEMENTS_LIST } from "../../hooks/useAchievements";
import { useRoutines } from "../../hooks/useRoutines";
import { supabase } from "../../src/config/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../src/context/ThemeContext";
import { getStyles } from "../../src/styles/SocialScreen.styles";
import { ItemDetailsModal } from "../../src/components/ProfileModals";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

interface SearchResult {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

/**
 * Función auxiliar para formatear el tiempo transcurrido desde una fecha dada, mostrando "Justo ahora", "Hace X min/h/d" o la fecha completa si es más de una semana.
 * @param timestamp
 * @param t
 * @returns
 */
const getTimeAgo = (timestamp: number, t: any) => {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return t("social.time.justNow");
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return t("social.time.minsAgo", {
      count: diffInMinutes,
      defaultValue: `Hace ${diffInMinutes} min`,
    });
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return t("social.time.hoursAgo", {
      count: diffInHours,
      defaultValue: `Hace ${diffInHours} h`,
    });
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return t("social.time.daysAgo", {
      count: diffInDays,
      defaultValue: `Hace ${diffInDays} d`,
    });
  return new Date(timestamp).toLocaleDateString();
};

const ITEMS_PER_PAGE = 15;

/**
 * Componente memoizado para mostrar cada resultado de búsqueda de usuario, con su avatar, nombre de usuario y un botón para ir a su perfil.
 */
const UserSearchCard = React.memo(({ item, colors, styles, onPress, onRemove }: any) => (
  <TouchableOpacity style={styles.userCard} onPress={() => onPress(item)}>
    {item.profilePictureUrl ? (
      <Image
        source={{ uri: item.profilePictureUrl }}
        style={styles.userAvatar}
      />
    ) : (
      <View style={styles.userAvatarPlaceholder}>
        <AntDesign
          name="user"
          size={moderateScale(24)}
          color={colors.textSecondary}
        />
      </View>
    )}
    <Text style={styles.usernameText}>@{item.username}</Text>
    {onRemove ? (
      <TouchableOpacity onPress={() => onRemove(item.id)} style={{ padding: scale(5) }}>
        <Feather name="x" size={moderateScale(20)} color={colors.textSecondary} />
      </TouchableOpacity>
    ) : (
      <Feather
        name="chevron-right"
        size={moderateScale(20)}
        color={colors.textSecondary}
      />
    )}
  </TouchableOpacity>
));

/**
 * Componente memoizado para mostrar cada actividad en el feed, ya sea una rutina creada o un entrenamiento completado, con detalles como duración, volumen o número de ejercicios, y un anuncio cada 5 publicaciones.
 */
const FeedActivityCard = React.memo(
  ({ item, showAd, colors, styles, t, onPressUser, onPressItem }: any) => {
    const isWorkout = item.type === "history";

    return (
      <>
        <TouchableOpacity style={styles.feedCard} activeOpacity={0.8} onPress={() => onPressItem && onPressItem(item)}>
          <View style={styles.feedHeader}>
            <TouchableOpacity onPress={() => onPressUser(item.userId)}>
              {item.userAvatar ? (
                <Image
                  source={{ uri: item.userAvatar }}
                  style={styles.feedAvatar}
                />
              ) : (
                <View style={styles.feedAvatarPlaceholder}>
                  <AntDesign
                    name="user"
                    size={moderateScale(20)}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.feedHeaderText}>
              <TouchableOpacity onPress={() => onPressUser(item.userId)}>
                <Text style={styles.feedUsername}>@{item.username}</Text>
              </TouchableOpacity>
              <Text style={styles.feedAction}>
                {item.type === "history"
                  ? t("social.completedWorkout")
                  : item.type === "achievement"
                    ? t("social.earnedAchievement", { defaultValue: "Obtuvo un nuevo logro" })
                    : t("social.createdRoutine")}
              </Text>
            </View>
            <Text style={styles.feedTime}>{getTimeAgo(item.timestamp, t)}</Text>
          </View>
          <View style={styles.feedContent}>
            <Text style={styles.feedTitle}>
              {item.type === "achievement" ? 
                (ACHIEVEMENTS_LIST.find((a) => a.id === item.title) ? t(ACHIEVEMENTS_LIST.find((a) => a.id === item.title)!.titleKey) : item.title) 
                : (item.title || t("social.defaultWorkout"))}
            </Text>
            <View style={styles.feedStats}>
              {item.type === "achievement" ? (
                 <Text style={styles.feedStatText}>
                    {ACHIEVEMENTS_LIST.find((a) => a.id === item.title)?.icon === "fire" ? (
                      <FontAwesome5 name="fire" size={moderateScale(12)} color={ACHIEVEMENTS_LIST.find((a) => a.id === item.title)?.color || "#f97316"} />
                    ) : (
                      <Feather name={ACHIEVEMENTS_LIST.find((a) => a.id === item.title)?.icon as any || "award"} size={moderateScale(12)} color={ACHIEVEMENTS_LIST.find((a) => a.id === item.title)?.color || "#f97316"} />
                    )}{" "}
                    {ACHIEVEMENTS_LIST.find((a) => a.id === item.title) ? t(ACHIEVEMENTS_LIST.find((a) => a.id === item.title)!.descKey) : t("social.congratulations", { defaultValue: "Felicidades" })}
                 </Text>
              ) : isWorkout ? (
                <>
                  <Text style={styles.feedStatText}>
                    <Feather name="clock" size={moderateScale(12)} />{" "}
                    {Math.ceil((item.details.duration || 0) / 60)} min
                  </Text>
                  <Text style={styles.feedStatText}>
                    <Feather name="activity" size={moderateScale(12)} />{" "}
                    {item.details.volume} {item.details.volumeUnit || "kg"}
                  </Text>
                </>
              ) : (
                <Text style={styles.feedStatText}>
                  <Feather name="list" size={moderateScale(12)} />{" "}
                  {item.details.exerciseCount} {t("routines.exercises")}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {showAd && (
          <View style={styles.adContainer}>
            <Text style={styles.adLabelText}>{t("social.advertisement", { defaultValue: "Publicidad" })}</Text>
            <BannerAd
              unitId={
                __DEV__
                  ? TestIds.BANNER
                  : (process.env.EXPO_PUBLIC_ADMOB_BANNER_SOCIAL as string)
              }
              size={BannerAdSize.MEDIUM_RECTANGLE}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}
      </>
    );
  },
);

/**
 * Pantalla principal de la pestaña Social, que incluye el feed de actividades y el buscador de usuarios.
 * @returns
 */
export default function SocialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"feed" | "search">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { feed, loadingFeed, refreshing, onRefresh } = useSocialFeed();
  const [page, setPage] = useState(1);
  const displayedFeed = feed.slice(0, page * ITEMS_PER_PAGE);

  const { measurementSystem, weight } = useProfile();
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const { routines: myRoutines, deleteRoutine } = useRoutines();

  useEffect(() => {
    if (user?.id) loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(`@gym_tracker_search_history_${user?.id}`);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch (error) {
      debugLog("Error loading history:", error);
    }
  };

  const addToHistory = (userItem: SearchResult) => {
    try {
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item.id !== userItem.id);
        const newHistory = [userItem, ...filtered].slice(0, 20);
        AsyncStorage.setItem(`@gym_tracker_search_history_${user?.id}`, JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      debugLog("Error saving history:", error);
    }
  };

  const removeHistoryItem = async (userId: string) => {
    try {
      setSearchHistory(prev => {
        const newHistory = prev.filter(item => item.id !== userId);
        AsyncStorage.setItem(`@gym_tracker_search_history_${user?.id}`, JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      debugLog("Error removing history item:", error);
    }
  };

  const clearAllHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(`@gym_tracker_search_history_${user?.id}`);
    } catch (error) {
      debugLog("Error clearing history:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!selectedItem || selectedItem.type !== "routine" || !user?.id) return;
    const originalId = selectedItem.fullData.id;

    const savedRoutine = myRoutines.find((r) => r.originalRoutineId === originalId);
    if (savedRoutine) {
      try {
        await deleteRoutine(savedRoutine.id);
        Alert.alert(t("profile.alerts.success"), t("routines.successRemoved"));
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    } else {
      try {
        const { error } = await supabase.from("routines").insert([
          {
            user_id: user.id,
            name: selectedItem.fullData.name,
            exercises: selectedItem.fullData.exercises,
            original_creator_id: selectedItem.userId,
            original_creator_name: selectedItem.username,
            original_routine_id: originalId,
          },
        ]);
        if (error) throw error;
        Alert.alert(t("profile.alerts.success"), t("routines.successSaved"));
      } catch (error) {
        Alert.alert(t("profile.alerts.error"), t("errors.unexpected"));
      }
    }
  };

  const handlePressItem = useCallback((item: any) => {
    if (item.type === "achievement") return;
    setSelectedItem(item);
    setDetailsModalVisible(true);
  }, []);

  // Efecto para manejar la búsqueda de usuarios con debounce, evitando llamadas excesivas a la API mientras el usuario escribe.
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) searchUsers(searchQuery.trim());
      else searchResults.length > 0 && setSearchResults([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  /**
   * Función para buscar usuarios en la base de datos de Supabase, aplicando un filtro de búsqueda que ignora acentos y vocales, y excluyendo usuarios bloqueados por el usuario actual.
   * @param text
   * @returns
   */
  const searchUsers = async (text: string) => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(t("alerts.error"), t("errors.networkFailed"));
      return;
    }

    setIsSearching(true);
    try {
      const searchPattern = text.replace(/[aeiouáéíóúü]/gi, "_");

      const { data, error } = await supabase
        .from("users")
        .select("id, username, profile_picture_url")
        .ilike("username", `%${searchPattern}%`)
        .neq("id", user?.id)
        .limit(10);

      if (error) throw error;

      const { data: blocksData } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user?.id},blocked_id.eq.${user?.id}`);

      const blockedIds = new Set();
      if (blocksData) {
        blocksData.forEach((block) => {
          if (block.blocker_id === user?.id) blockedIds.add(block.blocked_id);
          if (block.blocked_id === user?.id) blockedIds.add(block.blocker_id);
        });
      }

      const results: SearchResult[] = [];
      if (data) {
        data.forEach((doc) => {
          if (!blockedIds.has(doc.id)) {
            results.push({
              id: doc.id,
              username: doc.username,
              profilePictureUrl: doc.profile_picture_url,
            });
          }
        });
      }
      setSearchResults(results);
    } catch (error) {
      debugLog("Error buscando usuarios:", error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Función para manejar la acción de refrescar el feed, reiniciando la paginación y llamando a la función de refresco proporcionada por el hook useSocialFeed.
   */
  const handleRefresh = () => {
    setPage(1);
    onRefresh();
  };

  /**
   * Función para manejar la acción de presionar un usuario, navegando a su perfil mediante el router de Expo Router.
   */
  const handleUserPress = useCallback(
    (userIdOrItem: string | SearchResult) => {
      let id = "";
      if (typeof userIdOrItem === "string") {
        id = userIdOrItem;
      } else {
        id = userIdOrItem.id;
        addToHistory(userIdOrItem);
      }
      router.push({ pathname: "/userProfile", params: { id } });
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <View style={styles.topTabs}>
        <TouchableOpacity onPress={() => setActiveTab("feed")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "feed" && styles.tabTextActive,
            ]}
          >
            {t("social.feed")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("search")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "search" && styles.tabTextActive,
            ]}
          >
            {t("social.findFriends")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "search" ? (
          <View style={styles.flexContainer}>
            <View style={styles.searchBar}>
              <Feather
                name="search"
                size={moderateScale(20)}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t("social.searchPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather
                    name="x-circle"
                    size={moderateScale(16)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {isSearching ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.searchLoader}
              />
            ) : searchQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <UserSearchCard
                      item={item}
                      colors={colors}
                      styles={styles}
                      onPress={handleUserPress}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingTop: verticalScale(20),
                    paddingBottom: verticalScale(100) + insets.bottom,
                  }}
                  keyboardShouldPersistTaps="handled"
                />
              ) : (
                <Text style={styles.placeholderText}>
                  {t("social.noResults")}
                </Text>
              )
            ) : (
              <View style={{ flex: 1, marginTop: verticalScale(10) }}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{t("social.recentSearches")}</Text>
                  {searchHistory.length > 0 && (
                    <TouchableOpacity onPress={clearAllHistory}>
                      <Text style={styles.historyClearText}>{t("social.clearAll")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {searchHistory.length > 0 ? (
                  <FlatList
                    data={searchHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <UserSearchCard
                        item={item}
                        colors={colors}
                        styles={styles}
                        onPress={handleUserPress}
                        onRemove={removeHistoryItem}
                      />
                    )}
                    contentContainerStyle={{ paddingBottom: verticalScale(100) + insets.bottom }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <Text style={styles.emptyText}>
                    {t("social.emptyHistory")}
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.flexContainer}>
            {loadingFeed && feed.length === 0 ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.feedLoader}
              />
            ) : feed.length > 0 ? (
              <FlatList
                data={displayedFeed}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <FeedActivityCard
                    item={item}
                    showAd={(index + 1) % 5 === 0}
                    colors={colors}
                    styles={styles}
                    t={t}
                    onPressUser={handleUserPress}
                    onPressItem={handlePressItem}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingTop: verticalScale(20),
                  paddingBottom: verticalScale(100) + insets.bottom,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                  />
                }
                ListFooterComponent={() => {
                  if (displayedFeed.length < feed.length) {
                    return (
                      <TouchableOpacity
                        style={styles.loadMoreBtn}
                        onPress={() => setPage((prev) => prev + 1)}
                      >
                        <Text style={styles.loadMoreText}>
                          {t("profile.loadMore")}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                }}
              />
            ) : (
              <Text style={styles.placeholderText}>
                {t("social.emptyFeed")}
              </Text>
            )}
          </View>
        )}
      </View>

      <ItemDetailsModal
        visible={detailsModalVisible}
        type={selectedItem?.type}
        item={selectedItem?.fullData}
        isSaved={selectedItem?.type === "routine" ? !!myRoutines.find(r => r.originalRoutineId === selectedItem.fullData.id) : false}
        system={measurementSystem || "metric"}
        userWeight={weight || 0}
        onToggleSave={handleToggleSave}
        onClose={() => setDetailsModalVisible(false)}
      />
    </View>
  );
}

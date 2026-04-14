import { AntDesign, Feather } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { FeedItem, useSocialFeed } from "../../hooks/useSocialFeed";
import { supabase } from "../../src/config/supabase";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { getStyles } from "../../src/styles/SocialScreen.styles";

const debugLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

interface SearchResult {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

/**
 * Función auxiliar para mostrar el tiempo transcurrido desde una actividad de forma legible
 * @param timestamp
 * @param t
 * @returns
 */
const getTimeAgo = (timestamp: number, t: any) => {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return t("social.time.justNow", "Justo ahora");
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
 * Pantalla principal de la sección social, con feed de actividades y búsqueda de usuarios
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) searchUsers(searchQuery.trim());
      else searchResults.length > 0 && setSearchResults([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async (text: string) => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(t("alerts.error", "Error"), t("errors.networkFailed"));
      return;
    }

    setIsSearching(true);
    try {
      const searchPattern = text.replace(/[aeiouáéíóúü]/gi, "_");

      const { data, error } = await supabase
        .from("users")
        .select("id, username, profile_picture_url")
        .ilike("username", `%${searchPattern}%`)
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
          if (doc.id !== user?.id && !blockedIds.has(doc.id)) {
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

  const handleRefresh = () => {
    setPage(1);
    onRefresh();
  };

  const renderUserItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() =>
        router.push({ pathname: "/userProfile", params: { id: item.id } })
      }
    >
      {item.profilePictureUrl ? (
        <Image
          source={{ uri: item.profilePictureUrl }}
          style={styles.userAvatar}
        />
      ) : (
        <View style={styles.userAvatarPlaceholder}>
          <AntDesign name="user" size={24} color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.usernameText}>@{item.username}</Text>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderFeedItem = ({
    item,
    index,
  }: {
    item: FeedItem;
    index: number;
  }) => {
    const isWorkout = item.type === "history";
    const showAd = (index + 1) % 5 === 0;

    return (
      <>
        <View style={styles.feedCard}>
          <View style={styles.feedHeader}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/userProfile",
                  params: { id: item.userId },
                })
              }
            >
              {item.userAvatar ? (
                <Image
                  source={{ uri: item.userAvatar }}
                  style={styles.feedAvatar}
                />
              ) : (
                <View style={styles.feedAvatarPlaceholder}>
                  <AntDesign
                    name="user"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.feedHeaderText}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/userProfile",
                    params: { id: item.userId },
                  })
                }
              >
                <Text style={styles.feedUsername}>@{item.username}</Text>
              </TouchableOpacity>
              <Text style={styles.feedAction}>
                {isWorkout
                  ? t("social.completedWorkout")
                  : t("social.createdRoutine")}
              </Text>
            </View>
            <Text style={styles.feedTime}>{getTimeAgo(item.timestamp, t)}</Text>
          </View>
          <View style={styles.feedContent}>
            <Text style={styles.feedTitle}>
              {item.title || t("social.defaultWorkout")}
            </Text>
            <View style={styles.feedStats}>
              {isWorkout ? (
                <>
                  <Text style={styles.feedStatText}>
                    <Feather name="clock" size={12} />{" "}
                    {Math.ceil((item.details.duration || 0) / 60)} min
                  </Text>
                  <Text style={styles.feedStatText}>
                    <Feather name="activity" size={12} /> {item.details.volume}{" "}
                    kg
                  </Text>
                </>
              ) : (
                <Text style={styles.feedStatText}>
                  <Feather name="list" size={12} /> {item.details.exerciseCount}{" "}
                  {t("routines.exercises", "ejercicios")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {showAd && (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.textSecondary,
                marginBottom: 5,
              }}
            >
              Publicidad
            </Text>
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
  };

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
          <View style={{ flex: 1 }}>
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color={colors.textSecondary} />
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
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            {isSearching ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 20 }}
              />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
              />
            ) : searchQuery.length >= 2 ? (
              <Text style={styles.placeholderText}>
                {t("social.noResults")}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {t("social.searchInstructions")}
              </Text>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {loadingFeed && feed.length === 0 ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 40 }}
              />
            ) : feed.length > 0 ? (
              <FlatList
                data={displayedFeed}
                keyExtractor={(item) => item.id}
                renderItem={renderFeedItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
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
                        style={{
                          paddingVertical: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.surface,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: colors.border,
                          marginHorizontal: 20,
                          marginTop: 10,
                          marginBottom: 40,
                        }}
                        onPress={() => setPage((prev) => prev + 1)}
                      >
                        <Text
                          style={{ color: colors.primary, fontWeight: "bold" }}
                        >
                          {t("profile.loadMore", "Cargar más")}
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
    </View>
  );
}

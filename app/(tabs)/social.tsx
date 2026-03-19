import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FeedItem, useSocialFeed } from "../../hooks/useSocialFeed";
import { auth, db } from "../../src/config/firebase";
import { useTheme } from "../../src/context/ThemeContext";
import { getStyles } from "../../src/styles/SocialScreen.styles";

interface SearchResult {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

const getTimeAgo = (timestamp: number, t: any) => {
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return t("social.time.justNow");

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return t("social.time.minsAgo", { count: diffInMinutes });

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return t("social.time.hoursAgo", { count: diffInHours });

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return t("social.time.daysAgo", { count: diffInDays });

  return new Date(timestamp).toLocaleDateString();
};

export default function SocialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState<"feed" | "search">("feed");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { feed, loadingFeed, refreshing, onRefresh } = useSocialFeed();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async (text: string) => {
    setIsSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", text),
        where("username", "<=", text + "\uf8ff"),
        limit(10),
      );

      const querySnapshot = await getDocs(q);
      const results: SearchResult[] = [];

      querySnapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) {
          results.push({
            id: doc.id,
            username: doc.data().username,
            profilePictureUrl: doc.data().profilePictureUrl,
          });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.log("Error buscando usuarios:", error);
    } finally {
      setIsSearching(false);
    }
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

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    const isWorkout = item.type === "history";
    return (
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
                <AntDesign name="user" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.feedHeaderText}>
            <Text style={styles.feedUsername}>@{item.username}</Text>
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
                  <Feather name="activity" size={12} /> {item.details.volume} kg
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
    );
  };

  return (
    <View style={styles.container}>
      {/* Botones de navegación */}
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

      {/* Contenido principal */}
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
                contentContainerStyle={{ paddingBottom: 20 }}
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
            {loadingFeed ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginTop: 40 }}
              />
            ) : feed.length > 0 ? (
              <FlatList
                data={feed}
                keyExtractor={(item) => item.id}
                renderItem={renderFeedItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                  />
                }
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

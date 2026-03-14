import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../src/config/firebase";
import { colors } from "../../src/constants/theme";

interface SearchResult {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

export default function SocialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"feed" | "search">("feed");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  return (
    <View style={styles.container}>
      {/*Botones de navegación*/}
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

      {/*Contenido de búsqueda*/}
      {activeTab === "search" ? (
        <View style={styles.content}>
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

          {/*Resultados de búsqueda*/}
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
            <Text style={styles.placeholderText}>{t("social.noResults")}</Text>
          ) : (
            <Text style={styles.placeholderText}>
              {t("social.searchInstructions")}
            </Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.placeholderText}>
            Aquí verás las rutinas que completen tus amigos.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabText: { fontSize: 16, color: colors.textSecondary, fontWeight: "600" },
  tabTextActive: {
    color: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 5,
  },
  content: { padding: 20, flex: 1 },
  searchBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    marginLeft: 10,
    fontSize: 16,
  },
  placeholderText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});

import React, { useEffect } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  runOnJS
} from "react-native-reanimated";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { moderateScale, scale, verticalScale } from "../utils/Responsive";
import { ACHIEVEMENTS_LIST } from "../../hooks/useAchievements";
import { ClayCard } from "./ClayCard";

interface StreakModalProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export const StreakModal = ({ visible, streak, onClose }: StreakModalProps) => {
  const { t } = useTranslation();
  const scaleAnim = useSharedValue(0.5);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacityAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 12, stiffness: 100 });
    } else {
      opacityAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.5, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityAnim.value,
      transform: [{ scale: scaleAnim.value }],
    };
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={animatedStyle}>
          <ClayCard style={styles.modalContainer}>
            <FontAwesome5 name="fire" size={moderateScale(60)} color="#f97316" style={styles.iconShadow} />
            <Text style={styles.title}>{t("gamification.streakTitle", { defaultValue: "¡Racha Aumentada!" })}</Text>
            <Text style={styles.subtitle}>
              {streak} {t("gamification.streakDays", { defaultValue: "entrenamientos en racha" })}
            </Text>
            <ClayCard style={styles.button} color="#f97316" onPress={onClose}>
              <Text style={styles.buttonText}>{t("common.confirm", { defaultValue: "¡Genial!" })}</Text>
            </ClayCard>
          </ClayCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface AchievementModalProps {
  visible: boolean;
  achievementId: string | null;
  onClose: () => void;
}

export const AchievementModal = ({ visible, achievementId, onClose }: AchievementModalProps) => {
  const { t } = useTranslation();
  const scaleAnim = useSharedValue(0.5);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacityAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 10, stiffness: 80 });
    } else {
      opacityAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.5, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityAnim.value,
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const achievement = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);

  if (!visible || !achievement) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={animatedStyle}>
          <ClayCard style={[styles.modalContainer, { borderColor: achievement.color, borderWidth: 2 }]}>
            <View style={[styles.iconCircle, { backgroundColor: achievement.color + '20' }]}>
               <Feather name={achievement.icon as any} size={moderateScale(50)} color={achievement.color} />
            </View>
            <Text style={styles.title}>{t("gamification.achievementUnlocked", { defaultValue: "¡Nuevo Logro!" })}</Text>
            <Text style={[styles.achievementTitle, { color: achievement.color }]}>{t(achievement.titleKey)}</Text>
            <Text style={styles.subtitle}>{t(achievement.descKey)}</Text>
            
            <ClayCard style={styles.button} color={achievement.color} onPress={onClose}>
              <Text style={styles.buttonText}>{t("common.confirm", { defaultValue: "¡Increíble!" })}</Text>
            </ClayCard>
          </ClayCard>
        </Animated.View>
      </View>
    </Modal>
  );
};
export const StreakInfoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { t } = useTranslation();

  if (!visible) return null;

  const desc = t("gamification.streakInfoDesc");

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ClayCard style={[styles.modalContainer, { paddingHorizontal: moderateScale(20), width: '90%' }]}>
          <Text style={[styles.title, { marginBottom: verticalScale(20), marginTop: verticalScale(5) }]}>
            {t("gamification.streakInfoTitle")}
          </Text>
          
          <View style={{ width: '100%', marginBottom: verticalScale(15) }}>
            {desc.split('\n\n').map((paragraph: string, index: number) => {
              if (!paragraph.trim()) return null;
              
              let prefix = "";
              let content = paragraph;
              const colonIndex = paragraph.indexOf(":");
              
              if (colonIndex !== -1 && colonIndex < 35) {
                prefix = paragraph.substring(0, colonIndex + 1);
                content = paragraph.substring(colonIndex + 1).trim();
              }

              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: scale(15),
                    borderRadius: scale(12),
                    marginBottom: verticalScale(12),
                    borderWidth: 1,
                    borderColor: "rgba(150, 150, 150, 0.1)",
                    width: '100%',
                  }}
                >
                  <Text
                    style={{
                      color: '#AAA',
                      fontSize: moderateScale(13),
                      lineHeight: moderateScale(20),
                      textAlign: "justify",
                    }}
                  >
                    {prefix ? (
                      <Text style={{ fontWeight: "bold", color: '#FFF', textTransform: 'uppercase' }}>
                        {prefix}{" "}
                      </Text>
                    ) : null}
                    {content}
                  </Text>
                </View>
              );
            })}
          </View>
          <ClayCard style={styles.button} color="#f97316" onPress={onClose}>
            <Text style={styles.buttonText}>{t("common.close")}</Text>
          </ClayCard>
        </ClayCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: moderateScale(20),
    alignItems: 'center',
  },
  iconShadow: {
    textShadowColor: 'rgba(249, 115, 22, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: verticalScale(15),
  },
  iconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    color: '#FFF',
    marginBottom: verticalScale(5),
    textAlign: 'center',
  },
  achievementTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#AAA',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  button: {
    backgroundColor: '#f97316',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(25),
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  }
});

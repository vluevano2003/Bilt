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
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <FontAwesome5 name="fire" size={moderateScale(60)} color="#f97316" style={styles.iconShadow} />
          <Text style={styles.title}>{t("gamification.streakTitle", { defaultValue: "¡Racha Aumentada!" })}</Text>
          <Text style={styles.subtitle}>
            {streak} {t("gamification.streakDays", { defaultValue: "entrenamientos en racha" })}
          </Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t("common.confirm", { defaultValue: "¡Genial!" })}</Text>
          </TouchableOpacity>
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
        <Animated.View style={[styles.modalContainer, animatedStyle, { borderColor: achievement.color, borderWidth: 2 }]}>
          <View style={[styles.iconCircle, { backgroundColor: achievement.color + '20' }]}>
             <Feather name={achievement.icon as any} size={moderateScale(50)} color={achievement.color} />
          </View>
          <Text style={styles.title}>{t("gamification.achievementUnlocked", { defaultValue: "¡Nuevo Logro!" })}</Text>
          <Text style={[styles.achievementTitle, { color: achievement.color }]}>{t(achievement.titleKey)}</Text>
          <Text style={styles.subtitle}>{t(achievement.descKey)}</Text>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: achievement.color }]} onPress={onClose}>
            <Text style={styles.buttonText}>{t("common.confirm", { defaultValue: "¡Increíble!" })}</Text>
          </TouchableOpacity>
        </Animated.View>
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
    backgroundColor: '#1e1e1e',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
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

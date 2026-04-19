import { AntDesign, Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../config/supabase";
import { scale, verticalScale } from "../utils/Responsive";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  colors: any;
  homeStyles: any;
  routineStyles: any;
  insets: any;
}

/**
 * Modal para enviar feedback o reportar errores. Se conecta a Supabase para almacenar los comentarios de los usuarios.
 * @param param0
 * @returns
 */
export const FeedbackModal = ({
  visible,
  onClose,
  userId,
  colors,
  homeStyles,
  routineStyles,
  insets,
}: FeedbackModalProps) => {
  const { t } = useTranslation();
  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !userId) return;
    setIsSendingFeedback(true);
    try {
      const { error } = await supabase
        .from("feedback")
        .insert([{ user_id: userId, message: feedbackText.trim() }]);

      if (error) throw error;

      Alert.alert(t("profile.alerts.success"), t("feedback.successMsg"));
      setFeedbackText("");
      onClose();
    } catch (error) {
      Alert.alert(t("alerts.error", "Error"), t("feedback.errorMsg"));
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={homeStyles.feedbackOverlay}>
        <View
          style={[
            homeStyles.feedbackContent,
            {
              marginTop:
                Platform.OS === "ios"
                  ? insets.top + verticalScale(50)
                  : verticalScale(50),
            },
          ]}
        >
          <View
            style={[
              routineStyles.modalHeader,
              {
                paddingHorizontal: scale(20),
                paddingTop: verticalScale(20),
                paddingBottom: verticalScale(10),
              },
            ]}
          >
            <Text style={routineStyles.modalTitle}>{t("feedback.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign
                name="close"
                size={scale(24)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                homeStyles.feedbackScrollContent,
                {
                  paddingBottom:
                    Math.max(insets.bottom, verticalScale(20)) +
                    verticalScale(120),
                },
              ]}
            >
              <Text
                style={[
                  routineStyles.label,
                  { marginBottom: verticalScale(15) },
                ]}
              >
                {t("feedback.description")}
              </Text>

              <View style={homeStyles.feedbackInputWrapper}>
                <TextInput
                  style={homeStyles.feedbackInput}
                  multiline
                  placeholder={t("feedback.placeholder")}
                  placeholderTextColor={colors.textSecondary}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  autoFocus={false}
                />
              </View>

              <TouchableOpacity
                style={[
                  homeStyles.sendButton,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    opacity: !feedbackText.trim() ? 0.5 : 1,
                  },
                ]}
                disabled={!feedbackText.trim() || isSendingFeedback}
                onPress={handleSendFeedback}
              >
                {isSendingFeedback ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather
                      name="send"
                      size={scale(18)}
                      color="#FFF"
                      style={homeStyles.sendButtonIcon}
                    />
                    <Text style={homeStyles.sendButtonText}>
                      {t("feedback.send")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

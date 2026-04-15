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

      Alert.alert(
        t("profile.alerts.success", "¡Gracias!"),
        t(
          "feedback.successMsg",
          "Tu comentario ha sido enviado. ¡Lo revisaremos pronto!",
        ),
      );
      setFeedbackText("");
      onClose();
    } catch (error) {
      Alert.alert(
        t("alerts.error", "Error"),
        t(
          "feedback.errorMsg",
          "No se pudo enviar el comentario. Intenta de nuevo más tarde.",
        ),
      );
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
            { marginTop: Platform.OS === "ios" ? insets.top + 50 : 50 },
          ]}
        >
          <View
            style={[
              routineStyles.modalHeader,
              { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
            ]}
          >
            <Text style={routineStyles.modalTitle}>
              {t("feedback.title", "Reportar / Sugerencias")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color={colors.textPrimary} />
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
                { paddingBottom: Math.max(insets.bottom, 20) + 120 },
              ]}
            >
              <Text style={[routineStyles.label, { marginBottom: 15 }]}>
                {t("feedback.description", "¿Encontraste un error...?")}
              </Text>

              <View style={homeStyles.feedbackInputWrapper}>
                <TextInput
                  style={homeStyles.feedbackInput}
                  multiline
                  placeholder={t(
                    "feedback.placeholder",
                    "Escribe tu comentario aquí...",
                  )}
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
                      size={18}
                      color="#FFF"
                      style={homeStyles.sendButtonIcon}
                    />
                    <Text style={homeStyles.sendButtonText}>
                      {t("feedback.send", "Enviar Comentario")}
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

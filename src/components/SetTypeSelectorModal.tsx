import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, TouchableOpacity, View, Platform, KeyboardAvoidingView } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getStyles } from "../styles/Routines.styles";
import { scale, moderateScale, verticalScale } from "../utils/Responsive";
import { SetType } from "../../hooks/useRoutines";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: SetType) => void;
  currentType: string;
};

const TYPES: { id: SetType; color: string; label: string }[] = [
  { id: "normal", color: "#6B7280", label: "1" },
  { id: "warmup", color: "#F59E0B", label: "W" },
  { id: "dropset", color: "#3B82F6", label: "D" },
  { id: "topset", color: "#EF4444", label: "T" },
  { id: "backoff", color: "#10B981", label: "B" },
];

export const SetTypeSelectorModal = ({ visible, onClose, onSelect, currentType }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={[styles.modalOverlayCentered, { justifyContent: "center" }]} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.modalContentCentered, { padding: scale(20), maxHeight: "80%" }]}
          >
            <View style={{ marginBottom: verticalScale(15), alignItems: "center" }}>
              <Text style={{ fontSize: moderateScale(18), fontWeight: "bold", color: colors.textPrimary }}>
                {t("setTypes.title")}
              </Text>
            </View>

            <View style={{ flexDirection: "column" }}>
              {TYPES.map((type) => {
                const isSelected = currentType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => {
                      onSelect(type.id);
                      onClose();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: scale(12),
                      backgroundColor: isSelected ? "rgba(204, 85, 0, 0.1)" : colors.surface,
                      borderRadius: scale(10),
                      marginBottom: verticalScale(10),
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{
                      backgroundColor: type.id !== "normal" ? type.color : "rgba(0,0,0,0.05)",
                      width: scale(36),
                      height: scale(36),
                      borderRadius: scale(18),
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: scale(15),
                      borderWidth: type.id !== "normal" ? 0 : 1,
                      borderColor: colors.border,
                    }}>
                      <Text style={{ 
                        color: type.id !== "normal" ? "#FFF" : colors.textPrimary, 
                        fontWeight: "bold", 
                        fontSize: moderateScale(14) 
                      }}>
                        {type.label}
                      </Text>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: moderateScale(15), fontWeight: "bold", color: colors.textPrimary, marginBottom: verticalScale(2) }}>
                        {t(`setTypes.${type.id}.name`)}
                      </Text>
                      <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary }}>
                        {t(`setTypes.${type.id}.desc`)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

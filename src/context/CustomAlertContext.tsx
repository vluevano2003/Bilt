import React, { createContext, useState, ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert as RNAlert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useTheme } from "./ThemeContext";
import { scale, verticalScale, moderateScale } from "../utils/Responsive";

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

const CustomAlertContext = createContext<any>(null);

let globalShowAlert: (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => void;

// Guardamos la referencia original por si acaso
const originalAlert = RNAlert.alert;

// Hacemos el monkey-patch a la función global Alert.alert
RNAlert.alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons, options);
  } else {
    // Fallback por si acaso se llama antes de montar el Provider
    originalAlert(title, message, buttons, options);
  }
};

export const CustomAlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();

  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  globalShowAlert = (title, message, buttons, options) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }],
      options,
    });
  };

  const handleClose = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
    if (alertState.options?.onDismiss) {
      alertState.options.onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    setAlertState((prev) => ({ ...prev, visible: false }));
    if (button.onPress) {
      // Pequeño delay para permitir que el modal se cierre antes de ejecutar la acción
      setTimeout(() => {
        button.onPress!();
      }, 100);
    }
  };

  return (
    <CustomAlertContext.Provider value={{}}>
      {children}
      <Modal
        visible={alertState.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (alertState.options?.cancelable !== false) {
            handleClose();
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo oscuro semi-transparente
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: colors.surface,
              borderRadius: moderateScale(20),
              padding: scale(20),
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: moderateScale(18),
                fontWeight: "bold",
                color: colors.textPrimary,
                marginBottom: alertState.message
                  ? verticalScale(10)
                  : verticalScale(20),
                textAlign: "center",
              }}
            >
              {alertState.title}
            </Text>
            {!!alertState.message && (
              <Text
                style={{
                  fontSize: moderateScale(14),
                  color: colors.textSecondary,
                  marginBottom: verticalScale(25),
                  textAlign: "center",
                  lineHeight: moderateScale(20),
                }}
              >
                {alertState.message}
              </Text>
            )}

            <View
              style={{
                flexDirection:
                  alertState.buttons?.length === 2 ? "row" : "column",
                justifyContent: "space-between",
                width: "100%",
                gap: scale(12),
              }}
            >
              {alertState.buttons?.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                const isPrimary =
                  !isDestructive &&
                  !isCancel &&
                  index === (alertState.buttons?.length || 1) - 1;

                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      flex: alertState.buttons?.length === 2 ? 1 : undefined,
                      paddingVertical: verticalScale(12),
                      borderRadius: moderateScale(12),
                      backgroundColor: isDestructive
                        ? "#FF3B30"
                        : isPrimary
                        ? colors.primary
                        : "transparent",
                      alignItems: "center",
                      borderWidth:
                        isCancel || (!isDestructive && !isPrimary) ? 1 : 0,
                      borderColor: colors.border,
                      width: "100%",
                    }}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={{
                        fontSize: moderateScale(15),
                        fontWeight:
                          isPrimary || isDestructive ? "bold" : "600",
                        color: isDestructive
                          ? "#FFF"
                          : isPrimary
                          ? "#FFF"
                          : colors.textPrimary,
                      }}
                    >
                      {button.text || "OK"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </CustomAlertContext.Provider>
  );
};

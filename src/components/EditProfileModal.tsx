import { AntDesign } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { scale, verticalScale } from "../utils/Responsive";
import { CustomInput } from "./CustomInput";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

/**
 * Modal para editar el perfil del usuario. Permite cambiar foto, nombre, sistema de medición, altura, peso y bio. También muestra información no editable como género y email.
 * @param param0
 * @returns
 */
export const EditProfileModal = ({
  visible,
  onClose,
  isSaving,
  handleSave,
  pickImage,
  profilePic,
  editUsername,
  setEditUsername,
  editHeight,
  setEditHeight,
  editWeight,
  setEditWeight,
  gender,
  email,
  editBio,
  setEditBio,
  editMeasurementSystem,
  changeMeasurementSystem,
  colors,
  styles,
  t,
  insets,
}: any) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                paddingBottom: Math.max(
                  verticalScale(40),
                  insets.bottom + verticalScale(20),
                ),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile.editProfile")}</Text>
              <TouchableOpacity onPress={onClose}>
                <AntDesign
                  name="close"
                  size={scale(24)}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: verticalScale(60) }}
            >
              <TouchableOpacity
                style={[styles.avatarContainer, { alignSelf: "center" }]}
                onPress={pickImage}
              >
                {profilePic ? (
                  <Image
                    source={{ uri: profilePic }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <AntDesign
                      name="user"
                      size={scale(40)}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <AntDesign name="camera" size={scale(14)} color="#FFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>{t("profile.username")}</Text>
              <CustomInput
                value={editUsername}
                onChangeText={setEditUsername}
              />

              <Text style={styles.label}>{t("profile.measurementSystem")}</Text>
              <View style={styles.formSegmentContainer}>
                <TouchableOpacity
                  style={[
                    styles.formSegmentButton,
                    editMeasurementSystem === "metric" &&
                      styles.formSegmentButtonActive,
                  ]}
                  onPress={() => changeMeasurementSystem("metric")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      editMeasurementSystem === "metric" &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {t("profile.metric")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formSegmentButton,
                    editMeasurementSystem === "imperial" &&
                      styles.formSegmentButtonActive,
                  ]}
                  onPress={() => changeMeasurementSystem("imperial")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      editMeasurementSystem === "imperial" &&
                        styles.segmentTextActive,
                    ]}
                  >
                    {t("profile.imperial")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>
                    {t("profile.height")} (
                    {editMeasurementSystem === "metric" ? "cm" : "in"})
                  </Text>
                  <CustomInput
                    value={editHeight}
                    onChangeText={setEditHeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>
                    {t("profile.weight")} (
                    {editMeasurementSystem === "metric" ? "kg" : "lbs"})
                  </Text>
                  <CustomInput
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t("profile.gender")}</Text>
                  <CustomInput
                    value={gender}
                    editable={false}
                    style={styles.readOnlyInput}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>{t("profile.email")}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ width: "100%" }}
                  >
                    <CustomInput
                      value={email}
                      editable={false}
                      style={styles.readOnlyInput}
                    />
                  </ScrollView>
                </View>
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    marginTop: verticalScale(15),
                    marginBottom: verticalScale(10),
                  },
                ]}
              >
                {t("profile.bio", "Presentación")}
              </Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                multiline
                placeholder={t(
                  "profile.bioPlaceholder",
                  "Escribe una breve presentación sobre ti...",
                )}
                placeholderTextColor={colors.textSecondary}
                maxLength={150}
                style={{
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderRadius: scale(10),
                  padding: scale(15),
                  minHeight: verticalScale(100),
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: verticalScale(20),
                }}
              />

              <View style={{ marginTop: verticalScale(15), gap: scale(10) }}>
                <PrimaryButton
                  title={t("profile.saveChanges")}
                  onPress={handleSave}
                  loading={isSaving}
                />
                <SecondaryButton
                  title={t("profile.cancel")}
                  onPress={onClose}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

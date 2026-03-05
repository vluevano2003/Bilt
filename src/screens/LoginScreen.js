import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, storage } from "../config/firebase";
import { colors } from "../constants/theme";

/**
 * Un input estándar que puedes usar en cualquier pantalla
 * @param {*} param0
 * @returns
 */
const CustomInput = ({ style, ...props }) => (
  <TextInput
    style={[styles.input, style]}
    placeholderTextColor={colors.textSecondary}
    {...props}
  />
);

/**
 * Un botón primario con fondo sólido
 * @param {*} param0
 * @returns
 */
const PrimaryButton = ({ title, onPress, style, disabled, loading }) => (
  <TouchableOpacity
    style={[styles.buttonPrimary, style, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={colors.textPrimary} />
    ) : (
      <Text style={styles.buttonTextPrimary}>{title}</Text>
    )}
  </TouchableOpacity>
);

/**
 * Un botón secundario transparente con borde
 * @param {*} param0
 * @returns
 */
const SecondaryButton = ({ title, onPress, style }) => (
  <TouchableOpacity style={[styles.buttonSecondary, style]} onPress={onPress}>
    <Text style={styles.buttonTextSecondary}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Pantalla de login y registro con un proceso de registro dividido en pasos, manejo de imagen de perfil, y validaciones básicas.
 * @returns
 */
export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Maneja la selección de fecha tanto para Android como para iOS
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setBirthDate(
        selectedDate.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      );
    } else {
      setShowDatePicker(false);
    }
  };

  // Función para manejar el registro de usuario, incluyendo la subida de la imagen de perfil si se seleccionó una
  const handleRegister = async () => {
    if (!height || !weight) {
      Alert.alert("Error", "Por favor completa tus métricas.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      let profilePictureUrlToSave = null;

      if (profilePic) {
        const response = await fetch(profilePic);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, blob);
        profilePictureUrlToSave = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "users", user.uid), {
        username,
        profilePictureUrl: profilePictureUrlToSave,
        birthDate,
        gender,
        height,
        weight,
        email,
        measurementSystem: "metric",
        createdAt: new Date(),
      });

      Alert.alert("¡Éxito!", "Cuenta creada y configurada para mutar.");
    } catch (error) {
      Alert.alert("Error al registrar", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el inicio de sesión del usuario
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("¡Bienvenido!", "Iniciaste sesión correctamente");
    } catch (error) {
      Alert.alert("Error al entrar", "Credenciales incorrectas");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para avanzar al siguiente paso del registro, con validaciones básicas para cada paso
  const nextStep = () => {
    if (step === 1 && (!email || !password))
      return Alert.alert("Faltan datos", "Ingresa un correo y contraseña.");
    if (step === 2 && !username)
      return Alert.alert("Faltan datos", "Elige un nombre de usuario.");
    if (step === 3 && (!birthDate || !gender))
      return Alert.alert(
        "Faltan datos",
        "Completa tu fecha de nacimiento y género.",
      );
    setStep(step + 1);
  };

  // Renderiza el componente de Google para evitar repetir código
  const GoogleSignInButton = () => (
    <>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>O</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => Alert.alert("Próximamente", "En desarrollo.")}
      >
        <AntDesign
          name="google"
          size={24}
          color={colors.textPrimary}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Image
            source={require("../../assets/images/logo_white_nobg.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>BILT TRACKER</Text>

          {isLogin ? (
            <>
              <Text style={styles.subtitle}>Tu progreso, tu ritmo</Text>

              <CustomInput
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <CustomInput
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <PrimaryButton
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={isLoading}
              />
              <GoogleSignInButton />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Paso {step} de 4</Text>

              {step === 1 && (
                <View>
                  <CustomInput
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <CustomInput
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <PrimaryButton title="Siguiente" onPress={nextStep} />
                  <GoogleSignInButton />
                </View>
              )}

              {step === 2 && (
                <View>
                  <TouchableOpacity
                    style={styles.avatarContainer}
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
                          name="camerao"
                          size={32}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.avatarText}>Añadir foto</Text>
                      </View>
                    )}
                    {profilePic && (
                      <View style={styles.editBadge}>
                        <AntDesign name="edit" size={14} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <CustomInput
                    placeholder="¿Cómo te llaman en el gym? (Usuario)"
                    value={username}
                    onChangeText={setUsername}
                  />

                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title="Atrás"
                      onPress={() => setStep(1)}
                      style={styles.halfInput}
                    />
                    <PrimaryButton
                      title="Siguiente"
                      onPress={nextStep}
                      style={[styles.halfInput, { marginTop: 10 }]}
                    />
                  </View>
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.label}>Fecha de nacimiento:</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={{
                        color: birthDate
                          ? colors.textPrimary
                          : colors.textSecondary,
                        fontSize: 16,
                      }}
                    >
                      {birthDate || "Seleccionar fecha"}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <View>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                        themeVariant="dark"
                      />
                      {Platform.OS === "ios" && (
                        <PrimaryButton
                          title="Confirmar fecha"
                          onPress={() => setShowDatePicker(false)}
                          style={{
                            padding: 10,
                            marginTop: 5,
                            marginBottom: 15,
                          }}
                        />
                      )}
                    </View>
                  )}

                  <Text style={styles.label}>Género:</Text>
                  <View style={styles.rowInputs}>
                    <TouchableOpacity
                      style={[
                        styles.selectableButton,
                        styles.halfInput,
                        gender === "Hombre" && styles.selectableButtonActive,
                      ]}
                      onPress={() => setGender("Hombre")}
                    >
                      <Text
                        style={[
                          styles.selectableText,
                          gender === "Hombre" && styles.selectableTextActive,
                        ]}
                      >
                        Hombre
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.selectableButton,
                        styles.halfInput,
                        gender === "Mujer" && styles.selectableButtonActive,
                      ]}
                      onPress={() => setGender("Mujer")}
                    >
                      <Text
                        style={[
                          styles.selectableText,
                          gender === "Mujer" && styles.selectableTextActive,
                        ]}
                      >
                        Mujer
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title="Atrás"
                      onPress={() => setStep(2)}
                      style={[styles.halfInput, { marginTop: 20 }]}
                    />
                    <PrimaryButton
                      title="Siguiente"
                      onPress={nextStep}
                      style={[styles.halfInput, { marginTop: 20 }]}
                    />
                  </View>
                </View>
              )}

              {step === 4 && (
                <View>
                  <View style={styles.rowInputs}>
                    <CustomInput
                      placeholder="Altura (cm)"
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                    <CustomInput
                      placeholder="Peso (kg)"
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                  </View>
                  <View style={styles.rowInputs}>
                    <SecondaryButton
                      title="Atrás"
                      onPress={() => setStep(3)}
                      style={styles.halfInput}
                    />
                    <PrimaryButton
                      title="Finalizar"
                      onPress={handleRegister}
                      loading={isLoading}
                      style={[styles.halfInput, { marginTop: 10 }]}
                    />
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setStep(1);
            }}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Estilos para la pantalla de login y registro
 */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  formContainer: { paddingHorizontal: 30, paddingVertical: 40 },
  logo: { width: 200, height: 200, alignSelf: "center", marginBottom: 5 },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 5,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { color: colors.textSecondary, fontSize: 12, marginTop: 5 },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  rowInputs: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  selectableButton: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectableButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(204, 85, 0, 0.1)",
  },
  selectableText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  selectableTextActive: { color: colors.primary },
  buttonPrimary: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonTextPrimary: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    color: colors.textSecondary,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: { marginTop: 30, alignItems: "center" },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 15,
    textDecorationLine: "underline",
  },
});

# BILT TRACKER

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**BILT TRACKER** es una aplicación móvil integral para la gestión de entrenamientos en el gimnasio. Construida con **React Native** y **Expo Router**, ofrece una experiencia fluida, seguimiento en tiempo real y características sociales para conectar con otros atletas.

---

## 📦 Características Principales

El sistema está diseñado para gestionar el ciclo completo de entrenamiento y la interacción social del usuario:

- **Seguimiento de Entrenamientos (Active Workout):** \* Reproductor de rutinas activo en segundo plano (Mini Player).
  - Registro de sets, repeticiones y peso.
  - Temporizador de descanso flotante e inteligente.
  - Cálculo automático de volumen total (kg/lbs) y duración del entrenamiento.
- **Gestión de Rutinas y Packs:**
  - Creación y edición de rutinas personalizadas.
  - Funcionalidad _Drag & Drop_ para reordenar ejercicios en tiempo real.
  - Agrupación de rutinas en "Packs Semanales".
  - Posibilidad de guardar rutinas de otros creadores en tu perfil local.
- **Red Social Fit:**
  - **Feed Global:** Visualiza la actividad reciente (rutinas creadas y entrenamientos completados) de las personas a las que sigues.
  - **Búsqueda de Usuarios:** Encuentra a tus amigos a través del motor de búsqueda integrado.
  - **Privacidad:** Cuentas públicas o privadas con sistema de solicitudes de seguimiento.
- **Autenticación Segura:** Sistema de Login y Registro gestionado con Firebase Auth (Soporte para Email/Contraseña y preparado para Google Sign-In).
- **Internacionalización (i18n):** Soporte multiidioma dinámico (Español e Inglés) integrado en toda la interfaz gráfica, rutinas y menús.
- **Tema Dinámico y Persistente:** Soporte completo para **Modo Claro y Oscuro** gestionado a través de Context API y guardado localmente para recordar la preferencia del usuario al reabrir la app.
- **Perfil de Usuario:** \* Estadísticas semanales dinámicas.
  - Configuración de sistema de medidas (Métrico / Imperial).
  - Gestión de visibilidad de datos personales (peso, altura, edad).

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo.
- **Lenguaje:** TypeScript.
- **Enrutamiento:** Expo Router (File-based routing nativo con Tabs y Stacks).
- **Backend / BaaS:** Firebase (Authentication & Cloud Firestore).
- **Gestión de Estado:** React Context API (AuthContext, ThemeContext, ActiveWorkoutContext).
- **Persistencia Local:** `@react-native-async-storage/async-storage`.
- **Internacionalización:** `react-i18next` / `i18next`.
- **Componentes UI & Animaciones:**
  - `react-native-draggable-flatlist` (Listas interactivas y reordenables).
  - `react-native-gesture-handler` (Manejo de gestos fluidos).
  - `@react-native-community/datetimepicker` (Selector de fechas nativo).
  - `@expo/vector-icons` (AntDesign, Feather, FontAwesome).
- **Estilos:** StyleSheet nativo optimizado para inyección dinámica de temas (Dark/Light).

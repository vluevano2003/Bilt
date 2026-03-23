# BILT TRACKER

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![AdMob](https://img.shields.io/badge/AdMob-EA4335?style=for-the-badge&logo=googleadmob&logoColor=white)

**BILT TRACKER** es una aplicación móvil integral para la gestión de entrenamientos en el gimnasio. Construida con **React Native** y **Expo Router**, ofrece una experiencia fluida, seguimiento en tiempo real, características sociales para conectar con otros atletas y un sistema robusto de backend potenciado por Supabase.

---

## 📦 Características Principales

El sistema está diseñado para gestionar el ciclo completo de entrenamiento y la interacción social del usuario:

- **Seguimiento de Entrenamientos (Active Workout):** - Reproductor de rutinas activo en segundo plano (Mini Player).
  - **Notificaciones Persistentes (Sticky):** Monitoreo del tiempo de descanso y ejercicio actual directamente desde la pantalla de bloqueo o centro de notificaciones.
  - Registro de sets, repeticiones y peso.
  - Temporizador de descanso flotante e inteligente.
  - Cálculo automático de volumen total (kg/lbs), distribución muscular y duración del entrenamiento.
- **Gestión de Rutinas y Packs:**
  - Creación y edición de rutinas personalizadas.
  - Funcionalidad _Drag & Drop_ fluida para reordenar ejercicios en tiempo real.
  - Agrupación de rutinas en "Packs Semanales".
  - Posibilidad de guardar rutinas de otros creadores en tu perfil local.
- **Red Social Fit:**
  - **Feed Global:** Visualiza la actividad reciente (rutinas creadas y entrenamientos completados) de las personas a las que sigues.
  - **Búsqueda de Usuarios:** Encuentra a tus amigos a través del motor de búsqueda integrado.
  - **Privacidad:** Cuentas públicas o privadas con sistema de solicitudes de seguimiento.
- **Monetización Estratégica:** Integración nativa con **Google AdMob** mostrando banners en las pantallas de resumen y anuncios tipo _Medium Rectangle_ intercalados orgánicamente en el Feed Social.
- **Autenticación Segura:** Sistema de Login y Registro gestionado con **Supabase Auth** (Soporte para Email/Contraseña y preparado para Google Sign-In nativo).
- **Internacionalización (i18n):** Soporte multiidioma dinámico (Español e Inglés) integrado en toda la interfaz gráfica, rutinas y menús.
- **Tema Dinámico y Persistente:** Soporte completo para **Modo Claro y Oscuro** gestionado a través de Context API y guardado localmente para recordar la preferencia del usuario al reabrir la app.
- **Perfil de Usuario:** - Estadísticas semanales dinámicas y mapa de actividad.
  - Configuración de sistema de medidas (Métrico / Imperial).
  - Gestión de visibilidad de datos personales (peso, altura, edad).

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo.
- **Lenguaje:** TypeScript.
- **Enrutamiento:** Expo Router (File-based routing nativo con Tabs y Stacks).
- **Backend / BaaS:** Supabase (PostgreSQL, Authentication & Storage para avatares).
- **Compilación / DevOps:** EAS (Expo Application Services) para la generación de builds nativos (APK/AAB/IPA).
- **Gestión de Estado:** React Context API (AuthContext, ThemeContext, ActiveWorkoutContext).
- **Persistencia Local:** `@react-native-async-storage/async-storage`.
- **Internacionalización:** `react-i18next` / `i18next`.
- **Componentes UI, Funcionalidad & Animaciones:**
  - `react-native-google-mobile-ads` (Monetización).
  - `expo-notifications` (Gestión de notificaciones push locales).
  - `react-native-reanimated` & `react-native-gesture-handler` (Motor de animaciones y manejo de gestos fluidos a 60fps).
  - `react-native-draggable-flatlist` (Listas interactivas y reordenables).
  - `@react-native-community/datetimepicker` (Selector de fechas nativo).
  - `@expo/vector-icons` (AntDesign, Feather, FontAwesome).
- **Estilos:** StyleSheet nativo optimizado para inyección dinámica de temas (Dark/Light).

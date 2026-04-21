# BILT TRACKER

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![AdMob](https://img.shields.io/badge/AdMob-EA4335?style=for-the-badge&logo=googleadmob&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)

**BILT TRACKER** es una aplicación móvil integral para la gestión de entrenamientos en el gimnasio. Construida con **React Native** y **Expo Router**, ofrece una experiencia fluida, seguimiento en tiempo real, características sociales para conectar con otros atletas y un sistema robusto de backend totalmente dinámico potenciado por Supabase.

---

## 📦 Características Principales

El sistema está diseñado para gestionar el ciclo completo de entrenamiento y la interacción social del usuario:

- **Autenticación Segura y Rápida:** - Sistema de Login y Registro gestionado con **Supabase Auth**.
  - **Integración nativa con Google Sign-In**, que agiliza el registro extrayendo automáticamente el nombre, correo y foto de perfil del usuario.
  - **Gestión de Avatares:** Subida y actualización de imágenes de perfil directamente a **Supabase Storage**.
  - **Persistencia Inteligente:** La sesión se mantiene viva de forma segura en caché incluso si la aplicación se abre sin conexión a internet.

- **Base de Datos Dinámica de Ejercicios:** - Más de 80 ejercicios obtenidos en tiempo real desde la nube.
  - Soporte dinámico para previsualización de imágenes y animaciones (GIF/PNG).
  - Instrucciones técnicas detalladas y desglose anatómico (músculos sinérgicos y principales) para cada ejercicio.

- **Seguimiento de Entrenamientos (Active Workout):** - Reproductor de rutinas activo en segundo plano (Mini Player).
  - **Notificaciones Persistentes (Sticky):** Monitoreo del tiempo de descanso y ejercicio actual directamente desde la pantalla de bloqueo o centro de notificaciones.
  - **Feedback Háptico y Auditivo:** Alertas de vibración y sonido (`expo-av`) integradas al finalizar los temporizadores de descanso.
  - Registro avanzado de sets, repeticiones y peso (incluyendo cálculos con peso corporal, barras y discos).
  - Temporizador de descanso flotante e inteligente.
  - Cálculo automático de volumen total, distribución muscular y duración del entrenamiento adaptado al sistema del usuario (Métrico/Imperial).
  - **Protección Offline:** Si se pierde la conexión al finalizar, la app pausa y retiene el progreso localmente evitando cualquier pérdida de datos.

- **Gestión de Rutinas y Packs:**
  - Creación y edición de rutinas personalizadas.
  - Funcionalidad _Drag & Drop_ fluida para reordenar ejercicios en tiempo real.
  - Agrupación de rutinas en **"Packs Semanales"** con límites inteligentes para gestión de memoria.
  - Capacidad para guardar y calificar rutinas o packs de otros creadores en tu perfil local.

- **Red Social Fit (Sincronización en Tiempo Real):**
  - **Feed Global en Vivo:** Visualiza la actividad reciente mediante **Supabase Realtime Channels** (rutinas creadas y entrenamientos completados) de las personas a las que sigues.
  - **Notificaciones Push:** Enviadas a través de **Supabase Edge Functions** para alertas instantáneas de nuevos seguidores o solicitudes.
  - **Búsqueda de Usuarios:** Encuentra a tus amigos a través del motor de búsqueda integrado.
  - **Privacidad y Moderación:** Cuentas públicas o privadas con sistema de solicitudes. Incluye un sistema de **bloqueo de usuarios** y **reportes de contenido** para mantener un entorno seguro.

- **Interfaz Adaptativa (Edge-to-Edge) y UX Avanzada:** - Optimización total para dispositivos modernos sin bordes usando cálculos dinámicos de áreas seguras (Safe Areas).
  - **Manejo de Teclado Impecable:** Descarte táctil inteligente y prevención de "espacios fantasma" en Android e iOS mediante `KeyboardAvoidingView` optimizado.
  - **Feedback y Soporte:** Modal integrado para que los usuarios envíen comentarios o reporten errores directamente a la base de datos.
  - Alertas proactivas y cancelación de cargas si se detectan fallos en la red.

- **Monetización Estratégica:** Integración nativa con **Google AdMob** mostrando banners en las pantallas de resumen y anuncios tipo _Medium Rectangle_ intercalados orgánicamente cada 5 publicaciones en el Feed Social.

- **Internacionalización (i18n):** Soporte multiidioma dinámico (Español e Inglés) integrado en toda la interfaz gráfica, rutinas, bases de datos y menús.

- **Tema Dinámico y Persistente:** Soporte completo para **Modo Claro y Oscuro** gestionado a través de Context API y guardado localmente para recordar la preferencia del usuario al reabrir la app.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo.
- **Lenguaje:** TypeScript.
- **Enrutamiento:** Expo Router (File-based routing nativo con Tabs y Stacks).
- **Backend / BaaS:** Supabase (PostgreSQL, Authentication, Realtime Channels, Edge Functions & Storage).
- **Compilación / DevOps:** EAS (Expo Application Services) para la generación de builds nativos (APK/AAB/IPA).
- **Gestión de Estado:** React Context API (AuthContext, ThemeContext, ActiveWorkoutContext).
- **Persistencia Local:** `@react-native-async-storage/async-storage`.
- **Internacionalización:** `react-i18next` / `i18next` / `expo-localization`.
- **Componentes UI, Funcionalidad & Red:**
  - `@react-native-community/netinfo` (Monitoreo del estado de red para soporte offline).
  - `@react-native-google-signin/google-signin` (Autenticación nativa OAuth).
  - `react-native-safe-area-context` (Adaptación de UI para pantallas Edge-to-Edge).
  - `react-native-google-mobile-ads` (Monetización).
  - `expo-notifications` & `expo-device` (Gestión y enrutamiento de notificaciones push).
  - `expo-image-picker` (Selección y compresión de avatares).
  - `expo-av` & `Vibration` API (Motor de audio y feedback háptico).
  - `react-native-reanimated` & `react-native-gesture-handler` (Motor de animaciones y manejo de gestos fluidos a 60fps).
  - `react-native-draggable-flatlist` (Listas interactivas y reordenables).
  - `@react-native-community/datetimepicker` (Selector de fechas nativo).
  - `@expo/vector-icons` (AntDesign, Feather, FontAwesome, FontAwesome5).
- **Estilos:** StyleSheet nativo optimizado para inyección dinámica de temas (Dark/Light) y escalado responsivo basado en las dimensiones de la pantalla.

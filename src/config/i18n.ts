import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import es from "../locales/es.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
};

// Obtiene el idioma del dispositivo (ej. "es-MX" -> "es")
const deviceLanguage = getLocales()[0]?.languageCode ?? "es";

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18n;

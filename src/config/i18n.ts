import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import es from "../locales/es.json";

/**
 * Configura la internacionalización (i18n) para la aplicación utilizando la biblioteca i18next. Se definen los recursos de traducción para los idiomas inglés ("en") y español ("es"), y se detecta el idioma del dispositivo para establecerlo como idioma predeterminado. Si no se puede detectar el idioma, se establece el español como idioma predeterminado. La configuración también incluye una opción de interpolación para evitar el escape de valores y una compatibilidad con JSON v4.
 */
const resources = {
  en: { translation: en },
  es: { translation: es },
};

/**
 * Detecta el idioma del dispositivo y lo establece como idioma predeterminado para la aplicación. Si no se puede detectar el idioma, se establece el español ("es") como idioma predeterminado.
 */
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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import zh from './locales/zh.json';

const LANGUAGE_STORAGE_KEY = '@app_language';
const SUPPORTED = ['en', 'zh'];

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to English, user can switch in settings
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
  });

// Restore the user's last chosen language
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then(saved => {
    if (saved && SUPPORTED.includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  })
  .catch(() => {});

// Persist every language change so it survives app restarts
i18n.on('languageChanged', lng => {
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng).catch(() => {});
});

/** Locale string for Intl/date formatting based on the active language */
export const getDateLocale = () => (i18n.language === 'zh' ? 'zh-CN' : 'en-US');

export default i18n;

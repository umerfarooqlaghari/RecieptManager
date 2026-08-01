import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

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

export default i18n;

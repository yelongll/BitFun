import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { installerResources } from './languages';

i18n.use(initReactI18next).init({
  resources: installerResources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export default i18n;

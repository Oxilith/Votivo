/**
 * @file src/i18n/config.ts
 * @purpose Configuration and initialization for react-i18next internationalization
 * @functionality
 * - Initializes i18next with language resources
 * - Configures language detection and fallback behavior
 * - Sets up localStorage persistence for language preference
 * - Exports initialized i18n instance
 * @dependencies
 * - i18next
 * - react-i18next (initReactI18next)
 * - i18next-browser-languagedetector
 * - @/i18n/resources/en/common.json
 * - @/i18n/resources/pl/common.json
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/i18n/resources/en/common.json';
import plCommon from '@/i18n/resources/pl/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'pl'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: {
    common: enCommon,
  },
  pl: {
    common: plCommon,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'identity-app-language',
      caches: ['localStorage'],
    },
  });

export default i18n;

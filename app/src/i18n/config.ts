/**
 * @file src/i18n/config.ts
 * @purpose Configuration and initialization for react-i18next internationalization
 * @functionality
 * - Initializes i18next with language resources split by feature area
 * - Configures language detection and fallback behavior
 * - Sets up localStorage persistence for language preference
 * - Exports initialized i18n instance
 * @dependencies
 * - i18next
 * - react-i18next (initReactI18next)
 * - i18next-browser-languagedetector
 * - Feature-specific translation files (landing, header, assessment, insights, auth, profile, notFound, common)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
import enCommon from '@/i18n/resources/en/common.json';
import enLanding from '@/i18n/resources/en/landing.json';
import enHeader from '@/i18n/resources/en/header.json';
import enAssessment from '@/i18n/resources/en/assessment.json';
import enInsights from '@/i18n/resources/en/insights.json';
import enAuth from '@/i18n/resources/en/auth.json';
import enProfile from '@/i18n/resources/en/profile.json';
import enNotFound from '@/i18n/resources/en/notFound.json';

// Polish translations
import plCommon from '@/i18n/resources/pl/common.json';
import plLanding from '@/i18n/resources/pl/landing.json';
import plHeader from '@/i18n/resources/pl/header.json';
import plAssessment from '@/i18n/resources/pl/assessment.json';
import plInsights from '@/i18n/resources/pl/insights.json';
import plAuth from '@/i18n/resources/pl/auth.json';
import plProfile from '@/i18n/resources/pl/profile.json';
import plNotFound from '@/i18n/resources/pl/notFound.json';

export const SUPPORTED_LANGUAGES = ['en', 'pl'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    header: enHeader,
    assessment: enAssessment,
    insights: enInsights,
    auth: enAuth,
    profile: enProfile,
    notFound: enNotFound,
  },
  pl: {
    common: plCommon,
    landing: plLanding,
    header: plHeader,
    assessment: plAssessment,
    insights: plInsights,
    auth: plAuth,
    profile: plProfile,
    notFound: plNotFound,
  },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'landing', 'header', 'assessment', 'insights', 'auth', 'profile', 'notFound'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'votive-language',
      caches: ['localStorage'],
    },
  });

export default i18n;

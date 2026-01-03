/**
 * @file src/components/landing/LandingPage.tsx
 * @purpose Main landing page orchestrator composing all landing sections
 * @functionality
 * - Orchestrates all landing page sections in proper order
 * - Adds ma-vertical dividers between sections for visual rhythm
 * - Manages navigation to assessment via onStartDiscovery callback
 * - Manages navigation to auth and profile pages
 * - Provides smooth scrolling anchor navigation
 * - Integrates with theme context and i18n
 * @dependencies
 * - React
 * - @/hooks/useScrollReveal
 * - @/components/landing/sections/NavSection
 * - @/components/landing/sections/HeroSection
 * - @/components/landing/sections/PhilosophySection
 * - @/components/landing/sections/JourneySection
 * - @/components/landing/sections/InsightsSection
 * - @/components/landing/sections/CTASection
 * - @/components/landing/sections/FooterSection
 */

import type { FC } from 'react';
import {
  NavSection,
  HeroSection,
  PhilosophySection,
  JourneySection,
  InsightsSection,
  CTASection,
  FooterSection,
} from './sections';
import { useScrollReveal } from '@/hooks';

interface LandingPageProps {
  onStartDiscovery: () => void;
  onNavigateToAuth?: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToProfile?: () => void;
  onSignOut?: () => void;
}

/**
 * Ma-vertical divider component - intentional space with brush-reveal animation
 */
const MaVertical: FC = () => (
  <div className="ma-vertical h-px max-w-[200px] mx-auto my-28 bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
);

/**
 * Ma-breath - additional vertical breathing space
 */
const MaBreath: FC = () => <div className="h-28" />;

const LandingPage: FC<LandingPageProps> = ({ onStartDiscovery, onNavigateToAuth, onNavigateToSignUp, onNavigateToProfile, onSignOut }) => {
  // Enable scroll reveal animations for elements with .reveal class
  useScrollReveal();

  return (
    <div className="min-h-screen" data-testid="landing-page">
      <NavSection
        onStartDiscovery={onStartDiscovery}
        onNavigateToAuth={onNavigateToAuth}
        onNavigateToSignUp={onNavigateToSignUp}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />
      <HeroSection onStartDiscovery={onStartDiscovery} />
      <PhilosophySection />
      <MaVertical />
      <MaBreath />
      <JourneySection />
      <MaVertical />
      <InsightsSection />
      <CTASection onStartDiscovery={onStartDiscovery} />
      <FooterSection />
    </div>
  );
};

export default LandingPage;

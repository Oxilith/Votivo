/**
 * @file src/styles/theme.ts
 * @purpose Shared Ink & Stone design system style definitions for consistent Japanese minimalism aesthetic
 * @functionality
 * - Provides stone card styles with subtle borders and lift effects
 * - Provides text color classes using ink/moon semantic tokens
 * - Provides vermilion accent badge styles
 * - Provides phase number badge styles with vermilion accents
 * @dependencies
 * - CSS custom properties defined in src/index.css (Ink & Stone design system)
 */

// Card styles - Stone cards with subtle borders and hover lift
export const cardStyles = {
  // Base stone card with subtle border
  base: 'bg-[var(--bg-secondary)] border border-[var(--border)] rounded-sm',
  // Stone card with ink splatter hover effect
  stone: 'stone-card',
  // Hero card with vermilion top accent
  hero: 'stone-card border-t-2 border-t-[var(--accent)]',
  // Warm paper background section
  warm: 'bg-[var(--bg-secondary)]',
};

// Text colors using CSS custom properties
export const textStyles = {
  primary: 'text-[var(--text-primary)]',
  secondary: 'text-[var(--text-secondary)]',
  muted: 'text-[var(--text-muted)]',
  faint: 'text-[var(--text-faint)]',
  accent: 'text-[var(--accent)]',
  // Display font (Shippori Mincho)
  display: 'font-display',
  // Body font (IBM Plex Sans)
  body: 'font-body',
  // Mono font (IBM Plex Mono)
  mono: 'font-mono',
};

// Badge styles - Vermilion accents
export const badgeStyles = {
  // Subtle badge on paper background
  default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]',
  // Vermilion accent badge
  accent: 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20',
  // Mono uppercase label style
  label: 'font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]',
};

// Phase number badge - vermilion with low opacity (used in journey/phase cards)
export const phaseBadge = 'font-display text-[var(--accent)] opacity-30 text-6xl font-medium';

// Section marker style - vermilion line with mono label
export const sectionMarker = 'flex items-center gap-[var(--space-sm)] font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]';
export const sectionMarkerLine = 'w-8 h-px bg-[var(--accent)]';

// CTA button style
export const ctaButton = 'cta-button';

// Navigation link with calligraphic underline
export const navLink = 'nav-link';

// Scroll reveal utilities
export const scrollReveal = {
  fadeUp: 'reveal',
  stagger: (index: number) => `reveal [animation-delay:${String(index * 100)}ms]`,
};

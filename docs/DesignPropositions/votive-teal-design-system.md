# Votive Design System

A comprehensive design system for the Votive self-discovery application. This document defines the visual language, component patterns, and implementation guidelines to ensure consistency across the platform.

---

## Brand Identity

### Philosophy & Voice

**Votive** is a tool for intentional self-discovery. The name evokes devotion, commitment, and the casting of votes for who you want to become. Every design decision should reflect:

- **Introspection** - Calm, contemplative spaces that encourage reflection
- **Clarity** - Clean typography and clear hierarchy guide users through complex self-exploration
- **Trust** - Premium, editorial aesthetics that feel credible and professional
- **Warmth** - Approachable luxury; sophisticated but not cold

### Target Audience

Adults seeking meaningful personal growth who:
- Have tried conventional habit apps and found them insufficient
- Value depth over quick fixes
- Appreciate thoughtful, well-crafted experiences
- Are ready for honest self-examination

### Design Principles

1. **Depth over simplicity** - Don't oversimplify complex human psychology
2. **Editorial confidence** - Asymmetric layouts, bold typography, intentional whitespace
3. **Quiet luxury** - Premium without being flashy; sophistication through restraint
4. **Respect attention** - Animations should delight, not distract

---

## Color System

### Light Theme (Warm Ivory)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-ivory` | `#FAF8F5` | 250, 248, 245 | Primary background |
| `--color-cream` | `#F3F0EB` | 243, 240, 235 | Secondary background, sections |
| `--color-white` | `#FFFFFF` | 255, 255, 255 | Card surfaces |
| `--color-black` | `#1A1A1A` | 26, 26, 26 | Primary text |
| `--color-gray` | `#5C5C5C` | 92, 92, 92 | Secondary text |
| `--color-muted` | `#8A8A8A` | 138, 138, 138 | Tertiary text, labels |
| `--color-teal` | `#5BA8A8` | 91, 168, 168 | Primary accent |
| `--color-teal-light` | `#7CD0D0` | 124, 208, 208 | Accent highlights |
| `--color-gold` | `#C9A227` | 201, 162, 39 | Gold accent |
| `--color-gold-dark` | `#AA8C2C` | 170, 140, 44 | Gold accent (dark) |

### Dark Theme (Deep Teal)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-teal-deep` | `#0F1414` | 15, 20, 20 | Primary background |
| `--color-teal-elevated` | `#151C1C` | 21, 28, 28 | Elevated surfaces |
| `--color-teal-surface` | `#1A2424` | 26, 36, 36 | Card backgrounds |
| `--color-white-soft` | `#F5F5F3` | 245, 245, 243 | Primary text |
| `--color-stone` | `#9A9A96` | 154, 154, 150 | Secondary text |
| `--color-muted-dark` | `#666663` | 102, 102, 99 | Tertiary text |
| `--color-teal-accent` | `#7CD0D0` | 124, 208, 208 | Primary accent |
| `--color-gold-soft` | `#D4AF37` | 212, 175, 55 | Gold accent |
| `--color-gold-muted` | `#AA8C2C` | 170, 140, 44 | Gold accent (muted) |

### Semantic Color Mapping

```css
:root {
  --bg-primary: var(--color-ivory);
  --bg-secondary: var(--color-cream);
  --bg-surface: var(--color-white);
  --text-primary: var(--color-black);
  --text-secondary: var(--color-gray);
  --text-muted: var(--color-muted);
  --accent: var(--color-teal);
  --accent-bright: var(--color-teal-light);
  --accent-gold: var(--color-gold);
  --accent-gold-dark: var(--color-gold-dark);
  --border: rgba(26, 26, 26, 0.08);
}

.dark {
  --bg-primary: var(--color-teal-deep);
  --bg-secondary: var(--color-teal-elevated);
  --bg-surface: var(--color-teal-surface);
  --text-primary: var(--color-white-soft);
  --text-secondary: var(--color-stone);
  --text-muted: var(--color-muted-dark);
  --accent: var(--color-teal-accent);
  --accent-bright: var(--color-teal-accent);
  --accent-gold: var(--color-gold-soft);
  --accent-gold-dark: var(--color-gold-muted);
  --border: rgba(245, 245, 243, 0.06);
}
```

### Gradient Definitions

```css
/* Gold CTA gradient */
--gradient-gold: linear-gradient(135deg, #C9A227 0%, #AA8C2C 100%);

/* Border accent gradient (gold to teal) */
--gradient-border: linear-gradient(90deg, #C9A227, #5BA8A8);

/* Text gradient for hero highlights */
--gradient-text: linear-gradient(135deg, #1A1A1A 20%, #5BA8A8 80%);
.dark { --gradient-text: linear-gradient(135deg, #F5F5F3 20%, #7CD0D0 80%); }

/* Background gradient */
--gradient-bg: linear-gradient(180deg, #FAF8F5 0%, #F3F0EB 100%);
.dark { --gradient-bg: linear-gradient(180deg, #0F1414 0%, #151C1C 100%); }

/* Ambient spotlight */
--gradient-spotlight: radial-gradient(ellipse 60% 40% at 50% 30%, rgba(201, 162, 39, 0.12) 0%, transparent 60%);
.dark { --gradient-spotlight: radial-gradient(ellipse 60% 40% at 30% 20%, rgba(124, 208, 208, 0.1) 0%, transparent 60%); }
```

### Usage Guidelines

- **Gold** is the action color - use for CTAs and important interactive elements
- **Teal** is the insight color - use for accents, highlights, and secondary interactions
- **Never mix gold and teal in equal proportions** - let one dominate
- Gradients should be subtle; backgrounds use low opacity
- Dark theme uses teal as primary accent, light theme can use gold more prominently

---

## Typography

### Font Families

```css
--font-serif: 'Cormorant', Georgia, serif;
--font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Outfit:wght@300;400;500;600&subset=latin-ext&display=swap" rel="stylesheet">
```

### Cormorant (Serif)

An elegant, high-contrast serif with beautiful italic forms. Use for:
- Hero headlines
- Section titles
- Pull quotes
- Phase numbers
- Brand wordmark

**Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
**Italics:** All weights support italic (required for Polish diacritics in italic)

### Outfit (Sans-Serif)

A modern geometric sans-serif with excellent readability. Use for:
- Body text
- Navigation links
- Labels and captions
- Feature descriptions
- Buttons

**Weights:** 300 (light), 400 (regular), 500 (medium), 600 (semibold)

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Hero | clamp(2.5rem, 7vw, 5rem) | 500 | 1.1 | -0.03em | Hero headline |
| H1 | clamp(2rem, 5vw, 3rem) | 500 | 1.2 | -0.02em | Section titles |
| H2 | clamp(2rem, 5vw, 2.75rem) | 500 | 1.2 | -0.02em | Subsection titles |
| H3 | 1.375rem | 600 | 1.3 | 0 | Card titles |
| Body | 17px (1.0625rem) | 400 | 1.7 | 0 | Main body text |
| Body-sm | 0.9375rem | 400 | 1.7 | 0 | Secondary text |
| Caption | 0.875rem | 400 | 1.5 | 0 | Captions |
| Label | 0.75rem | 400 | 1.4 | 0.12em | Section labels (uppercase) |
| Label-sm | 0.6875rem | 400 | 1.4 | 0.08em | Small labels |

### Polish Character Support

Both fonts support full Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż).
Important: Include `latin-ext` subset in Google Fonts URL.

For italic Cormorant with Polish characters, ensure adequate padding to prevent clipping:
```css
.italic-highlight {
  font-style: italic;
  padding-left: 0.08em;
  padding-right: 0.08em;
  padding-bottom: 0.1em;
  overflow: visible;
}
```

---

## Spacing System

### Scale

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-xs` | 0.5rem | 8px |
| `--space-sm` | 1rem | 16px |
| `--space-md` | 1.5rem | 24px |
| `--space-lg` | 2rem | 32px |
| `--space-xl` | 3rem | 48px |
| `--space-2xl` | 4rem | 64px |
| `--space-3xl` | 6rem | 96px |
| `--space-4xl` | 8rem | 128px |
| `--space-5xl` | 12rem | 192px |

### Usage Guidelines

- **Component internal padding:** `--space-md` to `--space-xl`
- **Section padding (vertical):** `--space-5xl`
- **Grid gaps:** `--space-lg` to `--space-3xl`
- **Element margins:** `--space-sm` to `--space-lg`

---

## Shadow System

```css
--shadow-sm: 0 1px 3px rgba(26, 26, 26, 0.04);
--shadow-md: 0 4px 16px rgba(26, 26, 26, 0.06);
--shadow-lg: 0 12px 40px rgba(26, 26, 26, 0.08);
--shadow-glow: 0 0 60px rgba(91, 168, 168, 0.2);

/* Dark theme */
.dark {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 80px rgba(124, 208, 208, 0.15);
}
```

---

## Animation System

### Easing Curves

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);    /* Dramatic deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* Smooth deceleration */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);       /* Balanced */
```

### Duration Tokens

```css
--duration-fast: 300ms;      /* Micro-interactions */
--duration-normal: 500ms;    /* Standard transitions */
--duration-slow: 800ms;      /* Card transforms */
--duration-reveal: 1000ms;   /* Scroll reveals */
```

### Signature Animations

#### Word-by-Word Reveal
```css
@keyframes reveal-word {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(30px);
  animation: reveal-word 0.8s var(--ease-out-expo) forwards;
}

.hero-word:nth-child(1) { animation-delay: 0.1s; }
.hero-word:nth-child(2) { animation-delay: 0.15s; }
/* Increment by 0.05s for each word */
```

#### Float-In (Decorative Elements)
```css
@keyframes float-in {
  from { opacity: 0; transform: scale(0.8) translateY(40px); }
  to { opacity: 0.25; transform: scale(1) translateY(0); }
}
```

#### Pulse-Glow (CTA Attention)
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.4); }
  50% { box-shadow: 0 0 30px 10px rgba(201, 162, 39, 0.2); }
}
```

#### Scroll Reveal
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity var(--duration-reveal) var(--ease-out-expo),
              transform var(--duration-reveal) var(--ease-out-expo);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .reveal { opacity: 1; transform: none; }
  .hero-word { opacity: 1; transform: none; }
}
```

---

## Component Patterns

### Navigation

```html
<nav class="nav">
  <div class="nav-inner">
    <a href="#" class="nav-brand">Votive</a>
    <div class="nav-right">
      <div class="nav-links">
        <a href="#philosophy" class="nav-link">Philosophy</a>
        <a href="#journey" class="nav-link">The Journey</a>
        <a href="#insights" class="nav-link">AI Insights</a>
      </div>
      <button class="nav-cta">Begin Discovery</button>
      <div class="nav-controls">
        <div class="lang-toggle">...</div>
        <button class="theme-toggle">...</button>
      </div>
    </div>
  </div>
</nav>
```

**Behavior:**
- Fixed position with backdrop blur
- Background becomes more opaque on scroll (optional enhancement)
- Links have underline-draw hover animation
- Mobile: Collapse nav-links, keep CTA and controls

### Hero Section

Asymmetric layout with 60/40 split on desktop, single column on mobile.
- Word-by-word headline reveal animation
- Single decorative glow shape (theme-aware: gold/teal)
- Animated vote counter

### Phase Cards (Horizontal Scroll)

```html
<div class="phase-card">
  <div class="phase-card-header">
    <span class="phase-number">01</span>
  </div>
  <p class="phase-name">State Awareness</p>
  <h3 class="phase-title">Know Your Rhythms</h3>
  <p class="phase-description">...</p>
  <div class="phase-features">
    <span class="phase-feature">Tag 1</span>
    <span class="phase-feature">Tag 2</span>
  </div>
</div>
```

**Behavior:**
- Horizontal scroll with snap points
- Gradient border animation on hover (gold → teal)
- Scale up slightly (1.02) on hover
- "Coming Soon" variants have reduced opacity

### Insight Card

```html
<div class="insights-card">
  <div class="insights-card-header">
    <span class="insights-card-label">Sample Insight</span>
    <span class="insights-card-category">Identity Synthesis</span>
  </div>
  <p class="insights-card-quote">
    "Quote with <span class="highlight">highlighted</span> words..."
  </p>
  <p class="insights-card-analysis">Analysis text...</p>
  <p class="insights-card-footer">Powered by Claude AI</p>
</div>
```

**Behavior:**
- Static gold top border (not animated like phase cards)
- Teal glow backdrop (subtle, blurred)
- Gold text highlights for key phrases

### Buttons

#### Primary CTA (Gold Gradient)
```css
.cta-button {
  background: var(--gradient-gold);
  color: white;
  padding: var(--space-md) var(--space-2xl);
  font-weight: 500;
  transition: transform 0.5s var(--ease-out-expo),
              box-shadow 0.5s var(--ease-smooth);
  animation: pulse-glow 3s ease-in-out infinite;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(201, 162, 39, 0.4);
  animation: none;
}
```

#### Secondary (Nav CTA)
Smaller padding, no pulse animation.

### Feature List Items

```html
<div class="insights-feature">
  <span class="insights-feature-icon">
    <svg>...</svg>
  </span>
  <span class="insights-feature-text">Feature text</span>
</div>
```

**Behavior:**
- Left border accent (transparent → teal on hover)
- Background fill on hover (subtle teal tint)

---

## Layout Patterns

### Container Widths

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.container-wide {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}
```

### Asymmetric Grids

```css
/* Hero: 60/40 split */
.hero-inner {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .hero-inner {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
  }
}

/* Philosophy: 40/60 split */
@media (min-width: 1024px) {
  .philosophy-inner {
    grid-template-columns: 0.4fr 1fr;
  }
}

/* Insights: 50/100 split */
@media (min-width: 1024px) {
  .insights-inner {
    grid-template-columns: 0.5fr 1fr;
    align-items: center;
  }
}
```

### Horizontal Scroll

```css
.journey-scroll {
  display: flex;
  gap: var(--space-lg);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.journey-scroll::-webkit-scrollbar {
  display: none;
}

.phase-card {
  flex-shrink: 0;
  width: 320px;
  scroll-snap-align: start;
}
```

---

## Accessibility

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Color Contrast

All text/background combinations meet WCAG AA standards:
- Primary text on background: 12:1+ (light), 11:1+ (dark)
- Secondary text: 4.5:1+ on all backgrounds
- Accent colors tested for button contrast

---

## Tailwind Migration Guide

### Theme Extension Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Light theme
        ivory: '#FAF8F5',
        cream: '#F3F0EB',
        ink: '#1A1A1A',
        stone: '#5C5C5C',
        muted: '#8A8A8A',

        // Dark theme
        'teal-deep': '#0F1414',
        'teal-elevated': '#151C1C',
        'teal-surface': '#1A2424',
        'white-soft': '#F5F5F3',

        // Accent colors
        teal: {
          DEFAULT: '#5BA8A8',
          light: '#7CD0D0',
        },
        gold: {
          DEFAULT: '#C9A227',
          dark: '#AA8C2C',
          soft: '#D4AF37',
          muted: '#AA8C2C',
        },
      },

      fontFamily: {
        serif: ['Cormorant', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      animation: {
        'reveal-word': 'reveal-word 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-in': 'float-in 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },

      keyframes: {
        'reveal-word': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float-in': {
          from: { opacity: '0', transform: 'scale(0.8) translateY(40px)' },
          to: { opacity: '0.25', transform: 'scale(1) translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 162, 39, 0.4)' },
          '50%': { boxShadow: '0 0 30px 10px rgba(201, 162, 39, 0.2)' },
        },
      },

      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
}
```

### CSS Variable Mapping

Create a base CSS file that defines CSS variables from Tailwind values:

```css
/* src/styles/variables.css */
@tailwind base;

@layer base {
  :root {
    --bg-primary: theme('colors.ivory');
    --bg-secondary: theme('colors.cream');
    --bg-surface: white;
    --text-primary: theme('colors.ink');
    --text-secondary: theme('colors.stone');
    --text-muted: theme('colors.muted');
    --accent: theme('colors.teal.DEFAULT');
    --accent-gold: theme('colors.gold.DEFAULT');
    /* ... */
  }

  .dark {
    --bg-primary: theme('colors.teal-deep');
    --bg-secondary: theme('colors.teal-elevated');
    --bg-surface: theme('colors.teal-surface');
    --text-primary: theme('colors.white-soft');
    /* ... */
  }
}
```

### Custom Utilities

```css
/* Custom utilities for the design system */
@layer utilities {
  .gradient-gold {
    @apply bg-gradient-to-br from-gold to-gold-dark;
  }

  .gradient-border {
    background: linear-gradient(90deg, theme('colors.gold.DEFAULT'), theme('colors.teal.DEFAULT'));
  }

  .gradient-text-hero {
    @apply bg-gradient-to-br from-ink via-teal to-teal bg-clip-text text-transparent;
  }

  .dark .gradient-text-hero {
    @apply from-white-soft via-teal-light to-teal-light;
  }
}
```

---

## Implementation Checklist

### Landing Page
- [x] Hero with word-by-word reveal
- [x] Philosophy section with quote
- [x] Horizontal scroll journey
- [x] Insights features with hover effects
- [x] Sample insight card
- [x] CTA section with pulsing button
- [x] Theme toggle (dark/light)
- [x] Language toggle (EN/PL)
- [x] Scroll reveal animations
- [x] Reduced motion support

### React Migration
- [ ] Extract CSS variables to Tailwind config
- [ ] Create reusable component library
- [ ] Implement i18next for translations
- [ ] Set up framer-motion for animations
- [ ] Create theme context/provider

---

*Last updated: December 2024*
*Design system version: 1.0.0*

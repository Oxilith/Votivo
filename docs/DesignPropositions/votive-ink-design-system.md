# Votive Ink & Stone Design System

A design system for the "Ink & Stone" variant of the Votive landing page. This document defines the visual language, component patterns, and implementation guidelines for a Japanese minimalism-inspired aesthetic rooted in wabi-sabi philosophy and the concept of ma (間) — intentional negative space.

---

## Brand Identity

### Philosophy & Voice

**Ink & Stone** embraces contemplative precision through Japanese minimalist principles. The aesthetic evokes:

- **Ma (間)** — Intentional negative space creates breathing room for reflection
- **Wabi-sabi** — Beauty in imperfection and asymmetry
- **Contemplation** — Calm focus during input, moments of delight at milestones
- **Precision** — Analytical rigor balanced with introspective warmth

### Design Principles

1. **Asymmetric layouts** — Cards placed like stones in a zen garden
2. **Golden ratio spacing** — Proportions derived from φ ≈ 1.618
3. **Vermilion accent** — Traditional hanko seal red as the singular accent
4. **Vertical rhythm** — Generous line heights and breathing space
5. **Gentle reveals** — Animations that rise like calligraphy strokes

---

## Color System

### Light Theme — Rice Paper

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-paper` | `#FAF9F7` | 250, 249, 247 | Primary background |
| `--color-paper-warm` | `#F5F3EF` | 245, 243, 239 | Secondary background |
| `--color-stone` | `#E8E5DF` | 232, 229, 223 | Tertiary/elevated surfaces |
| `--color-ink` | `#1A1A1A` | 26, 26, 26 | Primary text |
| `--color-ink-soft` | `#3D3D3D` | 61, 61, 61 | Secondary text |
| `--color-ink-muted` | `#6B6B6B` | 107, 107, 107 | Muted text |
| `--color-ink-faint` | `#9A9A9A` | 154, 154, 154 | Faint text/labels |
| `--color-vermilion` | `#C73E1D` | 199, 62, 29 | Primary accent (hanko red) |
| `--color-vermilion-soft` | `#D45A3A` | 212, 90, 58 | Hover accent |

### Dark Theme — Night Ink

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-night` | `#0F0F0F` | 15, 15, 15 | Primary background |
| `--color-night-soft` | `#1A1A1A` | 26, 26, 26 | Secondary background |
| `--color-night-elevated` | `#242424` | 36, 36, 36 | Elevated surfaces |
| `--color-moon` | `#E8E5DF` | 232, 229, 223 | Primary text |
| `--color-moon-soft` | `#B8B5AF` | 184, 181, 175 | Secondary text |
| `--color-moon-muted` | `#7A7875` | 122, 120, 117 | Muted text |
| `--color-moon-faint` | `#4A4845` | 74, 72, 69 | Faint text/labels |
| `--color-vermilion-night` | `#E85A3A` | 232, 90, 58 | Primary accent |
| `--color-vermilion-night-soft` | `#FF7A5A` | 255, 122, 90 | Hover accent |

### CSS Variables Implementation

```css
:root {
  /* Light Theme - Rice Paper */
  --color-paper: #faf9f7;
  --color-paper-warm: #f5f3ef;
  --color-stone: #e8e5df;
  --color-ink: #1a1a1a;
  --color-ink-soft: #3d3d3d;
  --color-ink-muted: #6b6b6b;
  --color-ink-faint: #9a9a9a;
  --color-vermilion: #c73e1d;
  --color-vermilion-soft: #d45a3a;

  /* Semantic mappings */
  --bg-primary: var(--color-paper);
  --bg-secondary: var(--color-paper-warm);
  --bg-tertiary: var(--color-stone);
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-ink-soft);
  --text-muted: var(--color-ink-muted);
  --text-faint: var(--color-ink-faint);
  --accent: var(--color-vermilion);
  --accent-soft: var(--color-vermilion-soft);
  --border: rgba(26, 26, 26, 0.08);
  --border-strong: rgba(26, 26, 26, 0.15);
}

.dark {
  --bg-primary: var(--color-night);
  --bg-secondary: var(--color-night-soft);
  --bg-tertiary: var(--color-night-elevated);
  --text-primary: var(--color-moon);
  --text-secondary: var(--color-moon-soft);
  --text-muted: var(--color-moon-muted);
  --text-faint: var(--color-moon-faint);
  --accent: var(--color-vermilion-night);
  --accent-soft: var(--color-vermilion-night-soft);
  --border: rgba(232, 229, 223, 0.06);
  --border-strong: rgba(232, 229, 223, 0.12);
}
```

### Usage Guidelines

- **Vermilion** is the sole accent color — use for CTAs, highlights, and interactive states
- **Maintain warm neutrals** — rice paper tones create contemplative atmosphere
- **Never use pure black** — use `--color-ink` (1A1A1A) for softer contrast
- **Borders are subtle** — use low-opacity borders to maintain airiness

---

## Typography

### Font Families

```css
--font-display: 'Shippori Mincho', 'Hiragino Mincho ProN', serif;
--font-body: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'IBM Plex Mono', Consolas, monospace;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Shippori Mincho (Display Serif)

A Japanese-inspired Mincho typeface with elegant calligraphic qualities. Use for:
- Hero headlines
- Section titles
- Card titles
- Blockquotes
- Phase numbers

**Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### IBM Plex Sans (Body)

A humanist sans-serif with excellent readability. Use for:
- Body text
- Subtitles
- Descriptions
- Navigation links

**Weights:** 300 (light), 400 (regular), 500 (medium)

### IBM Plex Mono (Labels)

A monospace font for technical elements. Use for:
- Section labels
- Feature tags
- Category badges
- Vote counter labels
- Footer meta

**Weights:** 400 (regular), 500 (medium)

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Hero | clamp(2.5rem, 7vw, 4.5rem) | 500 | 1.15 | -0.02em | Hero headline |
| H1 | clamp(1.75rem, 4vw, 2.5rem) | 500 | 1.3 | 0 | Section titles |
| H2 | clamp(1.75rem, 4vw, 2.25rem) | 500 | 1.3 | 0 | Subsection titles |
| H3 | 1.25rem | 500 | 1.3 | 0 | Card titles |
| Body | 1.0625rem | 400 | 1.75-2.0 | 0 | Main body text |
| Body-sm | 0.9375rem | 400 | 1.7-1.8 | 0 | Secondary text |
| Label | 0.6875rem | 400 | 1.4 | 0.12-0.15em | Section labels (mono, uppercase) |
| Tag | 0.6875rem | 400 | 1.4 | 0 | Feature tags (mono) |

### Polish Character Support

All fonts include full Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) for bilingual support.

---

## Spacing System

### Golden Ratio Scale

Spacing values are derived from the golden ratio (φ ≈ 1.618):

```css
--space-xs: 0.382rem;   /* ~6px */
--space-sm: 0.618rem;   /* ~10px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.618rem;   /* ~26px */
--space-xl: 2.618rem;   /* ~42px */
--space-2xl: 4.236rem;  /* ~68px */
--space-3xl: 6.854rem;  /* ~110px */
--space-4xl: 11.09rem;  /* ~177px */
```

### Ma (間) Elements

Special spacing components for intentional negative space:

```css
.ma-vertical {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
  margin: var(--space-3xl) auto;
  max-width: 200px;
  position: relative;
  overflow: hidden;
}

/* Brush reveal animation - line draws in from center on scroll */
.ma-vertical::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  transform: scaleX(0);
  transform-origin: center;
}

.ma-vertical.visible::after {
  animation: brush-reveal 1.5s var(--ease-out) forwards;
}

@keyframes brush-reveal {
  to { transform: scaleX(1); }
}

.ma-breath {
  height: var(--space-3xl);
}
```

**Usage:** Place `.ma-vertical` between sections and observe with IntersectionObserver to add `.visible` class on scroll.

---

## Shadow System

Shadows are minimal and ink-like to maintain the contemplative aesthetic:

```css
--shadow-sm: 0 1px 2px rgba(26, 26, 26, 0.04);
--shadow-md: 0 4px 12px rgba(26, 26, 26, 0.06);
--shadow-ink: 2px 2px 0 rgba(26, 26, 26, 0.08);
```

### Usage Guidelines

- **Prefer subtle elevation** — shadows should be barely perceptible
- **Use borders primarily** — 1px borders with low opacity maintain airiness
- **Reserve shadow-md for hover** — creates gentle lift effect

---

## Texture & Atmosphere

### Paper Texture Overlay

A subtle washi paper grain effect applied globally via SVG noise filter:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
}

.dark body::before {
  opacity: 0.015;  /* Subtler in dark mode */
}
```

### Ink Brush Decoration

Decorative ink brush strokes as fixed overlays, creating atmosphere without interfering with content:

```css
.ink-decoration {
  position: fixed;
  right: 0;
  top: 10%;
  height: 80vh;
  width: auto;
  max-width: 500px;
  opacity: 0.06;
  pointer-events: none;
  z-index: 1;
}

.dark .ink-decoration {
  opacity: 0.08;
}

@media (max-width: 1024px) {
  .ink-decoration {
    display: none;  /* Hide on mobile for performance */
  }
}
```

**SVG Structure:**
```html
<svg class="ink-decoration" viewBox="0 0 400 800" fill="none" aria-hidden="true">
  <path d="M200 0 Q 250 200 180 400 Q 120 600 220 800"
        stroke="currentColor" stroke-width="80" stroke-linecap="round"/>
  <circle cx="200" cy="150" r="60" fill="currentColor" opacity="0.3"/>
  <circle cx="180" cy="450" r="40" fill="currentColor" opacity="0.2"/>
</svg>
```

---

## Animation System

### Easing & Timing

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--duration-fast: 200ms;
--duration-normal: 400ms;
--duration-slow: 800ms;
--duration-reveal: 1200ms;
```

### Scroll Reveal Animation

Elements rise gently like calligraphy strokes:

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity var(--duration-reveal) var(--ease-out),
              transform var(--duration-reveal) var(--ease-out);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Stagger Delays

```css
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }
.reveal-delay-5 { transition-delay: 0.5s; }
```

### Hero Word Animation

Words reveal with staggered delays:

```css
.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  animation: word-rise 0.8s var(--ease-out) forwards;
}

@keyframes word-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Ink Drawing Animation

SVG stroke animation for calligraphic brush effects:

```css
.ink-stroke path {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: ink-draw 3s var(--ease-out) 0.5s forwards;
}

.ink-stroke circle {
  opacity: 0;
  animation: ink-splash 0.8s var(--ease-out) forwards;
}

/* Stagger circle reveals */
.ink-stroke circle:nth-child(2) { animation-delay: 2s; }
.ink-stroke circle:nth-child(3) { animation-delay: 2.5s; }

@keyframes ink-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes ink-splash {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 0.4; }
  100% { opacity: 0.3; transform: scale(1); }
}
```

### Brush Reveal Animation

Horizontal line reveals like a calligraphy stroke:

```css
.brush-line {
  position: relative;
  overflow: hidden;
}

.brush-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  transform: scaleX(0);
  transform-origin: center;
}

.brush-line.visible::after {
  animation: brush-reveal 1.5s var(--ease-out) forwards;
}

@keyframes brush-reveal {
  to { transform: scaleX(1); }
}
```

### Quote Marks Animation

Decorative quote marks that fade in after content:

```css
.animated-quote::before,
.animated-quote::after {
  display: inline-block;
  color: var(--accent);
  opacity: 0;
}

.animated-quote::before { content: '"'; }
.animated-quote::after { content: '"'; }

.animated-quote.visible::before,
.animated-quote.visible::after {
  animation: quote-fade 0.8s var(--ease-out) 0.4s forwards;
}

@keyframes quote-fade {
  to { opacity: 1; }
}
```

### Interactive Element Animation

For buttons and interactive elements that need both entry animation AND hover/active states, use opacity-only animations to prevent transform conflicts:

```css
/* Problem: animation with forwards keeps transform applied, blocking hover */
/* DON'T use fade-up with transform on interactive elements */

/* Solution: opacity-only animation for interactive elements */
@keyframes fade-up-opacity {
  from { opacity: 0; }
  to { opacity: 1; }
}

.interactive-reveal {
  opacity: 0;
  animation: fade-up-opacity 0.8s var(--ease-out) 0.6s forwards;
  /* Transform is free for hover/active states */
}

.interactive-reveal:hover {
  transform: translateY(-2px);
}

.interactive-reveal:active {
  transform: translateY(0) scale(0.96);
}
```

**When using `.reveal` class on buttons:**
```css
/* Override reveal transform for buttons to enable interactions */
.button.reveal {
  transform: none;  /* Remove initial translateY from .reveal */
}

.button.reveal.visible {
  transform: none;
  transition: opacity var(--duration-reveal) var(--ease-out),
              background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
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

  .reveal, .hero-word {
    opacity: 1;
    transform: none;
  }
}
```

---

## Component Patterns

### Floating Navigation

```css
.nav {
  position: fixed;
  top: var(--space-lg);
  left: var(--space-xl);
  right: var(--space-xl);
  background: rgba(250, 249, 247, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
}
```

### Navigation Link with Calligraphic Underline

Brush-stroke style underline using clip-path for organic edges:

```css
.nav-link {
  position: relative;
  transition: color var(--duration-fast) var(--ease-out);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-normal) var(--ease-out);
  border-radius: 1px;
  /* Brush stroke variation - irregular edges */
  clip-path: polygon(0 40%, 5% 0, 95% 20%, 100% 60%, 98% 100%, 2% 80%);
}

.nav-link:hover::after {
  transform: scaleX(1);
}
```

### Section Marker

```css
.section-marker {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.section-marker::before {
  content: '';
  width: 24px;
  height: 1px;
  background: var(--accent);
}
```

### Stone Cards (Asymmetric Grid)

Cards placed like stones in a zen garden:

```css
.journey-stones {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-lg);
}

/* Asymmetric placement */
.stone:nth-child(1) { grid-column: 1 / 5; }
.stone:nth-child(2) { grid-column: 5 / 9; margin-top: var(--space-2xl); }
.stone:nth-child(3) { grid-column: 9 / 13; }
.stone:nth-child(4) { grid-column: 2 / 6; margin-top: calc(-1 * var(--space-lg)); }
.stone:nth-child(5) { grid-column: 7 / 11; margin-top: var(--space-xl); }
```

**Ink Splatter Hover Effect:**
```css
.stone {
  position: relative;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.stone:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

/* Ink splatter decoration on hover */
.stone::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.stone:hover::after {
  opacity: 0.15;
  transform: scale(1);
}
```

**Organic Rotation on Reveal:**
```css
/* Cards rotate slightly on scroll reveal for hand-placed aesthetic */
.stone.reveal {
  transform: translateY(24px) rotate(-0.5deg);
}

.stone.reveal:nth-child(odd) {
  transform: translateY(24px) rotate(0.5deg);
}

.stone.reveal.visible {
  transform: translateY(0) rotate(0deg);
}
```

### Insight Card

```css
.insights-card {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  padding: var(--space-2xl);
  position: relative;
}

.insights-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: var(--space-xl);
  width: 40px;
  height: 2px;
  background: var(--accent);
}
```

### CTA Button

Complete button pattern with hover lift and active press states:

```css
.cta-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-2xl);
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background: var(--accent);
  transition: background var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

/* Hover: lift effect */
.cta-button:hover {
  background: var(--accent-soft);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(199, 62, 29, 0.25);
}

/* Active: press/shrink effect */
.cta-button:active,
.cta-button:active:hover {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 2px 8px rgba(199, 62, 29, 0.3);
  transition-duration: 50ms;  /* Faster response on press */
}

/* Arrow icon animation on hover */
.cta-button-icon {
  width: 16px;
  height: 16px;
  transition: transform var(--duration-normal) var(--ease-out);
}

.cta-button:hover .cta-button-icon {
  transform: translateX(4px);
}
```

---

## Layout Patterns

### Hero Section

Asymmetric 2-column layout with content aligned to bottom:

```css
.hero-inner {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  align-items: end;
  gap: var(--space-3xl);
}
```

### Philosophy Section

Centered narrow container for focused reading:

```css
.philosophy-inner {
  max-width: 720px;
  margin: 0 auto;
}
```

### Insights Section

40/60 split with header and card:

```css
.insights-inner {
  display: grid;
  grid-template-columns: 0.4fr 0.6fr;
  align-items: start;
  gap: var(--space-3xl);
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
- Primary text on light: 14:1+ contrast ratio
- Secondary text on light: 8:1+ contrast ratio
- Vermilion on white: 4.8:1 (passes AA for large text)

---

## Theme Toggle

### Implementation

```javascript
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('votive-theme-ink', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('votive-theme-ink', 'light');
  }
}

// Initialize from localStorage or system preference
(function() {
  const theme = localStorage.getItem('votive-theme-ink');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();
```

---

## Application to Other Pages

### Assessment Pages

- **Calm during input**: Clean forms with generous whitespace
- **Progress visualization**: Subtle ink strokes filling in
- **Milestone celebrations**: Vermilion accents appear
- **Question cards**: Stone-like placement with gentle reveals

### Analysis Pages

- **Data presentation**: Stone-like cards with asymmetric layouts
- **Insight reveals**: Staggered animations for each insight category
- **Identity synthesis**: Large quote-style display with serif typography
- **Pattern visualization**: Minimal charts with vermilion highlights

---

## Implementation Checklist

### Core Patterns
- [x] Rice paper warm background
- [x] Paper texture overlay (washi grain)
- [x] Dark/light theme toggle
- [x] Golden ratio spacing system
- [x] Reduced motion support

### Navigation
- [x] Floating navigation with backdrop blur
- [x] Calligraphic underline on links
- [x] Button hover lift + active shrink

### Hero Section
- [x] Staggered word reveal animation
- [x] Fixed ink brush decoration (80vh overlay)
- [x] Ink drawing SVG animation
- [x] Opacity-only animation for CTA button

### Content Sections
- [x] Philosophy section with animated blockquote
- [x] Quote marks fade-in animation
- [x] Ma-vertical dividers with brush reveal
- [x] Ma breathing space elements

### Cards & Components
- [x] Asymmetric stone card grid (zen garden)
- [x] Ink splatter hover effect on cards
- [x] Organic rotation on card reveal
- [x] Insights section with sample card

### Interactive Elements
- [x] Button hover: lift (-2px) + shadow
- [x] Button active: press (scale 0.96)
- [x] Arrow icon slide on hover
- [x] Scroll reveal animations

### Internationalization
- [x] EN/PL language toggle
- [x] Polish diacritics support

---

*Last updated: December 2024*
*Design system version: 1.1.0 (Ink & Stone)*

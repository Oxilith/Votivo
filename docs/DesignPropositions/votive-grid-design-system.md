# Votive Grid Precision Design System

A design system for the "Minimalist Grid Precision" variant of the Votive landing page. This document defines the visual language, component patterns, and implementation guidelines for this ultra-clean geometric aesthetic.

---

## Brand Identity

### Philosophy & Voice

**Minimalist Grid Precision** embraces systematic clarity through strict geometric principles. The aesthetic evokes:

- **Clarity** - Mathematical grids and precise alignment create immediate understanding
- **Precision** - Monospace typography and systematic spacing suggest analytical rigor
- **Restraint** - A maximum 3-color palette demonstrates design confidence
- **Transparency** - Visible grid lines and systematic patterns reveal underlying structure

### Design Principles

1. **Strict modular grid** - All elements align to an 8px base unit
2. **Maximum 3 colors** - Dusty blue accent + ink/paper contrast
3. **Zero border-radius** - Sharp edges reinforce geometric precision
4. **Monospace labels** - Code-style typography for section identifiers
5. **Horizontal reveals** - Animations slide left-to-right, respecting grid axis

---

## Color System

### Light Theme

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-bg` | `#FAFAFA` | 250, 250, 250 | Primary background |
| `--color-bg-alt` | `#F5F5F5` | 245, 245, 245 | Secondary background |
| `--color-surface` | `#FFFFFF` | 255, 255, 255 | Card surfaces |
| `--color-ink` | `#0D0D0D` | 13, 13, 13 | Primary text (black onyx) |
| `--color-ink-secondary` | `#404040` | 64, 64, 64 | Secondary text |
| `--color-ink-muted` | `#808080` | 128, 128, 128 | Muted text |
| `--color-accent` | `#5D7A8C` | 93, 122, 140 | Primary accent (dusty blue) |
| `--color-highlight` | `#F5D0D0` | 245, 208, 208 | Pale pink highlight |
| `--color-border` | `rgba(13, 13, 13, 0.1)` | - | Borders |
| `--color-grid` | `rgba(13, 13, 13, 0.04)` | - | Grid lines |

### Dark Theme

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-bg` | `#0D0D0D` | 13, 13, 13 | Primary background |
| `--color-bg-alt` | `#1A1A1A` | 26, 26, 26 | Secondary background |
| `--color-surface` | `#262626` | 38, 38, 38 | Card surfaces |
| `--color-ink` | `#FAFAFA` | 250, 250, 250 | Primary text |
| `--color-ink-secondary` | `#BFBFBF` | 191, 191, 191 | Secondary text |
| `--color-ink-muted` | `#808080` | 128, 128, 128 | Muted text |
| `--color-accent` | `#7D9AAC` | 125, 154, 172 | Primary accent (lighter blue) |
| `--color-highlight` | `#D4A5B5` | 212, 165, 181 | Pale pink highlight |
| `--color-border` | `rgba(250, 250, 250, 0.1)` | - | Borders |
| `--color-grid` | `rgba(250, 250, 250, 0.03)` | - | Grid lines |

### CSS Variables Implementation

```css
:root {
  /* Light Theme */
  --color-bg: #FAFAFA;
  --color-bg-alt: #F5F5F5;
  --color-surface: #FFFFFF;
  --color-ink: #0D0D0D;
  --color-ink-secondary: #404040;
  --color-ink-muted: #808080;
  --color-accent: #5D7A8C;
  --color-highlight: #F5D0D0;
  --color-border: rgba(13, 13, 13, 0.1);
  --color-grid: rgba(13, 13, 13, 0.04);

  /* Semantic mappings */
  --bg-primary: var(--color-bg);
  --bg-secondary: var(--color-bg-alt);
  --bg-surface: var(--color-surface);
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-ink-secondary);
  --text-muted: var(--color-ink-muted);
  --accent: var(--color-accent);
  --border: var(--color-border);
}

.dark {
  --color-bg: #0D0D0D;
  --color-bg-alt: #1A1A1A;
  --color-surface: #262626;
  --color-ink: #FAFAFA;
  --color-ink-secondary: #BFBFBF;
  --color-ink-muted: #808080;
  --color-accent: #7D9AAC;
  --color-highlight: #D4A5B5;
  --color-border: rgba(250, 250, 250, 0.1);
  --color-grid: rgba(250, 250, 250, 0.03);
}
```

### Usage Guidelines

- **Dusty blue** is the sole accent color - use for CTAs, highlights, and interactive states
- **Maintain 3-color maximum** - ink, paper, and accent only
- **Never use pure black** - use `--color-ink` (0D0D0D) for softer contrast
- **Grid lines are decorative** - visible 64px grid reinforces systematic aesthetic

---

## Typography

### Font Families

```css
--font-serif: 'Merriweather', Georgia, serif;
--font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Fira Code', Consolas, monospace;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&subset=latin-ext&display=swap" rel="stylesheet">
```

### Merriweather (Serif)

A readable, sturdy serif with excellent screen rendering. Use for:
- Hero headlines
- Section titles
- Card titles
- Pull quotes

**Weights:** 300 (light), 400 (regular), 700 (bold), 400 italic

### Poppins (Sans-Serif)

A geometric sans-serif with clean proportions. Use for:
- Body text
- Subtitles
- Descriptions
- Button labels (when not using monospace)

**Weights:** 300, 400, 500, 600, 700

### Fira Code (Monospace)

A developer-focused monospace with programming ligatures. Use for:
- Navigation links
- Section labels (`// LABEL`)
- Phase numbers
- Feature tags
- Buttons and CTAs
- Vote counter

**Weights:** 400 (regular), 500 (medium)

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Hero | clamp(2.5rem, 6vw, 4.5rem) | 300 | 1.15 | -0.02em | Hero headline |
| H1 | clamp(1.75rem, 4vw, 2.5rem) | 400 | 1.2 | -0.01em | Section titles |
| H2 | clamp(1.5rem, 3vw, 2rem) | 400 | 1.3 | -0.01em | Subsection titles |
| H3 | 1.125rem | 400 | 1.3 | 0 | Card titles |
| Body | 1.0625rem | 400 | 1.8 | 0 | Main body text |
| Body-sm | 0.875rem | 400 | 1.7 | 0 | Secondary text |
| Label | 0.6875rem | 400 | 1.4 | 0.15em | Section labels (mono, uppercase) |
| Tag | 0.625rem | 400 | 1.4 | 0.02em | Feature tags (mono) |
| Mono-lg | 0.8125rem | 500 | 1 | 0.05em | Buttons (mono, uppercase) |

### Polish Character Support

All fonts include full Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) via `latin-ext` subset.

---

## Grid System

### Base Unit

```css
--grid-unit: 8px;
```

All spacing, sizing, and positioning derive from this 8px base unit.

### Spacing Scale

| Token | Calculation | Pixels |
|-------|-------------|--------|
| `--grid-unit * 0.5` | 4px | Micro spacing |
| `--grid-unit` | 8px | Base unit |
| `--grid-unit * 1.5` | 12px | Small spacing |
| `--grid-unit * 2` | 16px | Medium spacing |
| `--grid-unit * 3` | 24px | Grid gap |
| `--grid-unit * 4` | 32px | Large spacing |
| `--grid-unit * 8` | 64px | Section dividers |
| `--grid-unit * 16` | 128px | Section padding |

### 12-Column Grid

```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: calc(var(--grid-unit) * 3); /* 24px */
}
```

### Column Classes

```css
.col-span-4 { grid-column: span 4; }  /* 33% */
.col-span-5 { grid-column: span 5; }  /* 42% */
.col-span-6 { grid-column: span 6; }  /* 50% */
.col-span-7 { grid-column: span 7; }  /* 58% */
.col-span-8 { grid-column: span 8; }  /* 67% */
.col-span-12 { grid-column: span 12; } /* 100% */
```

### Container

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 calc(var(--grid-unit) * 4); /* 32px horizontal */
}
```

### Visible Grid Background

```css
.grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(var(--color-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid) 1px, transparent 1px);
  background-size: 64px 64px; /* 8 grid units */
  pointer-events: none;
  z-index: 0;
}
```

---

## Shadow System

Shadows are intentionally minimal to maintain the flat, geometric aesthetic.

```css
--shadow-sm: 0 1px 2px rgba(13, 13, 13, 0.04);
--shadow-md: 0 2px 8px rgba(13, 13, 13, 0.06);
```

### Usage Guidelines

- **Prefer borders over shadows** - 1px solid borders align with grid philosophy
- **No blur effects** - maintain sharp, geometric edges
- **No box-shadow on hover** - use border-color transitions instead

---

## Animation System

### Easing & Timing

```css
--ease-out: cubic-bezier(0.25, 1, 0.5, 1);
--ease-linear: linear;
--duration-base: 80ms;       /* Per 8px of movement */
--duration-reveal: 400ms;    /* Standard transition */
```

### Grid-Aligned Reveals

Animations slide horizontally (left-to-right) to respect the grid's horizontal axis.

```css
.reveal {
  opacity: 0;
  transform: translateX(-16px); /* 2 grid units */
  transition: opacity var(--duration-reveal) var(--ease-out),
              transform var(--duration-reveal) var(--ease-out);
}

.reveal.visible {
  opacity: 1;
  transform: translateX(0);
}
```

### Stagger Delays

Delays increment by 100ms (proportional to grid timing).

```css
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }
.reveal-delay-5 { transition-delay: 0.5s; }
```

### Hero Word Animation

Words reveal left-to-right with systematic 50ms stagger.

```css
.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateX(-20px);
  animation: reveal-grid 0.4s var(--ease-out) forwards;
}

.hero-word:nth-child(1) { animation-delay: 0.1s; }
.hero-word:nth-child(2) { animation-delay: 0.15s; }
/* Continue with 0.05s increments */

@keyframes reveal-grid {
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

### Section Label

Code-style labels with `//` prefix.

```html
<p class="section-label" data-i18n="philosophy.label">The Problem</p>
```

```css
.section-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: calc(var(--grid-unit) * 2);
}

.section-label::before {
  content: '//';
  margin-right: calc(var(--grid-unit));
  color: var(--text-muted);
}
```

### Navigation

Fixed top navigation with monospace styling.

```css
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
}

.nav-link {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  transition: color var(--duration-reveal) var(--ease-out);
}

.nav-link:hover {
  color: var(--text-primary);
}
```

### Phase Cards (5-Column Grid)

```html
<div class="phase-card">
  <div class="phase-card-header">
    <span class="phase-number">01</span>
  </div>
  <p class="phase-name">State Awareness</p>
  <h3 class="phase-title">Know Your Rhythms</h3>
  <p class="phase-description">...</p>
  <div class="phase-features">
    <span class="phase-feature">Peak energy times</span>
  </div>
</div>
```

```css
.journey-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: calc(var(--grid-unit) * 2);
}

.phase-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: calc(var(--grid-unit) * 3);
  position: relative;
  transition: border-color var(--duration-reveal) var(--ease-out);
}

.phase-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-reveal) var(--ease-out);
}

.phase-card:hover {
  border-color: var(--accent);
}

.phase-card:hover::before {
  transform: scaleX(1);
}

.phase-number {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--accent);
  line-height: 1;
}

.phase-feature {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.02em;
  color: var(--text-muted);
  padding: calc(var(--grid-unit) * 0.5) calc(var(--grid-unit));
  background: var(--bg-secondary);
}
```

### Insight Card

```css
.insights-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: calc(var(--grid-unit) * 4);
}

.insights-card::before {
  content: '// AI_INSIGHT';
  display: block;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: calc(var(--grid-unit) * 3);
}

.insights-card-quote .highlight {
  color: var(--accent);
  font-style: normal;
  font-weight: 600;
}
```

### CTA Button

```css
.cta-button {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--grid-unit) * 1.5);
  background: var(--accent);
  color: white;
  padding: calc(var(--grid-unit) * 2) calc(var(--grid-unit) * 4);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: opacity var(--duration-reveal) var(--ease-out);
}

.cta-button:hover {
  opacity: 0.85;
}
```

---

## Layout Patterns

### Hero Section

8-column text + 4-column meta on desktop, full-width on mobile.

```css
.hero-content {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--grid-gap);
  align-items: end;
}

.hero-text {
  grid-column: span 8;
}

.hero-meta {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

@media (max-width: 1024px) {
  .hero-text, .hero-meta {
    grid-column: span 12;
  }
}
```

### Philosophy Section

4-column header + 8-column content.

```css
.philosophy-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--grid-gap);
}

.philosophy-header { grid-column: span 4; }
.philosophy-content { grid-column: span 8; }
```

### CTA Section

Centered content spanning columns 4-9 (6 columns).

```css
.cta-text {
  grid-column: 4 / span 6;
  text-align: center;
}
```

### Section Padding

```css
section {
  padding: calc(var(--grid-unit) * 16) 0; /* 128px */
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
- Primary text on light: 18:1+ contrast ratio
- Secondary text on light: 7:1+ contrast ratio
- Accent on white: 4.6:1 (passes AA for large text)

### Selection

```css
::selection {
  background-color: var(--accent);
  color: white;
}
```

---

## Theme Toggle

### Implementation

```javascript
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('votive-theme-grid', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('votive-theme-grid', 'light');
  }
}

// Initialize from localStorage or system preference
(function() {
  const theme = localStorage.getItem('votive-theme-grid');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();
```

---

## Implementation Checklist

### Landing Page
- [x] Visible 64px grid background pattern
- [x] Fixed navigation with monospace links
- [x] Hero with left-to-right word reveal animation
- [x] Vote counter with monospace styling
- [x] Philosophy section with code-style label
- [x] 5-column journey cards layout
- [x] Phase cards with top border hover animation
- [x] Insights card with `// AI_INSIGHT` label
- [x] CTA section centered in grid
- [x] Dark/light theme toggle
- [x] EN/PL language toggle
- [x] Scroll reveal animations (horizontal)
- [x] Reduced motion support

---

*Last updated: December 2024*
*Design system version: 1.0.0 (Grid Precision)*

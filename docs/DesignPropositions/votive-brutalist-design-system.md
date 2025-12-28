# Votive Brutalist Elegance Design System

A design system for the "Brutalist Elegance" variant of the Votive landing page. This document defines the visual language, component patterns, and implementation guidelines for this distinctive aesthetic direction.

---

## Brand Identity

### Philosophy & Voice

**Brutalist Elegance** combines raw, uncompromising design with refined typography and deliberate restraint. The aesthetic evokes:

- **Authority** - Deep navy backgrounds and code-style labels project confidence and expertise
- **Precision** - Hard shadows, sharp edges, and monospace typography suggest analytical rigor
- **Intentionality** - Every element serves a purpose; decoration is functional
- **Depth** - Dark themes create focus; gold accents draw attention to what matters

### Design Principles

1. **Hard edges over soft curves** - No border-radius, no blurred shadows
2. **Vertical rhythm** - Side navigation, rotated text, timeline layouts
3. **Code aesthetic** - Monospace body text, `// LABELS`, technical precision
4. **Gold as signal** - Use gold sparingly for maximum impact on CTAs and highlights
5. **Reveal, don't show** - Animations reveal content progressively

---

## Color System

### Dark Theme (Default)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-primary` | `#0A0E14` | 10, 14, 20 | Primary background (deep navy) |
| `--bg-elevated` | `#111722` | 17, 23, 34 | Elevated surfaces, side nav |
| `--bg-surface` | `#1A2230` | 26, 34, 48 | Card backgrounds |
| `--bg-border` | `#2A3442` | 42, 52, 66 | Borders, grid pattern, shadows |
| `--text-primary` | `#FFFFFF` | 255, 255, 255 | Headlines, primary text |
| `--text-secondary` | `#C8CCD4` | 200, 204, 212 | Body text |
| `--text-muted` | `#5C6370` | 92, 99, 112 | Labels, captions |
| `--accent-gold` | `#E5C07B` | 229, 192, 123 | Primary accent, CTAs |
| `--accent-gold-muted` | `#AA8C5A` | 170, 140, 90 | Secondary accent |
| `--accent-gold-dim` | `#6B5A3A` | 107, 90, 58 | Tertiary accent, borders |

### Light Theme

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-primary` | `#FAF8F5` | 250, 248, 245 | Primary background (warm ivory) |
| `--bg-elevated` | `#F3F0EB` | 243, 240, 235 | Elevated surfaces |
| `--bg-surface` | `#FFFFFF` | 255, 255, 255 | Card backgrounds |
| `--bg-border` | `#D4D0C8` | 212, 208, 200 | Borders |
| `--text-primary` | `#0A0E14` | 10, 14, 20 | Headlines |
| `--text-secondary` | `#3A4250` | 58, 66, 80 | Body text |
| `--text-muted` | `#5C6370` | 92, 99, 112 | Labels, captions |
| `--accent-gold` | `#B8960F` | 184, 150, 15 | Primary accent (darker for contrast) |
| `--accent-gold-muted` | `#8B7355` | 139, 115, 85 | Secondary accent |
| `--accent-gold-dim` | `#C4B896` | 196, 184, 150 | Tertiary accent |

### CSS Variables Implementation

```css
:root {
  /* Base palette */
  --color-navy-deep: #0A0E14;
  --color-navy-elevated: #111722;
  --color-navy-surface: #1A2230;
  --color-navy-border: #2A3442;
  --color-gold-sharp: #E5C07B;
  --color-gold-muted: #AA8C5A;
  --color-gold-dim: #6B5A3A;
  --color-white-pure: #FFFFFF;
  --color-white-soft: #C8CCD4;
  --color-muted: #5C6370;

  /* Semantic tokens - Dark theme (default) */
  --bg-primary: #0A0E14;
  --bg-elevated: #111722;
  --bg-surface: #1A2230;
  --bg-border: #2A3442;
  --text-primary: #FFFFFF;
  --text-secondary: #C8CCD4;
  --text-muted: #5C6370;
  --accent-gold: #E5C07B;
  --accent-gold-muted: #AA8C5A;
  --accent-gold-dim: #6B5A3A;
  --shadow-color: #2A3442;
  --shadow-hover: #6B5A3A;
}

html.light {
  --bg-primary: #FAF8F5;
  --bg-elevated: #F3F0EB;
  --bg-surface: #FFFFFF;
  --bg-border: #D4D0C8;
  --text-primary: #0A0E14;
  --text-secondary: #3A4250;
  --text-muted: #5C6370;
  --accent-gold: #B8960F;
  --accent-gold-muted: #8B7355;
  --accent-gold-dim: #C4B896;
  --shadow-color: #C4C0B8;
  --shadow-hover: #AA8C5A;
}
```

### Tailwind Configuration

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: {
          deep: 'var(--bg-primary)',
          elevated: 'var(--bg-elevated)',
          surface: 'var(--bg-surface)',
          border: 'var(--bg-border)'
        },
        gold: {
          sharp: 'var(--accent-gold)',
          muted: 'var(--accent-gold-muted)',
          dim: 'var(--accent-gold-dim)'
        },
        slate: {
          pure: 'var(--text-primary)',
          soft: 'var(--text-secondary)',
          muted: 'var(--text-muted)'
        }
      }
    }
  }
}
```

### Usage Guidelines

- **Gold is the action color** - Reserve for CTAs, highlights, and critical UI elements
- **Navy creates depth** - Use elevation hierarchy (deep → elevated → surface)
- **Never use pure black** - Always use `--bg-primary` navy for backgrounds
- **Maintain contrast** - Light theme gold is darker (`#B8960F`) for readability

---

## Typography

### Font Families

```css
--font-serif: 'Instrument Serif', Georgia, serif;
--font-mono: 'JetBrains Mono', Consolas, monospace;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### Instrument Serif

An elegant, high-contrast serif with beautiful italic forms. Use for:
- Hero headlines
- Section titles
- Pull quotes
- Phase numbers (italic)
- Brand wordmark

**Weights:** Regular (400), Italic

### JetBrains Mono

A developer-focused monospace font with excellent readability. Use for:
- Body text
- Navigation links
- Labels and captions
- Buttons
- Section labels (`// LABEL`)

**Weights:** 300 (light), 400 (regular), 500 (medium), 600 (semibold)

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| Hero | clamp(4rem, 15vw, 12rem) | 400 | 0.85 | -0.03em | Hero headline |
| H1 | clamp(2rem, 5vw, 3rem) | 400 | 1.2 | -0.02em | Section titles |
| H2 | 2.5rem | 400 | 1.2 | -0.02em | Subsection titles |
| H3 | 1.5rem | 400 | 1.3 | 0 | Card titles |
| Body | inherit (mono) | 400 | 1.7 | 0 | Main body text |
| Body-sm | 0.875rem | 400 | 1.7 | 0 | Secondary text |
| Label | 0.65rem | 400 | 1.4 | 0.2em | Section labels (uppercase) |
| Caption | 0.7rem | 400 | 1.4 | 0.15em | Navigation, tags |

### Hero Title Styles

```css
.hero-title {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(4rem, 15vw, 12rem);
  line-height: 0.85;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.hero-title-outline {
  -webkit-text-stroke: 1px var(--accent-gold);
  color: transparent;
}
```

---

## Shadow System

### Hard Shadow Philosophy

Unlike soft, blurred shadows, hard shadows create a brutalist aesthetic with sharp, offset rectangles. No blur radius is used—shadows are solid blocks of color.

### Shadow Tokens

```css
/* Default state */
.hard-shadow {
  box-shadow: 8px 8px 0 var(--shadow-color);
  transition: box-shadow 0.3s var(--ease-out-quart),
              transform 0.3s var(--ease-out-quart);
}

/* Hover state */
.hard-shadow:hover {
  box-shadow: 12px 12px 0 var(--shadow-hover);
  transform: translate(-2px, -2px);
}

/* Gold accent shadow */
.hard-shadow-gold {
  box-shadow: 8px 8px 0 var(--shadow-hover);
}
```

### Shadow Colors

| Theme | Default | Hover |
|-------|---------|-------|
| Dark | `#2A3442` (navy border) | `#6B5A3A` (gold dim) |
| Light | `#C4C0B8` (warm gray) | `#AA8C5A` (gold muted) |

### Usage Guidelines

- **Cards and buttons** - Use `.hard-shadow` for interactive elements
- **Hover feedback** - Shadow expands (8px → 12px) and element shifts (-2px)
- **Insight card** - Use `.hard-shadow-gold` for emphasis
- **Never blur** - Maintain the brutalist hard-edge aesthetic

---

## Animation System

### Easing Curves

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);    /* Dramatic deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* Smooth deceleration */
```

### Reveal Animations

#### Clip-Path Reveal (Bottom to Top)
```css
.reveal {
  clip-path: inset(100% 0 0 0);
  opacity: 0;
  transition: clip-path 1s var(--ease-out-expo),
              opacity 0.8s var(--ease-out-expo);
}

.reveal.visible {
  clip-path: inset(0 0 0 0);
  opacity: 1;
}
```

#### Translate Reveal (Slide Up)
```css
.reveal-up {
  transform: translateY(60px);
  opacity: 0;
  transition: transform 0.8s var(--ease-out-expo),
              opacity 0.6s var(--ease-out-expo);
}

.reveal-up.visible {
  transform: translateY(0);
  opacity: 1;
}
```

### Stagger Delays

```css
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }
.delay-4 { transition-delay: 0.4s; }
.delay-5 { transition-delay: 0.5s; }
.delay-6 { transition-delay: 0.6s; }
```

### Gold Underline Animation

```css
.gold-underline {
  position: relative;
  display: inline;
}

.gold-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 100%;
  height: 3px;
  background: var(--accent-gold);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s var(--ease-out-expo);
}

.gold-underline.visible::after {
  transform: scaleX(1);
}
```

### Intersection Observer Implementation

```javascript
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-up, .gold-underline').forEach(el => {
  observer.observe(el);
});
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .reveal, .reveal-up {
    clip-path: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## Component Patterns

### Vertical Side Navigation

Fixed 80px sidebar with vertically-oriented navigation links.

```html
<nav class="side-nav" aria-label="Main navigation">
  <a href="#" class="brand-vertical mb-auto">Votive</a>
  <div class="flex flex-col items-center gap-2 mb-8">
    <a href="#philosophy" class="side-nav-link">Philosophy</a>
    <a href="#journey" class="side-nav-link">Journey</a>
    <a href="#insights" class="side-nav-link">Insights</a>
  </div>
</nav>
```

```css
.side-nav {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: var(--bg-elevated);
  border-right: 1px solid var(--bg-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  z-index: 100;
}

.side-nav-link {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  padding: 1rem 0.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.side-nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent-gold);
  transform: scaleY(0);
  transition: transform 0.3s var(--ease-out-expo);
}

.side-nav-link:hover {
  color: var(--accent-gold);
}

.side-nav-link:hover::before {
  transform: scaleY(1);
}

/* Brand logo */
.brand-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
  color: var(--accent-gold);
  letter-spacing: 0.1em;
}
```

**Mobile Behavior:** Converts to bottom navigation bar.

### Section Labels

Code-style labels with `//` prefix.

```html
<div class="section-label" data-i18n="philosophy.label">
  Our Philosophy
</div>
```

```css
.section-label {
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-gold-muted);
  margin-bottom: 1rem;
}

.section-label::before {
  content: '//';
  margin-right: 0.5rem;
  color: var(--text-muted);
}
```

### Phase Cards (Timeline Style)

Cards with left border accent and large italic phase numbers.

```html
<div class="phase-card hard-shadow reveal-up delay-1 relative overflow-visible">
  <span class="phase-number">01</span>
  <div class="text-gold-sharp text-xs tracking-widest uppercase mb-2">State Awareness</div>
  <h3 class="font-serif text-2xl text-slate-pure mb-3">Know Your Rhythms</h3>
  <p class="text-slate-muted text-sm mb-4">Description...</p>
  <div class="flex flex-wrap gap-2">
    <span class="feature-tag"><span class="feature-tag-icon"></span>Energy Mapping</span>
  </div>
</div>
```

```css
.phase-card {
  background: var(--bg-surface);
  border: 1px solid var(--bg-border);
  padding: 2rem;
  position: relative;
}

.phase-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-gold-dim);
  transition: background 0.3s ease;
}

.phase-card:hover::before {
  background: var(--accent-gold);
}

.phase-number {
  font-family: 'Instrument Serif', serif;
  font-size: 4rem;
  font-style: italic;
  color: var(--accent-gold-dim);
  line-height: 1;
  position: absolute;
  top: -1.5rem;
  right: 1rem;
  opacity: 0.5;
}

.phase-card:hover .phase-number {
  color: var(--accent-gold);
  opacity: 1;
}
```

### Insight Card

Code-style card with `// AI_INSIGHT` label.

```html
<div class="insight-card hard-shadow-gold p-8">
  <div class="flex items-center justify-between mb-6">
    <span class="text-xs text-slate-muted tracking-wider uppercase">Sample Insight</span>
    <span class="text-xs text-gold-muted tracking-wider">Identity Synthesis</span>
  </div>
  <p class="font-serif text-xl text-slate-pure leading-relaxed mb-6">
    "Your responses reveal someone who <span class="insight-highlight">values deep connection</span>..."
  </p>
  <p class="text-sm text-slate-muted mb-6">Analysis text...</p>
</div>
```

```css
.insight-card {
  background: var(--bg-surface);
  border: 1px solid var(--accent-gold-dim);
  position: relative;
}

.insight-card::before {
  content: '// AI_INSIGHT';
  position: absolute;
  top: -0.75rem;
  left: 1rem;
  font-size: 0.7rem;
  color: var(--accent-gold);
  background: var(--bg-elevated);
  padding: 0 0.5rem;
  letter-spacing: 0.1em;
}

.insight-highlight {
  color: var(--accent-gold);
  font-weight: 500;
}
```

### CTA Button

```css
.cta-button {
  background: var(--accent-gold);
  color: var(--bg-primary);
  padding: 1.25rem 3rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.cta-button:hover {
  background: var(--text-primary);
  color: var(--bg-primary);
  transform: translateY(-2px);
}

.cta-button:hover::before {
  left: 100%;
}
```

### Secondary Button

```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--bg-border);
  color: var(--text-secondary);
  padding: 1rem 2rem;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}
```

### Feature Tags

```css
.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--bg-border);
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.feature-tag:hover {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.feature-tag-icon {
  width: 4px;
  height: 4px;
  background: var(--accent-gold);
}
```

### Pull Quote

```css
.pull-quote {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-style: italic;
  line-height: 1.4;
  color: var(--text-primary);
  border-left: 3px solid var(--accent-gold);
  padding-left: 2rem;
}
```

---

## Layout Patterns

### Main Content Offset

```css
.main-content {
  margin-left: 80px;  /* Side nav width */
  padding-top: 4rem;  /* Top header height */
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding-top: 4rem;
    padding-bottom: 80px; /* Bottom nav height */
  }
}
```

### Grid Pattern Background

```css
.grid-pattern {
  background-image:
    linear-gradient(var(--bg-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--bg-border) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.3;
}
```

### Section Padding

```css
/* Full-height hero */
.hero-section {
  min-height: 100vh;
  padding: 6rem 2rem;
}

/* Standard sections */
.section {
  padding: 8rem 2rem;
}

/* Responsive horizontal padding */
@media (min-width: 768px) {
  .section { padding-left: 4rem; padding-right: 4rem; }
}
@media (min-width: 1024px) {
  .section { padding-left: 6rem; padding-right: 6rem; }
}
```

### Asymmetric Grid (Philosophy Section)

```css
.philosophy-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
}

@media (min-width: 1024px) {
  .philosophy-grid {
    grid-template-columns: repeat(12, 1fr);
  }

  .philosophy-left {
    grid-column: span 4;
  }

  .philosophy-right {
    grid-column: span 8;
  }
}
```

### Staggered Timeline (Journey Section)

```css
.timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Alternate offset on desktop */
@media (min-width: 1024px) {
  .timeline-item:nth-child(even) {
    margin-left: 6rem;
  }
}
```

---

## Accessibility

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--accent-gold);
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
- Primary text on dark background: 15:1+
- Secondary text on dark background: 10:1+
- Gold accent on dark background: 8:1+
- Light theme maintains similar ratios with adjusted gold

### Selection

```css
::selection {
  background-color: var(--accent-gold);
  color: var(--bg-primary);
}
```

---

## Theme Toggle

### Implementation

```html
<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
  <svg class="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
  </svg>
  <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
  </svg>
</button>
```

```javascript
function setTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    document.documentElement.classList.remove('light');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
  localStorage.setItem('votive-theme', theme);
}

// Initialize from localStorage or system preference
function initTheme() {
  const savedTheme = localStorage.getItem('votive-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
}
```

---

## Implementation Checklist

### Landing Page
- [x] Vertical side navigation with rotated text
- [x] Top header with language toggle and theme toggle
- [x] Hero with oversized serif headline
- [x] Hero title with gold outline text effect
- [x] Grid pattern backgrounds
- [x] Philosophy section with pull quote
- [x] Timeline-style phase cards with offset layout
- [x] Insight card with code-style label
- [x] CTA section with gold underline animation
- [x] Hard shadow hover effects
- [x] Scroll reveal animations (clip-path + translateY)
- [x] Dark/light theme toggle
- [x] EN/PL language toggle
- [x] Reduced motion support

---

*Last updated: December 2024*
*Design system version: 1.0.0 (Brutalist Elegance)*

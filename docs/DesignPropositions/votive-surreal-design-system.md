# Votive Surreal Design System

A comprehensive design language guide for the Votive Surreal Editorial Depth landing page variant. This system embraces artistic expression through dramatic typography, rotated elements, layered shadows, and an earthy, sophisticated color palette inspired by editorial art direction.

---

## 1. Brand Identity

### Design Philosophy

The Surreal aesthetic embodies **artistic introspection** through:
- **Drama**: Oversized display typography creates bold impact
- **Depth**: Layered shadows and watermark numbers add dimension
- **Motion**: Rotated cards and tilted elements suggest fluidity
- **Contrast**: Gradient backgrounds meet crisp typography
- **Artistry**: Each section is treated as a composition

### Core Principles

1. **Composition**: Treat each section as an art piece
2. **Drama**: Bold typography at extreme scales
3. **Layer**: Watermarks, shadows, and overlaps create depth
4. **Tilt**: Subtle rotations break rigidity
5. **Earth**: Warm, sophisticated color palette

---

## 2. Color System

### Light Theme

```css
:root {
  /* Backgrounds */
  --color-bg: #FBF8F5;           /* Warm off-white */
  --color-surface: #FFFFFF;      /* Pure white */

  /* Text */
  --color-text: #3D3D3D;         /* Warm charcoal */
  --color-text-muted: #6B6B6B;   /* Medium gray */
  --color-heading: #1A1A1A;      /* Near black */

  /* Surreal Palette */
  --color-dusty-rose: #C4A4A4;   /* Muted pink */
  --color-earth-purple: #7B6B8D; /* Dusty purple */
  --color-grounded-yellow: #D4C496; /* Warm ochre */
  --color-mocha: #8B7355;        /* Warm brown */
  --color-terracotta: #C08060;   /* Burnt orange */
}
```

### Dark Theme

```css
.dark {
  /* Backgrounds */
  --color-bg: #1A1816;           /* Deep warm black */
  --color-surface: #252220;      /* Warm dark */

  /* Text */
  --color-text: #E5E0DB;         /* Warm light */
  --color-text-muted: #A09890;   /* Muted warm */
  --color-heading: #FFFBF5;      /* Warm white */

  /* Surreal Palette (muted) */
  --color-dusty-rose: #8A7070;
  --color-earth-purple: #5A4D66;
  --color-grounded-yellow: #8A8060;
  --color-mocha: #6B5B48;
  --color-terracotta: #8A5B40;
}
```

### Gradient Backgrounds

Hero and CTA sections use gradient backgrounds:

```css
/* Hero gradient */
background: linear-gradient(135deg, var(--color-dusty-rose) 0%, var(--color-earth-purple) 100%);

/* CTA gradient */
background: linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-mocha) 100%);

/* Insights card gradient */
background: linear-gradient(135deg, var(--color-earth-purple), var(--color-mocha));
```

### Color Usage by Phase

Phase cards use the palette as accent colors:

| Phase | Color |
|-------|-------|
| Phase 1 | `--color-dusty-rose` |
| Phase 2 | `--color-earth-purple` |
| Phase 3 | `--color-grounded-yellow` |
| Phase 4 | `--color-mocha` |
| Phase 5 | `--color-terracotta` |

---

## 3. Typography

### Font Stack

```css
:root {
  --font-display: 'Abril Fatface', 'Georgia', serif;
  --font-sans: 'Source Sans 3', 'Helvetica Neue', sans-serif;
}
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
```

Both fonts support `latin-ext` for Polish characters.

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Hero title | Display | clamp(3rem, 8vw, 7rem) | 400 | 1.1 |
| Section title | Display | clamp(2.5rem, 5vw, 4rem) | 400 | 1.1 |
| CTA title | Display | clamp(2.5rem, 6vw, 5rem) | 400 | 1.1 |
| Phase number | Display | 4rem | 400 | 1 |
| Quote | Display | 1.5rem | 400 | 1.4 |
| Card quote | Display | 1.25rem | 400 | 1.5 |
| Body text | Sans | 1.125rem | 300 | 1.8 |
| Small body | Sans | 0.875rem | 400 | 1.6 |
| Labels | Sans | 0.75rem | 600 | 1.4 |
| Card title | Sans | 1rem | 600 | 1.4 |

### Watermark Typography

Large decorative numbers/letters:

```css
.philosophy__number,
.insights__number {
  font-family: var(--font-display);
  font-size: 15rem; /* or 20rem */
  opacity: 0.1-0.15;
  pointer-events: none;
}

.hero__watermark {
  font-size: 40vw;
  color: rgba(255, 255, 255, 0.08);
}
```

---

## 4. Spacing System

```css
:root {
  --space-xs: 0.5rem;    /* 8px */
  --space-sm: 1rem;      /* 16px */
  --space-md: 2rem;      /* 32px */
  --space-lg: 4rem;      /* 64px */
  --space-xl: 6rem;      /* 96px */
  --space-2xl: 10rem;    /* 160px */
}
```

Sections use generous `--space-2xl` padding for dramatic effect.

---

## 5. Shadow System

### Layered Depth Shadows

Multiple shadow layers create rich depth:

```css
:root {
  --shadow-layered:
    0 2px 4px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.06),
    0 16px 32px rgba(0, 0, 0, 0.08);
}

.dark {
  --shadow-layered:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.25);
}
```

### Shadow Usage

| Element | Shadow |
|---------|--------|
| Quote cards | `--shadow-layered` |
| Insight cards | `--shadow-layered` |
| Hover states | `--shadow-layered` |
| Buttons on hover | `--shadow-layered` |

---

## 6. Animation System

### Timing

```css
transition: all 0.4s ease;  /* Standard elements */
transition: all 0.5s ease;  /* Rotated elements */
transition: all 0.8s ease;  /* Reveal animations */
```

### Reveal Animations

Standard fade-up:

```css
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

Rotated reveal (for cards):

```css
.reveal-rotate {
  opacity: 0;
  transform: translateY(40px) rotate(3deg);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.reveal-rotate.revealed {
  opacity: 1;
  transform: translateY(0) rotate(2deg);
}
```

### Interactive Rotation

Cards that rotate on hover:

```css
.philosophy__quote-card {
  transform: rotate(2deg);
}

.philosophy__quote-card:hover {
  transform: rotate(0deg);
}

.insights__card {
  transform: rotate(-1deg);
}

.insights__card:hover {
  transform: rotate(0deg);
}
```

### Button Hover

Playful lift with micro-rotation:

```css
.btn--primary:hover {
  transform: translateY(-3px) rotate(-1deg);
  box-shadow: var(--shadow-layered);
}
```

### Staggered Delays

```css
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
.reveal-delay-3 { transition-delay: 300ms; }
.reveal-delay-4 { transition-delay: 400ms; }
.reveal-delay-5 { transition-delay: 500ms; }
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Component Patterns

### Navigation (Blend Mode)

Navigation uses `mix-blend-mode: difference` for contrast on gradient backgrounds:

```css
.nav {
  position: fixed;
  background: transparent;
  mix-blend-mode: difference;
}

.nav__brand,
.nav__link,
.nav__toggle,
.nav__cta {
  color: #FFFFFF; /* Inverts on light backgrounds */
}
```

### Watermark Numbers

Large decorative typography:

```css
.philosophy__number {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  font-family: var(--font-display);
  font-size: 15rem;
  color: var(--color-grounded-yellow);
  opacity: 0.15;
  line-height: 1;
  pointer-events: none;
}
```

### Rotated Quote Card

```css
.philosophy__quote-card {
  background: var(--color-surface);
  padding: var(--space-lg);
  box-shadow: var(--shadow-layered);
  transform: rotate(2deg);
  transition: transform 0.5s ease;
}

.philosophy__quote-card:hover {
  transform: rotate(0deg);
}
```

### Hero Title with Indent

Multi-line title with visual rhythm:

```css
.hero__title-line {
  display: block;
}

.hero__title-line--indent {
  padding-left: 15%;
}
```

### Phase Cards (Staggered)

Alternating vertical offset:

```css
.phase-card:nth-child(odd) {
  transform: translateY(20px);
}

.phase-card:hover {
  transform: translateY(0) scale(1.02);
  box-shadow: var(--shadow-layered);
  z-index: 10;
}
```

### Gradient Insight Card

```css
.insights__card {
  background: linear-gradient(135deg, var(--color-earth-purple), var(--color-mocha));
  color: #FFFFFF;
  transform: rotate(-1deg);
  box-shadow: var(--shadow-layered);
}
```

### Primary Button (on gradients)

```css
.btn--primary {
  background: #FFFFFF;
  color: var(--color-earth-purple);
}

.btn--primary:hover {
  transform: translateY(-3px) rotate(-1deg);
}
```

### Secondary Button (outlined)

```css
.btn--secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

---

## 8. Layout Patterns

### Container

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

### Hero Layout

Content positioned with padding, stat in absolute corner:

```css
.hero__content {
  max-width: 800px;
  padding-left: 10%;
}

.hero__stat {
  position: absolute;
  bottom: var(--space-lg);
  right: var(--space-lg);
  text-align: right;
}
```

### Two-Column Grid

```css
.philosophy__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
}

@media (min-width: 1024px) {
  .philosophy__grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Five-Column Phase Grid

```css
.journey__phases {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .journey__phases {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Asymmetric Insights Grid

Card with fixed width, content flexible:

```css
.insights__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
}

@media (min-width: 1024px) {
  .insights__grid {
    grid-template-columns: 400px 1fr;
  }
}
```

---

## 9. Accessibility Guidelines

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-earth-purple);
  outline-offset: 4px;
}
```

### Screen Reader Utility

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

### Decorative Elements

All watermarks and visual flourishes:

```html
<div class="hero__watermark" aria-hidden="true">V</div>
<div class="philosophy__number" aria-hidden="true">01</div>
```

### Color Contrast

White text on gradient backgrounds maintains WCAG AA contrast. Light theme body text meets 4.5:1 ratio.

---

## 10. Internationalization

### Language Toggle

```javascript
function updateLanguage(lang) {
  localStorage.setItem('votive-lang-surreal', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text) el.textContent = text;
  });
}
```

### Multi-Line Titles

Split into separate translatable spans:

```html
<h1 class="hero__title">
  <span class="hero__title-line" data-i18n="hero.title.line1">Discover</span>
  <span class="hero__title-line hero__title-line--indent" data-i18n="hero.title.line2">Your Inner</span>
  <span class="hero__title-line" data-i18n="hero.title.line3">Landscape</span>
</h1>
```

---

## 11. Theme Toggle

### Flash Prevention

```javascript
(function() {
  const theme = localStorage.getItem('votive-theme-surreal') || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
```

### Implementation

```javascript
function updateTheme(theme) {
  localStorage.setItem('votive-theme-surreal', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeIcon.textContent = '☾';
  } else {
    document.documentElement.classList.remove('dark');
    themeIcon.textContent = '☀';
  }
}
```

---

## 12. Implementation Checklist

### Setup
- [x] Google Fonts (Abril Fatface + Source Sans 3) with latin-ext
- [x] CSS custom properties for light/dark themes
- [x] Flash prevention script
- [x] Layered shadow system

### Surreal Elements
- [x] Watermark numbers (01, AI, V, →)
- [x] Rotated cards with hover reset
- [x] Multi-line hero title with indent
- [x] Gradient hero and CTA backgrounds
- [x] Mix-blend-mode navigation
- [x] Staggered phase card offsets
- [x] Oversized display typography

### Features
- [x] Theme toggle with localStorage
- [x] Language toggle (EN/PL) with localStorage
- [x] Scroll reveal with rotation variant
- [x] Vote counter animation
- [x] Playful button hover (lift + rotate)

### Accessibility
- [x] Focus-visible styles
- [x] Screen reader utility class
- [x] Reduced motion support
- [x] aria-hidden on decorative elements
- [x] Semantic heading hierarchy

### Responsive Design
- [x] Mobile-first approach
- [x] Breakpoints: 768px, 1024px
- [x] Hidden nav links on mobile
- [x] Scaled watermarks on mobile
- [x] Hidden hero stat on mobile

---

## 13. File References

- **HTML**: `/app/public/landing-surreal.html`
- **Design System**: `/docs/ClaudeDocs/votive-surreal-design-system.md`

---

## 14. Visual Characteristics Summary

| Aspect | Surreal Approach |
|--------|------------------|
| **Mood** | Artistic, dramatic, editorial |
| **Typography** | Oversized display font (Abril Fatface) |
| **Colors** | Earthy palette, gradient backgrounds |
| **Layout** | Asymmetric, overlapping layers |
| **Decoration** | Watermark numbers, rotated cards |
| **Shadows** | Multi-layer depth shadows |
| **Animation** | Rotated reveals, playful hovers |
| **Navigation** | Blend mode for gradient contrast |
| **Phases** | Staggered vertical positioning |

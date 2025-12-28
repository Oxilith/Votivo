# Votive Collage Design System

A comprehensive design language guide for the Votive Ethereal Collage landing page variant. This system embraces bold experimentation through massive typography, color block shapes, mixed scales, and a dynamic collage-inspired aesthetic.

---

## 1. Brand Identity

### Design Philosophy

The Collage aesthetic embodies **bold discovery** through:
- **Scale Contrast**: Massive headlines paired with tiny labels
- **Color Blocking**: Solid color shapes as compositional elements
- **Mixed Media**: Overlapping content blocks create visual depth
- **Typography Forward**: Condensed uppercase display text dominates
- **Discovery**: Non-linear visual hierarchy invites exploration

### Core Principles

1. **Contrast**: Extreme scale differences create visual tension
2. **Bold**: Unapologetic color blocks and heavy typography
3. **Layered**: Overlapping elements suggest depth and discovery
4. **Direct**: Short, punchy copy and clear CTAs
5. **Experimental**: Breaking traditional layout conventions

---

## 2. Color System

### Light Theme

```css
:root {
  /* Backgrounds */
  --color-bg: #FAFAFA;           /* Near white */
  --color-surface: #FFFFFF;      /* Pure white */

  /* Text */
  --color-text: #333333;         /* Dark charcoal */
  --color-text-muted: #666666;   /* Medium gray */
  --color-heading: #111111;      /* Near black */

  /* Color Block Palette */
  --color-block-blue: #5D7A8C;   /* Dusty blue */
  --color-block-pink: #D4A5A5;   /* Soft pink */
  --color-block-mocha: #A68B6D;  /* Warm mocha */
  --color-block-sage: #8FA082;   /* Natural sage */
  --color-block-cream: #E8E0D5;  /* Warm cream */
}
```

### Dark Theme

```css
.dark {
  /* Backgrounds */
  --color-bg: #141414;           /* Deep black */
  --color-surface: #1E1E1E;      /* Dark surface */

  /* Text */
  --color-text: #E0E0E0;         /* Light gray */
  --color-text-muted: #999999;   /* Medium gray */
  --color-heading: #FFFFFF;      /* Pure white */

  /* Color Block Palette (muted) */
  --color-block-blue: #3D5A6C;
  --color-block-pink: #8B6B6B;
  --color-block-mocha: #6B5B48;
  --color-block-sage: #5A6B4D;
  --color-block-cream: #2A2520;
}
```

### Color Block Usage

Phase cards use the full palette:

| Phase | Background Color |
|-------|------------------|
| Phase 1 | `--color-block-blue` |
| Phase 2 | `--color-block-pink` |
| Phase 3 | `--color-block-mocha` |
| Phase 4 | `--color-block-sage` |
| Phase 5 | `--color-block-cream` |

Decorative blocks scattered throughout sections:

```css
.block {
  position: absolute;
  z-index: 0;
}

.block--blue { background: var(--color-block-blue); }
.block--pink { background: var(--color-block-pink); }
.block--mocha { background: var(--color-block-mocha); }
.block--sage { background: var(--color-block-sage); }
.block--cream { background: var(--color-block-cream); }
```

---

## 3. Typography

### Font Stack

```css
:root {
  --font-display: 'Oswald', 'Impact', sans-serif;
  --font-sans: 'Open Sans', 'Helvetica Neue', sans-serif;
}
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Both fonts support `latin-ext` for Polish characters.

### Type Scale

| Element | Font | Size | Weight | Transform | Line Height |
|---------|------|------|--------|-----------|-------------|
| Hero title | Display | clamp(4rem, 12vw, 10rem) | 700 | Uppercase | 0.9 |
| Section title | Display | clamp(2.5rem, 6vw, 5rem) | 700 | Uppercase | 0.9 |
| CTA title | Display | clamp(3rem, 10vw, 8rem) | 700 | Uppercase | 0.9 |
| Card title | Display | 1.25rem | 600 | Uppercase | 1.2 |
| Quote | Display | 1.5rem | 500 | Uppercase | 1.3 |
| Body text | Sans | 1rem | 400 | None | 1.6 |
| Subtitle | Sans | 1.125rem | 300 | None | 1.6 |
| Tiny labels | Sans | 0.5-0.625rem | 600 | Uppercase | 1.4 |

### Typography Characteristics

- **Display**: Oswald condensed, always uppercase
- **Body**: Open Sans for readability
- **Tiny labels**: Extreme small size (0.5rem) creates contrast with massive headlines
- **Letter spacing**: 0.3em on tiny labels, -0.02em on display

---

## 4. Spacing System

```css
:root {
  --space-xs: 0.5rem;    /* 8px */
  --space-sm: 1rem;      /* 16px */
  --space-md: 2rem;      /* 32px */
  --space-lg: 3rem;      /* 48px */
  --space-xl: 5rem;      /* 80px */
  --space-2xl: 8rem;     /* 128px */
}
```

---

## 5. Shadow System

Block-style shadows:

```css
:root {
  --shadow-block: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-block-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.dark {
  --shadow-block: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-block-hover: 0 8px 30px rgba(0, 0, 0, 0.4);
}
```

---

## 6. Animation System

### Reveal Animations

Standard fade-up:

```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

Scale reveal (for cards):

```css
.reveal-scale {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal-scale.revealed {
  opacity: 1;
  transform: scale(1);
}
```

### Staggered Delays

Slightly irregular timing for organic feel:

```css
.reveal-delay-1 { transition-delay: 80ms; }
.reveal-delay-2 { transition-delay: 160ms; }
.reveal-delay-3 { transition-delay: 240ms; }
.reveal-delay-4 { transition-delay: 320ms; }
.reveal-delay-5 { transition-delay: 400ms; }
.reveal-delay-6 { transition-delay: 480ms; }
```

### Interactive Hovers

Phase cards scale up:

```css
.phase-card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-block-hover);
  z-index: 10;
}
```

Buttons have background swap:

```css
.btn--primary:hover {
  background: var(--color-block-blue);
  border-color: var(--color-block-blue);
}

.btn--secondary:hover {
  background: var(--color-heading);
  color: var(--color-bg);
}
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

### Navigation

Bold brand, heavy border:

```css
.nav {
  position: fixed;
  padding: var(--space-sm) 0;
  background: var(--color-bg);
  border-bottom: 3px solid var(--color-heading);
}

.nav__brand {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### Toggle Buttons

Solid with bold border:

```css
.nav__toggle {
  width: 44px;
  height: 44px;
  background: var(--color-block-cream);
  border: 2px solid var(--color-heading);
}

.nav__toggle:hover {
  background: var(--color-heading);
  color: var(--color-bg);
}
```

### Primary Button

Filled with border, swap on hover:

```css
.btn--primary {
  background: var(--color-heading);
  color: var(--color-bg);
  border: 2px solid var(--color-heading);
  font-family: var(--font-display);
  text-transform: uppercase;
}

.btn--primary:hover {
  background: var(--color-block-blue);
  border-color: var(--color-block-blue);
}
```

### Secondary Button

Outlined, fill on hover:

```css
.btn--secondary {
  background: transparent;
  color: var(--color-heading);
  border: 2px solid var(--color-heading);
}

.btn--secondary:hover {
  background: var(--color-heading);
  color: var(--color-bg);
}
```

### Phase Cards

Colored backgrounds, large numbers:

```css
.phase-card {
  padding: var(--space-lg) var(--space-md);
  color: #FFFFFF;
}

.phase-card:nth-child(1) { background: var(--color-block-blue); }
.phase-card:nth-child(2) { background: var(--color-block-pink); }
/* etc. */

.phase-card__number {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 700;
  opacity: 0.3;
}
```

### Quote Card

Bordered with large quote mark:

```css
.philosophy__quote-card {
  background: var(--color-surface);
  padding: var(--space-xl);
  border: 2px solid var(--color-heading);
  box-shadow: var(--shadow-block);
}

.philosophy__quote-card::before {
  content: '"';
  font-family: var(--font-display);
  font-size: 6rem;
  color: var(--color-block-mocha);
  opacity: 0.3;
}
```

### Insight Card

Inverted colors (dark bg):

```css
.insights__card {
  background: var(--color-heading);
  color: var(--color-bg);
  padding: var(--space-xl);
  border: 2px solid var(--color-heading);
}

.insights__card-quote .highlight {
  color: var(--color-block-pink);
}
```

### Stat Block

Colored background, positioned:

```css
.hero__stat {
  position: absolute;
  bottom: var(--space-xl);
  right: var(--space-lg);
  background: var(--color-block-pink);
  padding: var(--space-md);
  color: #FFFFFF;
}
```

### Tiny Labels

Extreme small size with wide spacing:

```css
.hero__tiny-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: var(--color-text-muted);
}
```

---

## 8. Color Block Shapes

Decorative absolute-positioned blocks:

```css
.block {
  position: absolute;
  z-index: 0;
}

/* Hero blocks */
.hero__block-1 {
  width: 40vw;
  height: 60vh;
  top: 10%;
  right: -5%;
}

.hero__block-2 {
  width: 20vw;
  height: 30vh;
  bottom: 5%;
  left: 10%;
}

/* Philosophy block */
.philosophy__block {
  width: 50vw;
  height: 80%;
  top: 10%;
  right: 0;
}

/* Insights blocks */
.insights__block-1 {
  width: 30vw;
  height: 50%;
  top: 0;
  left: -5%;
}

.insights__block-2 {
  width: 25vw;
  height: 40%;
  bottom: 10%;
  right: 5%;
}
```

All blocks use `aria-hidden="true"` for accessibility.

---

## 9. Layout Patterns

### Container

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

### Two-Column Grid

```css
.philosophy__grid,
.insights__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
}

@media (min-width: 1024px) {
  .philosophy__grid,
  .insights__grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Five-Column Phase Grid

Grid with 2px gap:

```css
.journey__phases {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
}

@media (min-width: 768px) {
  .journey__phases {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Journey Section (Inverted)

Full-width dark background:

```css
.journey {
  background: var(--color-heading);
  color: var(--color-bg);
}

.journey__title {
  color: var(--color-bg);
}
```

---

## 10. Accessibility Guidelines

### Focus States

High-visibility focus:

```css
:focus-visible {
  outline: 3px solid var(--color-block-blue);
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

All color blocks marked as decorative:

```html
<div class="block block--blue hero__block-1" aria-hidden="true"></div>
```

### Color Contrast

Phase card text is white on colored backgrounds—ensure sufficient contrast. Light cream card uses dark heading color.

---

## 11. Internationalization

### Language Toggle

```javascript
function updateLanguage(lang) {
  localStorage.setItem('votive-lang-collage', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text) el.textContent = text;
  });
}
```

### Multi-Part Titles

Split for flexible translation:

```html
<h1 class="hero__title">
  <span class="hero__title-line" data-i18n="hero.title.line1">Discover</span>
  <span class="hero__title-line">
    <span data-i18n="hero.title.line2a">Your </span>
    <span class="hero__title-accent" data-i18n="hero.title.line2b">True</span>
  </span>
  <span class="hero__title-line" data-i18n="hero.title.line3">Self</span>
</h1>
```

---

## 12. Theme Toggle

### Flash Prevention

```javascript
(function() {
  const theme = localStorage.getItem('votive-theme-collage') || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
```

### Implementation

```javascript
function updateTheme(theme) {
  localStorage.setItem('votive-theme-collage', theme);
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

## 13. Implementation Checklist

### Setup
- [x] Google Fonts (Oswald + Open Sans) with latin-ext
- [x] CSS custom properties for light/dark themes
- [x] Flash prevention script
- [x] Color block system

### Collage Elements
- [x] Massive display typography (10rem+)
- [x] Tiny labels (0.5rem)
- [x] Color block decorative shapes
- [x] Colored phase cards
- [x] Inverted journey section
- [x] Bold borders (2-3px)
- [x] Quote card with large quote mark

### Features
- [x] Theme toggle with localStorage
- [x] Language toggle (EN/PL) with localStorage
- [x] Scroll reveal + scale reveal
- [x] Vote counter animation
- [x] Interactive hover states

### Accessibility
- [x] Focus-visible styles
- [x] Screen reader utility class
- [x] Reduced motion support
- [x] aria-hidden on decorative blocks
- [x] Semantic heading hierarchy

### Responsive Design
- [x] Mobile-first approach
- [x] Breakpoints: 768px, 1024px
- [x] Hidden nav links on mobile
- [x] Reduced block opacity on mobile
- [x] Static stat block on mobile

---

## 14. File References

- **HTML**: `/app/public/landing-collage.html`
- **Design System**: `/docs/ClaudeDocs/votive-collage-design-system.md`

---

## 15. Visual Characteristics Summary

| Aspect | Collage Approach |
|--------|------------------|
| **Mood** | Bold, experimental, discovery-oriented |
| **Typography** | Massive condensed uppercase (Oswald) |
| **Scale** | Extreme contrast (10rem titles, 0.5rem labels) |
| **Colors** | Solid color blocks, full palette |
| **Layout** | Overlapping blocks, mixed media |
| **Borders** | Bold 2-3px strokes |
| **Shadows** | Block-style, subtle |
| **Animation** | Staggered reveals, scale transitions |
| **Phase Cards** | Each with unique background color |

# Votive Editorial Design System

A comprehensive design language guide for the Votive Editorial Introspective landing page variant. This system draws inspiration from high-end magazine design, emphasizing typographic hierarchy, thoughtful whitespace, and refined editorial elements.

---

## 1. Brand Identity

### Design Philosophy

The Editorial aesthetic embodies **sophisticated introspection** through:
- **Typography First**: Elegant serif headings with clean sans-serif body text
- **Structure**: Clear hierarchy through numbering, rules, and grid-based layouts
- **Restraint**: Minimal color palette, maximum impact through contrast
- **Narrative**: Content presented as chapters and volumes
- **Refinement**: Precise spacing, thin rules, and considered details

### Core Principles

1. **Hierarchy**: Every element has a clear level of importance
2. **Contrast**: Bold headings against light body text create visual tension
3. **Rhythm**: Consistent spacing creates readable, magazine-like flow
4. **Detail**: Drop caps, pull quotes, and numbered lists add editorial polish
5. **Narrative**: Language frames self-discovery as a literary journey

---

## 2. Color System

### Light Theme

```css
:root {
  /* Backgrounds */
  --color-bg: #FAF9F7;           /* Warm paper white */
  --color-surface: #FFFFFF;      /* Pure white cards */
  --color-cream: #F5F2EC;        /* Section backgrounds */

  /* Text */
  --color-text: #2D2D2D;         /* Dark charcoal */
  --color-text-muted: #6B6B6B;   /* Medium gray */
  --color-heading: #1A1A1A;      /* Near black */
  --color-ink: #0D0D0D;          /* Pure ink */

  /* Editorial Palette */
  --color-dusty-blue: #5D7A8C;   /* Primary accent */
  --color-mocha: #8B7355;        /* Secondary accent */
  --color-sage: #7A8B6F;         /* Tertiary */

  /* Accent */
  --color-accent: var(--color-dusty-blue);
  --color-accent-secondary: var(--color-mocha);
}
```

### Dark Theme

```css
.dark {
  /* Backgrounds */
  --color-bg: #141414;           /* Deep black */
  --color-surface: #1E1E1E;      /* Card surface */
  --color-cream: #252320;        /* Section backgrounds */

  /* Text */
  --color-text: #E5E5E5;         /* Light gray */
  --color-text-muted: #999999;   /* Medium gray */
  --color-heading: #FFFFFF;      /* Pure white */
  --color-ink: #FFFFFF;          /* White for rules */

  /* Editorial Palette (adjusted) */
  --color-dusty-blue: #7A9AAD;
  --color-mocha: #A68B6D;
  --color-sage: #8FA082;
}
```

### Color Usage Guidelines

| Element | Color Token |
|---------|-------------|
| Page background | `--color-bg` |
| Alternate sections | `--color-cream` |
| Cards/surfaces | `--color-surface` |
| Body text | `--color-text` |
| Captions/secondary | `--color-text-muted` |
| Headings | `--color-heading` |
| Primary accent (labels) | `--color-dusty-blue` |
| Secondary accent (card labels) | `--color-mocha` |
| Rules and borders | `--color-ink` |

---

## 3. Typography

### Font Stack

```css
:root {
  --font-serif: 'Playfair Display', 'Georgia', serif;
  --font-sans: 'Lato', 'Helvetica Neue', sans-serif;
}
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
```

Both fonts support `latin-ext` for Polish characters.

### Base Font Size

```css
html {
  font-size: 18px; /* Larger base for editorial readability */
}
```

### Type Scale

| Element | Font | Size | Weight | Style | Line Height | Letter Spacing |
|---------|------|------|--------|-------|-------------|----------------|
| Hero title | Serif | clamp(2.5rem, 5vw, 4rem) | 400/700 | Italic/Normal | 1.2 | -0.02em |
| Section title | Serif | clamp(1.75rem, 4vw, 2.5rem) | 400 | Italic | 1.2 | — |
| Card title | Serif | 1.25rem | 500 | Normal | 1.2 | — |
| Body text | Sans | 1rem (18px) | 400 | Normal | 1.7 | — |
| Large body | Sans | 1.111rem | 400 | Normal | 1.8 | — |
| Pull quote | Serif | 1.5rem | 400 | Italic | 1.5 | — |
| Labels | Sans | 0.722rem | 700 | Normal | 1.4 | 0.2em |
| Captions | Sans | 0.722rem | 400 | Italic | 1.4 | — |
| Phase numbers | Serif | 2.5rem | 700 | Normal | 1 | — |
| Drop cap | Serif | 4rem | 700 | Normal | 0.8 | — |

### Typography Usage

- **Headings**: Playfair Display, often in italic for elegance
- **Body**: Lato at 18px base for comfortable reading
- **Labels**: Lato uppercase with wide letter-spacing (0.2em)
- **Pull Quotes**: Playfair Display italic, larger than body
- **Drop Caps**: Playfair Display bold, floated left

---

## 4. Spacing System

### Base Values

```css
:root {
  --space-xs: 0.5rem;    /* 9px */
  --space-sm: 1rem;      /* 18px */
  --space-md: 2rem;      /* 36px */
  --space-lg: 4rem;      /* 72px */
  --space-xl: 6rem;      /* 108px */
  --space-2xl: 8rem;     /* 144px */
}
```

### Section Padding

All sections use `padding: var(--space-2xl) 0` (144px vertical) for generous editorial spacing.

---

## 5. Border & Rule System

### Border Tokens

```css
:root {
  --border-thin: 1px solid rgba(0, 0, 0, 0.1);
  --border-rule: 1px solid var(--color-ink);
}

.dark {
  --border-thin: 1px solid rgba(255, 255, 255, 0.1);
  --border-rule: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Rule Dividers

Horizontal rules create visual rhythm between sections:

```css
.rule {
  width: 100%;
  height: 1px;
  background: var(--color-ink);
  opacity: 0.1;
}

.rule--thick {
  height: 2px;
  opacity: 1;
}
```

Usage: Place `.rule--thick` between major sections for emphasis.

---

## 6. Shadow System

Minimal, refined shadows:

```css
:root {
  --shadow-editorial: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.dark {
  --shadow-editorial: 0 2px 16px rgba(0, 0, 0, 0.3);
}
```

Used sparingly on cards and surfaces to create subtle depth.

---

## 7. Animation System

### Reveal Animation

Subtle, refined fade-up on scroll:

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered delays */
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
.reveal-delay-3 { transition-delay: 300ms; }
.reveal-delay-4 { transition-delay: 400ms; }
.reveal-delay-5 { transition-delay: 500ms; }
```

### Underline Draw

Navigation links reveal underline on hover:

```css
.nav__link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-ink);
  transition: width 0.3s ease;
}

.nav__link:hover::after {
  width: 100%;
}
```

### Highlight Reveal

Insight card text highlights reveal on hover:

```css
.highlight {
  background: linear-gradient(120deg, transparent 0%, transparent 50%, var(--color-cream) 50%, var(--color-cream) 100%);
  background-size: 200% 100%;
  background-position: 100%;
  transition: background-position 0.5s ease;
}

.insights__card:hover .highlight {
  background-position: 0%;
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

## 8. Component Patterns

### Navigation

Clean, minimal navigation with underline hover effect:

```css
.nav {
  position: fixed;
  background: var(--color-bg);
  border-bottom: var(--border-thin);
}

.nav__brand {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  font-style: italic;
}
```

### Toggle Buttons

Square, bordered buttons:

```css
.nav__toggle {
  width: 36px;
  height: 36px;
  border: var(--border-thin);
  background: transparent;
}

.nav__toggle:hover {
  background: var(--color-cream);
}
```

### Primary Button

Solid ink background with uppercase text:

```css
.btn--primary {
  background: var(--color-ink);
  color: var(--color-bg);
  padding: 1rem 2rem;
  font-size: 0.778rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn--primary:hover {
  opacity: 0.85;
}
```

### Secondary Button

Bordered with background fill on hover:

```css
.btn--secondary {
  background: transparent;
  border: 1px solid var(--color-ink);
}

.btn--secondary:hover {
  background: var(--color-ink);
  color: var(--color-bg);
}
```

### Phase Cards

Grid-separated cards with numbered headers:

```css
.journey__phases {
  display: grid;
  gap: 1px;
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
}

.phase-card {
  background: var(--color-bg);
  padding: var(--space-md);
}

.phase-card__number {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-accent);
}
```

### Drop Cap

Editorial opening paragraph treatment:

```css
.philosophy__dropcap {
  font-family: var(--font-serif);
  font-size: 4rem;
  font-weight: 700;
  float: left;
  line-height: 0.8;
  margin-right: var(--space-sm);
  margin-top: 0.1em;
}
```

### Pull Quote

Large, bordered quote block:

```css
.philosophy__quote {
  padding: var(--space-md) 0;
  border-top: var(--border-thin);
  border-bottom: var(--border-thin);
  position: relative;
}

.philosophy__quote-mark {
  font-family: var(--font-serif);
  font-size: 4rem;
  color: var(--color-accent);
  position: absolute;
}

.philosophy__quote-text {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-style: italic;
  padding-left: var(--space-lg);
}
```

### Section Labels

Vertical label for sidebar:

```css
.philosophy__label {
  font-size: 0.722rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-accent);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  position: sticky;
  top: 120px;
}
```

### Numbered List

Editorial-style feature list:

```css
.insights__list {
  list-style: none;
  border-top: var(--border-thin);
}

.insights__item {
  padding: var(--space-sm) 0;
  border-bottom: var(--border-thin);
  display: flex;
  gap: var(--space-sm);
}

.insights__item-number {
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--color-accent);
}
```

---

## 9. Layout Patterns

### Container

Three width variations:

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.container--narrow {
  max-width: 720px;
}

.container--wide {
  max-width: 1440px;
}
```

### Two-Column Hero

Asymmetric content/visual split:

```css
.hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 1024px) {
  .hero__grid {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Sidebar Layout (Philosophy)

Vertical label sidebar with main content:

```css
.philosophy__grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .philosophy__grid {
    grid-template-columns: 200px 1fr;
    gap: var(--space-xl);
  }
}
```

### Five-Column Grid (Journey)

Grid with 1px gap creating border effect:

```css
.journey__phases {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background: var(--color-ink);
  border: 1px solid var(--color-ink);
}

@media (min-width: 768px) {
  .journey__phases {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Content + Sidebar (Insights)

Main content with card sidebar:

```css
.insights__grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .insights__grid {
    grid-template-columns: 1fr 400px;
    gap: var(--space-xl);
  }
}
```

---

## 10. Accessibility Guidelines

### Focus States

Offset outline for visibility:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
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

### Color Contrast

- Body text on background: minimum 4.5:1 ratio
- Headings on background: minimum 7:1 ratio
- Muted text: minimum 4.5:1 ratio

### Semantic Structure

- Proper heading hierarchy (h1 → h2 → h3)
- `role="navigation"` on nav
- `aria-label` on interactive elements
- `aria-hidden="true"` on decorative quote marks

---

## 11. Internationalization

### Language Toggle

Persisted to localStorage with key `votive-lang-editorial`:

```javascript
function updateLanguage(lang) {
  localStorage.setItem('votive-lang-editorial', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text) el.textContent = text;
  });
}
```

### Split Text Elements

For complex text like hero titles with bold/italic parts:

```html
<h1 class="hero__title">
  <span data-i18n="hero.title.part1">A Journal of </span>
  <strong data-i18n="hero.title.part2">Becoming</strong>
</h1>
```

---

## 12. Theme Toggle

### Flash Prevention

```javascript
(function() {
  const theme = localStorage.getItem('votive-theme-editorial') || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
```

### Toggle Implementation

```javascript
function updateTheme(theme) {
  localStorage.setItem('votive-theme-editorial', theme);
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
- [x] Google Fonts (Playfair Display + Lato) with latin-ext
- [x] CSS custom properties for light/dark themes
- [x] Flash prevention script in `<head>`
- [x] 18px base font size for editorial readability

### Editorial Elements
- [x] Drop cap on Philosophy section
- [x] Pull quote with large quote mark
- [x] Vertical section labels (desktop)
- [x] Numbered phase cards (01, 02, etc.)
- [x] Thin rule dividers between sections
- [x] Issue/Volume language in hero

### Features
- [x] Theme toggle with localStorage persistence
- [x] Language toggle (EN/PL) with localStorage
- [x] Scroll reveal animations
- [x] Vote counter animation
- [x] Underline draw on nav hover
- [x] Highlight reveal on insight card hover

### Accessibility
- [x] Focus-visible styles
- [x] Screen reader utility class
- [x] Reduced motion support
- [x] ARIA labels on buttons
- [x] Semantic heading hierarchy

### Responsive Design
- [x] Mobile-first approach
- [x] Breakpoints: 768px, 1024px
- [x] Hidden nav links on mobile
- [x] Single column layouts on small screens
- [x] Horizontal labels on mobile (instead of vertical)

---

## 14. File References

- **HTML**: `/app/public/landing-editorial.html`
- **Design System**: `/docs/ClaudeDocs/votive-editorial-design-system.md`

---

## 15. Visual Characteristics Summary

| Aspect | Editorial Approach |
|--------|-------------------|
| **Mood** | Sophisticated, literary, refined |
| **Typography** | Serif headings (italic), clean sans body |
| **Colors** | High contrast, minimal palette |
| **Structure** | Magazine grid, numbered sections |
| **Details** | Drop caps, pull quotes, thin rules |
| **Spacing** | Generous, consistent rhythm |
| **Shadows** | Minimal, refined |
| **Animations** | Subtle fades, underline draws |
| **Layout** | Asymmetric grids, sidebar labels |

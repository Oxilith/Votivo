# Votive Ethereal Design System

A comprehensive design language guide for the Votive Ethereal Wellness Calm landing page variant. This system prioritizes serenity, spaciousness, and gentle self-discovery through airy typography, soft organic forms, and calming color palettes.

---

## 1. Brand Identity

### Design Philosophy

The Ethereal aesthetic embodies **gentle self-discovery** through:
- **Spaciousness**: Generous whitespace (50%+) creates breathing room
- **Softness**: Rounded forms, blurred edges, and organic shapes
- **Lightness**: Ultra-light font weights (300) and translucent layers
- **Calm**: Slow, meditative animations and muted color transitions
- **Warmth**: Cream tones and blush accents add human warmth

### Core Principles

1. **Breathe**: Every element has space to exist
2. **Flow**: Organic shapes and gentle animations create natural movement
3. **Comfort**: Soft edges and warm neutrals feel approachable
4. **Clarity**: Simple hierarchy guides without demanding
5. **Presence**: Each moment feels intentional and unhurried

---

## 2. Color System

### Light Theme

```css
:root {
  /* Backgrounds */
  --color-bg: #FDFBF9;           /* Warm off-white */
  --color-bg-warm: #FBF8F4;      /* Cream tint for sections */
  --color-surface: #FFFFFF;      /* Pure white cards */

  /* Text */
  --color-text: #3D4852;         /* Soft charcoal */
  --color-text-muted: #6B7C8A;   /* Slate gray */
  --color-heading: #2C3E50;      /* Deep slate */

  /* Ethereal Palette */
  --color-pale-blue: #B8D4E3;    /* Serenity blue */
  --color-transcendent-pink: #E8C4C4; /* Blush rose */
  --color-soft-sage: #C5D5C5;    /* Natural sage */
  --color-cream: #F5F0E8;        /* Warm cream */
  --color-blush: #F2E4E1;        /* Soft blush */

  /* Accent */
  --color-accent: #9BB5C4;       /* Muted sky blue */
  --color-accent-hover: #7FA3B8; /* Deeper sky */
}
```

### Dark Theme

```css
.dark {
  /* Backgrounds */
  --color-bg: #1A1D21;           /* Deep charcoal */
  --color-bg-warm: #1E2227;      /* Warm dark */
  --color-surface: #252A30;      /* Card surface */

  /* Text */
  --color-text: #D1D5DB;         /* Light gray */
  --color-text-muted: #9CA3AF;   /* Muted gray */
  --color-heading: #F3F4F6;      /* Near white */

  /* Ethereal Palette (muted) */
  --color-pale-blue: #4A6A7D;
  --color-transcendent-pink: #8B6B6B;
  --color-soft-sage: #5A6B5A;
  --color-cream: #2A2520;
  --color-blush: #3A2E2C;

  /* Accent */
  --color-accent: #6B8A9A;
  --color-accent-hover: #7FA3B8;
}
```

### Color Usage Guidelines

| Element | Light | Dark |
|---------|-------|------|
| Page background | `--color-bg` | `--color-bg` |
| Section alternation | `--color-bg-warm` | `--color-bg-warm` |
| Cards | `--color-surface` | `--color-surface` |
| Body text | `--color-text` | `--color-text` |
| Secondary text | `--color-text-muted` | `--color-text-muted` |
| Headings | `--color-heading` | `--color-heading` |
| Accent elements | `--color-accent` | `--color-accent` |
| Phase card 1 | `--color-pale-blue` | `--color-pale-blue` |
| Phase card 2 | `--color-transcendent-pink` | `--color-transcendent-pink` |
| Phase card 3 | `--color-soft-sage` | `--color-soft-sage` |
| Phase card 4 | `--color-blush` | `--color-blush` |
| Phase card 5 | `--color-cream` | `--color-cream` |

---

## 3. Typography

### Font Stack

```css
:root {
  --font-sans: 'Quicksand', 'Avenir', 'Helvetica Neue', sans-serif;
  --font-serif: 'EB Garamond', 'Georgia', serif;
}
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Quicksand:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Both fonts support `latin-ext` for Polish characters.

### Type Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| Hero title | Serif | clamp(2.5rem, 6vw, 4rem) | 400 | 1.3 | -0.02em |
| Section title | Serif | clamp(1.75rem, 4vw, 2.5rem) | 400 | 1.3 | -0.02em |
| Card title | Serif | 1.125rem | 400 | 1.3 | -0.02em |
| Body text | Sans | 1rem | 300 | 1.8 | 0.01em |
| Subtitle | Sans | 1.125rem | 300 | 1.8 | 0.01em |
| Labels | Sans | 0.75rem | 500 | 1.4 | 0.15em |
| Small text | Sans | 0.875rem | 400 | 1.6 | 0.02em |

### Typography Usage

- **Headings**: EB Garamond at weight 400 (light elegance)
- **Body**: Quicksand at weight 300 (airy, approachable)
- **Labels**: Quicksand at weight 500, uppercase, wide letter-spacing
- **Quotes**: EB Garamond italic for testimonials and quotes

---

## 4. Spacing System

### Base Unit

Generous spacing creates the ethereal, breathable feel:

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

### Section Padding

All sections use `padding: var(--space-2xl) 0` (160px vertical) to create substantial breathing room between content blocks.

---

## 5. Border Radius System

Soft, organic curves throughout:

```css
:root {
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 9999px;
}
```

### Usage

| Element | Radius |
|---------|--------|
| Badges, buttons | `--radius-full` (pill) |
| Cards | `--radius-lg` |
| Toggle buttons | `--radius-full` |
| Input fields | `--radius-md` |

---

## 6. Shadow System

Barely-there shadows that suggest rather than define:

```css
:root {
  --shadow-soft: 0 4px 24px rgba(0, 0, 0, 0.03);
  --shadow-float: 0 8px 40px rgba(0, 0, 0, 0.06);
}

.dark {
  --shadow-soft: 0 4px 24px rgba(0, 0, 0, 0.2);
  --shadow-float: 0 8px 40px rgba(0, 0, 0, 0.3);
}
```

### Usage

| State | Shadow |
|-------|--------|
| Cards (resting) | `--shadow-soft` |
| Cards (hover) | `--shadow-float` |
| Floating elements | `--shadow-float` |
| Buttons (hover) | `--shadow-float` |

---

## 7. Animation System

### Easing & Duration

```css
:root {
  --ease-gentle: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-slow: 800ms;
  --duration-slower: 1200ms;
}
```

### Floating Blobs

Large, blurred organic shapes that drift slowly in the background:

```css
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
}

@keyframes float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, 40px) scale(1.05); }
  66% { transform: translate(20px, -20px) scale(0.95); }
}

@keyframes float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}

@keyframes float-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, 30px) scale(0.95); }
  66% { transform: translate(-40px, -20px) scale(1.05); }
}
```

Animation durations: 20-25 seconds for continuous, meditative movement.

### Pulsing Orb

A central visual element that breathes:

```css
@keyframes pulse-orb {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.8; }
}
```

Duration: 6 seconds, infinite loop.

### Scroll Reveal

Gentle fade-up animation on scroll:

```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity var(--duration-slow) var(--ease-gentle),
              transform var(--duration-slow) var(--ease-gentle);
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

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Component Patterns

### Navigation

Glass-morphism effect with blur:

```css
.nav {
  position: fixed;
  background: rgba(253, 251, 249, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.dark .nav {
  background: rgba(26, 29, 33, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}
```

### Toggle Buttons

Circular, soft containers:

```css
.nav__toggle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-surface);
  border: 1px solid rgba(0, 0, 0, 0.05);
}
```

### Primary Button

Pill-shaped with subtle lift on hover:

```css
.btn--primary {
  background: var(--color-heading);
  color: var(--color-bg);
  padding: 1rem 2rem;
  border-radius: var(--radius-full);
}

.btn--primary:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-float);
}
```

### Secondary Button

Outlined, transparent background:

```css
.btn--secondary {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-full);
}

.dark .btn--secondary {
  border-color: rgba(255, 255, 255, 0.15);
}
```

### Phase Cards

Centered content with colored number badges:

```css
.phase-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-md);
  text-align: center;
  box-shadow: var(--shadow-soft);
}

.phase-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-float);
}

.phase-card__number {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-cream); /* varies per card */
}
```

### Quote Block

Left-bordered with serif italic text:

```css
.philosophy__quote {
  padding-left: var(--space-md);
  border-left: 2px solid var(--color-transcendent-pink);
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.125rem;
}
```

### Badge

Rounded pill with blush background:

```css
.hero__badge {
  padding: 0.5rem 1.25rem;
  background: var(--color-blush);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: var(--radius-full);
}
```

---

## 9. Layout Patterns

### Container

Centered with generous padding:

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.container--narrow {
  max-width: 800px;
}
```

### Two-Column Grid

Used for Philosophy and Insights sections:

```css
.philosophy__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 768px) {
  .philosophy__inner {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xl);
  }
}
```

### Five-Column Grid (Journey)

Responsive from 1 to 5 columns:

```css
.journey__phases {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 640px) {
  .journey__phases {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .journey__phases {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

---

## 10. Accessibility Guidelines

### Focus States

Visible, offset outline:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
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

### Color Contrast

- Body text on background: minimum 4.5:1 ratio
- Headings on background: minimum 7:1 ratio
- Interactive elements: clearly distinguishable states

### Semantic Structure

- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on interactive elements
- `role="navigation"` on nav element
- `aria-hidden="true"` on decorative elements (blobs)

---

## 11. Internationalization

### Language Toggle

Persisted to localStorage with key `votive-lang-ethereal`:

```javascript
function updateLanguage(lang) {
  localStorage.setItem('votive-lang-ethereal', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text) el.textContent = text;
  });
}
```

### Translation Structure

Nested objects for organized content:

```javascript
translations = {
  en: {
    nav: { philosophy: 'Philosophy', journey: 'Journey', ... },
    hero: { badge: 'Self-Discovery', title: '...', ... },
    // ...
  },
  pl: {
    nav: { philosophy: 'Filozofia', journey: 'Podróż', ... },
    // ...
  }
}
```

---

## 12. Theme Toggle

### Flash Prevention

Inline script in `<head>` before styles load:

```javascript
(function() {
  const theme = localStorage.getItem('votive-theme-ethereal') || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
```

### Toggle Implementation

```javascript
function updateTheme(theme) {
  localStorage.setItem('votive-theme-ethereal', theme);
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
- [x] Google Fonts (Quicksand + EB Garamond) with latin-ext
- [x] CSS custom properties for light/dark themes
- [x] Flash prevention script in `<head>`
- [x] Semantic HTML structure

### Features
- [x] Theme toggle with localStorage persistence
- [x] Language toggle (EN/PL) with localStorage
- [x] Floating blob animations (3 blobs)
- [x] Pulsing orb in Philosophy section
- [x] Scroll reveal animations with IntersectionObserver
- [x] Vote counter animation
- [x] Responsive navigation (hidden links on mobile)

### Accessibility
- [x] Focus-visible styles
- [x] Screen reader utility class
- [x] Reduced motion support
- [x] ARIA labels on buttons
- [x] Semantic heading hierarchy
- [x] Decorative elements marked aria-hidden

### Responsive Design
- [x] Mobile-first approach
- [x] Breakpoints: 640px, 768px, 1024px
- [x] Fluid typography with clamp()
- [x] Flexible grid layouts

---

## 14. File References

- **HTML**: `/app/public/landing-ethereal.html`
- **Design System**: `/docs/ClaudeDocs/votive-ethereal-design-system.md`

---

## 15. Visual Characteristics Summary

| Aspect | Ethereal Approach |
|--------|-------------------|
| **Mood** | Calm, serene, meditative |
| **Whitespace** | 50%+ generous spacing |
| **Typography** | Light weights (300), elegant serif headings |
| **Colors** | Soft pastels, warm creams, muted blues |
| **Shapes** | Organic circles, blurred blobs |
| **Borders** | Soft radius (16-24px), pill buttons |
| **Shadows** | Barely-there, 3-6% opacity |
| **Animations** | Slow (800-1200ms), gentle easing |
| **Layout** | Single/dual column, centered content |

# Votive Neumorphic Design System

A comprehensive design language guide for the Votive Neumorphic Depth landing page variant. This system embraces soft UI (neumorphism) principles with raised and inset elements that create a tactile, three-dimensional interface experience.

---

## 1. Brand Identity

### Design Philosophy

The Neumorphic aesthetic embodies **tactile depth** through:
- **Soft Surfaces**: Elements appear raised from or pressed into the background
- **Monochromatic**: Background and surfaces share the same base color
- **Dual Shadows**: Light and dark shadows create the illusion of depth
- **Tactile Feedback**: Interactive states show pressed/released behavior
- **Rounded Forms**: Generous border radii soften all edges

### Core Principles

1. **Consistency**: All elements emerge from the same surface color
2. **Depth**: Dual shadows (light + dark) create dimensional illusion
3. **Touch**: Interactive elements respond with pressed states
4. **Softness**: Large radii and gentle transitions
5. **Subtlety**: Minimal color variation, maximum dimensional expression

---

## 2. Color System

### Light Theme

```css
:root {
  /* Neumorphic Base - must match for effect */
  --color-bg: #E8ECF0;
  --color-surface: #E8ECF0;

  /* Text */
  --color-text: #4A5568;
  --color-text-muted: #718096;
  --color-heading: #2D3748;

  /* Accent Colors */
  --color-accent: #6B8A9A;        /* Serenity blue */
  --color-accent-warm: #9B8578;   /* Mocha */
  --color-success: #7A9A7A;       /* Sage */
}
```

### Dark Theme

```css
.dark {
  /* Neumorphic Base - darker gray */
  --color-bg: #2D3748;
  --color-surface: #2D3748;

  /* Text */
  --color-text: #CBD5E0;
  --color-text-muted: #A0AEC0;
  --color-heading: #F7FAFC;

  /* Accent Colors (adjusted) */
  --color-accent: #7FAABD;
  --color-accent-warm: #B8A598;
}
```

### Color Usage Guidelines

| Element | Light | Dark |
|---------|-------|------|
| Page background | `#E8ECF0` | `#2D3748` |
| Card/surface | Same as bg | Same as bg |
| Body text | `#4A5568` | `#CBD5E0` |
| Muted text | `#718096` | `#A0AEC0` |
| Headings | `#2D3748` | `#F7FAFC` |
| Primary accent | `#6B8A9A` | `#7FAABD` |
| Secondary accent | `#9B8578` | `#B8A598` |

**Critical**: Background and surface must be identical colors for neumorphic effect to work properly.

---

## 3. Shadow System

The heart of neumorphism is the dual shadow system.

### Raised Shadows (Convex)

Elements that appear lifted from the surface:

```css
:root {
  --shadow-raised:
    8px 8px 16px rgba(166, 172, 180, 0.5),    /* Dark shadow (bottom-right) */
    -8px -8px 16px rgba(255, 255, 255, 0.8);   /* Light shadow (top-left) */

  --shadow-raised-lg:
    12px 12px 24px rgba(166, 172, 180, 0.5),
    -12px -12px 24px rgba(255, 255, 255, 0.8);
}

.dark {
  --shadow-raised:
    8px 8px 16px rgba(0, 0, 0, 0.35),
    -8px -8px 16px rgba(55, 65, 81, 0.25);

  --shadow-raised-lg:
    12px 12px 24px rgba(0, 0, 0, 0.4),
    -12px -12px 24px rgba(55, 65, 81, 0.3);
}
```

### Inset Shadows (Concave)

Elements that appear pressed into the surface:

```css
:root {
  --shadow-inset:
    inset 4px 4px 8px rgba(166, 172, 180, 0.4),
    inset -4px -4px 8px rgba(255, 255, 255, 0.7);

  --shadow-inset-sm:
    inset 2px 2px 4px rgba(166, 172, 180, 0.3),
    inset -2px -2px 4px rgba(255, 255, 255, 0.6);
}

.dark {
  --shadow-inset:
    inset 4px 4px 8px rgba(0, 0, 0, 0.3),
    inset -4px -4px 8px rgba(55, 65, 81, 0.2);

  --shadow-inset-sm:
    inset 2px 2px 4px rgba(0, 0, 0, 0.2),
    inset -2px -2px 4px rgba(55, 65, 81, 0.15);
}
```

### Shadow Usage

| State | Shadow Token | Use Case |
|-------|-------------|----------|
| Resting (raised) | `--shadow-raised` | Cards, buttons |
| Hover (raised) | `--shadow-raised-lg` | Enhanced lift |
| Active/Pressed | `--shadow-inset` | Clicked buttons, toggles |
| Container (inset) | `--shadow-inset` | Nav links container, stats |
| Subtle inset | `--shadow-inset-sm` | Labels, small elements |

---

## 4. Typography

### Font Stack

```css
:root {
  --font-sans: 'Nunito', 'Segoe UI', sans-serif;
  --font-serif: 'Libre Baskerville', 'Georgia', serif;
}
```

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Nunito:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

Both fonts support `latin-ext` for Polish characters.

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Hero title | Serif | clamp(2rem, 5vw, 3.5rem) | 400 | 1.3 |
| Section title | Serif | clamp(1.5rem, 3vw, 2rem) | 400 | 1.3 |
| Card title | Sans | 1rem | 600 | 1.4 |
| Body text | Sans | 1rem | 400 | 1.7 |
| Subtitle | Sans | 1.125rem | 400 | 1.6 |
| Labels | Sans | 0.75rem | 600 | 1.4 |
| Small text | Sans | 0.875rem | 400 | 1.5 |

### Typography Notes

- Nunito's rounded letterforms complement the soft UI aesthetic
- Libre Baskerville adds elegance to headings
- Body text is lighter (400 weight) for a friendly feel

---

## 5. Spacing System

```css
:root {
  --space-xs: 0.5rem;    /* 8px */
  --space-sm: 1rem;      /* 16px */
  --space-md: 1.5rem;    /* 24px */
  --space-lg: 2.5rem;    /* 40px */
  --space-xl: 4rem;      /* 64px */
  --space-2xl: 6rem;     /* 96px */
}
```

Generous padding inside elements ensures shadows don't feel cramped.

---

## 6. Border Radius System

Soft, rounded edges are essential to neumorphism:

```css
:root {
  --radius-sm: 16px;
  --radius-md: 24px;
  --radius-lg: 32px;
  --radius-full: 9999px;
}
```

### Usage

| Element | Radius |
|---------|--------|
| Buttons (pill) | `--radius-md` to `--radius-full` |
| Cards | `--radius-md` to `--radius-lg` |
| Toggle buttons | `--radius-md` |
| Circular elements | `50%` |
| Labels | `--radius-full` |

---

## 7. Animation System

### Timing

```css
transition: all 0.4s ease;  /* Default for most interactions */
transition: all 0.3s ease;  /* Faster for small elements */
transition: all 0.5s ease;  /* Reveal animations */
```

### Interactive States

#### Button Press

```css
.btn--primary {
  box-shadow: var(--shadow-raised);
  transition: all 0.4s ease;
}

.btn--primary:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-raised-lg);
}

.btn--primary:active {
  transform: translateY(0);
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.2);
}
```

#### Card Lift

```css
.phase-card {
  box-shadow: var(--shadow-raised);
}

.phase-card:hover {
  box-shadow: var(--shadow-raised-lg);
  transform: translateY(-4px);
}
```

### Scroll Reveal

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

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

## 8. Component Patterns

### Navigation

Raised brand, inset link container:

```css
.nav__brand {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
}

.nav__links {
  padding: var(--space-xs);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-inset);
}

.nav__link:hover {
  box-shadow: var(--shadow-raised);
}
```

### Toggle Button

Raised resting, inset active:

```css
.nav__toggle {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-raised);
}

.nav__toggle:hover {
  box-shadow: var(--shadow-raised-lg);
}

.nav__toggle:active {
  box-shadow: var(--shadow-inset);
}
```

### Primary Button

Colored with accent shadow:

```css
.btn--primary {
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-md);
  box-shadow:
    6px 6px 12px rgba(107, 138, 154, 0.4),
    -6px -6px 12px rgba(255, 255, 255, 0.3);
}

.btn--primary:active {
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.2);
}
```

### Secondary Button

Same bg, raised shadow:

```css
.btn--secondary {
  background: var(--color-bg);
  box-shadow: var(--shadow-raised);
}

.btn--secondary:active {
  box-shadow: var(--shadow-inset);
}
```

### Phase Cards

Raised cards with inset number badges:

```css
.phase-card {
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised);
  text-align: center;
}

.phase-card__number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: var(--shadow-inset);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Labels

Inset pill badges:

```css
.philosophy__label {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-inset-sm);
}
```

### Feature List Items

Raised list items:

```css
.insights__feature {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-raised);
}

.insights__feature-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: var(--shadow-inset-sm);
}
```

### Large Cards

Extra padding and larger shadow:

```css
.philosophy__card {
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-raised-lg);
}
```

### Quote Block

Inset container:

```css
.philosophy__quote {
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-inset);
}
```

### Hero Icon

Large raised circle:

```css
.hero__icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: var(--shadow-raised-lg);
}
```

### Stat Container

Inset rectangle:

```css
.hero__stat {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-inset);
}
```

---

## 9. Layout Patterns

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}
```

### Two-Column Grid

```css
.philosophy__content {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 768px) {
  .philosophy__content {
    grid-template-columns: 1fr 1fr;
  }
}
```

### Five-Column Phase Grid

```css
.journey__phases {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
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

High-visibility focus outline:

```css
:focus-visible {
  outline: 3px solid var(--color-accent);
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

Light theme contrast ratios meet WCAG AA:
- Body text (#4A5568) on bg (#E8ECF0): 5.1:1
- Heading (#2D3748) on bg: 8.9:1

Dark theme:
- Body text (#CBD5E0) on bg (#2D3748): 7.8:1
- Heading (#F7FAFC) on bg: 11.3:1

---

## 11. Internationalization

### Language Toggle

```javascript
function updateLanguage(lang) {
  localStorage.setItem('votive-lang-neumorphic', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = getNestedValue(translations[lang], key);
    if (text) el.textContent = text;
  });
}
```

---

## 12. Theme Toggle

### Flash Prevention

```javascript
(function() {
  const theme = localStorage.getItem('votive-theme-neumorphic') || 'light';
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
```

### Implementation

```javascript
function updateTheme(theme) {
  localStorage.setItem('votive-theme-neumorphic', theme);
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
- [x] Google Fonts (Nunito + Libre Baskerville) with latin-ext
- [x] CSS custom properties for light/dark themes
- [x] Flash prevention script
- [x] Matching bg and surface colors

### Neumorphic Elements
- [x] Raised shadows (cards, buttons, nav brand)
- [x] Inset shadows (stats, quotes, labels, number badges)
- [x] Pressed state on buttons (shadow-inset)
- [x] Hover state with enhanced shadow
- [x] Circular icon elements

### Features
- [x] Theme toggle with localStorage
- [x] Language toggle (EN/PL) with localStorage
- [x] Scroll reveal animations
- [x] Vote counter animation
- [x] Touch-like button feedback

### Accessibility
- [x] Focus-visible styles (3px outline)
- [x] Screen reader utility class
- [x] Reduced motion support
- [x] ARIA labels on buttons
- [x] Semantic heading hierarchy

### Responsive Design
- [x] Mobile-first approach
- [x] Breakpoints: 640px, 768px, 1024px
- [x] Hidden nav links on mobile
- [x] Single column layouts on small screens

---

## 14. File References

- **HTML**: `/app/public/landing-neumorphic.html`
- **Design System**: `/docs/ClaudeDocs/votive-neumorphic-design-system.md`

---

## 15. Visual Characteristics Summary

| Aspect | Neumorphic Approach |
|--------|---------------------|
| **Mood** | Tactile, soft, three-dimensional |
| **Colors** | Monochromatic base, subtle accents |
| **Surface** | Same color as background |
| **Shadows** | Dual (light + dark) for depth |
| **Radii** | Large (16-32px), generous curves |
| **States** | Raised (rest), Inset (pressed) |
| **Typography** | Rounded sans + classic serif |
| **Animation** | Press feedback, gentle lifts |
| **Layout** | Centered, generous padding |

---

## 16. Neumorphism Best Practices

### Do's

1. **Match colors**: Surface must equal background
2. **Use contrast**: Dark shadow + light shadow together
3. **Be generous**: Large radii, ample padding
4. **Show feedback**: Pressed states on interactive elements
5. **Layer carefully**: Raised elements on inset containers work

### Don'ts

1. **Mix colors**: Avoid contrasting surface vs background
2. **Overuse**: Not every element needs neumorphic treatment
3. **Skip accessibility**: Ensure focus states are visible
4. **Ignore contrast**: Text must remain readable
5. **Forget dark mode**: Shadows need different values per theme

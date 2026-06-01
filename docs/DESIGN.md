# AgeWell+ Design System

> A comprehensive design reference for the AgeWell+ eldercare application.  
> **Design Philosophy:** Accessibility-first, mobile-first, warm and calming — every decision optimized for elderly users and their caregivers.

---

## 1. Design Principles

| Principle | Description |
|---|---|
| **Accessibility First** | Enlarged font sizes (base 20px), minimum 48px touch targets, high-contrast text, and semibold default weight ensure usability for seniors with reduced vision or motor dexterity. |
| **Mobile First** | All layouts begin at the smallest screen (360px) and scale upward. Bottom navigation, single-column stacks on mobile, and safe-area padding for notched devices. |
| **Warmth & Calm** | A sage-green + cream palette creates a serene, non-clinical feel. No harsh blues or sterile whites — the app should feel like home, not a hospital. |
| **Clarity Over Cleverness** | Large, bold labels. Obvious icons. One primary action per screen section. Avoid cognitive overload. |
| **Role-Aware UX** | Two distinct experiences — **Elder** (simplified, large targets, sticker illustrations) and **Caregiver** (data-rich dashboards, monitoring tools) — sharing the same design tokens. |

---

## 2. Color Palette

### Primary Colors — Sage Green

The core identity color. Used for primary actions, active states, and brand elements.

| Token | Hex | Usage |
|---|---|---|
| `--primary` / `sage-500/600` | `#5C7A6E` | Buttons, active nav, icons |
| `--primary-light` / `sage-200–400` | `#9BB5A5` | Borders, secondary text, hover states |
| `--primary-dark` / `sage-700–900` | `#3A4E46` | Headings, high-contrast body text |
| `--primary-bg` / `sage-50/100` | `#E8F0EB` | Light card backgrounds, selected states |

### Secondary Colors — Warm Cream

Backgrounds and surface tones that provide warmth.

| Token | Hex | Usage |
|---|---|---|
| `cream-50/100` | `#FAF8F5` | Page backgrounds, secondary surfaces |
| `cream-200–500` | `#C9B9A4` | Borders, dividers, muted elements |
| `cream-800/900` | `#665D52` | Dark cream text (rare) |

### Accent & Status Colors

| Token | Hex | Usage |
|---|---|---|
| `accent` / `rose-500` | `#EF4444` | Emergency actions, danger alerts, missed medication |
| `accent-light` / `rose-50` | `#FEE2E2` | Danger background tints |
| `status-success` | `#10B981` | Confirmation, "taken" states |
| `status-warning` / `amber` | `#F59E0B` | Pending, "not sure" states |
| `status-info` | `#3B82F6` | Informational badges |

### Brand Accents (Loader / NavBar)

| Element | Hex | Notes |
|---|---|---|
| Loader icon background | `#173A63` | Deep navy, used only in FullScreenLoader |
| Nav active text | `#1B3D64` | Dark navy for bottom nav active state |
| Nav inactive text | `#778488` | Muted gray for inactive tabs |
| Nav active pill | `#EEF1EA` | Soft green pill behind active nav item |

### Page Background

```
bg-gradient-to-br from-cream-100 via-cream-50 to-sage-100/40
```

A subtle diagonal gradient from warm cream to a hint of sage — used on landing, auth, and onboarding screens. Dashboard pages use `bg-cream-50` (solid).

---

## 3. Typography

### Font Stack

| Role | Family | Fallbacks | Weight |
|---|---|---|---|
| **Headings** | `DM Serif Display` | `Butler`, `serif` | 700 (bold) |
| **Body / UI** | `DM Sans` | `Poppins`, `system-ui`, `sans-serif` | 600 (semibold default) |
| **Display (rare)** | `Romelio` | `sans-serif` | 400 |
| **Serif fallback** | `Butler` | — | 400, 500, 700, 900 (all registered via `@font-face`) |

### Type Scale (Elderly-Optimized)

All sizes are **larger than standard** to ensure readability:

| Token | Size | Line Height | Use Case |
|---|---|---|---|
| `xs` | 14px | 1.5 | Micro labels, timestamps |
| `sm` | 16px | 1.5 | Badges, secondary info |
| `base` | **20px** | 1.5 | Default body text |
| `lg` | 22px | 1.5 | Emphasized body, button text |
| `xl` | 24px | 1.5 | Section titles |
| `2xl` | 28px | 1.4 | Card headings |
| `3xl` | 32px | 1.3 | Page sub-headings |
| `4xl` | 36px | 1.3 | Page titles |
| `5xl` | 48px | 1.2 | Hero h1 |
| `6xl` | 56px | 1.1 | Landing hero (desktop) |

### Global Text Styling

```css
body {
  font-size: 20px;
  font-weight: 600;       /* Semibold by default */
  line-height: 1.5;
  letter-spacing: 0.025em;
}
```

---

## 4. Spacing & Layout

### Breakpoints

| Name | Min Width | Target Device |
|---|---|---|
| `xs` | 360px | Small phones |
| `sm` | 640px | Mobile landscape / small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Touch Target Minimums

| Element | Min Height | Min Width |
|---|---|---|
| Buttons & links | `48px` (`min-h-touch`) | — |
| Large buttons | `56px` (`min-h-touch-lg`) | — |
| Icon buttons | `48px` default, `56px` lg | `48px` / `56px` |
| Nav items | `56px` | Full flex width |

### Page Structure (`PageLayout`)

```
┌─────────────────────────────────────┐
│  PageHeader  (sticky, z-20)         │
│  backdrop-blur, cream-50/80 bg      │
├─────────────────────────────────────┤
│                                     │
│  PageMain                           │
│  px-3→6, py-3→4, space-y 4→6       │
│  pb-24 on mobile (nav clearance)    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ PageSection (animated entry)  │  │
│  │ opacity 0→1, y 10→0          │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  BottomNav  (fixed, z-40)           │
│  md:hidden — desktop hides it       │
└─────────────────────────────────────┘
```

**Decorative background blob:** A fixed `sage-100/30` blurred circle in the top-right corner provides depth without distraction.

### Safe Area Handling

```css
padding-bottom: calc(80px + env(safe-area-inset-bottom));  /* Mobile */
padding-bottom: 0;  /* md+ (no bottom nav) */
```

---

## 5. Component Library

### 5.1 Cards

| Variant | Description | Key Classes |
|---|---|---|
| `default` | Standard white card | `bg-white rounded-2xl→3xl p-4→6 border-2 border-sage-100 shadow-soft` |
| `interactive` | Clickable with hover | Adds `hover:shadow-card-hover cursor-pointer active:scale-[0.98]` |
| `elevated` | Stronger shadow | `shadow-elevated` |
| `flush` | No shadow/border extras | Clean surface |

**CardHeader:** Label row with optional icon dot and action slot. Uses uppercase `tracking-wider text-xs→sm` labels.

**CardSection:** Inner content block with `bg-sage-50 rounded-xl→2xl p-3→5`.

### 5.2 Buttons

| Variant | Style |
|---|---|
| `primary` | `bg-sage-600 text-white` — main actions |
| `secondary` | `bg-white border-2 border-sage-200 text-sage-700` |
| `ghost` | `bg-transparent text-sage-600` |
| `danger` | `bg-rose-500 text-white` |
| `cream` | `bg-cream-600 text-white` — caregiver flows |
| `soft-sage` | `bg-sage-100 text-sage-700 border-sage-200` — gentle alternative |
| `soft-amber` | `bg-amber-100 text-amber-800 border-amber-200` — "not sure" |

**Sizes:**

| Size | Padding | Font | Min Height |
|---|---|---|---|
| `sm` | `px-3→4 py-2→2.5` | `text-sm→base` | 44px |
| `default` | `px-4→6 py-3→4` | `text-base→lg` | 48px |
| `lg` | `px-6→8 py-4→5` | `text-lg→xl` | 56px |

All buttons use `framer-motion` `whileTap={{ scale: 0.95 }}` for tactile feedback.

**IconButton:** Circular, `rounded-full`, responsive sizing (`w-12→14`), with optional notification badge (rose-500 dot).

### 5.3 GradientCard

Hero-style cards with gradient backgrounds and decorative white blur circle.

Available gradients: `sage`, `sage-light`, `cream`, `blue`, `green`, `purple`, `pink`, `peach`, `wellness`, `health`, `success`, `rose`.

### 5.4 StatusBadge

Pill-shaped status indicators:

| Status | Colors |
|---|---|
| `taken` / `success` | `bg-sage-100 text-sage-700 border-sage-200` |
| `pending` / `warning` | `bg-amber-50 text-amber-700 border-amber-200` |
| `skipped` / `missed` | `bg-rose-50 text-rose-700 border-rose-200` |
| `active` | `bg-sage-500 text-white` (solid) |
| `inactive` | `bg-cream-100 text-sage-500` |

### 5.5 ProgressRing

SVG circular progress indicator. Default color `#7C9A8E` (sage), background `#E8F0EB`. Animated with 1s ease-out transition. Used prominently for medication adherence display.

### 5.6 StatsCard

Data display card with icon, label, value, unit, and optional trend indicator. Animated entry via `framer-motion`. Trend colors: up = `sage-600`, down = `rose-600`.

### 5.7 Other UI Components

| Component | Purpose |
|---|---|
| `AnimatedCounter` | Counting number animation |
| `CalendarHeatmap` | Activity visualization |
| `FloatingActionButton` | Persistent primary action |
| `MoodSelector` | Emoji/sticker mood picker |
| `TimelineEvent` | Activity log entries |
| `TrendChart` | Sparkline-style trend visualization |
| `Avatar` / `AvatarGroup` | User profile images with fallback initials |
| `Tooltip` | Contextual info popover |

---

## 6. Navigation

### Bottom Navigation (Mobile)

- Fixed at bottom, hidden on `md+` (tablet/desktop)
- `bg-white/95 backdrop-blur-xl` with top border
- Active tab: animated pill indicator using `framer-motion layoutId` (spring animation)
- Active colors: navy `#1B3D64` text & icon
- Inactive: muted `#778488`
- Min height per item: `56px`

**Elder Tabs:** Home → Meds → Symptoms → Emergency → Profile  
**Caregiver Tabs:** Home → Monitor → Alerts → Profile

Hidden on: `/auth`, `/onboarding`, `/demo`, landing page (`/`)

### Profile Dropdown (Desktop)

Dropdown menu with `rounded-3xl`, `AnimatePresence` for enter/exit, `min-w-[280px]`. Menu items have `min-h-[56px]` for elderly-friendly touch targets. Includes role switcher when user has dual roles.

---

## 7. Motion & Animation

### Library: Framer Motion

Used throughout for:

| Pattern | Implementation |
|---|---|
| **Page sections** | `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` with staggered `delay` |
| **Button feedback** | `whileTap={{ scale: 0.95 }}` |
| **Card interaction** | `whileTap={{ scale: 0.98 }}` |
| **Hover lift** | `whileHover={{ scale: 1.02, y: -5 }}` |
| **Modal overlay** | Opacity fade + spring scale for content |
| **Slide panels** | `x: '100%' → 0` with spring damping 25 |
| **Nav pill** | `layoutId` shared layout animation (spring: stiffness 420, damping 34) |

### CSS Animations (Tailwind)

| Name | Duration | Usage |
|---|---|---|
| `pulse-slow` | 3s | Subtle attention pulses |
| `fade-in` | 0.4s | General entrance |
| `slide-up` / `slide-down` | 0.4s | Content reveals |
| `scale-in` | 0.3s | Modal/popover entry |
| `bounce-subtle` | 0.6s | Playful attention |
| `float` | 6s infinite | Landing page decorative elements |
| `shimmer` | 2s infinite | Loading skeleton effect |

### Landing Page Specifics

- Floating background blobs: `duration: 8–10s, repeat: Infinity`
- Floating leaf icon: `duration: 12s` with x/y/rotate animation
- Arrow bounce: `x: [0, 5, 0]` every 1.5s on "Get Started" CTAs

---

## 8. Shadows & Depth

| Token | Value | Usage |
|---|---|---|
| `shadow-soft` | `0 4px 20px rgba(124,154,142, 0.08)` | Default card shadow |
| `shadow-elevated` | `0 8px 30px rgba(124,154,142, 0.12)` | Modals, elevated cards |
| `shadow-card` | `0 2px 12px rgba(0,0,0, 0.04)` | Minimal card shadow |
| `shadow-card-hover` | `0 8px 24px rgba(124,154,142, 0.15)` | Interactive card hover |
| `shadow-glow-sage` | `0 0 30px rgba(124,154,142, 0.2)` | Sage glow effect |
| `shadow-glow-cream` | `0 0 30px rgba(245,237,227, 0.5)` | Cream glow effect |

All shadows use the sage palette `rgba(124,154,142, ...)` for cohesion — never pure black.

---

## 9. Iconography

**Library:** [Lucide React](https://lucide.dev/)

- Consistent `strokeWidth={2.4–2.5}` for bolder, more visible strokes
- Sizes: `w-5 h-5` (default), `w-6 h-6` (medium), `w-7 h-7` (large)
- Icons always paired with text labels for accessibility
- Color follows parent context (sage for default, rose for danger, amber for warning)

**Key icons used across the app:**

| Context | Icons |
|---|---|
| Navigation | `Home`, `Pill`, `Stethoscope`, `AlertTriangle`, `User`, `Activity`, `Bell` |
| Actions | `Check`, `X`, `HelpCircle`, `ChevronDown/Up`, `LogOut` |
| Health | `Heart`, `Droplets`, `Activity`, `TrendingUp/Down` |
| Features | `Shield`, `Link2`, `History`, `Settings`, `Leaf` |

---

## 10. Visual Assets

### Sticker Illustrations

Hand-drawn style JPEG stickers used for emotional warmth in the Elder experience:

| File | Usage |
|---|---|
| `goodmood.jpeg` | "Good" mood selection |
| `fine.jpeg` | "Okay" mood selection |
| `notwell.jpeg` | "Not Well" mood selection |
| `done.jpeg` | "All Done" celebration state |
| `one.jpeg` | Elderly role card on landing |
| `two.jpeg` | Caregiver role card on landing |
| `sleep.jpeg` | Sleep/rest related features |
| `dine.jpeg` | Meal/nutrition related features |

### Landing Image

`landing.jpeg` — Hero photograph displayed in a `rounded-3xl` frame with `border-4 border-white shadow-lg`.

### Logo

`/logo.png` — App icon displayed at `w-8→10 h-8→10` in the header, `rounded-xl shadow-lg`.

---

## 11. Forms & Inputs

```css
.input {
  width: 100%;
  padding: 1rem 1.25rem;          /* py-4 px-5 */
  border: 2px solid sage-300;
  border-radius: 1rem;            /* rounded-2xl */
  font-size: 22px;                /* text-lg */
  background: white;
  transition: border-color;
}

.input:focus {
  border-color: sage-600;
  outline: none;
}
```

Error state: `border-rose-400`, focus `border-rose-600`.

---

## 12. Modals & Overlays

| Element | Style |
|---|---|
| Backdrop | `bg-sage-900/30 backdrop-blur-sm` |
| Modal card | `bg-white rounded-3xl p-8 border-2 border-sage-100 shadow-elevated` |
| Close button | `w-10 h-10 rounded-full` top-right corner |
| Slide panel (notifications) | Full-height right panel, `max-w-md`, spring-animated |

---

## 13. Loading States

### FullScreen Loader

- Background: `#F6F2EA` (warm cream)
- Center icon: `w-16 h-16 rounded-2xl bg-[#173A63]` with pulsing "A" letter
- Shadow: `0 16px 32px rgba(23,58,99, 0.25)`
- Message: `font-semibold tracking-wide` in navy

### Inline Spinner

```css
.loading-spinner {
  width: 40px; height: 40px;
  border: 4px solid sage-200;
  border-top-color: sage-700;
  border-radius: 50%;
  animation: spin;
}
```

---

## 14. Responsive Patterns

### Cards
- Padding: `p-4 → sm:p-5 → md:p-6`
- Border radius: `rounded-2xl → sm:rounded-3xl`

### Buttons
- Padding scales with breakpoint
- Font sizes: `text-sm→base` (sm), `text-base→lg` (default), `text-lg→xl` (lg)

### Grids
- Quick actions: `grid-cols-2 → sm:grid-cols-4`
- Dashboard sections: `grid-cols-1 → md:grid-cols-3` or `lg:grid-cols-3`
- Vitals: `grid-cols-1 → sm:grid-cols-2`

### Bottom Navigation
- Visible only below `md` (768px)
- Desktop: navigation through header/sidebar (profile dropdown)

---

## 15. Role-Specific Design Differences

| Aspect | Elder View | Caregiver View |
|---|---|---|
| **Nav tabs** | 5 tabs (Home, Meds, Symptoms, Emergency, Profile) | 4 tabs (Home, Monitor, Alerts, Profile) |
| **Card density** | Single-focus, large elements | Multi-data dashboard widgets |
| **Illustrations** | Sticker images for mood/completion | Data charts and monitoring panels |
| **Actions** | 3 big buttons (Taken / Not Sure / Skipped) | Management actions (upload, configure) |
| **Tone** | "Hello, Name" • warm greeting | "Overview" • data-focused |

---

## 16. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18+ (Vite) |
| Styling | TailwindCSS 3 + custom design tokens |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v6 |
| State | React Context (`AuthContext`) + custom hooks |
| Auth/Backend | Supabase |
| Fonts | DM Serif Display, DM Sans (Google Fonts) + Butler, Romelio (self-hosted) |

---

## 17. File Architecture

```
src/
├── assets/
│   ├── fonts/          # Butler (woff2), Romelio (ttf)
│   └── images/
│       ├── landing/    # Hero photograph
│       └── stickers/   # Hand-drawn mood illustrations
├── components/
│   ├── ui/             # Design system primitives
│   │   ├── Button.jsx, Card.jsx, StatusBadge.jsx
│   │   ├── StatsCard.jsx, GradientCard.jsx, ProgressRing.jsx
│   │   ├── AnimatedCounter, CalendarHeatmap, FloatingActionButton
│   │   ├── MoodSelector, TimelineEvent, TrendChart
│   │   ├── Avatar.jsx, AvatarGroup.jsx, Tooltip.jsx
│   │   └── index.js    # Barrel exports
│   ├── dashboard/      # Dashboard-specific widgets
│   │   ├── QuickActionsGrid, VitalsStatsRow, WeeklyHealthSummary
│   │   ├── HealthOverviewCard, ActivityTimeline
│   │   ├── CareTeamCard, CareTeamAvatars, EmergencyContactCard
│   │   ├── EnvironmentWidget, SmartControlPanel
│   │   └── PairingCodeDisplay
│   ├── layout/         # Page structure
│   │   └── PageLayout.jsx  (PageHeader, PageMain, PageSection, CenteredLayout)
│   └── *.jsx           # App-level components (BottomNav, ProfileDropdown, etc.)
├── contexts/           # AuthContext
├── hooks/              # useMedications, useNotifications, useActivity
├── pages/              # Route-level page components
│   ├── Diagnosis/      # Symptom checker flow
│   └── *.jsx           # All other pages
├── index.css           # Global styles + @layer components
└── App.jsx             # Router + auth guards
```

---

*Last updated: May 2026*

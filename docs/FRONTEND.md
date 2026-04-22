# Frontend Documentation

## Overview

The AgeWell frontend is a React 18 application built with Vite. It provides two distinct user experiences:

1. **Elder Interface** - Large buttons, simple navigation, high contrast
2. **Caregiver Interface** - Analytics dashboard, detailed monitoring, management tools

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Charts:** Recharts
- **Routing:** React Router DOM 7
- **State:** React Context API

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API client functions
│   │   └── client.js
│   ├── components/    # Reusable components
│   │   ├── ui/        # UI primitives (Button, Card, etc.)
│   │   ├── layout/    # Layout components
│   │   └── dashboard/ # Dashboard widgets
│   ├── contexts/      # React contexts
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/         # Custom React hooks
│   │   ├── useMedications.js
│   │   ├── useHealth.js
│   │   └── useNotifications.js
│   ├── lib/           # Utilities
│   │   └── supabase.js
│   ├── pages/         # Page components
│   │   ├── Elder*.jsx      # Elder pages
│   │   ├── Family*.jsx     # Caregiver pages
│   │   └── Diagnosis/      # Diagnosis flow
│   ├── App.jsx        # Main app with routes
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Routing

Routes are defined in `src/App.jsx` using React Router.

### Route Categories

**Public Routes:**
- `/` - Home/Landing
- `/auth` - Authentication
- `/auth/callback` - OAuth callback
- `/demo` - Demo page

**Onboarding Routes:**
- `/onboarding/role-select` - Choose elder/caregiver
- `/onboarding/elderly` - Elder onboarding
- `/onboarding/caregiver` - Caregiver onboarding

**Elder Routes:**
- `/elder/dashboard` - Main dashboard
- `/elder/meds` - Today's medications
- `/elder/meds/history` - Medication history
- `/elder/health` - Health vitals
- `/elder/emergency` - Emergency button
- `/elder/day-summary` - Daily recap
- `/elder/settings` - Settings
- `/elder/voice-memos` - Voice recordings

**Caregiver Routes:**
- `/family/dashboard` - Monitoring dashboard
- `/family/day-replay` - Activity replay
- `/family/members` - Linked elders
- `/family/health` - Health monitoring
- `/family/meds` - Medication management
- `/family/prescription/upload` - Upload prescriptions
- `/family/prescription/review` - Review parsed prescriptions
- `/family/settings` - Settings

**Diagnosis Routes:**
- `/diagnosis` - Diagnosis home
- `/diagnosis/input` - Symptom input
- `/diagnosis/qa` - Q&A flow
- `/diagnosis/report` - Report view
- `/diagnosis/history` - Past diagnoses

### Route Guards

- `AuthRoute` - Redirects authenticated users to dashboard
- `OnboardingRoute` - Ensures onboarding completion before access
- `ProtectedRoute` - Requires authentication and completed onboarding

## Authentication Flow

1. User clicks "Sign In with Google"
2. Supabase OAuth redirects to Google
3. Google redirects to `/auth/callback`
4. AuthContext handles session setup
5. Redirect to role selection if no role
6. Redirect to onboarding if incomplete
7. Redirect to appropriate dashboard

## Key Components

### UI Components (`src/components/ui/`)

**Button**
```jsx
<Button variant="primary|secondary|danger" size="lg|md|sm" disabled={false}>
  Click me
</Button>
```

**Card**
```jsx
<Card title="Title" subtitle="Subtitle" className="custom-class">
  Content
</Card>
```

**ProgressRing**
```jsx
<ProgressRing progress={75} size={120} strokeWidth={8} >
```

### Layout Components (`src/components/layout/`)

**PageLayout**
```jsx
<PageLayout
  header={<PageHeader title="Page Title" action={<Button>Action</Button>} />}
  footer={<BottomNav />}
>
  <PageSection title="Section">Content</PageSection>
</PageLayout>
```

## Custom Hooks

### useMedications
```javascript
const {
  medications,        // Array of medications
  todaySchedule,      // Today's schedule
  nextMedication,     // Next due medication
  adherenceRate,      // Percentage adherence
  loading,
  markAsTaken,        // Function to mark taken
  markAsMissed,       // Function to mark missed
  refresh
} = useMedications(userId)
```

### useHealth
```javascript
const {
  readings,           // Health readings
  stats,              // Aggregated stats
  loading,
  addReading,         // Add new reading
  refresh
} = useHealth(userId)
```

### useNotifications
```javascript
const {
  notifications,      // User notifications
  unreadCount,        // Number of unread
  acknowledge,        // Mark as read
  refresh
} = useNotifications(userId)
```

## State Management

### AuthContext
- Manages authentication state
- Handles role switching
- Tracks onboarding status
- Methods: `login()`, `logout()`, `addRole()`, `completeOnboarding()`

### NotificationContext
- Manages global notifications
- Toast messages
- Alert banners

## API Client

The API client in `src/api/client.js` provides methods:

```javascript
// Health
api.getHealthReadings(userId)
api.addHealthReading(data)
api.getHealthStats(userId)

// Medications
api.getMedications(userId)
api.getMedicationSchedule(userId)
api.markMedicationTaken(logId)

// User
api.checkIn(data)
api.generatePairingCode(userId)
api.verifyPairingCode(code, caregiverId)

// Diagnosis
api.startDiagnosis(data)
api.answerDiagnosisQuestion(data)
api.uploadDiagnosisImage(sessionId, file)
api.generateDiagnosisReport(data)
```

## Styling

### Tailwind Configuration

Colors defined in `tailwind.config.js`:
- Primary: `#3B82F6` (blue)
- Success: `#10B981` (green)
- Warning: `#F59E0B` (amber)
- Danger: `#EF4444` (red)
- Elder-safe font sizes: min 18px

### CSS Classes for Elder Interface

```css
/* Large touch targets */
.touch-target-lg { @apply min-h-[56px] min-w-[56px]; }

/* High contrast text */
.text-elder { @apply text-gray-900 font-semibold text-lg; }

/* Readable cards */
.card-elder { @apply bg-white rounded-2xl p-6 shadow-lg border border-gray-200; }
```

## Performance

- **Lazy Loading:** Pages loaded dynamically with `React.lazy()`
- **Code Splitting:** Vite handles automatic chunking
- **Image Optimization:** Use WebP format, lazy load images
- **Memoization:** Use `React.memo()` for expensive components

## Environment Variables

Create `.env` from `.env.example`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Development

```bash
npm install
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## Build Configuration

Vite config handles:
- React plugin
- Path aliases (`@/` → `src/`)
- Port configuration (default: 5173)
- Build output to `dist/`

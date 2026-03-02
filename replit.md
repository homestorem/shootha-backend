# Shoot'ha – replit.md

## Overview

Shoot'ha (شوتها) is a mobile-first sports venue booking application built for the Saudi/Arabic market. It allows players to discover, book, and manage football field reservations, and lets venue owners manage their sports facilities. The app is a React Native / Expo application with an Express.js backend server, targeting iOS, Android, and web platforms.

Key features include:
- Role-based access (Player, Owner, Guest, Supervisor) with separate UIs for each
- OTP-based phone authentication + password for players/owners
- **Fully separate Owner App** at `/owner` — 4-tab interface (Home, Bookings, Stats, Settings)
- Venue discovery and booking with time slot selection (player side)
- Booking management with player payment tracking
- 1-Click rebook system for repeating past bookings
- Animated splash screen with football animation
- Full RTL (right-to-left) Arabic UI
- Global dark/light mode with smooth transitions — persisted via AsyncStorage, applied to all screens and components
- Arabic (RTL) / English (LTR) language switcher — global, tab labels + all screen text translate; Kurdish removed
- Auto-sliding ad banner on home screen (190px, FlatList with pagingEnabled)
- Map/List toggle in Search tab (native MapView on iOS/Android, web fallback)
- Store tab (coming-soon page with pulsing placeholder)
- Multi-image upload for venues (max 6, 3x2 grid, 3MB limit per image)
- Location capture: player/owner device GPS stored at registration
- Supervisor role: temporary 2-hour JWT, view-only access via `/api/auth/supervisor-token`

### Owner App (app/owner/)
Completely separate interface at route `/owner`, only accessible to users with `role='owner'`:
- **Home** (`owner/(tabs)/index.tsx`): Greeting, ad banner, live active booking card with countdown timer, today's summary stats, recent bookings list
- **Bookings** (`owner/(tabs)/bookings.tsx`): Time-slot grid view for today (08:00–23:00), list view for month/year, FAB to add manual bookings, booking detail modal with cancel
- **Statistics** (`owner/(tabs)/stats.tsx`): 4 summary cards (app bookings, total revenue, today's bookings, occupancy rate), bar charts for last 7 days + peak hours
- **Settings** (`owner/(tabs)/settings.tsx`): Edit venue info, dark/light toggle, WhatsApp + support form, delete account (with upcoming booking protection), logout

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native / Expo)

**Framework:** Expo SDK 54 with Expo Router v6 (file-based routing)

The app uses file-based routing under the `app/` directory:
- `app/_layout.tsx` – Root layout with providers and animated splash overlay
- `app/(tabs)/` – Main tab navigation (Home, Search, Bookings, Profile)
- `app/venue/[id].tsx` – Venue detail and booking screen
- `app/booking/[id].tsx` – Booking detail management
- `app/select-role.tsx` – Role selection (Player / Owner / Guest)
- `app/auth/player/` – Player authentication flow (login, register, verify-otp)
- `app/auth/owner/` – Owner authentication flow (login, register, verify-otp)

**Navigation:** Expo Router with tab-based navigation. On iOS with Liquid Glass support it uses `NativeTabs` from `expo-router/unstable-native-tabs`; on other platforms it falls back to a standard `Tabs` component with a BlurView tab bar.

**State Management:**
- `context/AuthContext.tsx` – Authentication state (user, token, guest mode), persisted via AsyncStorage; `UserRole` includes supervisor; exposes `sendPhoneChangeOtp` and `updatePhone` for phone number change with OTP verification
- `context/ThemeContext.tsx` – Global dark/light mode via `useTheme()` → `{ isDark, colors, toggleTheme }`; `getColors(isDark)` used by all screens/components
- `context/LanguageContext.tsx` – Arabic/English only (Kurdish removed); `useLang()` → `{ language, setLanguage, t, isRTL }`; tab labels and all screen text use `t(key)`
- `context/BookingsContext.tsx` – Player bookings state (local, persisted via AsyncStorage); no longer contains MOCK_VENUES; uses versioned storage (v2) to purge any old sample data on upgrade
- `context/LocationContext.tsx` – Device GPS (expo-location), falls back to Mosul (36.335, 43.119)
- TanStack React Query for server data fetching

**UI Design:**
- Dark theme only (`#0A0A0A` background, `#2ECC71` neon green accent)
- All colors centralized in `constants/colors.ts`
- Cairo Arabic font family (Regular, SemiBold, Bold) via `@expo-google-fonts/cairo`
- Animated shimmer skeleton loading via `components/SkeletonCard.tsx` (replaces spinners)
- Haptic feedback on interactions
- RTL Arabic text throughout

**Key Components:**
- `AuthInput` – Animated input with glow effect and error state
- `VenueCard` – Venue listing card with gradient overlay and badge indicators
- `SkeletonCard` / `SkeletonVenueCard` – Animated shimmer placeholders
- `GuestModal` – Bottom sheet prompting guests to log in
- `ErrorBoundary` / `ErrorFallback` – App-level error catching with restart option
- `KeyboardAwareScrollViewCompat` – Cross-platform keyboard-aware scroll (uses `react-native-keyboard-controller` on native, plain `ScrollView` on web)

### Backend (Express.js)

**Framework:** Express.js v5 running as a standalone Node.js server

**Entry point:** `server/index.ts` – Sets up CORS (allowing Replit dev domains and localhost), JSON parsing, and static file serving

**Routes** (`server/routes.ts`):
- `POST /api/auth/send-otp` – Generates and stores a 6-digit OTP; returns `devOtp` in response body
- `POST /api/auth/register` – Creates user with phone + name + role + OTP + password; supports `venueImages`, `ownerDeviceLat`, `ownerDeviceLon`, `userLat`, `userLon`
- `POST /api/auth/login` – Verifies OTP and returns JWT
- `GET /api/auth/me` – Returns authenticated user info (JWT protected)
- `PATCH /api/auth/location` – Updates user lat/lon (JWT protected)
- `POST /api/auth/supervisor-token` – Issues a temporary view-only JWT (requires `SUPERVISOR_MASTER_KEY`)
- `GET /api/venues` – Public list of all registered venues (maps owner accounts → Venue shape)
- `GET /api/venues/:id` – Public single venue by owner ID
- `GET /api/owner/venue` – Get full owner venue details (owner only)
- `PATCH /api/owner/venue` – Update venue info: name, area, fieldSize, bookingPrice, facilities (owner only)
- `GET /api/owner/bookings?filter=today|month|year` – Get owner's bookings with optional filter (owner only)
- `POST /api/owner/bookings` – Create manual booking with conflict check (owner only)
- `PATCH /api/owner/bookings/:id` – Update booking (owner only, ownership validated)
- `DELETE /api/owner/bookings/:id` – Cancel booking (owner only, ownership validated)
- `GET /api/owner/stats` – Revenue, counts, occupancy rate, 7-day chart, peak hours (owner only)

**Owner Booking Type** (`server/storage.ts` → `OwnerBooking`):
```typescript
{ id, ownerId, playerName, playerPhone, date (YYYY-MM-DD), time (HH:MM), duration (hours), price (IQD/hr), fieldSize, status, source ('app'|'manual'), createdAt }
```

**Authentication:**
- Phone number + OTP (no passwords for end users)
- JWT tokens signed with `SESSION_SECRET` env var, 30-day expiry
- `authMiddleware` function validates Bearer tokens on protected routes

**Storage (`server/storage.ts`):**
- Currently uses `MemStorage` (in-memory Maps) as the active storage implementation
- `IStorage` interface is defined, making it easy to swap to a database-backed implementation
- OTPs expire after a set duration and are stored in memory

**Build system:** `scripts/build.js` handles the Expo static web build + server bundling for deployment on Replit

### Database

**Schema** (`shared/schema.ts`) uses Drizzle ORM with PostgreSQL dialect:
- `users` table – Basic username/password users (legacy or admin)
- `auth_users` table – Phone-based users with role, device ID, no-show count, and ban flag

**Config:** `drizzle.config.ts` points to `DATABASE_URL` environment variable

**Current state:** The schema is defined for PostgreSQL but the active storage layer is still `MemStorage`. The database is provisioned but the storage class needs to be migrated to use Drizzle queries against PostgreSQL.

**Migrations:** Stored in `./migrations/` directory, managed via `drizzle-kit push`

### Authentication Flow

1. User selects role (Player / Owner / Guest) on `/select-role`
2. For Player/Owner: enters phone number → server generates OTP (logged in console in dev)
3. User enters 6-digit OTP → server verifies → issues JWT
4. JWT stored in AsyncStorage; app reads it on launch to auto-authenticate
5. Guest mode stores a guest flag in AsyncStorage; prompts login on protected actions

### API Communication

- `lib/query-client.ts` – Centralizes API base URL resolution using `EXPO_PUBLIC_DOMAIN` env variable
- `apiRequest()` utility wraps fetch with JSON headers, base URL construction, and error throwing
- `getQueryFn()` factory creates TanStack Query-compatible fetch functions with 401 handling

### Mock Data

Venues and time slots are currently mocked in `context/BookingsContext.tsx` (as `MOCK_VENUES` and `TIME_SLOTS`). These are used throughout the app until a real venues API is connected.

## External Dependencies

### Core Framework
- **Expo SDK 54** – Build toolchain, native module access, app configuration
- **React Native 0.81** – Mobile UI rendering
- **Expo Router 6** – File-based navigation for React Native

### UI & Animations
- **expo-blur** – BlurView for tab bar backgrounds
- **expo-glass-effect** – Liquid Glass tab bar on supported iOS versions
- **expo-linear-gradient** – Gradient overlays on venue cards
- **expo-haptics** – Haptic feedback on button presses
- **expo-image** – Optimized image component
- **expo-image-picker** – Profile/venue photo uploads
- **react-native-reanimated** – Advanced animations
- **react-native-gesture-handler** – Gesture recognition
- **react-native-keyboard-controller** – Keyboard-aware layout management
- **@expo-google-fonts/cairo** – Arabic Cairo typeface
- **@expo/vector-icons** – Ionicons and other icon sets

### State & Data
- **@tanstack/react-query** – Server state management and caching
- **@react-native-async-storage/async-storage** – Local persistence for auth tokens and bookings

### Backend & Auth
- **express** – HTTP server
- **jsonwebtoken** – JWT creation and verification
- **bcryptjs** – Password hashing (for legacy users table)

### Database
- **drizzle-orm** – Type-safe ORM for PostgreSQL
- **drizzle-zod** – Zod schema generation from Drizzle tables
- **drizzle-kit** – Database migration management
- **pg** – PostgreSQL Node.js client

### Validation
- **zod** – Runtime schema validation (used with drizzle-zod and API inputs)

### Environment Variables Required
- `DATABASE_URL` – PostgreSQL connection string
- `SESSION_SECRET` – JWT signing secret
- `EXPO_PUBLIC_DOMAIN` – Public domain for API URL construction (set automatically in Replit)
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` – Used for CORS allowlist configuration
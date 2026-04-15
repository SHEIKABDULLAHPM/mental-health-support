# MindPeace UI Project Documentation

Date: 2026-04-14
Scope: React frontend in project/src
Validation status: Lint pass, production build pass

## 1. Project UI Overview

MindPeace is a React + Vite + Tailwind mental wellness application with:
- Route-based page architecture using react-router-dom.
- Context-based global state for theme, user/auth, and audio.
- Reusable UI components for navigation, sentiment, trends, emotion detection, and error handling.
- Protected user area with onboarding gate and authenticated dashboard modules.

Entry points:
- src/main.jsx
- src/App.jsx

Global providers:
- ThemeProvider (theme mode and toggling)
- UserProvider (auth/session/profile/points/streak/badges)
- AudioProvider (audio playback state)
- AppErrorBoundary (runtime UI fail-safe)

## 2. Route Map and Page Inventory

### Public and gated routes
- /welcome -> Landing (auth entry and marketing surface)
- /onboarding -> Onboarding (only authenticated, non-onboarded users)
- / -> Layout + nested protected pages (authenticated + onboarded users)
- * -> Redirect to /welcome

### Protected nested routes
- / -> Home
- /mood-checkin -> MoodCheckin
- /journal -> Journal
- /recommendations -> Recommendations
- /challenges -> Challenges
- /activities -> Activities
- /reflection-wall -> ReflectionWall
- /positivity -> PositivityDrops
- /future-letters -> FutureLetters
- /nature-sounds -> NatureSounds
- /chat -> Chatbot
- /voice-emotion -> VoiceEmotion

## 3. Detailed Page Documentation

### Landing
Purpose:
- First experience page with product messaging and CTA.
- Entry point to sign-in/sign-up via AuthForms.

Behavior:
- Theme toggle available.
- CTA opens auth form.
- Successful login routes to onboarding.

### Onboarding
Purpose:
- Multi-step preference capture for personalization.

Behavior:
- Step progress visualization.
- Stores preferences in user profile.
- Sets local onboarding flags and redirects to dashboard.

### Home
Purpose:
- Personalized dashboard and daily overview.

Behavior:
- Dynamic greeting with date/time.
- New-user welcome banner after onboarding.
- Quick actions to core modules.
- Mood trend and forecast widget.
- Weekly insight cards and recommendations panel.

### MoodCheckin
Purpose:
- Capture mood, optional notes, and sentiment.

Behavior:
- Emotion inputs and submission workflow.
- Sentiment analysis with retry/error handling.
- Trends and emotional insight visuals.

### Journal
Purpose:
- Reflective writing with mood and sentiment support.

Behavior:
- Mood-tagged entry writing.
- Multi-model sentiment fallback strategy (BiLSTM -> classical -> VADER).
- Save and history retrieval.
- Optional analytics view with trends/forecast.

### Recommendations
Purpose:
- Serve personalized content suggestions.

Behavior:
- User-tailored recommendations.
- Integrates emotion/sentiment context for relevance.

### Challenges
Purpose:
- Habit building through goals and milestones.

Behavior:
- Challenge completion state.
- Points and badge progression updates through UserContext.

### Activities
Purpose:
- Interactive mindfulness modules.

Behavior:
- Activity selector with dedicated mini-experiences.
- Includes breathing, coloring, meditation, and mini games.
- Mini games include session tracking, preferences, and event logging.

### ReflectionWall
Purpose:
- Social-style reflection feed and sentiment-enabled posting.

Behavior:
- Create reflections.
- Analyze sentiment pre/post submit.
- Error + retry handling for sentiment operations.

### PositivityDrops
Purpose:
- Positive content and motivation snippets.

Behavior:
- Curated positivity cards with filtering/engagement UI.

### FutureLetters
Purpose:
- Scheduled self-letters for future delivery.

Behavior:
- Write letter with title/body.
- Quick scheduling presets and custom date.
- Tabs for writing, scheduled, delivered.

### NatureSounds
Purpose:
- Ambient audio relaxation surface.

Behavior:
- Select and play preset nature tracks.
- Integrated with shared audio context/player behavior.

### Chatbot
Purpose:
- Conversational support interface.

Behavior:
- User/assistant chat interactions.
- Multi-language and sentiment-enhanced display behavior.

### VoiceEmotion
Purpose:
- Voice-based emotion detection experience.

Behavior:
- Speech capture and emotion analysis display.
- Uses VoiceEmotionDetector component.

## 4. Component Catalog and Purpose

### App shell and navigation
- components/Layout.jsx: Protected-area frame, top nav, side nav, and content outlet.
- components/Navbar.jsx: Theme toggle, user menu, notifications, logout access.
- components/Sidebar.jsx: Main navigation links for all protected modules.
- components/AudioPlayer.jsx: Persistent bottom audio playback control.

### Auth and resilience
- components/AuthForms.jsx: Login/register workflows, validation, demo login.
- components/AppErrorBoundary.jsx: Captures render/runtime failures and protects app shell.

### Analytics and mood
- components/MoodTrendChart.jsx: Trend visualization with rolling means/anomalies/forecast.
- components/SentimentCard.jsx: Card view of sentiment model output.
- components/SentimentMeter.jsx: Compact sentiment gauge/visual meter.

### Emotion detection
- components/FaceEmotionDetector.jsx: Webcam-driven emotion detection and callback reporting.
- components/DetectedExpression.jsx: Structured display of detected emotion state.
- components/VoiceEmotion/VoiceEmotionDetector.jsx: Voice emotion analysis widget.

### UX utility
- components/Reveal.jsx: Scroll/reveal animation wrapper used across pages.

## 5. Features and Behavior Matrix

### Authentication and access control
- Local auth flag controls protected route entry.
- Onboarding gate ensures first-time setup before dashboard access.
- Logout clears auth/session-related local storage.

### Personalization
- Onboarding preferences are captured and persisted.
- Dashboard and recommendations adapt to user context.

### Mood and sentiment
- Mood check-in, journal, and reflection workflows integrate sentiment analysis.
- Error and retry handling is available in sentiment-driven pages.

### Engagement and gamification
- Challenges award points/badges.
- Activities include relaxing mini-games and guided exercises.

### Media and calm experiences
- Nature sound playback via shared audio state.
- Voice and face emotion capture modules available.

### Accessibility and responsiveness (current state)
- Tailwind responsive breakpoints are used throughout.
- Mobile sidebar and adaptive layouts are implemented.
- Additional a11y improvements are still recommended (see section 9).

## 6. User Flow and Navigation

Primary flow:
1. User opens /welcome.
2. User signs in/up using AuthForms.
3. User is sent to /onboarding (first-time path).
4. On completion, user lands on / (Home dashboard).
5. User navigates modules via Sidebar quick links.

Recovery/guard flow:
- Unauthenticated access to protected routes redirects to /welcome.
- Authenticated but not onboarded users redirect to /onboarding.
- Unknown paths redirect to /welcome.

## 7. UI/UX Consistency and Design Validation

Validated strengths:
- Cohesive card-based design language and consistent rounded geometry.
- Reusable gradient and dark-mode patterns.
- Shared navigation paradigm with predictable placement.
- Strong visual hierarchy in key pages (Landing, Home, Activities).

Consistency observations:
- Several pages use different naming conventions for loading/error state variables.
- Date/time formatting is currently page-local instead of centralized.
- Some icon semantics were inconsistent and have been corrected.

Usability observations:
- Core task paths (check-in, journal, activities, recommendations) are easy to discover.
- Error recovery exists in sentiment-heavy pages.
- Activities module supports engaging interactions but is code-heavy and should be split into smaller units for maintainability.

## 8. Verified Issues and Fixes Applied

The following issues were fixed during this review:

1. Removed dead/commented import
- File: src/components/FaceEmotionDetector.jsx
- Fix: Removed commented unused API import line.
- Impact: Cleaner code and reduced noise.

2. Replaced non-semantic icon aliasing
- Files:
  - src/pages/Journal.jsx
  - src/pages/FutureLetters.jsx
- Fix: Replaced CreditCard-as-edit alias with direct Edit3 import and usage.
- Impact: Better semantic clarity and maintainability.

3. Removed global hooks-disable and fixed underlying dependency issues
- File: src/pages/Activities.jsx
- Fixes:
  - Removed eslint-disable comment.
  - Fixed stale closure/dependency issues in effects.
  - Added useMemo import and stable shape type memoization.
  - Introduced previousSessionRef to safely manage game session lifecycle.
- Impact: Eliminated hook warnings and improved lifecycle correctness.

## 9. Optimization and Improvement Recommendations

### Implemented in this pass
- Route-level code splitting enabled in App routing using React.lazy + Suspense fallback.
- Shared date/time utility added and adopted in Home, FutureLetters, and Chatbot.
- Async loading state naming standardized to isSentimentLoading in:
  - src/pages/Journal.jsx
  - src/pages/MoodCheckin.jsx
  - src/pages/ReflectionWall.jsx
- Empty-state UX added for Scheduled and Delivered tabs in FutureLetters.
- Accessibility improvements applied:
  - Skip-to-content link and main landmark target in Layout.
  - Explicit aria-label attributes added to key Chatbot controls.

### Remaining high-priority improvements
- Split very large page modules (especially Activities and Chatbot) into smaller feature subcomponents.

### Remaining medium-priority improvements
- Add shared reusable loading/error UI primitives to remove repeated patterns.
- Expand standardized async naming to all remaining pages beyond the sentiment pages updated here.

### Remaining accessibility and quality improvements
- Extend explicit labels/helper text coverage across all forms and custom interactive controls.
- Add page-level and component tests for route guards, onboarding flow, sentiment widgets, and activity modules.
- Add CI workflow for lint + build + test automation.

## 10. Verification Results

Commands executed in project folder:
- npm install
- npm run lint
- npm run build

Current status:
- Lint: PASS (no warnings, no errors)
- Build: PASS
- Bundle status: Route-level code splitting is active and route chunks are now emitted separately.

## 11. Best-Practice Alignment (React)

Current alignment:
- Functional components and hooks are used consistently.
- Context providers are correctly layered at app root.
- Route guarding and onboarding gating are implemented.
- Error boundary is in place.

Next-step alignment goals:
- Component decomposition for very large files.
- Route-level lazy loading.
- Stronger a11y and test coverage baseline.

---

This documentation reflects the current verified UI state after code review, functional validation, and applied fixes.

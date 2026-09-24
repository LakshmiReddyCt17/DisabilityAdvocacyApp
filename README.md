# Welfare Schemes Mobile Application (v1.0 MVP)

A cross-platform React Native mobile application built with Expo to enable individuals with disabilities to discover, filter, and register for regional and national welfare schemes.

---

## 1. System Overview & Architecture

The application adopts an offline-first architecture with localized caching to ensure performance across varying connectivity levels. 

The client communicates with the data layer via REST endpoints, entirely decoupled from hardcoded source values through environment variables.

---

## 2. Core Implemented Features (v1.0 Deliverables)

### Instant Rendering & Caching Layer
- Integrated Stale-While-Revalidate caching via AsyncStorage.
- Cached scheme listings and dashboard components load instantly on launch.
- Silent background synchronization updates cache upon network connection without blocking UI interaction.

### Progressive 3-Step Registration Wizard
- Structured multi-step registration flow replacing single-form overhead.
- Step-by-step input validation and field checks.
- Accessible dropdown selectors and pre-submission summary review card.

### WCAG Accessibility Conformance
- Interactive components meet minimum 48dp x 48dp touch targets.
- Dynamic font scaling support across standard Android and iOS display settings.
- Integrated screen reader labels (accessibilityLabel, accessibilityRole, accessibilityState).
- Full UI localization implemented across 7 regional languages.

### Security Hardening & Environment Isolation
- All endpoints, identifiers, and configuration secrets are completely extracted into .env.
- Live credentials are excluded from version control via .gitignore.
- Template configuration provided via .env.example in the project root.

---

## 3. Installation & Local Development

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn
- Expo Application Services CLI (npm install -g eas-cli)

### Setup Instructions

1. Clone the repository:
   git clone <REPOSITORY_URL>
   cd <PROJECT_FOLDER>

2. Install dependencies:
   npm install

3. Configure Environment Variables:
   Create a local .env file from the provided template:
   cp .env.example .env

   Add your active database identifiers to .env:
   EXPO_PUBLIC_GOOGLE_SHEETS_ID=YOUR_SPREADSHEET_ID
   EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=YOUR_GOOGLE_API_KEY

4. Start the development server:
   npx expo start

---

## 4. Database Setup & Updating API Credentials

The application uses Google Sheets as a lightweight backend layer. Follow these steps to migrate data ownership, update sheet permissions, or rotate API keys:

### Step 1: Duplicate & Restrict the Sheet
1. Open the source database spreadsheet:
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
2. Select File > Make a copy to move ownership to your organization's Google Drive.
3. Update sharing permissions from public/unrestricted to Restricted (Specific Organization Accounts Only).
4. Copy the new spreadsheet ID from the URL (the string between /d/ and /edit).

### Step 2: Generate / Rotate the API Key
1. Open the Google Cloud Console.
2. Enable the Google Sheets API under your Google Cloud project.
3. Navigate to APIs & Services > Credentials.
4. Click Create Credentials > API Key.
5. Under API Restrictions, set the key to restrict access solely to Google Sheets API.

### Step 3: Update Client Configuration
1. Open your local .env file.
2. Update the variables with your new values:
   EXPO_PUBLIC_GOOGLE_SHEETS_ID=YOUR_NEW_SPREADSHEET_ID
   EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=YOUR_NEW_API_KEY
3. Restart Metro bundler and clear cache:
   npx expo start -c

---

## 5. Standalone Build Generation (EAS Build)

The project includes an eas.json configuration for building installable Android binaries:

eas build -p android --profile preview

---

## 6. Phase 2 Architecture Roadmap

The following technical initiatives are documented as architectural recommendations for the next development phase:

- Relational Database Migration: Transitioning the Google Sheets ingestion layer to an authenticated relational database (such as PostgreSQL or Supabase) with Row-Level Security (RLS) policies and JWT-based authentication.
- Dynamic Document & Eligibility Matching: Expanding the applicant profile with a checklist engine (identity cards, income verification, welfare records) to cross-reference scheme criteria, highlight matching schemes, and flag missing prerequisite documents.
- OCR Identity Verification: Integrating camera-based optical character recognition to extract applicant details directly from identification cards.
- Automated CI/CD Delivery: Setting up automated delivery pipelines targeting Google Play Store and Apple App Store distribution tracks.
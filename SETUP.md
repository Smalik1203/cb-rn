# ClassBridge Mobile - Setup Guide

This is the React Native (Expo) mobile app for ClassBridge V1, using the existing Supabase backend.

## Prerequisites

1. Your existing ClassBridge V1 Supabase credentials
2. Node.js and npm installed
3. Expo CLI (installed automatically with dependencies)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Supabase:
   - Open `.env` file
   - Replace `your_supabase_url_here` with your Supabase project URL
   - Replace `your_supabase_anon_key_here` with your Supabase anon key
   - These are the SAME credentials from your web app

## Running the App

### 🎨 VIEW DEMO SCREEN (No Login Required)
To see the full attendance UI/UX with hardcoded data:
```bash
npm run dev
```
Then navigate to: `/attendance-demo` in your browser

**The demo showcases:**
- ✅ Mark Attendance with progress tracking
- ✅ Attendance History with date filters
- ✅ Analytics & Insights dashboard
- ✅ Search and filter students
- ✅ Bulk actions (All Present/Absent/Reset)
- ✅ Beautiful confirmation modals
- ✅ Interactive student cards with avatars
- ✅ Responsive mobile design
- ✅ Color-coded status indicators

### Web Preview (Development)
```bash
npm run dev
```
Then press `w` to open in web browser

### iOS (requires Mac)
```bash
npm run dev
```
Then press `i` to open in iOS simulator

### Android
```bash
npm run dev
```
Then press `a` to open in Android emulator

## Project Structure

```
classbridge-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── timetable.tsx  # Timetable (to be implemented)
│   │   ├── attendance.tsx # Attendance (to be implemented)
│   │   ├── fees.tsx       # Fees (to be implemented)
│   │   ├── analytics.tsx  # Analytics (admin only)
│   │   ├── manage.tsx     # Management (superadmin only)
│   │   └── settings.tsx   # Settings & logout
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root layout with auth protection
├── contexts/
│   └── AuthContext.tsx    # Auth state management
├── lib/
│   └── supabase.ts        # Supabase client configuration
└── .env                   # Environment variables

```

## Features Implemented

### Phase 1: Setup + Auth ✅
- [x] Expo project with TypeScript
- [x] Supabase client with SecureStore/AsyncStorage
- [x] Email/password authentication
- [x] AuthProvider with session management
- [x] Role-based navigation (student, admin, superadmin, cb_admin)
- [x] Protected routes
- [x] Login screen
- [x] Settings screen with logout

## Role-Based Navigation

The app shows different tabs based on user role:

### All Users
- Home
- Timetable
- Attendance
- Fees
- Settings

### Admin & SuperAdmin (additional)
- Analytics

### SuperAdmin & CB Admin (additional)
- Manage

## Next Steps

Implement remaining features in order:
1. Timetable (read-only view)
2. Attendance (mark/view)
3. Fees (view/manage)
4. Quizzes/Tests
5. Communications
6. Analytics
7. Enhanced Home screen with dashboard

## Notes

- Uses the SAME Supabase backend as web app
- No database changes needed
- All RLS policies work as-is
- School code scoping is preserved
- Auth metadata structure matches web app

## Tech Stack

- Expo SDK 54
- React Native
- Expo Router (file-based routing)
- @supabase/supabase-js
- React Query (TanStack Query)
- Zustand (state management)
- React Hook Form + Zod (forms)
- React Native Paper (UI components)
- Expo Secure Store (auth storage)

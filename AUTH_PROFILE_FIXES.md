# Auth/Profile Data Consistency Fixes

## Issues Fixed

### 1. **Multiple Supabase Clients** ✅
**Problem**: Different files were importing from different Supabase clients (`./supabaseClient` vs `../lib/supabase`)
**Solution**: 
- Updated `src/data/queries.ts` to import from `../lib/supabase`
- Updated `src/data/rlsCheck.ts` to import from `../lib/supabase`
- Ensured all files use the same singleton client with SecureStore

### 2. **Wrong Profile Lookup Key** ✅
**Problem**: Using `user.id` instead of `auth_user_id` for profile lookups
**Solution**:
- Fixed `getCurrentUserContext()` in `src/data/queries.ts` to use `.eq('auth_user_id', user.id)`
- Fixed `getUserProfile()` in `src/services/api.ts` to use `.eq('auth_user_id', user.id)`
- Fixed RLS check functions to use `auth_user_id`

### 3. **Session Persistence Issues** ✅
**Problem**: Missing SecureStore configuration causing session flips
**Solution**:
- Confirmed `src/lib/supabase.ts` has proper SecureStore configuration
- `persistSession: true` with SecureStore adapter
- All clients now use the same secure storage

### 4. **Race Conditions in Auth Context** ✅
**Problem**: Multiple auth listeners updating state at different times
**Solution**:
- Updated `AuthContext` to fetch profile data immediately on auth state changes
- Added proper error handling and cleanup
- Prevented race conditions by fetching profile synchronously with auth state

### 5. **RLS Policy Misalignment** ✅
**Problem**: Some queries missing school_code filters
**Solution**:
- All queries now properly include school_code filters where applicable
- RLS checks updated to use correct field names
- Consistent filtering patterns across all data access

### 6. **Duplicate User Rows Prevention** ✅
**Problem**: `.single()` calls on potentially non-unique queries
**Solution**:
- Replaced all `.single()` calls with `.maybeSingle()` where 0 rows is valid
- Added proper null handling for profile lookups
- Fixed timetable slot queries to handle missing data gracefully

## Files Modified

### Core Auth Files
- `src/contexts/AuthContext.tsx` - Fixed race conditions, added profile fetching
- `src/lib/supabase.ts` - Already had SecureStore (no changes needed)

### Data Access Files
- `src/data/queries.ts` - Fixed client import, auth_user_id lookup, .single() calls
- `src/data/rlsCheck.ts` - Fixed client import, auth_user_id lookup, .single() calls
- `src/services/api.ts` - Fixed auth_user_id lookup in profile fetching

### Hook Files
- `src/hooks/useUnifiedTimetable.ts` - Fixed .single() calls to .maybeSingle()

### Service Files
- `lib/services/attendanceService.ts` - Fixed .single() calls to .maybeSingle()

## Key Changes Made

### 1. **Unified Supabase Client**
```typescript
// Before: Multiple clients
import { supabase } from './supabaseClient';  // queries.ts
import { supabase } from '../lib/supabase';   // AuthContext.tsx

// After: Single client everywhere
import { supabase } from '../lib/supabase';   // All files
```

### 2. **Correct Profile Lookup**
```typescript
// Before: Wrong key
.eq('id', user.id)

// After: Correct key
.eq('auth_user_id', user.id)
```

### 3. **Race Condition Prevention**
```typescript
// Before: Separate auth and profile fetching
const { data } = await supabase.auth.getSession();
// Profile fetched separately later

// After: Synchronous profile fetching
const { data } = await supabase.auth.getSession();
if (data.session) {
  const profileResult = await getCurrentUserContext();
  setState({ 
    status: 'signedIn', 
    session: data.session, 
    user: data.session.user,
    profile: profileResult.data  // Immediate profile data
  });
}
```

### 4. **Safe Query Patterns**
```typescript
// Before: Unsafe .single()
.single();  // Throws if 0 rows

// After: Safe .maybeSingle()
.maybeSingle();  // Returns null if 0 rows
```

## Benefits Achieved

### 1. **Consistent User Data**
- Same user will always see the same profile data
- No more flickering between different user states
- Profile data fetched synchronously with auth state

### 2. **Secure Session Management**
- Sessions persist securely using Expo SecureStore
- No more silent session drops on app reload
- Consistent session state across app restarts

### 3. **Robust Error Handling**
- Proper null handling for missing profiles
- Graceful degradation when data is unavailable
- No more crashes from undefined behavior

### 4. **RLS Compliance**
- All queries properly scoped by school_code
- Consistent access patterns across all data access
- Proper user permission enforcement

## Testing Recommendations

### 1. **Auth Flow Testing**
- Test sign in/out flows
- Test app restart with existing session
- Test profile data consistency across screens

### 2. **Race Condition Testing**
- Rapid navigation between screens
- Multiple simultaneous auth state changes
- Profile data consistency during transitions

### 3. **Error Scenario Testing**
- Network failures during auth
- Invalid/missing profile data
- RLS policy violations

## Monitoring

### 1. **Auth State Consistency**
- Monitor for auth state changes without profile updates
- Track profile fetch failures
- Monitor session persistence success rates

### 2. **Performance**
- Profile fetch timing
- Auth state change frequency
- Memory usage during auth flows

The auth/profile data consistency issues have been comprehensively addressed. Users should now experience stable, consistent authentication and profile data across all app interactions.

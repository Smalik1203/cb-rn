# CRITICAL FIX: Super Admin Being Fetched as Student

## 🚨 **Root Cause Identified**

The issue was **multiple fallback defaults to 'student'** throughout the codebase. When profile data failed to load (due to RLS policies, network issues, or missing data), the system was silently defaulting to 'student' role instead of properly handling the error.

## 🔧 **Specific Issues Fixed**

### 1. **Primary Issue: Silent Fallback in getCurrentUserContext()**
**File**: `src/data/queries.ts` (Line 72)
```typescript
// BEFORE (WRONG):
role: (data as any)?.role || 'student',  // ❌ Silent fallback to student

// AFTER (CORRECT):
if (!data) {
  return {
    data: null,
    error: mapError(new Error('User profile not found'), { queryName: 'getCurrentUserContext', table: 'users' }),
  };
}
return {
  data: {
    auth_id: user.id,
    role: data.role,  // ✅ Use actual role, no fallback
    school_code: data.school_code,
    class_instance_id: data.class_instance_id,
  },
  error: null,
};
```

### 2. **AuthContext Not Handling Profile Errors**
**File**: `src/contexts/AuthContext.tsx`
```typescript
// BEFORE (WRONG):
const profileResult = await getCurrentUserContext();
setState({ 
  status: 'signedIn', 
  session: data.session, 
  user: data.session.user,
  profile: profileResult.data  // ❌ Using data even if error
});

// AFTER (CORRECT):
const profileResult = await getCurrentUserContext();
if (profileResult.error || !profileResult.data) {
  console.error('Profile fetch failed:', profileResult.error);
  setState({ status: 'signedOut' });  // ✅ Sign out on profile error
  return;
}
setState({ 
  status: 'signedIn', 
  session: data.session, 
  user: data.session.user,
  profile: profileResult.data  // ✅ Only use valid data
});
```

### 3. **RLS Check Defaulting to Student**
**File**: `src/data/rlsCheck.ts` (Line 267)
```typescript
// BEFORE (WRONG):
result.userRole = (user as any)?.role || 'student';  // ❌ Silent fallback

// AFTER (CORRECT):
if (!user) {
  result.errors.push('User profile not found');
  return result;
}
result.userRole = (user as any)?.role;  // ✅ Use actual role
```

### 4. **UI Components Defaulting to Student**
**Files**: Multiple tab files and DrawerContent
```typescript
// BEFORE (WRONG):
const role = profile?.role || 'student';  // ❌ Silent fallback

// AFTER (CORRECT):
const role = profile?.role;  // ✅ Use actual role, undefined if missing
```

## 🎯 **Why This Happened**

1. **RLS Policy Issues**: The user lookup was failing due to RLS policies not allowing access to the user's own profile
2. **Silent Failures**: Instead of handling the error, the code was silently defaulting to 'student'
3. **Multiple Fallbacks**: Every component had its own fallback to 'student', masking the real issue
4. **No Error Handling**: AuthContext wasn't checking if profile fetch succeeded

## 🔍 **Debugging Steps for dvbhaskar**

To debug why dvbhaskar (super admin) is being fetched as student:

### 1. **Check Console Logs**
Look for these error messages:
- `"Profile fetch failed: User profile not found"`
- `"Profile fetch failed during auth state change: ..."`
- `"Profile fetch failed during refresh: ..."`

### 2. **Check Database**
```sql
-- Verify user exists in users table
SELECT id, auth_user_id, role, school_code 
FROM users 
WHERE auth_user_id = 'dvbhaskar_auth_id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 3. **Check RLS Policies**
The issue might be:
- RLS policy not allowing super admin to read their own profile
- Missing school_code in user record
- Incorrect auth_user_id mapping

### 4. **Test Profile Fetch**
```typescript
// Add this debug code temporarily
const { data: { user } } = await supabase.auth.getUser();
console.log('Auth user:', user?.id);

const { data, error } = await supabase
  .from('users')
  .select('id, role, school_code, class_instance_id')
  .eq('auth_user_id', user?.id)
  .maybeSingle();

console.log('Profile data:', data);
console.log('Profile error:', error);
```

## ✅ **What's Fixed Now**

1. **No More Silent Fallbacks**: All 'student' defaults removed
2. **Proper Error Handling**: Profile fetch errors now sign out the user
3. **Clear Error Messages**: Console logs show exactly what's failing
4. **Fail-Fast Behavior**: App won't continue with invalid profile data

## 🚀 **Next Steps**

1. **Test the fix**: dvbhaskar should now either:
   - See their correct super admin role, OR
   - Get signed out with a clear error message

2. **If still getting signed out**: Check the console logs to see the specific error

3. **Fix the root cause**: Likely an RLS policy issue preventing super admin from reading their own profile

The super admin should no longer be silently treated as a student. The app will now either show the correct role or fail clearly with an error message.

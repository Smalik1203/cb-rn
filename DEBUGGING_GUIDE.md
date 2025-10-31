# 🔍 Debugging Guide - Create Admin Flow

## Overview

Comprehensive debugging has been added to the "Create Admin" functionality to help track issues and understand the request flow.

---

## 📊 Debug Logs - What You'll See

### 1️⃣ **UI Component Logs** (`add-admin.tsx`)

When you click "Create Admin", you'll see:

```
═══════════════════════════════════════════════════
🎯 ADD ADMIN SCREEN - Button Clicked
═══════════════════════════════════════════════════
📝 Form data: {
  fullName: "John Doe",
  email: "john@example.com",
  password: "8 characters",
  phone: "+1234567890",
  adminCode: "JD001",
  schoolCode: "SCHOOL123"
}
👤 Current profile: {
  auth_id: "uuid-here",
  role: "superadmin",
  school_code: "SCHOOL123",
  school_name: "My School",
  email: "admin@school.com"
}
```

**What to Check**:
- ✅ All form fields are populated
- ✅ School code exists
- ✅ Current user is a super admin

---

### 2️⃣ **Validation Logs**

If validation fails:
```
⚠️ Validation failed: Missing fields
```
or
```
⚠️ Validation failed: Password too short
```

If validation passes:
```
✅ Validation passed
🚀 Calling createMutation.mutateAsync...
```

---

### 3️⃣ **API Hook Logs** (`useAdmins.ts`)

After validation, the mutation starts:

```
═══════════════════════════════════════════════════
🚀 CREATE ADMIN - Starting request
═══════════════════════════════════════════════════
📋 Input data: {
  full_name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  admin_code: "JD001",
  password_length: 8
}
🏫 School code: SCHOOL123
```

**Authentication Check**:
```
🔐 Getting auth session...
✅ Auth token obtained: eyJhbGciOiJIUzI1NiI...
👤 User ID: uuid-here
📧 User email: admin@school.com
```

**Request Details**:
```
🌐 Request URL: https://mvvzqouqxrtyzuzqbeud.supabase.co/functions/v1/create-admin
📦 Request body: {
  full_name: "John Doe",
  email: "john@example.com",
  password: "[REDACTED]",
  phone: "+1234567890",
  role: "admin",
  admin_code: "JD001"
}
```

**Sending Request**:
```
📤 Sending POST request...
📥 Response received: {
  status: 200,
  statusText: "OK",
  ok: true,
  headers: { content-type: "application/json" }
}
```

**Parsing Response**:
```
📄 Parsing response...
📝 Raw response: {"message":"Admin created successfully",...}
✅ Parsed result: { message: "Admin created successfully", data: {...} }
```

**Success**:
```
═══════════════════════════════════════════════════
✅ CREATE ADMIN - Success!
⏱️  Duration: 2345ms
📊 Result: { message: "Admin created successfully", data: {...} }
═══════════════════════════════════════════════════
🎉 Mutation success callback
🔄 Invalidated admins query cache
```

---

### 4️⃣ **Error Logs**

If something fails, you'll see:

```
═══════════════════════════════════════════════════
💥 CREATE ADMIN - Failed!
═══════════════════════════════════════════════════
Error details: {
  name: "Error",
  message: "Database error creating new user",
  stack: "..."
}
═══════════════════════════════════════════════════
```

Back in the UI:
```
═══════════════════════════════════════════════════
💥 ADD ADMIN SCREEN - Error Caught
═══════════════════════════════════════════════════
Error object: {
  name: "Error",
  message: "Database error creating new user",
  stack: "..."
}
═══════════════════════════════════════════════════
```

---

## 🎯 How to Use These Logs

### Step 1: Open Developer Console

**For Web (Expo)**:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Try creating an admin
4. Watch the logs appear in real-time

**For React Native Debugger**:
1. Open React Native Debugger
2. Connect to your app
3. Watch the Console tab

**For Expo Go**:
1. Shake device
2. Tap "Debug Remote JS"
3. Check Chrome DevTools console

---

### Step 2: Identify Where It Fails

Follow the emoji trail:

```
🎯 Button clicked        ← UI started
👤 Profile loaded        ← User data available
✅ Validation passed     ← Form is valid
🚀 Starting request      ← API call initiated
🔐 Auth token obtained   ← Authentication works
📤 Sending request       ← Network call made
📥 Response received     ← Server responded
❌ Request failed        ← PROBLEM HERE!
```

---

### Step 3: Check Error Details

Look for these common errors:

#### ❌ "School code is required"
**Problem**: User doesn't have a school_code in their profile
**Solution**: Update user profile in database

#### ❌ "Not authenticated"
**Problem**: No auth token or session expired
**Solution**: Log out and log back in

#### ❌ "Forbidden - Not a super admin"
**Problem**: User role is not 'superadmin'
**Solution**: Update user role in database

#### ❌ "Database error creating new user"
**Problem**: Database constraint or policy blocking insert
**Solution**: Check RLS policies and trigger function

#### ❌ "Network request failed"
**Problem**: CORS, network, or Edge Function not deployed
**Solution**: Check CORS settings and Edge Function status

---

## 📋 Debugging Checklist

When investigating an issue, check these in order:

### 1. Form Data
- [ ] All fields filled in
- [ ] Password is at least 6 characters
- [ ] Email format is valid
- [ ] Phone number format is valid

### 2. User Profile
- [ ] User is logged in (has session)
- [ ] User role is 'superadmin'
- [ ] User has school_code
- [ ] School code is valid

### 3. API Request
- [ ] Request URL is correct
- [ ] Auth token is present
- [ ] Request body has all required fields
- [ ] Content-Type is application/json

### 4. Server Response
- [ ] Response status is 200
- [ ] Response has valid JSON
- [ ] No error messages in response
- [ ] Edge Function logs show success

### 5. Database
- [ ] RLS policies allow INSERT
- [ ] RLS policies allow UPDATE
- [ ] Trigger function works
- [ ] No constraint violations

---

## 🛠️ Common Issues & Solutions

### Issue 1: Logs Not Appearing
**Cause**: Console not connected or filtered
**Solution**: 
- Check console filter settings
- Ensure remote debugging is enabled
- Clear console and try again

### Issue 2: Too Many Logs
**Cause**: Debug logging is very verbose
**Solution**: 
- Use console filters (type "CREATE ADMIN" in filter)
- Look for the delimiter lines (═══)
- Focus on ❌ emoji for errors

### Issue 3: CORS Errors
**Symptom**: "Access-Control-Allow-Origin" error
**Solution**: Edge Function needs localhost origins added

### Issue 4: 401 Unauthorized
**Symptom**: Authentication failed
**Solution**: 
```bash
# Check token in console logs
# If missing or invalid, sign out and sign in again
```

### Issue 5: 403 Forbidden
**Symptom**: Not a super admin
**Solution**:
```sql
-- Update user role in database
UPDATE users 
SET role = 'superadmin' 
WHERE id = 'user-id-here';

-- Also update auth metadata
-- (Need to use Supabase dashboard or service role)
```

### Issue 6: 500 Server Error
**Symptom**: Database error or server crash
**Solution**: Check Supabase logs in dashboard

---

## 📈 Performance Monitoring

The logs include timing information:

```
⏱️  Duration: 2345ms
```

**Normal Ranges**:
- Fast: < 1000ms (1 second)
- Normal: 1000-3000ms (1-3 seconds)
- Slow: > 3000ms (3+ seconds)

**If slow, check**:
- Network connection
- Edge Function cold start
- Database query performance
- Region/latency issues

---

## 🧹 Cleaning Up Logs

Once everything works, you can:

### Option 1: Keep Debug Logs
- Useful for future debugging
- Can be filtered out in production

### Option 2: Remove Debug Logs
Edit these files and remove console.log statements:
- `src/hooks/useAdmins.ts`
- `app/(tabs)/add-admin.tsx`

### Option 3: Conditional Logging
```typescript
const DEBUG = __DEV__; // Only in development

if (DEBUG) {
  console.log('Debug info');
}
```

---

## 📊 Example Success Flow

Here's what a successful creation looks like:

```
1. 🎯 ADD ADMIN SCREEN - Button Clicked
2. 👤 Current profile: { role: "superadmin", school_code: "SCHOOL123" }
3. ✅ Validation passed
4. 🚀 CREATE ADMIN - Starting request
5. 🔐 Getting auth session...
6. ✅ Auth token obtained
7. 📤 Sending POST request...
8. 📥 Response received: { status: 200, ok: true }
9. 📄 Parsing response...
10. ✅ Parsed result: { message: "Admin created successfully" }
11. ✅ CREATE ADMIN - Success! ⏱️ Duration: 1823ms
12. 🎉 Mutation success callback
13. 🔄 Invalidated admins query cache
14. ✅ Form reset complete
```

**Total Time**: ~1.8 seconds ✅

---

## 🎓 Understanding the Flow

```
User Interface (add-admin.tsx)
    ↓
    handleCreate() - Button click handler
    ↓
    Form validation
    ↓
    createMutation.mutateAsync() - React Query mutation
    ↓
API Hook (useAdmins.ts)
    ↓
    Get auth session & token
    ↓
    Build request payload
    ↓
    fetch() - HTTP POST request
    ↓
Edge Function (create-admin)
    ↓
    Validate permissions
    ↓
    Create user in auth.users
    ↓
    Trigger: handle_new_user()
    ↓
    Insert into public.users
    ↓
    Insert into admin table
    ↓
    Return success response
    ↓
Back to UI
    ↓
    Show success alert
    ↓
    Reset form
    ↓
    Refresh admin list
```

---

## 🎯 Next Steps

1. **Try creating an admin** - Watch the logs
2. **If it fails** - Look for ❌ emoji and check error message
3. **Copy error details** - Share with support if needed
4. **Check this guide** - Match error to common issues
5. **Fix and retry** - Apply solution and test again

---

## 💡 Tips

- 🔍 Use browser's console filter to search for "CREATE ADMIN"
- 📋 Copy-paste error logs when asking for help
- ⏱️ Check timing to identify slow operations
- 🎯 Focus on the first error that appears
- 🔄 Clear console between attempts for clarity

---

**Happy Debugging!** 🐛🔨

If you still have issues after checking all of the above, please share:
1. Full console logs (from button click to error)
2. Your user's role and school_code
3. Edge Function logs from Supabase dashboard

---

**Last Updated**: October 30, 2025
**Version**: 1.0.0


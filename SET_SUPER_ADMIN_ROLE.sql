// Set Super Admin User Metadata
// Run this in your Supabase SQL editor or use the Supabase client

-- Option 1: Update user metadata via SQL (if you have access to auth.users table)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"superadmin"'::jsonb
)
WHERE email = 'dvbhaskar@example.com'; -- Replace with actual email

-- Option 2: Update user metadata via Supabase client (run this in your app)
/*
import { supabase } from './src/lib/supabase';

async function setSuperAdminRole() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { error } = await supabase.auth.updateUser({
      data: {
        role: 'superadmin',
        school_code: 'your_school_code', // Replace with actual school code
        full_name: 'DVBHASKAR'
      }
    });
    
    if (error) {
      console.error('Error updating user metadata:', error);
    } else {
      console.log('✅ User metadata updated successfully');
    }
  }
}

setSuperAdminRole();
*/

-- Option 3: Check current user metadata
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users 
WHERE email = 'dvbhaskar@example.com'; -- Replace with actual email

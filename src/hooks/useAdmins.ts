import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

type Admin = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  admin_code: string;
  school_code: string;
  school_name: string;
  created_at: string;
};

type CreateAdminInput = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  admin_code: string;
};

type UpdateAdminInput = {
  id: string;
  full_name: string;
  phone: string;
  admin_code: string;
};

/**
 * Fetch all admins for a specific school
 */
export function useAdmins(
  schoolCode: string | null | undefined,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return useQuery({
    queryKey: ['admins', schoolCode, page, pageSize],
    queryFn: async () => {
      if (!schoolCode) {
        throw new Error('School code is required');
      }

      log.info('Fetching admins', { schoolCode });

      // Try admin table first
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('id, full_name, email, phone, role, admin_code, school_code, school_name, created_at')
        .eq('school_code', schoolCode)
        .eq('role', 'admin')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!adminError && adminData) {
        return adminData.map((admin: any) => ({
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          phone: String(admin.phone || ''),
          role: admin.role,
          admin_code: admin.admin_code || '',
          school_code: admin.school_code,
          school_name: admin.school_name || '',
          created_at: admin.created_at,
        })) as Admin[];
      }

      // Fallback to users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, role, admin_code, school_code, school_name, created_at')
        .eq('school_code', schoolCode)
        .eq('role', 'admin')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (usersError) {
        log.error('Failed to fetch admins', usersError);
        throw usersError;
      }

      if (!usersData) return [];
      return usersData.map((admin: any) => ({
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone: String(admin.phone || ''),
        role: admin.role,
        admin_code: admin.admin_code || '',
        school_code: admin.school_code,
        school_name: admin.school_name || '',
        created_at: admin.created_at,
      })) as Admin[];
    },
    enabled: !!schoolCode,
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Create a new admin via Edge Function
 */
export function useCreateAdmin(schoolCode: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAdminInput) => {
      const startTime = Date.now();
      
      // 🔍 Debug: Initial state
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 CREATE ADMIN - Starting request');
      console.log('═══════════════════════════════════════════════════');
      console.log('📋 Input data:', {
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        admin_code: input.admin_code,
        password_length: input.password?.length,
      });
      console.log('🏫 School code:', schoolCode);
      
      if (!schoolCode) {
        console.error('❌ School code is missing!');
        throw new Error('School code is required');
      }

      // 🔍 Debug: Get session
      console.log('🔐 Getting auth session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Failed to get session: ' + sessionError.message);
      }
      
      const token = session?.access_token;

      if (!token) {
        console.error('❌ No auth token found!');
        console.log('Session data:', session);
        throw new Error('Not authenticated. Please log in.');
      }

      console.log('✅ Auth token obtained:', token.substring(0, 20) + '...');
      console.log('👤 User ID:', session.user?.id);
      console.log('📧 User email:', session.user?.email);

      // 🔍 Debug: Prepare request
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-admin`;
      const requestBody = {
        full_name: input.full_name,
        email: input.email,
        password: input.password,
        phone: input.phone,
        role: 'admin',
        admin_code: input.admin_code,
      };

      console.log('🌐 Request URL:', url);
      console.log('📦 Request body:', {
        ...requestBody,
        password: '[REDACTED]',
      });

      log.info('Creating admin', { email: input.email });

      // 🔍 Debug: Make request
      console.log('📤 Sending POST request...');
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('📥 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            'content-type': response.headers.get('content-type'),
          },
        });
      } catch (fetchError: any) {
        console.error('❌ Fetch error:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
        });
        throw new Error('Network request failed: ' + fetchError.message);
      }

      // 🔍 Debug: Parse response
      console.log('📄 Parsing response...');
      let result;
      try {
        const responseText = await response.text();
        console.log('📝 Raw response:', responseText);
        
        result = JSON.parse(responseText);
        console.log('✅ Parsed result:', result);
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', {
          name: parseError.name,
          message: parseError.message,
        });
        throw new Error('Invalid response from server');
      }

      // 🔍 Debug: Check response status
      if (!response.ok) {
        console.error('❌ Request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details,
          debug: result.debug,
        });
        
        const errorMessage = result.error || result.details || 'Failed to create admin';
        throw new Error(errorMessage);
      }

      const duration = Date.now() - startTime;
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ CREATE ADMIN - Success!');
      console.log('⏱️  Duration:', duration + 'ms');
      console.log('📊 Result:', result);
      console.log('═══════════════════════════════════════════════════');

      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success callback:', data);
      // Invalidate admins query to refetch
      queryClient.invalidateQueries({ queryKey: ['admins', schoolCode] });
      console.log('🔄 Invalidated admins query cache');
    },
    onError: (error: any) => {
      console.error('═══════════════════════════════════════════════════');
      console.error('💥 CREATE ADMIN - Failed!');
      console.error('═══════════════════════════════════════════════════');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      console.error('═══════════════════════════════════════════════════');
    },
  });
}

/**
 * Update an existing admin
 */
export function useUpdateAdmin(schoolCode: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAdminInput) => {
      log.info('Updating admin', { adminId: input.id });

      // Try admin table first
      const { error: adminError } = await supabase
        .from('admin')
        .update({
          full_name: input.full_name,
          phone: Number(input.phone) || 0,
          admin_code: input.admin_code,
        })
        .eq('id', input.id);

      if (!adminError) {
        return;
      }

      // Fallback to users table
      const { error: usersError } = await supabase
        .from('users')
        .update({
          full_name: input.full_name,
          phone: input.phone,
          admin_code: input.admin_code,
        })
        .eq('id', input.id);

      if (usersError) {
        log.error('Failed to update admin', usersError);
        throw usersError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins', schoolCode] });
    },
  });
}

/**
 * Delete an admin via Edge Function
 */
export function useDeleteAdmin(schoolCode: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      log.info('Deleting admin', { userId });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-admin`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete admin');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins', schoolCode] });
    },
  });
}


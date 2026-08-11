import type { NextApiRequest } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ApiError } from './error';

export { ApiError, publicApiError } from './error';

export async function requireSuperAdmin(req: NextApiRequest) {
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Authentication required');
  }

  const client = getSupabaseServerClient();
  const { data: authData, error: authError } = await client.auth.getUser(accessToken);
  if (authError || !authData.user) {
    throw new ApiError(401, 'INVALID_SESSION', 'Invalid session');
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role,is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile?.is_active || profile.role !== 'super_admin') {
    throw new ApiError(403, 'ADMIN_REQUIRED', 'Super administrator access required');
  }

  return { client, userId: authData.user.id };
}

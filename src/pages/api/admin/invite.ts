import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

type AppRole = Database['public']['Enums']['app_role'];

const INVITABLE_ROLES: AppRole[] = ['product_manager', 'editor', 'sales', 'viewer'];
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'JSON required' });
  }
  if (JSON.stringify(req.body ?? {}).length > 5_000) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Authentication required' });

  const email = text(req.body?.email, 254).toLowerCase();
  const firstName = text(req.body?.firstName, 80) || null;
  const lastName = text(req.body?.lastName, 80) || null;
  const role = text(req.body?.role, 40) as AppRole;

  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Valid email required' });
  if (!INVITABLE_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const client = getSupabaseServerClient();

  try {
    const { data: authData, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !authData.user) return res.status(401).json({ error: 'Invalid session' });

    const { data: requester, error: requesterError } = await client
      .from('profiles')
      .select('role,is_active')
      .eq('id', authData.user.id)
      .single();

    if (requesterError || !requester?.is_active || requester.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super administrator access required' });
    }

    const redirectTo = 'https://www.ipackautoparts.com/set-password';
    const { data: invitation, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { first_name: firstName, last_name: lastName, role },
    });
    if (inviteError || !invitation.user) {
      const message = inviteError?.message?.toLowerCase().includes('already')
        ? '该邮箱已存在，请使用忘记密码流程'
        : '邀请发送失败，请稍后重试';
      return res.status(400).json({ error: message });
    }

    const { error: profileError } = await client.from('profiles').upsert({
      id: invitation.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: true,
    });

    if (profileError) {
      await client.auth.admin.deleteUser(invitation.user.id);
      throw profileError;
    }

    await client.from('audit_logs').insert({
      action: 'account_invited',
      resource_type: 'profile',
      resource_id: invitation.user.id,
      user_id: authData.user.id,
      status: 'success',
      new_value: { email, role },
    });

    return res.status(201).json({ invited: true });
  } catch (error) {
    console.error('Account invitation failed', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: '邀请服务暂时不可用' });
  }
}

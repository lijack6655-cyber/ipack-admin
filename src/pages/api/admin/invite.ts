import type { NextApiRequest, NextApiResponse } from 'next';

// Fixed accounts are provisioned separately; obsolete callers must not send mail.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: '邀请功能已停用，请联系管理员维护现有内部账号' });
}

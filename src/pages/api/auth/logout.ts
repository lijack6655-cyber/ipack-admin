import type { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '方法不允许',
    });
  }

  try {
    // 清除 cookie（如有）
    res.setHeader(
      'Set-Cookie',
      'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly; Secure; SameSite=Strict'
    );

    return res.status(200).json({
      success: true,
      message: '登出成功',
    });
  } catch (error: any) {
    console.error('[LOGOUT_ERROR]', error);
    return res.status(500).json({
      success: false,
      message: '登出失败，请稍后重试',
    });
  }
}

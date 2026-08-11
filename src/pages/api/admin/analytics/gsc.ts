import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSuperAdmin, publicApiError, ApiError } from '@/lib/api/admin';
import { getDateRange, getGoogleAuth, getGoogleConfig, googleUpstreamError, numberValue } from '@/lib/analytics/google';

const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

type SearchAnalyticsResponse = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
};

async function querySearchAnalytics(siteUrl: string, body: Record<string, unknown>) {
  const auth = getGoogleAuth([GSC_SCOPE]);
  const client = await auth.getClient();
  try {
    const response = await client.request<SearchAnalyticsResponse>({
      url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      method: 'POST',
      data: body,
    });
    return response.data;
  } catch (error) {
    throw googleUpstreamError(error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    await requireSuperAdmin(req);
    const range = getDateRange(req.query.startDate, req.query.endDate);
    const { siteUrl } = getGoogleConfig();
    if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
      throw new ApiError(503, 'GSC_NOT_CONFIGURED', 'GSC site is not configured');
    }

    const base = { startDate: range.startDate, endDate: range.endDate, dataState: 'final' };
    const [summaryResponse, queryResponse, pageResponse] = await Promise.all([
      querySearchAnalytics(siteUrl, { ...base, rowLimit: 1 }),
      querySearchAnalytics(siteUrl, { ...base, dimensions: ['query'], rowLimit: 25 }),
      querySearchAnalytics(siteUrl, { ...base, dimensions: ['page'], rowLimit: 10 }),
    ]);

    const summary = summaryResponse.rows?.[0];
    const mapRow = (row: NonNullable<SearchAnalyticsResponse['rows']>[number]) => ({
      clicks: numberValue(row.clicks),
      impressions: numberValue(row.impressions),
      ctr: numberValue(row.ctr),
      position: numberValue(row.position),
    });

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({
      range,
      summary: mapRow(summary ?? {}),
      topQueries: (queryResponse.rows ?? []).map((row) => ({ query: row.keys?.[0] || '(not set)', ...mapRow(row) })),
      topPages: (pageResponse.rows ?? []).map((row) => ({ page: row.keys?.[0] || '(not set)', ...mapRow(row) })),
      coverageNote: 'Search Analytics reports search performance, not complete index coverage.',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const result = publicApiError(error);
    if (!(error instanceof ApiError)) console.error('GSC analytics request failed');
    return res.status(result.status).json(result.body);
  }
}

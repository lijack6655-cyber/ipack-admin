import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSuperAdmin, publicApiError, ApiError } from '@/lib/api/admin';
import { getDateRange, getGoogleAuth, getGoogleConfig, googleUpstreamError, numberValue } from '@/lib/analytics/google';

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

async function runReport(propertyId: string, body: Record<string, unknown>) {
  const auth = getGoogleAuth([GA_SCOPE]);
  const client = await auth.getClient();
  try {
    const response = await client.request<RunReportResponse>({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
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
    const { client } = await requireSuperAdmin(req);
    const range = getDateRange(req.query.startDate, req.query.endDate);
    const { propertyId } = getGoogleConfig();
    if (!propertyId || !/^\d+$/.test(propertyId)) {
      throw new ApiError(503, 'GA4_NOT_CONFIGURED', 'GA4 property is not configured');
    }

    const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];
    const [summary, pages, sources, leads, inquiryResult] = await Promise.all([
      runReport(propertyId, {
        dateRanges,
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
        ],
      }),
      runReport(propertyId, {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, {
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, {
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead', matchType: 'EXACT' } } },
      }),
      client
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${range.startDate}T00:00:00.000Z`)
        .lt('created_at', new Date(Date.parse(`${range.endDate}T00:00:00.000Z`) + 86_400_000).toISOString()),
    ]);

    if (inquiryResult.error) {
      throw new ApiError(503, 'INQUIRY_QUERY_FAILED', 'Inquiry data is temporarily unavailable');
    }

    const summaryMetrics = summary.rows?.[0]?.metricValues ?? [];
    const pageRows = (pages.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '(not set)',
      views: numberValue(row.metricValues?.[0]?.value),
    }));
    const totalPageViews = pageRows.reduce((sum, row) => sum + row.views, 0);
    const sourceRows = (sources.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || 'Unassigned',
      sessions: numberValue(row.metricValues?.[0]?.value),
    }));
    const totalSessions = sourceRows.reduce((sum, row) => sum + row.sessions, 0);

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({
      range,
      summary: {
        activeUsers: numberValue(summaryMetrics[0]?.value),
        pageViews: numberValue(summaryMetrics[1]?.value),
        averageSessionDurationSeconds: numberValue(summaryMetrics[2]?.value),
        inquiries: inquiryResult.count ?? 0,
        ga4LeadEvents: numberValue(leads.rows?.[0]?.metricValues?.[0]?.value),
      },
      topPages: pageRows.map((row) => ({ ...row, share: totalPageViews ? row.views / totalPageViews : 0 })),
      trafficSources: sourceRows.map((row) => ({ ...row, share: totalSessions ? row.sessions / totalSessions : 0 })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const result = publicApiError(error);
    if (!(error instanceof ApiError)) console.error('GA4 analytics request failed');
    return res.status(result.status).json(result.body);
  }
}

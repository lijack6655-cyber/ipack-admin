import { GoogleAuth } from 'google-auth-library';
import { ApiError } from '../api/error.ts';

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type DateRange = { startDate: string; endDate: string };

export function getDateRange(start: unknown, end: unknown, today = new Date()): DateRange {
  const endDate = typeof end === 'string' && ISO_DATE.test(end) ? end : today.toISOString().slice(0, 10);
  const defaultStart = new Date(new Date(`${endDate}T00:00:00.000Z`).getTime() - 29 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const startDate = typeof start === 'string' && ISO_DATE.test(start) ? start : defaultStart;

  const startTime = Date.parse(`${startDate}T00:00:00.000Z`);
  const endTime = Date.parse(`${endDate}T00:00:00.000Z`);
  const datesAreExact = Number.isFinite(startTime) && Number.isFinite(endTime) &&
    new Date(startTime).toISOString().slice(0, 10) === startDate &&
    new Date(endTime).toISOString().slice(0, 10) === endDate;
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || !datesAreExact || startTime > endTime) {
    throw new ApiError(400, 'INVALID_DATE_RANGE', 'Invalid date range');
  }
  if ((endTime - startTime) / DAY_MS > 365) {
    throw new ApiError(400, 'DATE_RANGE_TOO_LARGE', 'Date range cannot exceed 366 days');
  }

  return { startDate, endDate };
}

export function getGoogleConfig() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const siteUrl = process.env.GSC_SITE_URL?.trim();

  if (!clientEmail || !privateKey) {
    throw new ApiError(503, 'GOOGLE_NOT_CONFIGURED', 'Google API credentials are not configured');
  }

  return { clientEmail, privateKey, propertyId, siteUrl };
}

export function getGoogleAuth(scopes: string[]) {
  const { clientEmail, privateKey } = getGoogleConfig();
  return new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes,
  });
}

type GoogleHttpError = {
  response?: { status?: number };
  code?: number | string;
};

export function googleUpstreamError(error: unknown) {
  const status = (error as GoogleHttpError)?.response?.status ?? (error as GoogleHttpError)?.code;
  if (status === 401 || status === 403) {
    return new ApiError(502, 'GOOGLE_ACCESS_DENIED', 'Google API access is not authorized');
  }
  if (status === 429) {
    return new ApiError(502, 'GOOGLE_RATE_LIMITED', 'Google API rate limit reached');
  }
  return new ApiError(502, 'GOOGLE_API_FAILED', 'Google API request failed');
}

export function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

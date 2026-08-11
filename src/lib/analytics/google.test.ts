import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, publicApiError } from '../api/error.ts';
import { getDateRange, googleUpstreamError, numberValue } from './google.ts';

test('defaults to an inclusive 30-day date range', () => {
  assert.deepEqual(getDateRange(undefined, undefined, new Date('2026-08-11T08:00:00Z')), {
    startDate: '2026-07-13',
    endDate: '2026-08-11',
  });
});

test('rejects reversed, invalid calendar, and oversized ranges', () => {
  assert.throws(() => getDateRange('2026-08-12', '2026-08-11'), ApiError);
  assert.throws(() => getDateRange('2026-02-31', '2026-03-01'), ApiError);
  assert.throws(() => getDateRange('2025-01-01', '2026-08-11'), ApiError);
});

test('normalizes legitimate empty metric values to zero', () => {
  assert.equal(numberValue(undefined), 0);
  assert.equal(numberValue(''), 0);
  assert.equal(numberValue('17.5'), 17.5);
  assert.equal(numberValue('not-a-number'), 0);
});

test('maps Google authorization, quota, and upstream failures without leaking details', () => {
  const denied = publicApiError(googleUpstreamError({ response: { status: 403 }, message: 'private key details' }));
  const limited = publicApiError(googleUpstreamError({ response: { status: 429 } }));
  const failed = publicApiError(googleUpstreamError({ response: { status: 500 }, message: 'upstream body' }));

  assert.deepEqual(denied, { status: 502, body: { error: 'Google API access is not authorized', code: 'GOOGLE_ACCESS_DENIED' } });
  assert.equal(limited.body.code, 'GOOGLE_RATE_LIMITED');
  assert.equal(failed.body.code, 'GOOGLE_API_FAILED');
  assert.doesNotMatch(JSON.stringify([denied, limited, failed]), /private key|upstream body/i);
});

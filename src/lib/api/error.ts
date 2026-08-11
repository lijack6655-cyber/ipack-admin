export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function publicApiError(error: unknown) {
  if (error instanceof ApiError) {
    return { status: error.status, body: { error: error.message, code: error.code } };
  }

  return {
    status: 500,
    body: { error: 'Analytics service temporarily unavailable', code: 'INTERNAL_ERROR' },
  };
}

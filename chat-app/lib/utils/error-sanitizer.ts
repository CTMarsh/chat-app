/**
 * Strips PostgreSQL/PostgREST schema details from error messages
 * before exposing them to users. Ported from Swift ErrorSanitizer.
 */

const SCHEMA_PATTERNS = [
  'relation "',
  'column "',
  'violates',
  'constraint "',
  'schema "',
  'pg_',
  'operator does not exist',
  'permission denied for',
  'does not exist',
  'already exists',
  'not-null',
  'unique_violation',
  'foreign_key_violation',
  'pgrst',
]

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

export function sanitizeError(error: unknown): string {
  if (!error) return GENERIC_MESSAGE

  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : GENERIC_MESSAGE

  const lower = message.toLowerCase()

  if (SCHEMA_PATTERNS.some(pattern => lower.includes(pattern))) {
    return GENERIC_MESSAGE
  }

  return message
}

export function sanitizeErrorMessage(message: string): string {
  const lower = message.toLowerCase()

  if (SCHEMA_PATTERNS.some(pattern => lower.includes(pattern))) {
    return GENERIC_MESSAGE
  }

  return message
}

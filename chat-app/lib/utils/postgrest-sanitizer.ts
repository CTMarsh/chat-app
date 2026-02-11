/**
 * Escapes special characters in strings used in PostgREST .or() filters.
 * Prevents filter injection via `. % * ( ) ,` characters.
 * Ported from Swift PostgRESTSanitizer.
 */

const SPECIAL_CHARS = ['\\', '.', '%', '*', '(', ')', ',']

export function sanitizePostgRESTFilter(input: string): string {
  let result = input
  for (const char of SPECIAL_CHARS) {
    result = result.replaceAll(char, `\\${char}`)
  }
  return result
}

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return fieldErrors ? { ok: false, message, fieldErrors } : { ok: false, message };
}

export function ok(): ActionResult {
  return { ok: true };
}

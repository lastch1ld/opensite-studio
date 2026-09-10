// Email is an identity here, and identity comparison has to agree with
// itself everywhere. app/api/invitations/[token] already accepts an
// invitation whose address matches the session's case-insensitively —
// but nothing normalized the address on the way *in*, so
// `bob@corp.com` and `Bob@corp.com` were two separate User rows that
// both satisfied that check. Signing up under the other casing of an
// invited address was enough to claim the invitation meant for it.
//
// Normalizing on write stops new split identities; lookups additionally
// go through `emailWhere` so rows written before this still resolve.
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Case-insensitive equality filter for an email column. Prisma renders
 * this as ILIKE-equivalent on Postgres, so it matches both normalized rows
 * and any mixed-case row stored before normalizeEmail existed. */
export function emailWhere(raw: string) {
  return { equals: normalizeEmail(raw), mode: "insensitive" as const };
}

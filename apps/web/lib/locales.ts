import { db } from "./db";

// A Site should have exactly one default Locale — enforced here at the
// application layer (see schema.prisma's comment on Locale.isDefault)
// rather than a DB constraint, so every write path that can change which
// Locale is default (locale create, locale update, locale delete) goes
// through this one transaction instead of each API route hand-rolling the
// "unset the old default first" step.
export async function setDefaultLocale(siteId: string, localeId: string) {
  return db.$transaction(async (tx) => {
    await tx.locale.updateMany({ where: { siteId, NOT: { id: localeId } }, data: { isDefault: false } });
    return tx.locale.update({ where: { id: localeId }, data: { isDefault: true } });
  });
}

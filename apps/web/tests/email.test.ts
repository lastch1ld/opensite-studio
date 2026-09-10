import { describe, expect, it } from "vitest";
import { emailWhere, normalizeEmail } from "@/lib/email";

describe("normalizeEmail", () => {
  it("collapses the casings and padding of one address to one identity", () => {
    for (const raw of ["bob@corp.com", "Bob@corp.com", "BOB@CORP.COM", "  bob@corp.com  "]) {
      expect(normalizeEmail(raw), raw).toBe("bob@corp.com");
    }
  });
});

describe("emailWhere", () => {
  // Rows written before normalizeEmail existed can still be mixed-case, so
  // the lookup filter has to be case-insensitive as well as normalized —
  // otherwise this fix locks those accounts out of logging in.
  it("asks for a case-insensitive match on the normalized address", () => {
    expect(emailWhere("  Bob@Corp.com ")).toEqual({ equals: "bob@corp.com", mode: "insensitive" });
  });
});

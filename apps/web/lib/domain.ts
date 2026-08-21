import { randomBytes } from "crypto";
import { promises as dns } from "dns";

// TXT verification chosen over CNAME: it proves domain control without
// requiring the owner to point DNS at us before we've confirmed they own it,
// and it doesn't collide with whatever A/CNAME record they use to actually
// route traffic here (often the apex, which can't hold a CNAME anyway).
export function verificationRecordName(domain: string): string {
  return `_opensite-verify.${domain}`;
}

export function generateVerificationToken(): string {
  return randomBytes(16).toString("hex");
}

export async function verifyDomainTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(verificationRecordName(domain));
    return records.some((chunks) => chunks.join("").trim() === token);
  } catch {
    return false;
  }
}

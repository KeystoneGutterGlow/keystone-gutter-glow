// Personal referral codes: 8 characters from an alphabet without look-alikes (no 0/O, 1/I/L, U),
// so they're easy to read out or type from a text. About 650 billion possibilities, so they
// can't be guessed. The friend's page is /referred/<code>.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_RE = new RegExp(`^[${ALPHABET}]{8}$`);

export function makeReferralCode(): string {
  // 256 isn't a multiple of 30, so reject the top of the range to keep every character equally likely.
  let code = "";
  while (code.length < 8) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      if (b < 240 && code.length < 8) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return code;
}

/** The same person referring the same friend (by the friend's phone or email): a repeat, not a new referral. */
export function sameReferral(
  a: { referrerPhone: string; friendPhone: string; friendEmail: string },
  b: { referrerPhone: string; friendPhone: string; friendEmail: string },
): boolean {
  if (a.referrerPhone !== b.referrerPhone) return false;
  return (!!a.friendPhone && a.friendPhone === b.friendPhone) || (!!a.friendEmail && a.friendEmail === b.friendEmail);
}

/** Tidies a code someone typed or pasted (case, spaces, dashes). Returns null if it can't be a code. */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, "");
  return CODE_RE.test(code) ? code : null;
}

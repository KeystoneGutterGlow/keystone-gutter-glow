// A notification for Jimmy, delivered by FormSubmit (formsubmit.co) from the visitor's browser.
// The server decides whether one is sent and writes it (lib/notify/formsubmit.ts). The browser only
// passes it on, after the server has accepted the request, so nothing reaches Jimmy about a booking
// that wasn't saved. FormSubmit only delivers email: the booking itself lives in the database,
// which also enforces the daily limit.
//
// Safe to import from client components.

export interface Notice {
  /** FormSubmit's AJAX endpoint for Jimmy's address */
  endpoint: string;
  /** Sent as-is. Keys starting with "_" are FormSubmit settings; the rest become the email's table. */
  fields: Record<string, string>;
}

export type NoticeResult =
  | { ok: true }
  /** "activation": FormSubmit is waiting for Jimmy to click "Activate Form" in its first email. */
  | { ok: false; reason: "activation" | "refused" | "network"; message?: string };

export const FORMSUBMIT_AJAX = "https://formsubmit.co/ajax/";

/**
 * Posts the notice to FormSubmit and reports whether FormSubmit confirmed it. Only a
 * `"success": "true"` answer counts. An unreachable server, an error status, an unreadable answer
 * and an inactive form are all failures, so the page never claims Jimmy has something he doesn't.
 */
export async function sendNotice(notice: Notice, signal?: AbortSignal): Promise<NoticeResult> {
  // Never post customer details anywhere but FormSubmit, whatever the server sent.
  if (!notice.endpoint.startsWith(FORMSUBMIT_AJAX)) return { ok: false, reason: "refused", message: "unexpected endpoint" };

  let res: Response;
  try {
    const timeout = AbortSignal.timeout(20_000);
    res = await fetch(notice.endpoint, {
      method: "POST",
      // Form-encoded rather than JSON: a "simple" cross-origin request, so the browser sends it
      // straight away without a preflight, and `keepalive` lets it finish if the tab is closed.
      body: new URLSearchParams(notice.fields),
      headers: { Accept: "application/json" },
      keepalive: true,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  const data = (await res.json().catch(() => null)) as { success?: unknown; message?: unknown } | null;
  const message = typeof data?.message === "string" ? data.message : undefined;
  if (res.ok && (data?.success === "true" || data?.success === true)) return { ok: true };
  if (message && /activat/i.test(message)) {
    console.warn("[notify] FormSubmit hasn't been activated for this site yet:", message);
    return { ok: false, reason: "activation", message };
  }
  console.warn(`[notify] FormSubmit didn't accept the notice (${res.status})`, message ?? "");
  return { ok: false, reason: "refused", message };
}

import { formSubmitEnabled } from "@/lib/notify/formsubmit";
import { isDemoStorage } from "@/lib/storage";

/**
 * Whether the stand-alone plan request form can work here. Its only record is the email to Jimmy,
 * so a real deployment with FormSubmit off hides it rather than letting someone fill it in for nothing.
 * Choosing a plan while booking always works: it travels with the booking.
 * Server only. Static pages read it at build time.
 */
export function planRequestsOpen(): boolean {
  return formSubmitEnabled() || isDemoStorage();
}

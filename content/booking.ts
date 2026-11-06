// Scheduling rules. Shared by the booking UI and the server-side availability checks.
// Change a start time or the daily cap here and both sides follow, including the database:
// the cap is sent with every booking and the database applies the lower of it and
// booking_settings.max_jobs_per_day.

export interface SlotDef {
  /** 24h "HH:MM", stored with the booking */
  id: string;
  label: string;
  part: "Morning" | "Midday" | "Afternoon";
}

/**
 * "time-slots": the customer picks a day and a start time (current behavior).
 * "day-only":   the customer picks a day. The server files the job under the first free slot
 *               internally and the customer never sees a time.
 *
 * Jimmy chose "day-only": customers ask for a specific arrival time in the additional-information
 * box. Website Agreement, Addendum A1 also asks for maxJobsPerDay: 3, but the cap stays as it is
 * until he confirms. Also set site.policies.lateCancelFeeDollars when he confirms that fee.
 */
export type ScheduleMode = "time-slots" | "day-only";

export const bookingRules = {
  timeZone: "America/New_York",
  scheduleMode: "day-only" as ScheduleMode,
  /** Hard cap. The database enforces it too. */
  maxJobsPerDay: 4,
  /**
   * Start times offered each day. There are deliberately more of these than the daily cap,
   * so a day closes after any four bookings, whichever times they take.
   * Must stay at least as long as maxJobsPerDay, because day-only mode files jobs under these.
   */
  slots: [
    { id: "08:00", label: "8:00 AM", part: "Morning" },
    { id: "10:00", label: "10:00 AM", part: "Morning" },
    { id: "12:00", label: "12:00 PM", part: "Midday" },
    { id: "14:00", label: "2:00 PM", part: "Afternoon" },
    { id: "16:00", label: "4:00 PM", part: "Afternoon" },
  ] satisfies SlotDef[],
  /** 0 = Sunday. Jimmy confirmed Monday through Saturday. */
  closedWeekdays: [0] as number[],
  /** "YYYY-MM-DD" days off: holidays, vacation */
  blackoutDates: [] as string[],
  /** The current site starts bookings tomorrow */
  minLeadDays: 1,
  /** How far ahead the calendar opens */
  horizonDays: 60,
};

export type BookingRules = typeof bookingRules;

/** The free-text box, and Jimmy's procedure for arrival-time requests. */
export const additionalInfo = {
  label: "Additional information we should know",
  placeholder: "Please come after 2 PM, enter through the gate, watch out for mud…",
  note: "Need a specific arrival time? Ask here.",
};

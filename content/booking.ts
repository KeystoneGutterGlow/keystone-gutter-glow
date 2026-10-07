// Scheduling rules. Shared by the booking UI and the server-side availability checks.
// Change a start time or the daily cap here and both sides follow.

export interface SlotDef {
  /** 24h "HH:MM", stored with the booking */
  id: string;
  label: string;
  part: "Morning" | "Midday" | "Afternoon";
}

export const bookingRules = {
  timeZone: "America/New_York",
  /** Hard cap. The database enforces it too. */
  maxJobsPerDay: 4,
  /**
   * Start times offered each day. There are deliberately more of these than the daily cap,
   * so a day closes after any four bookings, whichever times they take.
   */
  slots: [
    { id: "08:00", label: "8:00 AM", part: "Morning" },
    { id: "10:00", label: "10:00 AM", part: "Morning" },
    { id: "12:00", label: "12:00 PM", part: "Midday" },
    { id: "14:00", label: "2:00 PM", part: "Afternoon" },
    { id: "16:00", label: "4:00 PM", part: "Afternoon" },
  ] satisfies SlotDef[],
  /** 0 = Sunday. ASSUMPTION: closed Sundays. The current site allows any day; confirm with Jimmy. */
  closedWeekdays: [0] as number[],
  /** "YYYY-MM-DD" days off: holidays, vacation */
  blackoutDates: [] as string[],
  /** The current site starts bookings tomorrow */
  minLeadDays: 1,
  /** How far ahead the calendar opens */
  horizonDays: 60,
};

export type BookingRules = typeof bookingRules;

import { bookingRules } from "@/content/booking";
import { site } from "@/content/site";

// Builds a one-event .ics so the customer can drop the appointment into their calendar.

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** slotId null makes it an all-day event, for day-only scheduling. */
export function buildIcs(opts: { ref: string; date: string; slotId: string | null; address: string; minutes?: number }) {
  const day = opts.date.replace(/-/g, "");
  const pad = (n: number) => String(n).padStart(2, "0");
  let when: string[];
  if (opts.slotId) {
    const [h, m] = opts.slotId.split(":").map(Number) as [number, number];
    const end = h * 60 + m + (opts.minutes ?? 90);
    when = [
      `DTSTART;TZID=${bookingRules.timeZone}:${day}T${pad(h)}${pad(m)}00`,
      `DTEND;TZID=${bookingRules.timeZone}:${day}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`,
    ];
  } else {
    when = [`DTSTART;VALUE=DATE:${day}`];
  }
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keystone Gutter Glow//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.ref}@keystonegutterglow.com`,
    `DTSTAMP:${stamp(new Date())}`,
    ...when,
    `SUMMARY:${esc(`Gutter cleaning, ${site.name}`)}`,
    `LOCATION:${esc(opts.address)}`,
    `DESCRIPTION:${esc(`Booking ${opts.ref}. Questions or changes: ${site.phone.display}.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

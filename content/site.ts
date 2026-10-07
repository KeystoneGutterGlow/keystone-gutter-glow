// Business facts. Everything here comes from the current keystonegutterglow.com
// unless marked CONFIRM. Edit in one place; the page, schema and footer all read from it.

export const site = {
  name: "Keystone Gutter Glow",
  legalName: "Keystone Gutter Glow LLC",
  url: "https://keystonegutterglow.com",
  owner: "Jimmy Esmond",
  phone: {
    display: "(214) 642-5081",
    href: "tel:+12146425081",
    sms: "sms:+12146425081",
    schema: "+1-214-642-5081",
  },
  email: "jimmyesmond@keystonegutterglow.com",
  county: "Bucks County",
  state: "PA",
  // The current site says "Serving Jamison & surrounding areas".
  centerTown: "Jamison",
  // From the current FAQ: "specialized gutter vacuums that can reach up to 32ft".
  poleReachFeet: 32,
  // From the current schema: "Ground-based vacuum gutter cleaning", "carbon fiber vacuum pole".
  // CONFIRM with Jimmy that ladders are genuinely not part of a normal visit before leaning on it harder.
  groundBased: true,
  // Shown on the current site's trust bar. CONFIRM before launch; add a policy/cert number if one exists.
  insured: true,
  residentialOnly: true,
  policies: {
    payAfter: true, // "Payment is due after service is completed, via the invoice we send"
    freeRescheduleHours: 24,
    returnVisitHours: 48, // "contact us within 48 hours ... we will return ... at no additional charge"
    weather: ["heavy rain", "lightning", "ice", "high winds"],
  },
} as const;

export type Site = typeof site;

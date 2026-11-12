// Where the legal pages live. Kept apart from content/legal.tsx so client components can link to
// them without pulling the full text of all three documents into the page's JavaScript.

export const legalPaths = {
  terms: "/terms",
  privacy: "/privacy",
  planTerms: "/recurring-plan-terms",
} as const;

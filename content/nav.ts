// Section anchors for the downspout rail and the mobile menu. Order = page order.

export interface NavItem {
  id: string;
  label: string;
}

export const homeSections: NavItem[] = [
  { id: "services", label: "What we clean" },
  { id: "vacuum", label: "Vacuum vs. scoop" },
  { id: "how", label: "How it works" },
  { id: "prices", label: "Prices" },
  { id: "work", label: "Before & after" },
  { id: "jimmy", label: "Meet Jimmy" },
  { id: "area", label: "Where we work" },
  { id: "faq", label: "Questions" },
];

export const BOOK_ID = "book";

// Owner section. The quote and story are Jimmy's own words, tidied for grammar only. `draft: true`
// renders a field with the hatched placeholder style, if one ever needs to go back to that.
// His photo (2026-11-11, from Sam) is public/images/jimmy.webp, re-saved without any metadata.

export interface DraftText {
  text: string;
  draft: boolean;
}

export const owner = {
  name: "Jimmy Esmond",
  role: "Owner, Keystone Gutter Glow LLC",
  photo: {
    src: "/images/jimmy.webp" as string | null,
    width: 828,
    height: 1104,
    alt: "Jimmy Esmond raising his carbon-fiber gutter vacuum pole in a driveway on a fall afternoon",
    want: "Jimmy beside his gutter vacuum equipment. Daylight, eye level.",
    file: "public/images/jimmy.webp",
  },
  quote: {
    text: "“It’s just better.”",
    draft: false,
  } as DraftText,
  story: [
    { text: "I’m 16 and a student at Central Bucks East High School. I started this business to pursue my dreams in business.", draft: false },
    { text: "I use vacuums to ensure there are no liabilities on anyone, and because a vacuum does a much more thorough job than scooping.", draft: false },
  ] as DraftText[],
};

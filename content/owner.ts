// Owner section. The quote and story are Jimmy's own words, tidied for grammar only. `draft: true`
// renders a field with the hatched placeholder style, if one ever needs to go back to that.
// His photo is still to come: drop it at the path below and set `src`.

export interface DraftText {
  text: string;
  draft: boolean;
}

export const owner = {
  name: "Jimmy Esmond",
  role: "Owner, Keystone Gutter Glow LLC",
  photo: {
    src: null as string | null, // e.g. "/images/jimmy.jpg"
    want: "Jimmy beside his gutter vacuum equipment. Daylight, eye level.",
    file: "public/images/jimmy.jpg",
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

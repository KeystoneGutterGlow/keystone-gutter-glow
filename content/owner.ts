// Owner section. Jimmy's real story is still to come, so every narrative field is a
// placeholder: `draft: true` renders it with the hatched placeholder style.
// To go live, replace `text`, set `draft: false`, and drop his photo at the path below.

export interface DraftText {
  text: string;
  draft: boolean;
}

export const owner = {
  name: "Jimmy Esmond",
  role: "Owner, Keystone Gutter Glow LLC",
  photo: {
    src: null as string | null, // e.g. "/images/jimmy.jpg"
    want: "Jimmy beside the vacuum cart on a customer's lawn. Daylight, eye level, pole in hand.",
    file: "public/images/jimmy.jpg",
  },
  quote: {
    text: "A line in Jimmy's own words about why he cleans gutters this way.",
    draft: true,
  } as DraftText,
  story: [
    { text: "Where Jimmy's from and how long he's been in Bucks County.", draft: true },
    { text: "How he got into gutter cleaning, and why he went with a vacuum rig instead of a ladder and a scoop.", draft: true },
    { text: "What he wants a customer to notice when they look at the photos afterward.", draft: true },
  ] as DraftText[],
};

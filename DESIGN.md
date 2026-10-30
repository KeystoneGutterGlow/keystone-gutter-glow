# Keystone Gutter Glow: visual system

## The idea: the page is the drainage line

A house sheds water in one direction: roof, gutter, downspout, ground. The site does the same.

- **The gutter runs across the top.** The hero opens with a drawn roof edge and gutter. The left half is clean and the right half is still full of leaves and needles. The vacuum's gooseneck sits right where clean meets dirty, and its pole comes down through the hero to a hose and a tank on the ground. That's the whole business in one picture, before anyone reads a word.
- **The downspout runs down the left.** The desktop nav is a downspout. Each section is a strap holding the pipe to the wall. As you scroll, water fills the pipe down to the section you're in. At the top of the page the rail's gutter stub lines up with the hero gutter, so the two read as one run.
- **Everything drains to booking.** The downspout ends in an elbow pointing at the Book button. The booking section sits at the bottom of the page, where the water goes.

If you swapped the logo for a roofer's or a landscaper's, the hero, the nav, the services drawing, the cross-sections and the pricing street would all stop making sense. That's the test.

## Color: literal, not decorative

| Token | Hex | Means |
|---|---|---|
| `--navy` | `#0D2A4E` | Keystone. Structure, text, linework. Taken from the logo. |
| `--navy-deep` | `#081B33` | Footer, pressed button ledge |
| `--sky` | `#3BB0EE` | Clean water and clean aluminum. Keystone's action. Taken from the logo's water drop. Fills and large type only on light backgrounds. |
| `--sky-ink` | `#0A6AA6` | Sky that passes contrast as text on light |
| `--enamel` | `#F3F5F6` | Page. White gutter enamel, slightly cool |
| `--alu-*` | `#E5E9EC` / `#CDD4DA` / `#8C99A5` | Aluminum: panels, rules, drawing fills |
| `--debris` / `--leaf` / `--mud` | `#6B4A2E` / `#B4652F` / `#9C8770` | **Only** for debris and for "the scoop way". It is never used as a button color. |

The client's existing navy and cyan are kept and refined. No gradients except the tonal bands that make the drawn aluminum look like aluminum.

## Type

- **Zilla Slab** (600/700) for display. No italics anywhere on the site, per the agreement; emphasis comes from weight and color. It's a slab with a bit of grit, like hardware-store signage. Prices are set in it because a price on a sign should look like one.
- **Atkinson Hyperlegible** for body text and UI. It was built for low-vision readers, so phone numbers, ZIPs, times and form fields can't be misread. It's distinctive without being cute.
- No mono, and no letterspaced uppercase eyebrows over every heading.
- Display sizes are set per section and are deliberately uneven. "We vacuum. They scoop." runs at up to 10rem. The FAQ heading is 2rem.

## Spacing and rhythm

- 4px base. Section padding is set per section and never comes from one shared value: Services is tight, Vacuum is huge, How-it-works is a single sentence, the Area section is compact.
- Background sequence: enamel, white, **navy (dominant)**, enamel, aluminum, white, enamel, enamel, **navy (booking)**, deep navy. The two navy blocks bracket the parts that sell.
- Layouts break the grid on purpose: drawings bleed off the right edge, the vacuum headline is staggered, and the pricing columns get widths proportional to the houses.

## Buttons

- Rectangular, 2px radius, with a hard 3px "ledge" in a darker shade underneath. On press the ledge disappears and the button drops 2px, so it feels physical. No glow, no scale-on-hover.
- One primary style per surface: navy on light, sky on dark.
- Labels say what happens: "Pick a day", "Book this house", "Check the schedule". Never "Learn more".

## Linework and drawings

- Technical-elevation style: 1.5px navy strokes, flat aluminum fills, sky for water, brown only for debris. They read like a contractor's sketch, not clip art.
- **Keystone markers.** Callouts in diagrams and town pins on the map use the PA keystone shape from the logo, the same shape as Pennsylvania's route-marker signs. It's the one repeated brand glyph.
- There are no generic icon sets. The handful of UI icons (phone, arrow, camera) are drawn to match the 1.5px stroke.

## Photography

- Use real job photos only: gutter-level shots looking down the run, debris close-ups, the rig on a lawn. No filters, no stock houses.
- Where a photo doesn't exist yet, show a **hatched placeholder** (the architectural convention for "to be supplied") with the shot described and a target filename, so it's obvious what to shoot.
- The before/after on the current site is the strongest asset. It powers the interactive slider.

## Dividers

- The drawn gutter at the top of the hero, ground lines (with hatch below) at the bottom of drawings, and hairline aluminum rules. No wave dividers, no blobs.

## Motion

- Smooth anchor scrolling, the downspout fill, step transitions in booking, and a slow suction animation in the vacuum cross-section, which shows the direction of flow. That's all of it.
- Everything turns off under `prefers-reduced-motion`.

## Winter mode

Firewood keeps the same bones: the left rail, a drawing at true scale, and a page that drains to the action at the bottom. `[data-season="firewood"]` swaps the tokens to soft white and red, so buttons, focus rings and placeholders follow without their own styles.

- **The downspout becomes a column of split logs.** The scroll-driven level that filled the pipe with water now decides how far the fire has burned, down to the order form. Logs above the level are alight and logs below it aren't lit yet. The flames rise through a transform, so scrolling doesn't repaint them.
- **The pricing street becomes a yard of cord stacks.** All three show the same 4 by 8 ft face at one scale, and only the depth changes, so the drawing explains what a cord is.
- **Motion:** falling snow in the hero and the moving flames. Under `prefers-reduced-motion` the snow is gone and the flames hold still. The burn level still follows scrolling.

## Mobile

- **The downspout stays on phones.** It's a slim 24px rail fixed to the left edge, sitting inside the page gutter (never narrower than 26px), so it doesn't cover text.
  - It works like the desktop rail: one strap per section, the current one turns sky blue and taller (it doubles as the pull handle), and water fills to where you are.
  - At the top of the page the pipe hangs off the hero gutter. Once the gutter scrolls away, the pipe runs to the top of the screen.
  - Scrolling into a new section briefly flashes its name beside the strap.
- **Tap the rail to open it.** It widens into a white drawer over a scrim. The straps stay exactly where they were and the section names appear beside them in the slab face.
  - Every row is at least 44px tall, even on a 320×568 screen.
  - Tap a name to scroll there and close the drawer. Tapping outside, swiping left, Escape and the Close button also close it.
  - Focus moves to the current section on open and back to the rail on close. It respects safe areas and closes itself if the screen grows into the desktop layout.
- **Book stays separate.** A sticky bottom bar ("Book a cleaning · from $169" plus a call button) holds it, and the downspout's elbow empties into the Book button, as on desktop. The bar steps aside while the booking section is on screen, and the pipe then runs to the bottom.
- The hero keeps the rig drawing. The pole moves to the right margin so the headline gets full height.
- Vacuum vs. scoop becomes a two-state toggle, so the comparison happens in the same spot on screen.
- Pricing becomes tap-to-book rows. Booking goes full-bleed with a sticky Continue bar and 48px+ day cells.

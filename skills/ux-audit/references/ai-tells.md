# AI tells blocklist

A list of patterns that coding agents produce again and again in generated UI. Many of them make a product look generic. Some of them also hurt usability, accessibility or trust. Each entry names the pattern, the harm and a better option. Every entry has at least one published source (see the end of the file).

## How to use this list

- The plugin never proposes a pattern from this list in a flow, a design option or a fix proposal.
- In an audit, flag a pattern only when it hurts the user task or user trust. A pattern that only looks generic is not a finding.
- Severity is `minor` at most. Use `advisory` in most cases. Use a higher level only when the pattern blocks a task (for example, text that nobody can read, or content that stays hidden).
- Basis is `web_sourced` when the claim comes from the sources below. Basis is `observed` when you saw the harm in the running product.
- A user may ask for a blocked pattern. Give one short warning that names the harm. If the user insists, allow it. Then add a decision to `docs/ux/project.json` with `kind: "ai_tell_override"`, the pattern id and the reason. Do not warn again for that pattern.
- A pattern that is part of the user's own design system is not a tell. Do not flag it and do not ask for an override.
- All entries are habits of reflex, not laws. A pattern chosen on purpose for a clear reason, and used with care, is allowed.

---

## Layout

### Identical feature-card trio (`feature-card-trio`)
- Looks like: Three (or four, or six) equal cards in a row. Each has a small line icon, a short bold title and two lines of text.
- Why it hurts: All items get the same weight, so the reader cannot see which feature matters. The block also looks like stock output, which weakens trust in a new product.
- Do instead: Show the one or two features that matter most with real content: a screenshot, a short demo or a concrete number. Vary size and order by importance.
- Sources: [Designpixil](https://designpixil.com/blog/ai-slop-design), [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [SuperDesign](https://superdesign.dev/blog/why-ai-design-looks-generic)

### Cards inside cards (`nested-cards`)
- Looks like: A rounded container holds a second rounded panel, which holds more tiles, badges and bars. Each level has its own border and shadow.
- Why it hurts: Extra borders add visual noise and shrink the usable width, mainly on small screens. The layers also hide which group of information belongs together.
- Do instead: Use one level of container. Group related items with spacing, a heading or a thin divider.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Impeccable README](https://github.com/pbakaus/impeccable), [Alex Lavaee](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/)

### Centered hero with a stock button pair (`centered-hero-default`)
- Looks like: A centered headline, a centered sentence, and two buttons such as "Get Started" and "Learn More". The hero often takes a full screen and holds little information.
- Why it hurts: Generic button labels do not say what happens next. Two buttons of near equal weight split attention. A first screen without a concrete claim does not tell the visitor what the product is.
- Do instead: Align text to the content, not by default. State what the product does in the first line. Use one primary action with a label that names the result, for example "Book a 15-minute demo".
- Sources: [SuperDesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [Designpixil](https://designpixil.com/blog/ai-slop-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same), [Hacker News thread](https://news.ycombinator.com/item?id=45622944)

### Template page skeleton (`template-page-skeleton`)
- Looks like: The same order on every site: hero, logo strip, features, how it works, testimonials, pricing, FAQ, closing banner. Some sections exist only to fill a slot.
- Why it hurts: Visitors scan for the answer to their own question. A section that answers nothing slows them down. The same rhythm for every section makes the page hard to scan.
- Do instead: Start from the questions a visitor must answer to decide. Keep only the sections that answer one. Remove a section if the page works without it.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)

### Decorative step numbers (`decorative-step-numbers`)
- Looks like: Large "01 / 02 / 03" markers on items that are not a sequence, or on a sequence that is already clear from the layout.
- Why it hurts: Numbers suggest an order. If the order does not exist, the reader looks for a process that is not there. The markers also take space and attention.
- Do instead: Number only real steps that the user must follow in order. Otherwise use plain headings.
- Sources: [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

### Colored side border on cards (`side-accent-border`)
- Looks like: Cards or alerts with a thick colored line on the left (or top) edge, repeated across a whole grid or list.
- Why it hurts: Color is a signal. When every card has one, the signal loses meaning, and a real warning no longer stands out. Color alone also fails for users with color vision differences.
- Do instead: Keep a colored edge for one meaning only, such as a status, and pair it with an icon or a label. Use neutral cards for the rest.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Impeccable README](https://github.com/pbakaus/impeccable)

### No product evidence (`no-product-evidence`)
- Looks like: A page full of benefit claims, but no real screenshot, no real workflow and no real data. Abstract shapes or gradient blobs sit where the product should be.
- Why it hurts: The visitor cannot check the claim. This is a trust gap, and it slows the decision to try or buy.
- Do instead: Show the real product in use: an actual screen, a short step-by-step example, or a real result with a source.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Designpixil](https://designpixil.com/blog/ai-slop-design), [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/)

---

## Typography

### Eyebrow labels (`eyebrow-labels`)
- Looks like: A tiny, uppercase, letter-spaced label (sometimes in a pill) above a section heading or the hero headline. It repeats above most sections.
- Why it hurts: The label usually repeats or vaguely labels what the heading says, so it adds a line to read and no meaning. Small, spaced capitals are also slower to read and often have low contrast. Repetition makes the page look machine-made.
- Do instead: Put the key word in the heading itself. Keep a small label only where it names a field or a category in data (for example a status or a date on a card), not as a decoration above headings.
- Sources: [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [Impeccable PR 129](https://github.com/pbakaus/impeccable/pull/129), [Designpixil](https://designpixil.com/blog/ai-slop-design)

### Gradient text (`gradient-text`)
- Looks like: A headline or a metric filled with a purple, blue or teal gradient through background clipping. Sometimes the gradient moves.
- Why it hurts: Contrast changes along the text, so part of the letters can fall below the readable level. Forced-colors and high-contrast modes may show the text wrongly. A moving gradient pulls the eye away from the message.
- Do instead: Use one solid text color with checked contrast. Show emphasis with size, weight or position.
- Sources: [Impeccable docs](https://impeccable.style/docs/detector), [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [Alex Lavaee](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design)

### Default font and flat hierarchy (`default-font-monoculture`)
- Looks like: One neutral sans-serif family (Inter or a close twin) at every level, with small differences in size and weight. Nobody chose the font for the product.
- Why it hurts: With little contrast between levels, users cannot scan the page for what matters. The product also has no recognizable voice, so it blends with competitors.
- Do instead: Choose the font on purpose for the audience and the content. Define a clear scale for headings, body and captions. Keep an existing brand font if the project has one.
- Sources: [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [SuperDesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [Designpixil](https://designpixil.com/blog/ai-slop-design), [The Crit](https://thecrit.co/resources/vibe-coding-design-guide), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

### Oversized italic serif headline (`italic-serif-hero`)
- Looks like: A very large italic serif face on the hero headline, often with one word in a second color or style. It is the newer way to look "premium".
- Why it hurts: Large italic text in a thin display face is slower to read and breaks badly on narrow screens. As a copied trend, it no longer signals care.
- Do instead: Use a serif only if the brand is editorial and the style fits the content. Keep headlines upright, with enough weight, and test them at the smallest viewport.
- Sources: [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [Impeccable PR 129](https://github.com/pbakaus/impeccable/pull/129), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

---

## Color and effects

### Indigo and purple gradient default (`indigo-purple-gradient`)
- Looks like: A purple-to-blue (or purple-to-cyan) gradient behind the hero, on buttons, or as a glow behind cards. Accent colors sit near the framework's default indigo.
- Why it hurts: Visitors see this look on many sites, and some read it as "generated, unfinished". The color then says nothing about the brand. Gradient backgrounds under text also make a contrast check harder.
- Do instead: Derive the palette from the brand and the product. Use one accent with a defined job (for example primary action). Check contrast for every text and background pair.
- Sources: [Superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [Designpixil](https://designpixil.com/blog/ai-slop-design), [SmoothUI](https://smoothui.dev/blog/ai-design-slop), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [PRG: purple gradient explanation](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [Hacker News thread](https://news.ycombinator.com/item?id=45622944)

### Glass panels and neon glow (`glass-and-neon-glow`)
- Looks like: Frosted, semi-transparent panels with blur, glowing borders and colored shadows. Often placed over a gradient or an image.
- Why it hurts: Text on a changing blurred background has uneven contrast and often fails the WCAG minimum. The effect adds visual noise and costs graphics performance on weak devices.
- Do instead: Use solid or near-solid surfaces for text. Keep any blur for a small, purposeful layer (for example a sticky bar) and check contrast on the worst background.
- Sources: [Axess Lab](https://axesslab.com/?p=5111), [SmoothUI](https://smoothui.dev/blog/ai-design-slop), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Alex Lavaee](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/)

### Same radius and shadow on everything (`uniform-radius-shadow`)
- Looks like: Every surface has the same large corner radius and the same soft shadow: cards, buttons, inputs, images, chips.
- Why it hurts: Without differences, the interface has no depth cues. Users cannot tell a clickable item from a plain container, or an important item from a minor one.
- Do instead: Set a small radius scale and use it with intent. Use elevation only for layers that sit above others (menus, dialogs). Give interactive items a clear affordance.
- Sources: [Designpixil](https://designpixil.com/blog/ai-slop-design), [SuperDesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same), [The Crit](https://thecrit.co/resources/vibe-coding-design-guide), [Hacker News thread](https://news.ycombinator.com/item?id=45622944)

### Dark mode with neon accents as a default (`dark-neon-default`)
- Looks like: A near-black page with bright acid accents and glowing lines, chosen for the mood and not for the content or the context of use.
- Why it hurts: High-contrast neon on black can cause glare and eye strain in long sessions. The mood can also hide a weak structure, so the page looks strong but explains little.
- Do instead: Choose the theme from the use case (time of day, long reading, data work). Offer both themes if the audience needs it. Use accent colors in small amounts with checked contrast.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [SmoothUI](https://smoothui.dev/blog/ai-design-slop)

### Reveal-on-scroll animation on every section (`scroll-reveal-everything`)
- Looks like: Every section fades and slides in when it enters the view, and every card has a hover effect.
- Why it hurts: Content stays invisible until the script runs. Users with slow devices, print, screenshots or reduced-motion settings can see blank areas. Constant motion also slows scanning.
- Do instead: Render content visible by default. Use motion only to explain a change of state. Respect `prefers-reduced-motion`.
- Sources: [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

### Looping decorative motion (`looping-decoration-animation`)
- Looks like: Pulsing badges, blinking dots, moving gradients, scanning lines and bounce or elastic easing on static content.
- Why it hurts: Motion that never ends distracts from the task and can disturb users with vestibular or attention problems. It also makes a serious product look less serious.
- Do instead: Animate only on a user action or a real status change. Stop or remove any loop that lasts more than a few seconds, and honor `prefers-reduced-motion`.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [SmoothUI](https://smoothui.dev/blog/ai-design-slop), [Impeccable README](https://github.com/pbakaus/impeccable), [Alex Lavaee](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/)

---

## Components

### Pill badges on everything (`pill-badge-spam`)
- Looks like: Rounded chips such as "New", "Beta", "AI-powered" or an announcement pill above the hero, scattered over many sections.
- Why it hurts: When many items are marked as special, no item is. Visitors learn to ignore the chips, so a real status such as "Beta" is also missed.
- Do instead: Use a badge only for a real, current state that the user must know. Keep it to one place and keep it truthful.
- Sources: [Tundra AI Labs](https://tundraailabs.com/ui-guide), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Designpixil](https://designpixil.com/blog/ai-slop-design), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same), [Hacker News thread](https://news.ycombinator.com/item?id=45622944)

### Emoji as icons (`emoji-as-icons`)
- Looks like: Emoji characters used as navigation icons, feature icons or bullets.
- Why it hurts: Emoji look different on each platform, so the design is inconsistent. Screen readers read the emoji name aloud, which clutters the output. The meaning is often unclear.
- Do instead: Use one consistent icon set with an accessible name, or use text labels. Hide purely decorative icons from assistive technology.
- Sources: [Tundra AI Labs](https://tundraailabs.com/ui-guide), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)

### Sparkle icon for AI features (`sparkle-ai-icon`)
- Looks like: A sparkle or star glyph on every button or menu item that uses AI, placed next to ordinary actions.
- Why it hurts: In user tests, people did not read the sparkle as "AI". They could not predict what the button does. The same icon in many places means nothing.
- Do instead: Use an icon or a text label that names the action ("Summarize", "Rewrite"). If you must mark AI, add the word and explain what the feature does and what data it uses.
- Sources: [Nielsen Norman Group](https://www.nngroup.com/articles/ai-sparkles-icon-problem/), [CSS-Tricks](https://css-tricks.com/the-proliferation-and-problem-of-the-sparkles-icon/), [Geoff Graham](https://geoffgraham.me/struggling-with-ai-iconography-for-ui-design/)

### Invented social proof (`fake-social-proof`)
- Looks like: Three five-star quotes with a first name or initials only, stock-like names, invented numbers ("Loved by 240,000+ users"), and mock dashboards with figures that do not add up.
- Why it hurts: Visitors check these claims, and invented ones cost trust fast. They can also break consumer-protection rules about fake reviews and misleading claims.
- Do instead: Use real quotes with a name, role and permission, or leave the section out. State only numbers you can source. Mark placeholder content clearly before launch.
- Sources: [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Designpixil](https://designpixil.com/blog/ai-slop-design)

### Placeholder "trusted by" logo strip (`trusted-by-logo-strip`)
- Looks like: A row of small gray logos or fake brand names under the hero, with a line such as "Trusted by leading teams".
- Why it hurts: Logos that are unreadable, invented or unapproved give no proof. A false claim damages trust and can create legal risk.
- Do instead: Show real customers with their permission, or one concrete case study with a result. If you have none yet, leave the strip out.
- Sources: [Designpixil](https://designpixil.com/blog/ai-slop-design), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide)

### Generated or placeholder imagery (`placeholder-imagery`)
- Looks like: Glossy, plastic-looking illustrations, garbled text inside images, mismatched illustration styles, gradient blobs in place of photos, and alt text such as "hero image".
- Why it hurts: Garbled text and odd shapes look careless and reduce credibility. Missing or generic alt text leaves screen reader users without the meaning. Images that carry no information cost load time.
- Do instead: Use real photos, real product screens or one consistent illustration style. Write alt text that says what the image shows, or mark a decorative image as decorative.
- Sources: [Tundra AI Labs](https://tundraailabs.com/ui-guide), [TeneX Studio](https://tenex.studio/en/blog/ai-slop-ui-8-signes/), [Designpixil](https://designpixil.com/blog/ai-slop-design)

### Missing focus, error and empty states (`missing-states-and-focus`)
- Looks like: Polished default screens, but no visible keyboard focus, weak text contrast, and no designed empty, loading or error states.
- Why it hurts: Keyboard users lose their place. Users who meet an error or an empty list get no guidance on what to do. This blocks tasks, not only looks.
- Do instead: Design and test the focus ring, the empty, loading, error and success states for each key screen. Check contrast against the target level in the project UX file.
- Sources: [SmoothUI](https://smoothui.dev/blog/ai-design-slop)

### Builder leftovers in production (`builder-leftovers`)
- Looks like: A default favicon, builder badges or names in meta tags, a temporary host domain, and legal pages with unfilled placeholders such as "[Company Name]".
- Why it hurts: Visitors read these as an unfinished product. Missing or empty privacy and terms pages also create legal and trust risk, mostly where users enter personal data.
- Do instead: Before launch, set the product favicon, share image, title and domain, remove builder markers, and fill the legal pages with real text reviewed by a person.
- Sources: [Tundra AI Labs](https://tundraailabs.com/ui-guide)

---

## Copy

### Stock marketing vocabulary (`stock-saas-vocabulary`)
- Looks like: Words used without a specific meaning: "unlock", "seamless", "effortless", "elevate", "empower", "transform", "powerful", "friction".
- Why it hurts: These words tell the reader nothing they can check. Readers skip them, so real benefits in the same sentence are skipped too.
- Do instead: Name the real action and result with a number or an example. For instance, "Export your invoices to CSV in one click".
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)

### Confident but vague claims (`vague-claims`)
- Looks like: Short, rhythmic lines that fit any product: triads such as "Fast. Simple. Powerful.", slogans such as "Built differently", and rhetorical questions in the hero.
- Why it hurts: The page says nothing the visitor can use to decide. It sounds sure but gives no proof, so it can lower trust.
- Do instead: Write what the product does, for whom, and what changes for them. Test each line: if a competitor could use the same sentence, rewrite it.
- Sources: [Designpixil](https://designpixil.com/blog/ai-slop-design), [925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide), [Hacker News thread](https://news.ycombinator.com/item?id=45622944)

### Formulaic section headings (`formulaic-section-headings`)
- Looks like: Headings built from a fixed template: "Everything you need to…", "Built for you", "Designed for teams".
- Why it hurts: Headings are what people scan. A heading that names no topic makes the page harder to navigate and for screen reader users to jump through.
- Do instead: Write each heading so it states the topic or the answer in the section. A reader should understand the page from the headings alone.
- Sources: [VibeMole](https://vibemole.com/resources/avoid-vibecoded-app-design), [Tundra AI Labs](https://tundraailabs.com/ui-guide)

---

## Sources

All sources were consulted on 2026-10-08. The list holds opinions and observations from practitioners. It is not proof of user harm in every context, so audits must confirm the harm in the product (`observed`) or cite the source (`web_sourced`).

1. [925 Studios, AI slop fonts and gradients](https://www.925studios.co/blog/ai-slop-design-tells) - 2026-10-08
2. [SmoothUI, AI design slop](https://smoothui.dev/blog/ai-design-slop) - 2026-10-08
3. [Designpixil, AI slop design](https://designpixil.com/blog/ai-slop-design) - 2026-10-08
4. [Hacker News, vibe-coded websites thread](https://news.ycombinator.com/item?id=45622944) - 2026-10-08
5. [Impeccable README (anti-patterns)](https://github.com/pbakaus/impeccable) - 2026-10-08
6. [Impeccable detector docs](https://impeccable.style/docs/detector) - 2026-10-08
7. [Impeccable PR 129, eyebrow chip and italic serif rules](https://github.com/pbakaus/impeccable/pull/129) - 2026-10-08
8. [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) - 2026-10-08
9. [TeneX Studio, 8 signs of AI slop](https://tenex.studio/en/blog/ai-slop-ui-8-signes/) - 2026-10-08
10. [VibeMole, avoid vibe-coded app design](https://vibemole.com/resources/avoid-vibecoded-app-design) - 2026-10-08
11. [Tundra AI Labs, UI guide](https://tundraailabs.com/ui-guide) - 2026-10-08
12. [SuperDesign, why AI design looks generic](https://superdesign.dev/blog/why-ai-design-looks-generic) - 2026-10-08
13. [CodeMySpec, why vibe-coded websites look the same](https://codemyspec.com/blog/vibe-coded-websites-look-the-same) - 2026-10-08
14. [The Crit, vibe coding design guide](https://thecrit.co/resources/vibe-coding-design-guide) - 2026-10-08
15. [Alex Lavaee, why my AI-generated UI looked generic](https://alexlavaee.me/blog/lessons-learned-designing-with-ai/) - 2026-10-08
16. [PRG, why AI builds the same purple gradient website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website) - 2026-10-08
17. [Axess Lab, glassmorphism and accessibility](https://axesslab.com/?p=5111) - 2026-10-08
18. [Nielsen Norman Group, the sparkles icon problem](https://www.nngroup.com/articles/ai-sparkles-icon-problem/) - 2026-10-08
19. [CSS-Tricks, the sparkles icon](https://css-tricks.com/the-proliferation-and-problem-of-the-sparkles-icon/) - 2026-10-08
20. [Geoff Graham, AI iconography for UI](https://geoffgraham.me/struggling-with-ai-iconography-for-ui-design/) - 2026-10-08

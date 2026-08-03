# Groundwork — The Waterworks

**Status:** design agreed, not built. Name provisional. §10 drawn 2026-08-03; §9.1 still gates all build work.
**Date:** 2026-08-03
**Relationship to the Foundry:** second visualization of identical content. Not a replacement.

---

## 1. What this is

A second explainer of conversion tracking for OpGo new hires, teaching the same concepts as the Conversion Foundry through an entirely different physical model: **a hand-built water system on a hillside you were handed.**

The Foundry is an object you orbit. The Waterworks is a system you **operate**. It is always running.

Where the Foundry explains *what the components are*, the Waterworks explains *what the work is like* — the judgment, the constraints, the irreversibility, and the fact that the client only ever sees the last three feet of it.

### The audience insight this is built around

An intern observed that the surprising thing about analytics is how much **human judgment** it contains: what to track, what counts as a lead, what a lead even *is*. The ideal ("a qualified potential customer") and the implementation ("a pageview on `/thank-you`") are close but not the same, and nobody says so out loud. Every design decision below serves making that visible.

---

## 2. Why this metaphor

Four were developed and three rejected. The rejections are load-bearing — do not revisit them without reading this.

| Model | Rejected because |
| --- | --- |
| Exploded architectural section | A diagram curated to fit the lesson, not a real process. Cold, technical, over-designed. |
| Quarry / mine | Good on judgment (*cut-off grade* is the perfect term for the lead-definition decision) but extractive, static, and a mine is dark when the brief called for light and earthy. |
| Tapestry loom | Excellent on setup-is-the-work and on history-carries-scars, but **cloth is dead once woven** — no way to model changing a rule and having new data behave differently. Also opaque: if the client doesn't know looms, neither will an intern. |
| **Waterworks** | **Selected.** |

### Why water wins

**The vocabulary already exists.** "Upstream system," "downstream consumer," "going upstream to find the problem." Data engineers already speak this. The model is native, not imposed — which is why it needs no teaching.

**It's alive.** Always flowing. This is what the loom could not do.

**It has the right relationship to time.** Water that already ran is gone and cannot be re-routed. Change a gate and everything *after* obeys the new rule; everything before does not, and never will. That is exactly the semantics of changing a tracking rule.

**History still persists** — in the silt. Sediment settles in layers, and each layer was laid down under whatever gate positions were live at the time. The loom's best insight survives intact.

**Rain is honest chaos.** Uniform, abundant, everywhere, unusable. It doesn't need to be stylized into "static" or "soil" — it's already the thing.

---

## 3. The topology

Upstream to downstream:

| # | Feature | Concept |
| --- | --- | --- |
| 1 | **Rainfall** | Everything that happens. Impressions, scrolls, visits, calls, walk-ins. Abundant and unusable. |
| 2 | **The catchment** | The client's property — the site, the phone lines, the locations. Rain outside it is simply gone. |
| 3 | **Feeder rills** | Individual interactions. Raw, muddy, unnamed, nothing sorted. |
| 4 | **The intake weir** | Capture. What you collect *at all*. First thing built, hardest to move later. |
| 5 | **The gates** | Consent, filtering, naming, conditions. Where judgment lives. |
| 6 | **The division weir** | The routing to destinations. A level stone lip the stream runs over across its whole width, feeding every destination channel at once. It sorts; it does not share. See §10.1. |
| 7 | **Platform pools** | Side by side at the same *elevation* — peers, no hierarchy. Water levels differ. Different chemistry each. |
| 8 | **Draw-off channels** | What you pull from each pool toward the report. |
| 9 | **The pool** | The deliverable. Fitted out per client. The only part they ever see. |

Off-system features:

- **The client's gate** — offline/CRM sources on land you do not control.
- **Percolation** — loss before capture. Soaks away.
- **Leaks** — loss *between* stages, mid-channel.
- **Side channels** — retroactive draws from a platform pool (§5.4).
- **Silt** — the immutable record, in every pond.

### Station mapping

Content is shared with the Foundry (`stations.ts`, `routes.ts`). The same twelve concepts render as:

| Foundry station | Waterworks feature |
| --- | --- |
| Website | The catchment |
| GTM | The headworks — intake weir + gates + division weir together |
| Consent Mode | A specific gate immediately below the intake |
| GA4 | Platform pool. Clear, deep, longest retention. |
| Google Ads | Platform pool. **Pre-dyed** — it holds the click IDs it issued. |
| Meta Pixel | Platform pool that **also catches rain directly** (view-through). |
| Meta CAPI | A **second, buried inlet** to the same Meta pool. Same water arriving by two routes — mark it (`event_id`) or count it twice. Deduplication becomes physical. |
| Server-side GTM | An alternative headworks. Built, plumbed, and dry. |
| Zapier | The channel carrying water from the client's gate. |
| File Upload | Buckets, carried by hand, in irregular loads. |
| CRM | The source on the client's land. |
| Attribution | How the final pool assigns credit among its inflows; the gauges on the draw-offs. |

---

## 4. `ClientSite` — the brief as data

The learner **picks a client**, and the ground, available materials, forced compromises and correct pool all change. This is not content you read; it is input that reshapes the system.

```ts
type ClientSite = {
  id: string
  name: string
  sector: string
  goal: string                        // what they actually want
  conversions: Conversion[]           // phone | form | walk-in | online-sale | booking (+ weight)
  discovery: Channel[]                // search | maps | social | referral
  ground: 'wordpress-full' | 'wix-locked' | 'shopify' | 'custom'
  restrictions: Restriction[]         // regulated | no-PII | no-remarketing
  offlineShare: number                // 0–1, how much success is invisible online
  monthlyVolume: number               // drives the drought/flood behaviour
  literacy: 'one-question' | 'instrument-wall'
}
```

Everything downstream derives from this: which channels can be cut, which gates are available, which compromises are **forced** rather than chosen, how much rain falls, and what a correct final pool looks like.

### Scenarios

| Client | Ground | The hard part |
| --- | --- | --- |
| **Dentist** *(onramp — prebuilt reference)* | WordPress, local search | Offline tail is immediate and local: a phone call. Proxy at the moment of intent. |
| **Ecommerce** | Clean, purchase events, real values | Not easy: consent gaps, Pixel/CAPI dedup, refunds rewriting values after the fact. |
| **B2B manufacturing** *(most representative)* | Good online data, RFQ forms | Offline tail is a six-month CRM cycle **you don't own**. Your channels are correct and the pool is still low. |
| **Clinic** | Protected — cannot draw from this catchment | Low volume, and the platform starts modeling on your behalf. |
| **Franchise** *(data only — never playable)* | Forty locations, one untagged site | Exists solely as the right-hand half of the scenario pair. See §10.2. |

### The scenario pair

Two scenarios exist specifically to be seen side by side, because together they teach something neither teaches alone:

**Low volume, high architecture.** Immaculate waterworks. Every channel cut true, every gate correct, dye traces clean. And a trickle. Ponds barely wet, the gauge sits in the noise, week-over-week is meaningless. *Architecture does not create water.*

**High volume, low architecture.** A flood down a bare hillside. Enormous flow, almost no channels, water cutting its own gullies and going wherever the ground falls. Most of it lost. Impressive from a distance, which is the trap.

Realized as a non-interactive overlook set-piece — §10.2.

---

## 5. Mechanics

### 5.1 Gates — the unit of decision

A gate is a sluice you throw. Throwing it changes flow **from that moment forward**. Water already downstream is unaffected and unreachable.

Three kinds, and the distinction matters more than any other single idea here:

- **Chosen** — you decided. *`form_submit` counts as a lead.*
- **Forced** — the ground decided. *No dataLayer access, so we read the DOM.*
- **Inherited** — the platform decided, silently, and nobody was told. *Modeled conversions. Thresholded rows. A credit formula you cannot inspect.*

Inherited is the frightening category: no decision to find, no annotation anyone wrote, and the number still isn't what it says it is. Low `monthlyVolume` produces more of them.

### 5.2 Silt — the immutable record

Every pond accumulates layered sediment. Each layer's composition reflects the gate positions in force when it settled. Change the definition in March and the silt above the March line is a different color.

The lesson: your historical data carries the scars of your implementation history permanently, and numbers from before a definition change do not mean what numbers after it mean.

### 5.3 Platform chemistry

Each platform pool reads differently from identical input. This is the number-one new-hire confusion ("why does Google Ads say 40 and GA4 say 31?") and the model should answer it **visually, without prose**:

- Meta's pool catches rain directly — credit for water that never came down a channel.
- Google's pool is pre-dyed — it can match on click IDs your channel never carried.
- Each pool has its own **retention depth**, marked on the pool wall.

Crucially the pools receive *identical* input — the division weir feeds every channel the same water (§10.1). Differences in what each pool reports never come from unequal shares. Full pool signatures in §10.1.

### 5.4 Side channels — retroactive recategorization

Sometimes you never built a gate for something, but the platform has been collecting all along. You lower a new intake into the platform pool and draw from it directly, bypassing every gate you never cut.

**This must have a visible limit.** Each pool carries a **retention line**. You can draw anything above it. Everything below has been let go and no side channel reaches it. The depth differs per pool, and the asymmetry is the lesson — some things you can rebuild later and some you cannot, and knowing which is the skill.

Do not let this read as "mistakes are always fixable."

**Pools are through-flow, not accumulators.** Water arrives at the top and the oldest water leaves continuously out of the bottom. A pool's level is therefore volume *within the window*, not a lifetime total, and the retention line is the lowest point a new intake can be lowered to — below it the water is already gone. Silt still settles on the floor and stays. The water passes through; the record does not.

### 5.5 Leaks

A crack in a channel; water into the ground mid-run. Found by comparing the gauge above against the gauge below. Same procedure in both worlds, which is the point.

### 5.6 Dye tracing — the interactive centerpiece

Most of the network is culverted. You cannot see inside GTM. You cannot see inside a platform. So you drop dye at the source and watch the checkpoints that are **open to the sky**.

A dye run distinguishes three different bugs that otherwise look identical:

1. **Did it appear at all?** Absent at checkpoint 3, present at 2 → the fault is between them.
2. **Did it arrive in the right order?** Out-of-sequence arrival is a different failure from non-arrival.
3. **Did it land in the right pool, named correctly?** Arriving and being miscategorized is a third.

This is the single highest-value interaction in the piece and should be built first among the mechanics.

### 5.7 The oscillation

Walk **upstream** to find the fault. Walk **down** to see if it cleared. You cannot evaluate a change from the gate where you made it — the only place a gate change is legible is the pool, and forcing the walk is the point. It is the felt experience of the job and the reason tracking work is slow.

---

## 6. Modes

**A · Walk it** *(onramp)* — the dentist site is complete and correct. Explore, open gates, read why each call was made, run dye, oscillate. Learn the vocabulary.

**B · Build it** *(the spine)* — bare hillside and a brief. Cut channels, set gates, choose what counts. Nothing grades you. You walk down to the pool and find out whether the client's question has an answer in it. Track form fills for a dentist whose business is phone calls and the pool is beautiful and empty.

**C · Fix it** — arrive at a system that's already wrong. Something reads oddly at the pool; go upstream. Emerges naturally from returning to your own build.

Sequence: watch one, then do one.

---

## 7. Visual direction

**Register: earthy, light, daylit, hand-built.** Explicitly *not* the Foundry's dark industrial palette. The two should be unmistakably different objects teaching identical content.

- **Palette:** warm limewash / paper ground. Ochre and silt soil. Weathered timber grey. Moss and gorse green at the edges. Water graded from muddy ochre at the rills through olive to blue-grey and finally near-clear at the pool.
- **The only "chart" is the water's clarity.** Color change with descent carries the entire progressive-refinement idea. Resist adding legends for it.
- **Materials:** wet stone, silt, moss, timber sluice boards gone grey, hand-cut channels. Irregular edges everywhere — nothing should be CAD-straight.
- **Light:** open sky, low warm sun, dust in the air, still water reflecting.

### Anti-patterns

- Glowing emissive lines, neon on dark. That's the Foundry.
- Perfect geometry. Channels meander; ponds are irregular.
- Rendering rain as abstract "static" or "noise." It's rain.
- Labeling everything. The color grade and the pond shapes should carry the meaning; text is for the info panel.
- Any implication that data mistakes are recoverable without limit (see §5.4).

---

## 8. Repo structure

**One repo, one Vite app, two views** — not a second project, not a tab.

The two versions share their **content**. `stations.ts` and `routes.ts` describe the concepts, not the Foundry. Duplicating them means they drift, and then the two explainers contradict each other in front of a new hire.

```
src/
  content/      stations, routes, tour copy      (moved out of data/, shared)
  shared/       tokens, Effects, Tooltip, InfoPanel, Loader
  foundry/      current scene/ + its ui/
  waterworks/   new
  App.tsx       reads location.hash, mounts one
```

Entered by hash route (`#/foundry`, `#/waterworks`) with a small switch affordance in a corner. A tab implies they're panes of one thing; they're two experiences.

`base: '/conversion-foundry/'` and the repo name stay as-is for now. Rename if the Waterworks becomes primary.

---

## 9. Open — resolve before building

1. **Rendering approach.** Genuinely undecided and it should be settled first. Ortho-locked R3F with shader water, versus 2D canvas with flow fields. Water is expensive in 3D and the piece is stylized enough that 2D may be both cheaper and better-looking. This decision gates everything else.
2. **Pond labeling.** Do the ponds carry concept names (consent, naming, matching) or stay physical and let the info panel name them? Leaning physical.
3. **Traversal.** Survey view versus working view, and how you move between them. *Partly resolved:* §10.2 establishes the survey view as an overlook you descend from. How you move *within* the working view is still open.
4. **Rain at low volume.** Drought must visibly change the picture, not just a number.
5. **How much the learner builds vs. inherits** in mode B. All-bare-hillside may be too much blank page.
6. **Scenario access** — freely selectable, or sequenced?

## 10. The remaining design pieces

Drawn 2026-08-03. None of the four forks on §9.1 — the 2D/3D decision changes fidelity, not meaning.

### 10.1 Platform pools and the division weir

**The weir sorts; it does not share.** The headworks' last stone is a long, level lip the stream runs over across its whole width. Below it, one channel per destination, and each channel mouth carries a **grate** — bars you set, deciding what that destination receives. `form_submit` passes every grate; `scroll_depth` passes only GA4's.

The same water visibly runs down all three channels at once. This is the one impossible object in an otherwise physical world, and it is deliberate: a learner who notices *"that's the same water three times"* has understood the lesson. A proportional split would teach the opposite — that Ads reports more because it got more — and would fight §5.3 for the rest of the piece.

A grate is a gate whose decision is *destination* rather than *admission*, so §5.1's taxonomy applies unchanged: chosen (you sent it), forced (the platform won't accept that event type), inherited (it routes something you never asked it to).

**Three pools, not four** — Pixel and CAPI are two inlets to one Meta pool. Side by side, no hierarchy. Each carries four marks: water level, staff gauge, retention line, silt.

**Level is what arrived and stayed. The gauge is what the platform reports. The gap between them is the most valuable object in the piece** — a post reading 40 standing in a pool that plainly does not hold 40.

| Pool | Signature | The confusion it answers |
| --- | --- | --- |
| **GA4** | Clear, deep, retention line lowest on the wall. One inlet. Gauge sits close to the water. | The honest baseline. Without one pool that mostly tells the truth, nothing else reads as strange. |
| **Google Ads** | Pre-dyed — already holds color it issued itself. Credits water carrying matching dye, and some that arrives clean. Retention line high. **Gauge reads above the water at low volume.** | Modeled conversions. §5.1's inherited gate, made physical. |
| **Meta** | Surface inlet (Pixel) plus a second **buried** inlet below the waterline (CAPI), and it catches rain directly on its own surface. Unmarked, both inlets deliver the same water and **the gauge reads near double**. Set `event_id` and it settles. | Deduplication, and view-through credit for water that never came down a channel. |

Standing at the pools: three gauges reading three different numbers, over three pools visibly holding different amounts, all fed from one lip. The 40-vs-31 question is answered before anyone reads a word.

**Legibility risk to watch.** Four marks on one pool wall is the most likely thing to go muddy. They survive only by differing in kind — a surface, a standing post, a stain on stone, a floor deposit. If any two start reading as the same kind of mark, cut one.

### 10.2 The scenario pair

A non-interactive overlook set-piece, reachable at any time. Two hillsides side by side seen from distance, both rendered from real `ClientSite` data at low fidelity — no bespoke assets.

**Left — the clinic.** Immaculate. Every channel cut true, every gate correct, dye traces clean. And a trickle. Ponds barely wet, the gauge needle sitting inside its noise band. *Architecture does not create water.*

**Right — the franchise.** Forty locations, enormous rainfall, one untagged site. Water cuts its own gullies down bare ground and most of it goes in. Its final pool is *small* — but its gauge reads **high**, because at that volume the platforms model confidently over the gaps. Volume without architecture doesn't merely lose data; it produces a confident wrong number.

§4 calls the flood "impressive from a distance," and the overlook *is* the distance — the framing enacts the trap, so it needs almost no copy. One hand-lettered plaque per side. Descend from here into whichever system you're working.

### 10.3 Pool fit-out by `literacy`

`literacy` sets **demand** — how many questions the client brings to the water's edge. What you cut upstream sets **supply**. The fit-out is where they meet.

The furniture itself is given, not chosen: `one-question` gets a single stone step and one gauge; `instrument-wall` gets a bank of gauges, taps and sample bottles along the rim. What each instrument can *read* depends entirely on what you built. **A gauge with nothing plumbed to it sits at rest. A tap with no channel behind it runs dry when opened.** Nothing scores you — you walk down and count how many of the client's questions have an answer behind them.

Every gauge carries a marked **noise band** on the dial. Below it, readings are not meaningful. This is the same object the scenario pair uses, and it is how low volume becomes visible at the deliverable.

Three pictures:

- **Instrument wall over a trickle** — twelve gauges, all alive, every needle inside the noise band. Rigor theater.
- **One step over a rich system** — the fit-out does not hide the draw-off channels, so nine channels arrive and one gauge reads. What you threw away is visible upstream of the furniture.
- **One question, wrong thing built** — the single gauge is dead. Needle at rest. This is §6's beautiful empty pool and the best moment in mode B.

### 10.4 The dye run, as a sequence

1. **Charge** — pick a dye and a source interaction on the catchment. Two dyes are available so arrival order is testable.
2. **Drop** — it enters and runs the culverted network.
3. **Catch** — you see it live *only* at the checkpoint you are standing at. Five checkpoint types, placed unevenly and not all present in every scenario: below the intake weir, between two gates, at the division lip, at a channel mouth, at a pool inlet. Deliberately not everywhere — the culverting is the point.
4. **Read the stains** — every checkpoint it passed is marked: present or absent, strong or faint, what color, and in what layer order. Layered marks rhyme with §5.2's silt rather than inventing a second vocabulary.
5. **Fade** — stains expire. Evidence has a shelf life; want it again, run it again.

The three diagnoses of §5.6, each a distinct physical reading:

- **Absent at 3, present at 2** → walk that reach. A leak, a closed gate, or a grate.
- **Blue over red when red went first** → arrived out of order. A different fault entirely from not arriving.
- **Stained the wrong channel, or the right pool in the wrong color** → arrived and was miscategorized.

§5.7 still holds: you cannot read the outcome at the gate you changed. Stains make that walk bearable rather than tedious, without collapsing it into a table.

## 11. Build order

Nothing starts until §9.1 is answered.

1. Static hillside for one scenario at the agreed fidelity. No interaction. Look at it.
2. Flowing water — rills, channels, ponds, the color grade.
3. Gates: throw one, watch downstream change and upstream history persist.
4. Dye tracing, all three failure modes.
5. `ClientSite` driving the terrain; second and third scenarios.
6. Modes A and B; the pool fit-out.
7. Leaks, side channels, retention lines, silt.
8. Shared-content refactor and route switch.

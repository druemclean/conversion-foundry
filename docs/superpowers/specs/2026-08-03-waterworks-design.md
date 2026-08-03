# Groundwork — The Waterworks

**Status:** design agreed, not built. Name provisional.
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
| 6 | **The division weir** | The split to destinations. (A *partidor* — the real acequia stone that parts one stream into fixed shares.) |
| 7 | **Platform pools** | Side by side, same level. Different chemistry each. |
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

### The scenario pair

Two scenarios exist specifically to be seen side by side, because together they teach something neither teaches alone:

**Low volume, high architecture.** Immaculate waterworks. Every channel cut true, every gate correct, dye traces clean. And a trickle. Ponds barely wet, the gauge sits in the noise, week-over-week is meaningless. *Architecture does not create water.*

**High volume, low architecture.** A flood down a bare hillside. Enormous flow, almost no channels, water cutting its own gullies and going wherever the ground falls. Most of it lost. Impressive from a distance, which is the trap.

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

### 5.4 Side channels — retroactive recategorization

Sometimes you never built a gate for something, but the platform has been collecting all along. You lower a new intake into the platform pool and draw from it directly, bypassing every gate you never cut.

**This must have a visible limit.** Each pool carries a **retention line**. You can draw anything above it. Everything below has been let go and no side channel reaches it. The depth differs per pool, and the asymmetry is the lesson — some things you can rebuild later and some you cannot, and knowing which is the skill.

Do not let this read as "mistakes are always fixable."

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
3. **Traversal.** Survey view versus working view, and how you move between them.
4. **Rain at low volume.** Drought must visibly change the picture, not just a number.
5. **How much the learner builds vs. inherits** in mode B. All-bare-hillside may be too much blank page.
6. **Scenario access** — freely selectable, or sequenced?

## 10. Remaining design pieces

Not yet drawn, in priority order:

1. Platform pools and the division weir
2. The scenario pair (low-volume/high-architecture beside high-volume/low-architecture)
3. Pool fit-out variants by `literacy`
4. The dye run, as a sequence

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

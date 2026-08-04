# Addendum: Waterworks Sandbox — Data-Model Corrections & Act II (Conversion Loop)

For the session drafting the waterworks build plan. This documents (1) corrections to the
dual-track data model from the Gemini reference file (`dist/waterworks_simulation.tsx`),
and (2) the design for Act II — the Pixel vs. CAPI conversion loop. The Gemini file is a
logic reference only; its visual design is throwaway and its fonts/materials do not meet
project standards.

Audience note: the sandbox is for **anyone** to play with and learn from — new hires and
interns are one audience, not the only one. Design for layered depth: a casual visitor
gets the big picture by watching; a curious one gets the nuance by toggling.

---

## Part 1: Corrections to the Act I data model

The Gemini reference gets the core right: browser-side user traffic (slow, open river,
subject to gates) vs. server-to-server reporting (sealed high-speed pipes), converging on
Looker Studio. Keep that skeleton, and keep its gate ordering (UTM stripping happens
before the consent decision; consent blocking destroys the GA4 record, stripping merely
anonymizes it). Four corrections before it hardens:

### 1.1 Relabel the API pipes: they carry clicks/spend, not generic "API data"

The reference implies platform APIs bypass all gates and deliver ground truth. True for
**clicks and spend** (counted server-side at the ad platform — genuinely consent-proof).
False for **conversions**, which come from the Pixel/CAPI on the client's site and are
subject to the same browser hazards. The dual track is:

- **API pipes**: clicks + spend (platform-reported, robust)
- **River**: sessions + conversions (site-measured, fragile)

Label the pipes accordingly in-scene and in copy. Do not let the sandbox teach
"API numbers are the truth, GA4 is lossy" — that misreads every Meta conversion
discrepancy.

### 1.2 Three degradation states, not two

The reference's binary (colored = attributed, grey = Direct) hides the misattribution
users actually see daily. Use three outcomes for river packets:

| State | Visual | GA4 lands as | Real-world cause |
|---|---|---|---|
| Attributed | Full source color | Correct paid channel | Params/gclid intact |
| Misattributed | Dull/wrong color | `facebook / referral`, organic, etc. | UTMs stripped but referrer intact |
| Direct | Grey | Direct / (none) | Params AND referrer lost (in-app browsers, ITP) |

Stripped Meta traffic usually becomes **referral**, not Direct. True Direct requires
losing the referrer too. The HUD's GA4 card needs a row for each.

### 1.3 Google Ads is resilient to the UTM gate

Google Ads → GA4 attribution rides on auto-tagging (gclid), not manual UTMs. The UTM
gate should strip Meta packets readily, but Ads packets only under an extreme/secondary
condition (gclid loss via redirects or in-app browsers). Ads and Meta packets reacting
identically to the UTM gate teaches the wrong failure mode. Simplest v1: UTM gate has
no effect on Ads packets; tooltip explains why ("auto-tagging survives UTM stripping").

### 1.4 Surface the discrepancy on ONE card

The whole payoff is "Meta API says 100, GA4 says 40." The reference makes the user
compute this across two HUD cards. Instead, the Looker Studio card shows the same
metric from both sources side by side, with the gap decomposed:

```
Meta clicks (API):        100
Meta sessions (GA4):       40
Gap:                       60  → 35 blocked (consent) · 25 misattributed
```

### 1.5 Deferred (post-v1 sub-toggles, note but don't build)

- **Consent Mode modeling**: denied users still send cookieless pings; GA4 models the
  gap. Visual: blocked packets become ghostly translucent and still reach GA4 as
  "modeled." Accurate and a great visual — but a sub-toggle, not v1.
- **Attribution windows / view-through** as additional discrepancy sources: copy
  mention only.

### 1.6 Code-level notes from the reference (avoid inheriting)

- GA4 card progress bars divide by total drops across both sources (bar caps at ~50%).
  Denominator must be per-source drops.
- Gate checks at moment-of-crossing (live toggle affects only packets that haven't
  crossed) is correct behavior — preserve it.
- GA4→Looker feed packets carrying the post-stripping color forward is a nice touch —
  preserve it.
- Reference leaks its resize listener and uses Inter. Don't inherit either.

---

## Part 2: Act II — the conversion loop (Pixel vs. CAPI)

The foundry scene already covers Pixel/CAPI *anatomy* (stations, `attributed_conversion`
/ `matched_conversion` routes, `event_id` in payloads). The waterworks covers
*cause-and-effect*. Act II makes the sandbox a closed loop rather than a one-way flume.

### 2.1 Shape: a literal loop

- **Act I (existing)**: acquisition. Clicks flow *down* — sources → UTM gate → consent
  wall → GA4 pool, API pipes alongside.
- **Act II (new)**: conversion. When a surviving packet converts at the website, it
  fires paired return packets *up* two return paths to a new **Meta Events Manager
  basin** at the source tier. The circuit visibly closes.

Layout reservation for the plan: **one Events Manager basin node near the Meta source,
two return paths (browser + server), and a dedup gate at the basin mouth.**

### 2.2 The paired-packet mechanic

A conversion spawns two return packets sharing a visible tether or matching glyph —
this is the **event_id made physical**:

1. **Pixel packet** (browser return path): translucent magenta; passes back through
   gate territory — consent wall and ad-blocker apply. Fragile.
2. **CAPI packet** (server return path): opaque magenta; sealed pipe, bypasses browser
   gates entirely; passes one gate of its own — a **match-quality filter** (hashed
   email/phone present?). Sturdy.

At the basin mouth, the **dedup gate**:

- **event_id ON**: paired packets snap-merge into one on arrival (satisfying merge
  animation). Count: 1.
- **event_id OFF**: both splash in separately. Count: 2. Conversions visibly inflate;
  HUD flags it.

### 2.3 The three teaching scenarios

| Scenario | What the user sees | Lesson |
|---|---|---|
| Consent blocked, CAPI on | Pixel packet dies at the wall; CAPI twin still arrives | Why CAPI/redundancy exists |
| Both arrive, event_id off | Double splash, inflated count | Why dedup config matters |
| CAPI on, match quality low | CAPI packet arrives but lands grey/unattributed | Server data isn't magic — it needs identifiers |

### 2.4 HUD

New **Events Manager card**: `browser events / server events / deduplicated total`.
Place adjacent to the GA4 card so the Meta-vs-GA4 conversion discrepancy is visible on
one screen with causes decomposed (same principle as 1.4).

### 2.5 Modes (progressive disclosure)

- **Guided mode (default)**: short scripted sequence — drop a click, watch it convert,
  watch the pair return, then the sim prompts the next toggle ("now block consent and
  drop another"). One toggle introduced at a time, one-line takeaway each. Target
  ~90 seconds to the full picture.
- **Sandbox mode**: everything unlocked — spawn keys, all gates live. The reference's
  Q/E/1/2 key scheme is an acceptable skeleton.

### 2.6 Camera

Act II is vertical (return paths go up), so drone/overhead views matter more. In guided
mode, auto-frame the camera to follow the paired packets up the return paths, then hand
control back.

### 2.7 Scope fencing

v1 of Act II is: paired packets, consent-vs-pixel interaction, dedup toggle, Events
Manager card. **Match-quality filter and Consent Mode modeling are sub-toggles for
later** — reserve space in the layout and HUD, don't build them first.

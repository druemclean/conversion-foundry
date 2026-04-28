# Build Plan: Conversion Tracking Foundry

Companion to CLAUDE.md. Source of truth for *what to build*; CLAUDE.md governs *how the project is constrained*.

## Visual direction

Refined editorial-industrial. Reference points: Linear marketing site, Apple Vision Pro page, Stripe docs animations, Teenage Engineering product pages. Watchmaker-meets-software.

### Color palette (CSS vars)

- Background: deep navy gradient `#0d1424` to `#02030a`
- Ink: `#e8ecf3` (raise contrast vs v1, which was too faded)
- Ink dim: `#a8b3c8` (also raised)
- Cyan `#5fd4ff`, amber `#ffb054`, magenta `#d96fff`, green `#6fe39a`

### Materials

PBR via MeshStandardMaterial or MeshPhysicalMaterial with moderate metalness (0.4–0.7) and an HDRI environment map. Use Drei's `<Environment preset="warehouse" />` or `"city"` and tune. Emissive accents are the heroes; bloom them properly via postprocessing.

### Post-processing pipeline

- Bloom: intensity 0.6–0.9, luminance threshold 0.85, mipmap blur on
- SSAO: subtle, just enough to tuck stations into the ground
- Vignette: darkness 0.4, offset 0.3
- ChromaticAberration: very subtle, 0.0008
- Tone mapping: ACES Filmic, exposure ~1.0

## Categorical visual hierarchy

Stations fall into four categories. The geometry vocabulary should make the category obvious at first glance.

**Origins** — where data is born.
Visual language: rounded, generative shapes. Soft glows that feel like data is *emerging* from them. Pulsing emission outward.
Members: Website, CRM/Offline, File Upload (see addendum).

**Connectors** — route, transform, gate data. Pure middleware.
Visual language: clearly mechanical. Gears, valves, switches, ports. Geometry feels like a machine.
Members: Consent Mode, GTM, Server-side GTM, Zapier (see addendum).

**Hybrid platforms** — both destination AND source. They receive conversions but also contribute click IDs, audiences, and matched signals back into the system. This bidirectionality is conceptually critical for beginners and v1 missed it.
Visual language: dual-faced or portal-like. Should visibly have an "intake" side and an "output" side. Two emissive rings (in + out). Capsules should travel BOTH directions on routes connected to these.
Members: Google Ads, Meta Pixel, Meta CAPI.

**Observatories** — read-only consumers of data.
Visual language: vessel-like, lens-like, telescope-like. Things you *look into*. Glass, refraction, transparency.
Members: GA4, Attribution Model.

## Concept weighting

Beginners need to land on three things first: **Website**, **GTM**, and **the ad platforms**. These should be physically larger and visually heavier than the others.

- Website: ~1.4× scale, prominent, clearly the entry point
- GTM: ~1.5× scale, central position, the most elaborate machinery
- Ad platforms (Google Ads, Meta Pixel, Meta CAPI): ~1.2× scale each, arranged so they read as a related cluster
- Everything else: 1.0× baseline

The camera's default framing should naturally lead the eye through Website → GTM → ad platforms before noticing the rest.

## Iconography

v1 stations looked too similar. Each one needs a clearly readable silhouette so a new hire can identify it without reading the label.

- **Website**: a rounded monitor on a stand with a recognizable browser chrome (URL bar, traffic light dots), a faintly emissive cursor blip
- **CRM/Offline**: a rotating index/rolodex card stack OR a vault door, rounded, with subtle ledger lines
- **Consent Mode**: a torii-style gate with a horizontal beam that visibly raises and lowers in time with consent state. Amber. Add a tiny "shield" icon floating above
- **GTM**: a multi-tier hub. Central spinning core, an outer ring of orbiting tag tokens (small cubes labeled with tiny icons), a top antenna. The most visually busy, intentionally
- **Server-side GTM**: clearly a server rack — vertical, ribbed slots, blinking activity LEDs in green, a thin glass front panel
- **Google Ads**: a portal-like dual-ring. Front face is an outbound bullseye (data flowing in), back face shows a "click ID" geometry (data flowing back). Cyan
- **Meta Pixel**: a translucent pixel-grid screen on a slim frame, dual emissive rings around its edge. Magenta
- **Meta CAPI**: a substantial server-port pylon with a primary vertical ring, a secondary horizontal ring, and a glowing core. Should feel related to Meta Pixel (same magenta) but more "backend"
- **GA4**: a glass observatory dome with a faint bar-chart silhouette inside, lit from within. Lens-like, you should feel like you can see data *through* it
- **Attribution Model**: a slowly rotating geodesic crystal at the summit, multiple thin emissive lines converging into it from below. When you click it, the lines visibly carry recent capsules

(See addendum for Zapier and File Upload iconography.)

## Layout

Keep the v1 spatial layout as a starting point but adjust for the new sizes:

- Ground plane (y ≈ 0): Website, Consent, GTM, GA4, Google Ads, Pixel
- Mid level (y ≈ 4): Server-side GTM, CAPI, CRM/Offline
- Summit (y ≈ 8): Attribution

Add a subtle ground plane with a faint grid. Use fog. Keep the stars but make them more refined (varied sizes via shader points).

## Connections

Translucent tubes between stations carry capsules. Capsule color matches the destination platform's accent. For hybrid platforms, capsules travel **both directions** on appropriate routes (Google Ads sends gclid back to Server-side GTM, for instance). This is the bidirectionality made visible.

Capsules should ease along curves, not move linearly. Use a non-linear parameter mapping (smoothstep) so they accelerate out of stations and decelerate into them.

## Interaction model

- OrbitControls with damping. Polar clamp prevents flipping under the scene. Distance clamp.
- Idle: gentle auto-rotate that disengages on user interaction and does not re-engage
- Hover: scale up slightly + emissive boost + raise the station's label to full opacity. Cursor changes to pointer
- Tooltip follows cursor on hover, shows station name + category tag
- Click: camera tweens (framer-motion-3d, eased) to a position offset from the station; info panel slides in from the right
- **Click outside the panel anywhere on the canvas should close it** (v1 required clicking a tiny × button — fix that). Escape also closes. The × button should still exist and be larger
- Side rail (left side, vertical): a guided "Follow an event" mode that walks the camera through the path Website → Consent → GTM → all destinations → Attribution, with the panel updating at each stop. A "Free explore" toggle returns to full orbit

## Typography & HUD

Raise contrast vs v1.

- Title: Instrument Serif, ~44px (was 38)
- Eyebrow: JetBrains Mono, 11px, letterspacing 0.18em
- Subtitle: 14px, color `--ink-dim` (which is now lighter)
- Hint chips: 11px (was 10)
- Panel title: 32px (was 28)
- Panel body: 14px (was 12)
- Panel labels: 10px tracked
- Tooltip: 11px

Glassmorphic panel: keep the backdrop blur but increase opacity floor to 0.78 so text is easier to read against busy 3D content.

## Performance implementation tips

(Targets live in CLAUDE.md. These are how to hit them.)

- Use instancedMesh for stars and for capsules of the same color
- Suspense for the Environment HDRI
- React.memo any station component that doesn't need to re-render every frame
- Disable shadow map on small decorative meshes; only stations and ground need shadows

## Anti-patterns (do not do)

- Default Three.js cubes/spheres without composition
- Inter or Roboto anywhere
- Pure RGB primary colors
- Linear/un-eased transitions
- A single point light as the only fill
- Stations that look mostly like each other
- A camera that can flip upside down
- Bloom intensity over 1.2 (cranks into amateur territory fast)
- Generic AI gradient backdrops (purple-to-pink, etc.)

## Build order

Build in this sequence so we can review at each stage:

1. **Scaffold**: Vite + TS + R3F + Drei + postprocessing + Tailwind + Instrument Serif + JetBrains Mono. Black scene, ground plane, env map, post-processing pipeline, ACES, fog. Just an empty stage that already looks expensive
2. **First station vertical slice**: Build GTM only, with full polish: PBR materials, emissive bloom, idle motion, hover, click, info panel slide-in, click-outside-to-close. Get this one *right*
3. **Category templates**: Build one station per category to validate the visual language: Website (origin), Consent (connector), Google Ads (hybrid, with bidirectional capsules), GA4 (observatory)
4. **Remaining stations**: Fill in CRM, Server-side GTM, Pixel, CAPI, Attribution, plus Zapier and File Upload (see addendum)
5. **Routes & capsules**: All connections per the addendum route table, with bidirectional flow on hybrids, named hero capsules, and proper easing
6. **Guided mode**: Side rail, scripted camera tour
7. **Polish pass**: Loader, intro fly-through, micro-interactions, copy review, mobile responsiveness check
8. **Deploy prep**: Vite `base` config, GitHub Actions workflow

## Copy

Use the `STATIONS` array in `foundry.html` as the source of truth for station names, tags, descriptions, "what flows through," and beginner takeaways. Tighten the prose where you can. Don't introduce new concepts beyond what's in v1 (with addendum exceptions: Zapier, File Upload, the sGTM demotion).

## Deliverable

A working Vite project I can `pnpm dev` locally and `pnpm build` to a static `dist/` for GitHub Pages deployment. Include a README with run instructions and a short description of the architecture.

---

# Addendum: Named capsules and refined topology

These supersede the matching sections above where they conflict.

## Named events in flight

Capsules currently render as unlabeled glowing dots. Upgrade to a "hero capsule" pattern:

- Each route defines an `EVENT_NAMES` array (examples below)
- Most capsules on a route stay unlabeled (visual flow)
- One "hero" capsule per route carries a small JetBrains Mono label that floats just above the capsule, billboarded to camera, that cycles through the route's event names every few seconds
- Hero capsule travels slightly slower than the rest and has a brighter halo
- Label is color-matched to the route, fades in within ~12 units of camera and fades out beyond
- When the user hovers a route's tube (raycast on tubes too), all capsules on that route slow to 30% speed and all gain temporary labels for inspection. Restore on un-hover

This is the single highest-leverage pedagogical addition. A new hire watching `page_view` → `consent_check` → `gtag_event` → `imported_conversion` travel through the system learns the schema by osmosis.

## Topology corrections

The v1 reference had server-side GTM as the central offline router. That's not how OpGo actually operates. Update as follows:

**Promote Zapier to primary offline connector.**
- New station, replaces the central role of sGTM
- Category: Connector (mechanical visual language)
- Iconography: a multi-port switchboard or a stylized lightning bolt threaded through gear teeth. Green accent (matches CRM)
- Position: roughly where sGTM was in v1 (mid-level, behind GTM)
- Scale: 1.1× (it's a primary connector but secondary to GTM)

**Demote sGTM to "alternative architecture."**
- Keep the station, but render it visually muted: lower emissive intensity (0.4× normal), partially transparent shell (opacity 0.6), labeled with a "ALT · NOT IN USE" tag in the panel
- Position it slightly behind Zapier as a ghost/echo
- Routes from sGTM render as dashed translucent tubes, no capsules flowing
- Info panel copy should explain: "An alternative routing layer that lives on your own server instead of Zapier. OpGo doesn't currently use this, but it's the direction the industry is moving"

**Add File Upload as a small offline source.**
- Category: Origin (rounded, generative)
- Iconography: a stylized stack of CSV rows with a small upload arrow. Green accent
- Scale: 0.85× (intentionally smaller, signaling "less used")
- Tag in panel: "MANUAL · OCCASIONAL"
- Position: behind CRM, slightly lower

## Updated route table (replaces v1 routes wholesale)

```
ROUTES = [
  // Browser path (primary, prominent)
  ['website',     'consent',     CYAN,    1.4, ['page_view','session_start','phone_click','form_submit','scroll','video_play','purchase']],
  ['consent',     'gtm',         CYAN,    1.4, ['page_view +consent','form_submit +consent','purchase +consent']],
  ['gtm',         'ga4',         CYAN,    1.0, ['page_view','generate_lead','purchase','user_id','session_id']],
  ['gtm',         'gads',        CYAN,    1.0, ['conversion','enhanced_conversion {em,ph}','gclid_capture']],
  ['gtm',         'pixel',       MAGENTA, 1.0, ['PageView','Lead','Purchase','ViewContent','InitiateCheckout']],

  // GA4 import path (the "GA4 events become Ads conversions" route)
  ['ga4',         'gads',        CYAN,    0.5, ['imported_conversion','audience_signal'], { style: 'import' }],

  // Offline path (Zapier primary)
  ['crm',         'zapier',      GREEN,   0.9, ['lead_created','lead_qualified','opportunity_won','refund_issued']],
  ['zapier',      'gads',        CYAN,    0.7, ['offline_conversion {gclid,value}']],
  ['zapier',      'capi',        MAGENTA, 0.7, ['Lead {em,ph,event_id}','Purchase {em,ph,event_id}']],

  // Offline path (file upload, dimmer)
  ['fileupload',  'gads',        CYAN,    0.4, ['offline_conversion_bulk'], { style: 'manual' }],
  ['fileupload',  'capi',        MAGENTA, 0.4, ['bulk_event_upload'], { style: 'manual' }],

  // Alternative path (sGTM, dashed/ghosted, no capsules)
  ['gtm',         'sgtm',        WHITE,   0,   [], { style: 'alternative' }],
  ['sgtm',        'capi',        WHITE,   0,   [], { style: 'alternative' }],
  ['sgtm',        'gads',        WHITE,   0,   [], { style: 'alternative' }],

  // Convergence to attribution
  ['ga4',         'attribution', CYAN,    0.5, ['session_data']],
  ['gads',        'attribution', CYAN,    0.5, ['conversion_value','attribution_credit']],
  ['pixel',       'attribution', MAGENTA, 0.5, ['attributed_conversion']],
  ['capi',        'attribution', MAGENTA, 0.5, ['matched_conversion']],
];
```

## Route style variants

- `default`: solid translucent tube, capsules flowing one direction
- `import` (GA4 → Google Ads): solid tube but capsules carry a small "↻" glyph badge to signal "imported, not direct"
- `manual` (file upload routes): tube renders as widely-spaced dashes; capsules appear in bursts (a clump of 5, then nothing for 4 seconds, then another clump) to signal manual upload cadence
- `alternative` (sGTM routes): thin dashed tube, no capsules ever, opacity 0.25, no bloom contribution

## Bidirectional flow on hybrid platforms

The hybrid-platform concept still applies. Specifically:

- `gtm → gads` should also have a return capsule path carrying `gclid_back` or `audience_segment` (Google Ads contributing back into GTM's data layer)
- `gtm → pixel` should also return `fbp/fbc` cookie reads
- Use opposite-direction capsules with subtly different geometry (smaller, dimmer) so the eye reads them as "return signals"

## Station updates

Add to the station list:

```
{
  id: 'zapier', name: 'Zapier', tag: 'CRM ROUTER', category: 'connector',
  fn: 'A no-code automation platform. Listens for CRM events (closed deals, qualified leads, refunds) and forwards them to ad platforms as offline conversions. The OpGo default for closing the loop on conversions that happen after the click.',
  flow: [['trigger', 'CRM webhook or scheduled poll'], ['transform', 'shape payload, hash PII'], ['action', 'send to Google Ads, Meta CAPI, etc.']],
  takeaway: 'Zapier is the practical alternative to building your own server-side pipeline. Slower and more limited than sGTM, but takes 20 minutes to set up instead of 20 hours.'
},
{
  id: 'fileupload', name: 'File Upload', tag: 'MANUAL · OCCASIONAL', category: 'origin',
  fn: 'A CSV of conversions uploaded directly to Google Ads or Meta. Used when neither GTM nor an automated CRM connection is available, or for retroactive backfills.',
  flow: [['gclid', 'click identifier (Google)'], ['email_hash', 'matching key (Meta)'], ['conversion_time', 'when it happened'], ['conversion_value', 'revenue or score']],
  takeaway: 'The fallback option. Manual but powerful. Best for one-off imports, fixing gaps in tracking, or platforms with no automated connection.'
},
```

Update the existing sGTM station's takeaway to: "An alternative routing layer that runs on your own server. More reliable and private than Zapier, but a significant lift to set up. Worth knowing exists; not what OpGo currently uses."

Update GTM's flow array to include enhanced conversions:

```
flow: [
  ['triggers', 'when a tag should fire'],
  ['variables', 'dynamic values from the page'],
  ['tags', 'GA4, Ads, Pixel, etc.'],
  ['data layer', 'shared event bus'],
  ['enhanced conversions', 'hash form PII for Ads/GA4'],
],
```

## Why this matters for the build

Routing is the conceptual core of conversion tracking. The original v1 implied a single canonical path. The reality is messier and more interesting: browser via GTM, CRM via Zapier, manual via file upload, alternative via sGTM. Showing the four parallel paths with appropriate visual weight is the actual lesson.

---

Start with step 1 of the build order. Show the scaffold and first visual checkpoint before moving on to step 2.

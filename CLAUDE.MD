# Project: Conversion Tracking Foundry

A polished, immersive 3D explainer of how digital conversion tracking works. Audience: OpGo new hires and interns who have never set up tracking before. Will deploy to GitHub Pages.

See `foundry.html` for the v1 single-file proof-of-concept (vanilla Three.js r128) — source of truth for layout, station list, copy, and interaction model. Push significantly beyond it on visual fidelity, iconography distinctiveness, and typography.

See `BUILD_PLAN.md` for the full visual direction, build order, station iconography, route table, and the addendum updates.

## Stack constraints

- pnpm only, no npm or yarn
- Vite + React 18 + TypeScript strict mode
- @react-three/fiber, @react-three/drei, @react-three/postprocessing
- framer-motion-3d for camera moves; leva for dev-time tweakability (hide before final)
- Tailwind for the 2D HUD layer
- No CSS-in-JS libraries beyond what Tailwind provides
- No state management library (useState + useReducer is sufficient)
- No external GLTF model files — build all geometry procedurally
- Project name: `conversion-tracking-foundry`

## Visual non-negotiables

- Instrument Serif (display) and JetBrains Mono (technical labels) only — no Inter, no Roboto, no system fonts. Load via @fontsource
- Dark editorial-industrial aesthetic (see `foundry.html`)
- ACES tone mapping + bloom + SSAO postprocessing pipeline must be in place before adding any station
- PBR materials (MeshStandardMaterial / MeshPhysicalMaterial) with HDRI environment map; emissive accents are the heroes

## Performance targets

- 60fps on a recent MacBook Air
- Cap pixel ratio at 2
- First contentful paint under 2 seconds
- Total bundle under 1.5MB gzipped (excluding HDRI)

## What I value

- Polish over feature completeness. A scaffolded scene that looks great beats a feature-complete scene that looks generic
- Show me checkpoints. Stop after each build-order step (see `BUILD_PLAN.md`) and let me look
- Real working code only. No placeholder TODOs in committed code

# Third-Party Licenses and Notices

Last updated: 2026-03-10

This file tracks third-party software licenses used by this project and planned integrations.

This is an engineering tracking document, not legal advice.

## Maintenance Policy

- Update this file whenever we add, remove, or upgrade dependencies.
- Record both runtime and build-time dependencies that are distributed with releases or required to build distributed artifacts.
- For external services/components (for example slicer backends), add a section before integration and complete the compliance checklist before release.
- Keep links to upstream source and local license files whenever available.
- Generate a full dependency license inventory with `npm run licenses:report` and include it in release prep.

## Current Project Dependencies

## Generated Inventory

- Auto-generated report file: `THIRD_PARTY_LICENSES_REPORT.md`
- Regenerate manually: `npm run licenses:report`
- Release path: `npm run build:dist` (runs license report, then build + dist verification)

Source of truth for versions in this table:
- `package.json`
- installed package metadata in `node_modules/*/package.json`

| Package | Version (installed) | License | Purpose | Upstream |
|---|---:|---|---|---|
| `three` | `0.181.2` | `MIT` | 3D rendering in KlipperView | <https://github.com/mrdoob/three.js> |
| `vue` | `3.5.29` | `MIT` | frontend framework/runtime | <https://github.com/vuejs/core> |
| `@vitejs/plugin-vue` | `6.0.4` | `MIT` | Vue build plugin | <https://github.com/vitejs/vite-plugin-vue> |
| `vite` | `7.3.1` | `MIT` | build/dev tooling | <https://github.com/vitejs/vite> |
| `typescript` | `5.9.3` | `Apache-2.0` | type checking/transpile | <https://github.com/microsoft/TypeScript> |
| `vue-tsc` | `3.2.5` | `MIT` | Vue type-check tooling | <https://github.com/vuejs/language-tools> |
| `@vue/tsconfig` | `0.8.1` | `MIT` | TS config preset | <https://github.com/vuejs/tsconfig> |
| `@types/node` | `24.12.0` | `MIT` | Node typings for tooling | <https://github.com/DefinitelyTyped/DefinitelyTyped> |

## Local License Files

When available, license texts are in:

- `node_modules/three/LICENSE`
- `node_modules/vue/LICENSE`
- `node_modules/vite/LICENSE.md`
- `node_modules/typescript/LICENSE.txt`

## Slicer Integration Licensing

### Local slicer service (implemented in this repo)

- Component: `scripts/slicer-service.mjs`
- License status: inherits this project license unless otherwise stated.
- Bundled engines: none.
- Current default profile: `mock-fast` (internal mock output generator).

### CuraEngine (optional external integration)

- Component: `Ultimaker/CuraEngine`
- Upstream: <https://github.com/Ultimaker/CuraEngine>
- License reported by upstream: `AGPL-3.0`
- Integration mode in this repo: external executable configured by user in `slicer/profiles.json` (not bundled).

Compliance checklist before distributing builds that depend on CuraEngine:

- Confirm exact version and license of the binary/source you distribute or require.
- Include copyright and license notice for CuraEngine in release artifacts/docs.
- If you expose a modified CuraEngine service over a network, prepare corresponding source disclosure path.
- Document whether you run unmodified upstream binaries or patched builds.
- Add any extra third-party licenses brought in by the slicer service repo/container.

## Change Log

- 2026-03-10: Initial license tracking document created.
- 2026-03-10: Added current JS/build dependency licenses.
- 2026-03-10: Added CuraEngine planned integration compliance checklist.
- 2026-03-10: Added implemented local slicer-service licensing status and clarified CuraEngine as optional external dependency.

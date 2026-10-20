# Licantén campaign and simple credit — verification

## Changed files
- `src/components/landing/LicantenOfferHero.tsx`: real project drone photograph, promotional starting price and basic-kit scope, canonical parcel CTA and simulator anchor.
- `src/components/fintech/EasyCreditSimulator.tsx`: editable CLP price, accessible down-payment slider, 12/24/36/48/60-month controls, nominal annual rate, immediate French-system results and visible disclaimer. Initial 0% is explicitly an editable assumption, not a commercial condition.
- `src/lib/easyCredit.ts` and `src/lib/easyCredit.test.ts`: finite bounded inputs, existing French calculator reuse, zero-interest rounding correction, existing consultation URL and lot context.
- `src/pages/Index.tsx`: offer and simulator immediately after existing cinematic hero; original search and remaining sections retained.
- `src/pages/ProjectDetail.tsx`: Licantén-only access near commercial CTAs; selected live lot price/ID transfer, existing consultation title and message intent.
- `src/pages/landing/LandingLeadForm.tsx`: optional initial message, preserving existing submission flow.
- `src/index.css`: semantic-token photographic overlay and range accent.
- `AGENTS.md`, `roadmap.md`, this document: architecture rule and delivery status.

## Executed checks
- `bun run test -- src/lib/easyCredit.test.ts src/lib/buyerTools.test.ts src/lib/priceCurrency.test.ts src/routes/navLinks.test.ts`: 34 tests passed across four files.
- Harness preview compilation: latest observed `build OK`. Manual production build and standalone typecheck were not run, in accordance with harness instructions.
- Playwright at 1440, 390 and 320 pixels: no horizontal overflow or page errors; reviewed campaign and simulator screenshots.
- Promotional example: CLP 19,990,000, 20% down, 36 months: CLP 444,222 monthly at 0%, CLP 531,163 at nominal annual 12%.
- Checked 0-price result, term button updates, anchor navigation, existing financing consultation dialog and prefilled message. No contact was submitted, to avoid creating production CRM data.
- Checked original homepage search and three featured-project tabs, and campaign parcel CTA to `/p/valle-escondido-licanten`.
- Selected a real publicly returned lot priced CLP 23,990,000; simulator received that price and retained its ID for subsequent consultation.

## Photograph verification limitation
The existing asset pointer's relative CDN endpoint returns the Vite HTML fallback on localhost. The same exact asset endpoint on the published site returned the original 1824×1026 JPEG. For local visual checks only, Playwright fulfilled that single image request from this downloaded original. Application code retains the existing `.asset.json` URL and asset flow. This verifies the actual photograph and layout, not localhost CDN delivery.

## Scope preserved
No database writes, migrations, inventory/geometry changes, auth, permission, payment or reservation changes. No deployment or publication. Advanced financing calculator, maps, tour and project routes remain intact. Promotional price is display-only, not a live inventory update.
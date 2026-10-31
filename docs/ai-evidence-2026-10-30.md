# AI access, adoption, tokens and research — evidence ledger

Read the live references in `web/src/tour/aiEvidenceRefs.ts`. Every numerical record in `aiEvidence.ts` carries its source and retrieval date. New UI figures remain on the human verification list in `PENDING.md`.

## Slide 9: access cost

The 20 USD reference is Claude Pro billed monthly; the official page consulted on 2026-10-30 lists Max at 100 USD and Ultra at 200 USD. These are named tiers, not equivalent entitlements across vendors. Existing comparison-country tax assumptions are preserved. Argentina's 51% is a conditional cash-outlay example: 21% digital VAT plus the 30% advance where the transaction and peso card settlement are covered. It excludes provincial taxes, bank fees, exchange spreads and foreign state sales taxes. Payment with existing USD can differ; the advance is not necessarily a final tax burden.

The LATAM map colors only the four countries already represented by this tax comparison (Argentina, Chile, Uruguay, Mexico). Others remain explicit gaps. Bands are display assumptions: below 20% green, 20–25% amber, above 25% red. These are neither a legal classification nor measured checkout quotes. See ARCA, SII, SAT and DGI links. Uruguay's general rate does not establish every provider's actual checkout handling; verify with a human.

API prices are named snapshots with conditions, in USD per million tokens: Claude Sonnet 4.6 3/15/0.30; GPT-6.1 Sol Standard short context 2/10/0.10; Gemini 2.5 Pro Standard prompts at most 200k tokens 1.25/10/0.125 (input/output/cache read). Grok 4.7 input/output 2/6; cache rate is null here. No benchmark equivalence is implied. Cache writes, storage, tools, taxes and tokenization differ. Cursor is a product using multiple models, not one fixed token tariff; its documented eligible Teams/Enterprise surcharge is separate.

## Enterprise adoption

Gallup's January 2026 publication reports US technology employees in Q4 2025: 77% some use, 57% frequent use, 31% daily. Nested categories must not be summed. Total use moved from 76% to 77% quarter to quarter; this is not proof of underperformance against a pre-registered forecast.

Yu et al. (MIT FutureTech/CMU), a 2026 preprint using S&P 500 10-K disclosures, estimates 11% deep enterprise integration and another 10% use in production/services in 2025. This is a disclosure-based measure of integration, not an installed-software census. Technology leads; it is incorrect to say no IT adoption is occurring.

The authors of Firm Data on AI report roughly 70% firm adoption but 89% no self-reported sales-per-worker impact over the preceding three years in surveys fielded November 2025–January 2026 in the US, UK, Germany and Australia. These denominators differ from Gallup and the S&P sample. Later working-paper revisions exist; the slide cites the dated authors' CEPR column, not a claim that these are the newest possible survey waves.

## Token consumption and percentile limits

The requested global user-month token percentile pyramid cannot be estimated from the cited public sources. Do not invent p50/p90/p99 token thresholds. Anthropic reports artifact-level normalized conversation percentiles; Google reports all-surface aggregate monthly volume; OpenAI reports API throughput. Grok traffic through OpenRouter is a platform sample, not all Grok, and Cursor pricing documents do not reveal a comparable user-month distribution.

Instead the slide labels a real, narrow percentile example: OpenAI's internal research organization, August 2026, median above 600 USD/day and p90 above 7,000 USD/day of inference **valued at API prices**. This is neither raw tokens, actual bills nor representative of consumers. Pyramid widths are illustrative. The author's 8,000,000,000 Claude Code tokens are a self-reported observation for the preceding 30 days, confirmed in the task conversation on 2026-10-30; cache composition and monthly percentile remain null. Never turn that into an API bill without a breakdown.

## Adoption pyramid and inspiration

The requested visual was found in the viral AI Bear / social-media infographic. Its 15–25 million paying-user figure does not match the subsequently published OpenAI release (2026-02-27): more than 50 million consumer subscribers and more than 900 million weekly users of ChatGPT. Use the official release; do not reuse the viral numbers or suggest they count all vendors.

The base is the UN's approximate world population of 8.2 billion **in 2024**, explicitly earlier than the product metrics. 50m / 8.2bn = 0.609756% is a scale illustration using a published lower-bound threshold, not a precise current world adoption estimate, an upper bound below 1%, or a count of 20 USD plans. Counts are not summed or subtracted. The diagram is redrawn in native, selectable HTML/CSS; widths are not proportional, and the source of visual inspiration and primary-data replacements are shown on the slide.

## Research output and acceleration

arXiv annual counts are reproducibly summed from the archived official monthly CSV for completed years 2020–2025. Preprints.org reports 31,691 posted preprints in 2025; SocArXiv reports 3,162 accepted papers. Definitions, coverage and possible overlap are explicit; do not sum them as unique global papers or compare acceptance rates. Annual counts show output volume, not quality or a causal AI treatment effect.

Google's AI co-scientist demonstration recapitulated a hypothesis whose experimental validation had already been completed by collaborators, without access to those unpublished results. It illustrates a faster hypothesis stage, not replacing the entire discovery/validation process. The claim “all work that took months now takes days” is not supported as a general fact and is not presented as one. OpenAI's internal report on more experiments also reports additional compute and measurement limitations; no causal multiplier is derived.

## Validation

No dependencies added. Tests run only in CI. New tests cover unit separation, cache-aware costs, non-invented percentiles, reference/data export wiring, provider selection, map keyboard input and research-view switching. Source aggregation script writes only to its chosen workspace root and is tested with temporary fixtures, never real `data/`.

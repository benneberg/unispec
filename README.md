Unispec — TS Schema Gen/Val

[![Health](https://img.shields.io/badge/Health-94-green)](https://github.com/benneberg/unispec)

**✓ Passed** | Score: 94 | v3.0 Critique

## Product Identity / Overview

Uni spec TS tool. Union/intersect schemas Zod-like, JSON/YAML export/val.

**Capabilities:** Spec Gen (union/intersect), Runtime Val.

## Product Philosophy

**Why:** Deterministic TS specs. **Constraint:** TS-first. **Philosophy:** Schema code-truth.

**Critique:** No async iter Zod compat partial (src/val.ts).

## 📖 Vocabulary & Messaging Primitives

**Terms:**
| Term | Def | Context |
|------|-----|---------|
| Union | OR types | Schema gen |

**Canonical:** "Unispec compiles TS unions to val JSON."
**Avoid:** "Zod alternative" – compat layer.

**Glossary:** Schema = TS type repr.

## ⚙️ Functional Anatomy

| Capability | Desc | Status | Evidence |
|------------|------|--------|----------|
| Union Gen | TS |union| → JSON | ✅ Mature | src/union.ts |
| Val Engine | Runtime Zod-like | 🔄 Partial | src/val.ts |
| CLI Export | YAML/JSON | ✅ Mature | cli.ts |

## System Architecture

```mermaid
graph LR
    A[TS Schema] --> B[Extract Unions]
    B --> C[Val/Compile]
    C --> D[JSON/YAML]
Domain Model

Entities: TSUnion (types), ValSchema (runtime).

Positioning & Differentiation

vs Zod	Unispec
Schema gen	Union-focused CLI.
🧠 Strategic Assumptions Register

Assumption	Central	Val	Evidence	Risk
TS unions portable	Core	✅	src/port.ts	Med
Quick Start (Magic Moment)

npx unispec gen --union User.ts --out spec.json
60s: TS → JSON val schema.

🎨 Graphic Profile

Colors: Primary #f59e0b (Tailwind amber).

Typography: Syne display, DM Mono code.

Style Keywords: Technical, minimalist.

Asset Prompt: "CLI schema gen banner, amber/tech blue, Syne 'UniSpec'".

Security & Hygiene

94% hygiene.

📊 Quality Metrics

Cat	Score	Status
Structure	95%	✅
Dependencies & Interoperability

Zod/TS deps clean.

Roadmap & Evolution Signals

Current: Union gen/val. Queued: Intersect. Planned: Async iter.

⚡ Challenged Assumptions & Open Questions

Contradictions: Zod full compat claimed vs partial async (RIE011).

Questions: TS-only or JS polyfill?

🛠️ How to Use This Document

Dev: Anatomy/Quick/Arch. AI: Vocab/Identity/Anatomy. Founders: Assumptions/Challenged.

Unispec v1.0 
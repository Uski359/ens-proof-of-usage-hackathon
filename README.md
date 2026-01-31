# ENS-aware Proof-of-Usage
## Deterministic Eligibility for DeFi Incentives

Deterministic, reproducible on-chain usage verification using ENS identity for DeFi incentives, airdrops, and rewards.

## 🚨 The Problem

Today, DeFi incentives and airdrops are:

- Ad-hoc and non-reproducible
- Difficult to verify transparently
- Vulnerable to Sybil and farming attacks
- Inconsistent across time and evaluators

The same wallet can receive different eligibility results depending on who evaluates it and when.

This breaks trust.

## 💡 The Idea

This project introduces ENS-aware deterministic proof-of-usage.

Instead of distributing rewards, it generates verifiable eligibility proofs.

Flow:

ENS name / Wallet  
↓  
Deterministic evaluation  
↓  
Proof hash + score + risk tags

Key principles:

- ENS → human-readable identity layer
- Proof → fully deterministic and reproducible
- AI → interpretation only (never part of the proof)

If AI is removed, the proof still verifies.

## 🔑 Why ENS?

ENS is not used as a cosmetic feature.

It provides:

- Human-readable input (UX)
- Identity abstraction over raw addresses
- Identity continuity across evaluations

Important detail:

ENS is resolved first.  
Only the wallet address enters the proof.  
ENS itself never alters proof determinism.

This design is intentionally aligned with the
“Most Creative Use of ENS” sponsor track.

## 🧪 What This Hackathon Demo Includes

Included:

- ENS / wallet input
- ENS to address resolution
- Deterministic usage evaluation
- Proof hash generation
- Score, farming risk, and tags
- Demo UI at /demo/proof
- API endpoint at /api/proof

Explicitly not included (by design):

- Production infrastructure
- Full indexing engine
- Real airdrop execution
- Existing IndexFlow codebase

The scope is deliberately limited to ensure hackathon integrity.

## 🖥️ Demo

Live Demo:  
https://<hackathon-demo-link>

Demo Route:  
/demo/proof

Suggested demo flow:

1. Enter an ENS name or address
2. Resolve to wallet address
3. Generate deterministic proof
4. Observe fixed hash, score, and tags
5. Re-run to confirm deterministic output

## 🏗️ Tech Stack

- Express + TypeScript - API
- Ethers - ENS resolution
- Next.js (App Router) - demo interface
- TypeScript

AI tools were used only for UI scaffolding and non-critical helper logic.

Full disclosure is available in AI_ATTRIBUTION.md.

## 📁 Repository Structure

apps/api -> Express API for ENS resolution + deterministic proof  
apps/web -> Next.js demo UI  
DEPLOYMENT.md -> Render/Vercel setup  
HACKATHON.md -> Hackathon compliance


## 🏁 Hackathon Compliance

- Repository created during the hackathon
- All code written from scratch
- No previous repositories, deploys, or demos reused

Full details are documented in HACKATHON.md.

## 🏆 Sponsor Alignment

- ENS → identity-aware deterministic proofs
- DeFi protocols → reproducible eligibility for incentives and airdrops

This project focuses on eligibility proofs, not reward distribution.

## 📜 License

MIT

## 🧠 One-liner for Demo and Judging

We don’t create rewards.  
We create deterministic eligibility.

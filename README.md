# ENS-aware Deterministic Proof-of-Usage

Deterministic, reproducible proof-of-usage generation for DeFi incentives and airdrops,  
using ENS strictly as a human-readable identity abstraction layer.

---

## Overview

In DeFi, incentive eligibility and airdrop rules are often ad-hoc, opaque, and hard to reproduce.

This project demonstrates a **deterministic proof-of-usage system** where the **same input always produces the same output** under the same policy — making eligibility decisions transparent, auditable, and reproducible.

ENS is intentionally used **only for UX and identity abstraction**.  
All proofs are generated **solely from the resolved wallet address**, not from the ENS name itself.

---

## How It Works

1. User inputs an **ENS name or wallet address**
2. If ENS is provided, it is resolved **server-side** for identity readability
3. The resolved **wallet address** is used as the **only proof input**
4. A deterministic proof is generated using a fixed policy
5. The system outputs:
   - Proof hash
   - Score
   - Explainable policy tags

**Same input + same policy = same proof. Always.**

---

## ENS Usage (Intentional & Minimal)

ENS is treated as an **identity abstraction layer**, not a trust assumption.

- ENS improves human readability and UX
- Proof inputs remain strictly address-based
- No ENS records are written or modified
- No data is stored inside ENS

This design aligns with ENS best practices for **wallet-centric applications**.

---

## Key Features

- **Deterministic proof generation**
- **ENS-aware UX (read-only, backend-resolved)**
- **Batch processing** (multiple ENS names / addresses)
- **Explainable policy tags**
- **CSV & JSON export** for off-chain pipelines
- **Graceful RPC error handling** (per-item, non-blocking)
- **Public proof verification UX**

---

## Proof Verification

Anyone can verify a proof by recomputing it using the same deterministic policy.

- No state is stored
- No signatures or trust assumptions are introduced
- Verification simply recomputes and compares outputs

This reinforces transparency and reproducibility.

---

## Determinism Contract

This project guarantees:

- No randomness
- No timestamps
- No AI-based decision logic
- Proof output depends **only** on:
  - Resolved wallet address
  - Policy version

### Policy Versions
- **v1** — Initial deterministic policy

Future policy upgrades will be versioned and communicated explicitly.

---

## Demo Notes

- Batch size is intentionally limited for demo stability
- ENS resolution errors do **not** affect other inputs in the same batch
- Successful proofs remain fully deterministic and reproducible

---

## Live Demo

👉 **Demo:** [https://<your-vercel-url> ](https://ens-proof-of-usage-hackathon-web.vercel.app) 

👉 **Repository:** [https://github.com/](https://github.com/Uski359/ens-proof-of-usage-hackathon)

---

## Use Cases

- DeFi incentive eligibility
- Airdrop filtering
- Loyalty and long-term usage programs
- Off-chain eligibility pipelines with on-chain verifiability

---

## License

MIT

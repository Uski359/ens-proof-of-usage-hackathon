# ENS-aware Proof of Usage (Hackathon)

## Problem
DeFi incentive systems need a fast, deterministic signal that can be generated from an address while still supporting ENS-friendly UX.

## Solution
This project generates a deterministic proof hash, score, and tags based solely on a resolved address. ENS resolution is used only to improve input UX. The same input always yields the same output.

## Why ENS
ENS names reduce friction for users and make inputs human-readable. We resolve ENS names to an address and then apply deterministic proof logic to that address.

## What the Demo Includes (Check-in 1)
- Single input for ENS name or wallet address
- Resolution step and deterministic proof output
- Web UI at `/demo/proof`
- API endpoint `POST /api/proof`

## Local Development
1) Install dependencies:
   - `pnpm install`
2) Copy `.env.example` to `.env` and set `RPC_URL` if you want ENS resolution.
3) Run both apps:
   - `pnpm dev`
4) Web: `http://localhost:3000/demo/proof`
   API: `http://localhost:4000/health`

## Deploy (placeholders)
- Web (Vercel): <ADD_LINK>
- API (Render): <ADD_LINK>

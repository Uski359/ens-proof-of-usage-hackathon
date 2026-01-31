# Deployment Guide

## Vercel (Web)
1) Create a new Vercel project and point it at `apps/web` in this repo.
2) Set the framework preset to Next.js (App Router).
3) Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL` = your Render API URL (for example: `https://your-service.onrender.com`)
4) Deploy. The demo will be available at `/demo/proof`.

## Render (API)
1) Create a new Web Service from this repo.
2) Set the root directory to the repo root (not `apps/api`).
3) Use these commands:
   - Build: `pnpm install --frozen-lockfile && pnpm --filter api build`
   - Start: `pnpm --filter api start`
4) Environment variables:
   - `RPC_URL` = public RPC provider URL (required for ENS resolution)
   - `CHAIN_ID` = chain ID for payloads (default 1)
   - `PORT` = 4000 (Render injects this automatically; keep it if set)
5) Deploy and note the public URL. Use it in Vercel.

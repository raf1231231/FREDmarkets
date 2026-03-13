# FREDmarkets

## Project Name
FREDmarkets

## Purpose
A decentralized prediction market platform built on Solana, enabling users to trade on Federal Reserve Economic Data (FRED) indicators. Users can create markets on upcoming economic releases, sponsor market potentials with initial liquidity, and trade conditional outcome tokens based on economic indicator predictions.

## Tech Stack

### Backend
- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma)
- **Blockchain**: Solana (using `@solana/web3.js` and `@coral-xyz/anchor`)
- **Scheduler**: node-cron
- **Additional**: Axios, CORS, Helmet, Morgan, Rate limiting

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript / React 19
- **Styling**: Tailwind CSS 4
- **Blockchain**: Solana Wallet Adapter
- **Build Tool**: Next.js (Vite plugin)

### Infrastructure
- **Deployment**: Railway (backend), Vercel (frontend), Neon (PostgreSQL)

## Key Files

### Backend (`backend/`)
- `src/index.ts` - Main entry point
- `prisma/schema.prisma` - Database schema
- API endpoints in `src/`

### Frontend (`frontend/`)
- `src/app/` - Next.js app router
- `src/components/` - React components
- Configuration files

### Documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOY_CHECKLIST.md` - Quick reference
- `RAILWAY_DEPLOYMENT.md` - Railway-specific deployment

## How to Run
```bash
# Backend
cd backend
npm install
npm run dev        # Development
npm run build      # Production build
npm run db:push    # Push Prisma schema

# Frontend
cd frontend
npm install
npm run dev        # Development
npm run build      # Production build

# Run all tests
npm test
```

## Current Status
**100% Complete** - Infrastructure deployment ready, frontend/backend configured, smart contract phase 0+1 complete.

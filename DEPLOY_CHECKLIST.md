# Deployment Checklist

Quick reference checklist for deploying FREDmarkets to production.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] CI passes (GitHub Actions: backend build + frontend build)
- [ ] Environment variables documented in `.env.example` (backend) and `.env.example` (frontend)
- [ ] Database schema is finalized
- [ ] FRED API key obtained
- [ ] Oracle keypair generated (`solana-keygen new --outfile oracle-keypair.json`)
- [ ] Oracle pubkey matches `oracle_authority` in on-chain `PlatformConfig`

## Database (Neon)

- [ ] Neon account created at https://neon.tech
- [ ] Project created: `fredmarkets` (PostgreSQL 16, us-east-2)
- [ ] Connection string saved securely (never commit!)
- [ ] Connection tested locally: `psql "postgresql://..."` returns prompt
- [ ] Optional: Neon ↔ Railway integration connected (auto-injects DATABASE_URL)

## Backend (Railway)

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `FRED_API_KEY`
  - [ ] `FRONTEND_URL` (Vercel URL — fill in after Vercel deploy)
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `ORACLE_KEYPAIR` (base64-encoded 64-byte keypair — never commit!)
  - [ ] `SOLANA_RPC_URL` (devnet or paid mainnet RPC)
  - [ ] `FRED_MARKETS_PROGRAM_ID=GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo`
  - [ ] `ORACLE_CRON_SCHEDULE=*/15 * * * *` (adjust as needed)
  - [ ] `ORACLE_ADMIN_SECRET` (openssl rand -hex 32 — optional, enables manual trigger)
- [ ] Build succeeds (nixpacks detects Node.js, runs `npm ci && npx prisma generate`)
- [ ] Migrations run successfully (start command: `npx prisma migrate deploy && npm start`)
- [ ] Health endpoint returns 200: `curl https://[railway-url]/api/health`
- [ ] FRED API proxy works: `curl https://[railway-url]/api/fred/series/CPIAUCSL`
- [ ] Oracle logs show: `⏰ Oracle cron scheduled: */15 * * * *`
- [ ] Custom domain configured (optional)

## Frontend (Vercel)

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework detected as Next.js
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` (Railway URL + `/api`, e.g. `https://fredmarkets.up.railway.app/api`)
  - [ ] `NEXT_PUBLIC_RPC_ENDPOINT` (devnet or mainnet RPC)
- [ ] Build succeeds
- [ ] Site loads without errors
- [ ] Market Cloud displays data from backend
- [ ] No CORS errors in browser console
- [ ] Custom domain configured (optional)

## Post-Deployment Verification

- [ ] Backend health check: `curl https://[railway-url]/api/health`
- [ ] Frontend loads: Visit Vercel URL
- [ ] API connection works: Check browser console for API calls
- [ ] Database queries work: Market Cloud shows FRED data
- [ ] CORS configured correctly: No CORS errors
- [ ] SSL certificates active: Both URLs use HTTPS
- [ ] Oracle cycle runs: Check Railway logs at next cron interval

## Monitoring Setup

- [ ] Set up uptime monitoring (UptimeRobot pinging `/api/health`)
- [ ] Configure error tracking (Sentry — optional)
- [ ] Enable Railway deployment notifications (Slack/Discord)
- [ ] Set up database backup strategy

## Documentation

- [ ] Update README with live URLs
- [ ] Document environment variables in `.env.example` files
- [ ] Add deployment guide links

## Security

- [ ] Environment variables not in Git
- [ ] `.env` and `.env.local` in `.gitignore`
- [ ] Database credentials secure (Neon dashboard access restricted)
- [ ] Oracle keypair stored only in Railway env — not in repo
- [ ] FRED API key in Railway env only
- [ ] CORS restricted to Vercel domain (`FRONTEND_URL` in backend)
- [ ] Rate limiting enabled (100 req/15min — already in code)

## Performance

- [ ] Database indexes created (already in schema: `status`, `fredSeriesId`)
- [ ] API caching enabled (FRED cache in Neon — already implemented)
- [ ] CDN enabled (Vercel default for static assets)
- [ ] Consider paid RPC for mainnet to avoid rate limits

## Final Checks

- [ ] All page routes load without 500 errors
- [ ] Mobile responsive layout works
- [ ] Wallet connection works (Phantom/Backpack on devnet)
- [ ] Error pages display correctly (404, 500)

---

## Deployment Commands Reference

### First Deploy
```bash
# 1. Neon: Get connection string from console.neon.tech
# 2. Railway:
cd backend && railway login && railway init && railway up
# (then set env vars in Railway dashboard)

# 3. Vercel:
cd frontend && vercel --prod
# (then set NEXT_PUBLIC_API_BASE_URL in Vercel dashboard)

# 4. Update FRONTEND_URL in Railway env → trigger redeploy
```

### Subsequent Deploys
```bash
# Both Railway and Vercel auto-deploy on push to main
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Redeploy
```bash
# Railway: Click "Redeploy" in dashboard, or:
railway up

# Vercel: Click "Redeploy" in dashboard, or:
cd frontend && vercel --prod
```

### Rollback
```bash
# Railway: Redeploy previous working deployment in dashboard
# Vercel: Redeploy previous deployment in dashboard
# Git: git revert [commit-hash] && git push
```

### Run Migrations Manually (if needed)
```bash
# Railway shell:
railway shell
npx prisma migrate deploy
```

---

## Emergency Contacts / Status Pages

- Railway Status: https://status.railway.app
- Vercel Status: https://www.vercel-status.com
- Neon Status: https://neonstatus.com

---

## Current Deployment Status

Last Updated: 2026-03-02

- **Database**: Neon — ready (schema + migrations complete)
- **Backend**: Railway — ready to deploy (nixpacks.toml, railway.json configured)
- **Frontend**: Vercel — ready to deploy (vercel.json configured)
- **Oracle**: Integrated into backend (cron-based, auto-starts if ORACLE_KEYPAIR is set)
- **CI**: GitHub Actions CI pipeline active (.github/workflows/ci.yml)

**Next Step**: Deploy backend to Railway following RAILWAY_DEPLOYMENT.md, then frontend to Vercel.

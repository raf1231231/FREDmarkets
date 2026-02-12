# Deployment Checklist

Quick reference checklist for deploying FREDmarkets to production.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented in `.env.example`
- [ ] Database schema is finalized
- [ ] FRED API key obtained

## Database (Neon)

- [ ] Neon account created
- [ ] Project created: `fredmarkets`
- [ ] Connection string saved securely
- [ ] Database tested locally

## Backend (Railway)

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL` (from Neon)
  - [ ] `FRED_API_KEY`
  - [ ] `FRONTEND_URL` (Vercel URL)
  - [ ] `NODE_ENV=production`
- [ ] Build succeeds
- [ ] Migrations run successfully
- [ ] Health endpoint returns 200: `/api/health`
- [ ] FRED API proxy works: `/api/fred/series/CPIAUCSL`
- [ ] Custom domain configured (optional)

## Frontend (Vercel)

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Root directory set to `frontend`
- [ ] Framework detected as Next.js
- [ ] Environment variable configured:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` (Railway URL)
- [ ] Build succeeds
- [ ] Site loads without errors
- [ ] Market Cloud displays data
- [ ] No CORS errors in console
- [ ] Custom domain configured (optional)

## Post-Deployment Verification

- [ ] Backend health check: `curl https://[railway-url]/api/health`
- [ ] Frontend loads: Visit Vercel URL
- [ ] API connection works: Check browser console for API calls
- [ ] Database queries work: Market Cloud shows FRED data
- [ ] CORS configured correctly: No CORS errors
- [ ] SSL certificates active: Both URLs use HTTPS

## Monitoring Setup

- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure error tracking (Sentry - optional)
- [ ] Enable Railway deployment notifications
- [ ] Set up database backup strategy

## Documentation

- [ ] Update README with live URLs
- [ ] Document environment variables
- [ ] Add deployment guide links
- [ ] Create runbook for common issues

## Security

- [ ] Environment variables not in Git
- [ ] `.env` in `.gitignore`
- [ ] Database credentials secure
- [ ] API keys rotated if needed
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled (already in code)

## Performance

- [ ] Database indexes created (already in schema)
- [ ] API caching enabled (already implemented)
- [ ] Frontend static generation configured
- [ ] CDN enabled (Vercel default)

## Final Checks

- [ ] All links work
- [ ] Mobile responsive
- [ ] Wallet connection works (after implementing)
- [ ] Market creation flow functional (after implementing)
- [ ] Error pages display correctly

## Deployment Commands Reference

### First Deploy
```bash
# 1. Neon: Get connection string from console
# 2. Railway: Connect repo, set env vars, deploy
# 3. Vercel: Connect repo, set env vars, deploy
```

### Subsequent Deploys
```bash
# Just push to GitHub - both Railway and Vercel auto-deploy
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Redeploy
```bash
# Railway: Click "Redeploy" in dashboard
# Vercel: Click "Redeploy" in dashboard
```

### Rollback
```bash
# Railway: Redeploy previous working deployment
# Vercel: Redeploy previous working deployment
# Git: git revert [commit-hash] && git push
```

## Emergency Contacts

- Railway Status: https://status.railway.app
- Vercel Status: https://www.vercel-status.com
- Neon Status: https://neonstatus.com

## Current Deployment Status

Last Updated: [DATE]

- **Database**: Neon (configured, not deployed yet)
- **Backend**: Railway (ready to deploy)
- **Frontend**: Vercel (needs root directory fix)

**Next Step**: Deploy backend to Railway following RAILWAY_DEPLOYMENT.md

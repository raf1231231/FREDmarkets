# Railway + Neon Deployment Guide

Complete guide for deploying the FREDmarkets backend to Railway with Neon PostgreSQL.

## Prerequisites

- Railway account (https://railway.app)
- Neon account (https://neon.tech)
- GitHub repository with your code
- FRED API key

## Part 1: Neon Database Setup

### 1. Create Neon Project

1. Go to https://console.neon.tech
2. Click "New Project"
3. Configure:
   - **Name**: fredmarkets
   - **PostgreSQL Version**: 16
   - **Region**: us-east-2 (Ohio) or us-west-2 (Oregon) - choose closest to your users
4. Click "Create Project"

### 2. Get Connection String

After creation, Neon displays your connection string:

```
postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
```

**Important**: Save this connection string - you'll need it for Railway!

### 3. Verify Database

```bash
# Test connection locally first
psql "postgresql://[your-connection-string]"
```

## Part 2: Railway Backend Deployment

### 1. Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `FREDmarkets` repository
4. Railway will detect the monorepo structure

### 2. Configure Service

1. After deployment starts, go to **Settings**
2. **Root Directory**: Set to `backend`
3. **Build Command**: `npm install && npx prisma generate`
4. **Start Command**: `npx prisma migrate deploy && npm start`

### 3. Add Environment Variables

Go to **Variables** tab and add:

```env
# Database (from Neon)
DATABASE_URL=postgresql://[your-neon-connection-string]

# FRED API
FRED_API_KEY=your_fred_api_key_here

# Frontend (update after Vercel deployment)
FRONTEND_URL=https://your-frontend.vercel.app

# Node Environment
NODE_ENV=production

# Port (Railway provides this automatically, but set as backup)
PORT=3001
```

### 4. Deploy

1. Click "Deploy" or push to GitHub
2. Railway auto-deploys on every push to main branch
3. Monitor deployment in **Deployments** tab
4. Check logs for any errors

### 5. Get Your Backend URL

After deployment:
1. Go to **Settings** > **Networking**
2. Click "Generate Domain"
3. Your backend URL: `https://[your-app].up.railway.app`

## Part 3: Connect Neon to Railway (Alternative)

Instead of manually adding DATABASE_URL, you can use Neon's Railway integration:

### Option A: Neon Integration (Recommended)

1. In Neon console, go to your project
2. Click "Integrations" > "Add Integration"
3. Select "Railway"
4. Choose your Railway project
5. Select environments (Production)
6. Custom prefix: `DATABASE`
7. Click "Connect"

This automatically adds:
- `DATABASE_URL`
- `DATABASE_PRISMA_URL` (same as DATABASE_URL for Neon)
- `DATABASE_URL_UNPOOLED` (direct connection)

### Option B: Manual (What we did above)

Just add the connection string manually to Railway environment variables.

## Part 4: Run Migrations

Migrations run automatically on deploy (via start command), but you can also run manually:

1. In Railway, go to your service
2. Click "Deployments" > Latest deployment
3. Click "View Logs"
4. Look for: `✓ Prisma Migrate applied successfully`

Or run manually in Railway shell:
```bash
npx prisma migrate deploy
```

## Part 5: Update Frontend

### 1. Update Vercel Environment Variable

1. Go to Vercel dashboard
2. Select your FREDmarkets project
3. Go to **Settings** > **Environment Variables**
4. Add/Update:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://[your-railway-app].up.railway.app/api
   ```
5. Redeploy frontend

### 2. Update Backend CORS

The backend `.env` should have:
```env
FRONTEND_URL=https://your-frontend.vercel.app
```

Update `backend/src/index.ts` CORS configuration if needed.

## Part 6: Verify Deployment

### 1. Test Backend Health

```bash
curl https://[your-railway-app].up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-...","uptime":...}
```

### 2. Test FRED API Proxy

```bash
curl https://[your-railway-app].up.railway.app/api/fred/series/CPIAUCSL
```

### 3. Test from Frontend

Visit your Vercel deployment and check:
- Market Cloud page loads
- Data fetches from backend
- No CORS errors in console

## Troubleshooting

### Database Connection Errors

Check Railway logs:
```
Error: P1001: Can't reach database server
```

**Solution**: Verify DATABASE_URL is correct in Railway environment variables.

### Migration Errors

```
Error: Prisma Migrate failed
```

**Solution**: Run migrations manually in Railway shell:
```bash
railway shell
npx prisma migrate deploy
```

### CORS Errors

```
Access to fetch at '...' from origin '...' has been blocked by CORS
```

**Solution**: Update FRONTEND_URL in Railway environment variables to match your Vercel URL.

### Cold Start Delays

Railway may have cold starts. To reduce:
1. Upgrade to Railway Pro (keeps services warm)
2. Use health check pings from UptimeRobot or similar

## Monitoring

### Railway Dashboard

- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status

### Neon Dashboard

- **Monitoring**: Query performance and connections
- **Storage**: Database size and growth
- **Branches**: Create development branches if needed

## Cost Estimates

### Neon (Free Tier)
- Storage: Up to 0.5 GB
- Compute: 191.9 hours/month
- **Cost**: $0/month for moderate usage

### Railway (Hobby Plan)
- $5/month + usage
- Includes $5 of compute
- Additional: $0.000231/GB transferred

**Estimated Total**: $5-10/month for moderate traffic

## Automatic Deployments

Railway auto-deploys on every push to main branch:

1. Push changes to GitHub
2. Railway detects changes
3. Runs build command
4. Runs migrations
5. Starts service
6. Zero-downtime deployment

## Rollback

If deployment fails:

1. Go to **Deployments** in Railway
2. Find previous working deployment
3. Click "Redeploy"
4. Or revert commit in Git and push

## Next Steps

1. Set up monitoring (UptimeRobot, Better Uptime)
2. Configure custom domain (optional)
3. Set up backup strategy for Neon database
4. Enable Railway metrics and alerts
5. Configure deployment notifications (Slack, Discord)

## Support

- **Railway**: https://docs.railway.app
- **Neon**: https://neon.tech/docs
- **Prisma**: https://www.prisma.io/docs

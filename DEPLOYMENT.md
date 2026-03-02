# Deploying FREDmarkets to Vercel

## Frontend Deployment

### Quick Deploy via CLI:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy frontend:
```bash
cd frontend
vercel
```

3. Follow prompts:
   - Login with GitHub/Email
   - Link to your GitHub repo (optional)
   - Accept default settings
   - Choose "Production" deployment

### Deploy via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Import your GitHub repository: `raf1231231/FREDmarkets`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. Add Environment Variables (in Vercel dashboard):
   - `NEXT_PUBLIC_API_BASE_URL` = Your Railway backend URL (e.g. `https://fredmarkets.up.railway.app/api`)
   - `NEXT_PUBLIC_RPC_ENDPOINT` = `https://api.devnet.solana.com` (devnet) or paid RPC for mainnet

5. Click "Deploy"

## Backend Deployment Options

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up
```

Then add these environment variables in Railway dashboard:
- `DATABASE_URL` = Your Neon connection string (see RAILWAY_DEPLOYMENT.md)
- `FRED_API_KEY` = Your FRED API key (get free at https://fred.stlouisfed.org/docs/api/api_key.html)
- `FRONTEND_URL` = Your Vercel frontend URL
- `PORT` = 3001
- `NODE_ENV` = production
- `ORACLE_KEYPAIR` = Base64-encoded oracle keypair (see backend/.env.example)
- `SOLANA_RPC_URL` = `https://api.devnet.solana.com` (or paid RPC for mainnet)
- `FRED_MARKETS_PROGRAM_ID` = `GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo`
- `ORACLE_CRON_SCHEDULE` = `*/15 * * * *`

### Option 2: Render
1. Go to https://render.com
2. Create New → Web Service
3. Connect GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma migrate deploy && npm start`
5. Add environment variables (same as Railway)

### Option 3: Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
cd backend
fly launch
fly deploy
```

## Environment Variables Summary

### Frontend (Vercel):
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Backend (Railway):
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
FRED_API_KEY=your_fred_api_key_here
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
ORACLE_KEYPAIR=<base64-encoded-64-byte-keypair>
SOLANA_RPC_URL=https://api.devnet.solana.com
FRED_MARKETS_PROGRAM_ID=GaK745UiF6FMZt5hXbCrKQrhmdcmRx8SYi3AdfFshMBo
ORACLE_CRON_SCHEDULE=*/15 * * * *
ORACLE_ADMIN_SECRET=<openssl rand -hex 32>
```

See `backend/.env.example` for full documentation of each variable.

## Post-Deployment Steps

1. Update CORS in backend to allow your Vercel domain
2. Test the API connection from frontend
3. Set up custom domain (optional)
4. Enable automatic deployments from GitHub

## Quick Start (All-in-One)

```bash
# 1. Deploy frontend to Vercel
cd frontend && vercel --prod

# 2. Deploy backend to Railway
cd ../backend && railway up

# 3. Update frontend env with backend URL
# Go to Vercel dashboard → Settings → Environment Variables
# Add: NEXT_PUBLIC_API_BASE_URL = <your-railway-url>/api

# 4. Redeploy frontend
cd frontend && vercel --prod
```

For a detailed step-by-step guide see **RAILWAY_DEPLOYMENT.md**.

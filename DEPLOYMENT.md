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
   - `NEXT_PUBLIC_API_BASE_URL` = Your backend URL (see below)

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
- `DATABASE_URL` = Your Supabase pooler URL
- `DIRECT_URL` = Your Supabase direct URL
- `FRED_API_KEY` = Your FRED API key
- `PORT` = 3001
- `NODE_ENV` = production
- `FRONTEND_URL` = Your Vercel frontend URL

### Option 2: Render
1. Go to https://render.com
2. Create New → Web Service
3. Connect GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
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
- `NEXT_PUBLIC_API_BASE_URL` = https://your-backend.railway.app

### Backend (Railway/Render/Fly):
- `DATABASE_URL` = postgresql://postgres.hmcywjqvfepxwlqdeita:...@aws-0-us-west-2.pooler.supabase.com:6543/postgres
- `DIRECT_URL` = postgresql://postgres.hmcywjqvfepxwlqdeita:...@aws-0-us-west-2.pooler.supabase.com:5432/postgres
- `FRED_API_KEY` = cefea4662a2255e23e53c9b27af27b84
- `PORT` = 3001
- `NODE_ENV` = production
- `FRONTEND_URL` = https://your-app.vercel.app

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
# Add: NEXT_PUBLIC_API_BASE_URL = <your-railway-url>

# 4. Redeploy frontend
vercel --prod
```

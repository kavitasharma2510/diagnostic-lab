# Deploy Tyagi Pathology Lab System

Stack: **MongoDB Atlas** (database) + **Render** (API) + **Vercel** (React UI)

Your repo is already wired for:
- API default: `https://diagnostic-lab-rbdo.onrender.com`
- UI default: `https://diagnostic-lab-client.vercel.app`

---

## Before you deploy

1. **Commit and push** all code (including `backend/public/assets/` logos and letterhead).
2. **MongoDB Atlas** — create a free cluster and get a connection string.
3. Accounts on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), [Render](https://render.com), and [Vercel](https://vercel.com).

---

## Step 1 — MongoDB Atlas

1. Create a cluster (M0 free tier is fine).
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere — required for Render).
4. **Connect** → Drivers → copy the URI, e.g.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/diagnostic_lab`
5. Replace `USER`, `PASS`, and ensure the database name is `diagnostic_lab`.

---

## Step 2 — Push code to GitHub

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Step 3 — Deploy API on Render

### Option A — Blueprint (recommended)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect repo `kavitasharma2510/diagnostic-lab`.
3. Render reads `render.yaml` and creates the web service.
4. Set these **secret** env vars when prompted:

| Variable | Example |
|----------|---------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/diagnostic_lab` |
| `CLIENT_URL` | `https://diagnostic-lab-client.vercel.app` |
| `LAB_EMAIL` | your lab email |

`APP_URL` is optional — Render sets `RENDER_EXTERNAL_URL`; the API uses it automatically.

### Option B — Manual web service

1. **New** → **Web Service** → connect GitHub repo.
2. Settings:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

3. Add environment variables from `backend/.env.example` (use Atlas `MONGO_URI`).

### After first deploy

1. Open `https://YOUR-SERVICE.onrender.com/api/health` — should return `{"status":"ok",...}`.
2. Sync database schema (run once from your PC with Atlas URI in `backend/.env`):

```bash
npm run db:migrate
npm run db:seed
```

Or use **Render Shell** on the service and run the same commands.

> **PDF generation** needs Chrome. The build runs `npm run browsers:install`. Use at least **Starter** plan (512MB+ RAM). Free tier may fail on PDF approve.

---

## Step 4 — Deploy UI on Vercel

1. [Vercel Dashboard](https://vercel.com) → **Add New** → **Project**.
2. Import `kavitasharma2510/diagnostic-lab` from GitHub.
3. Vercel reads root `vercel.json` (builds `client/` automatically).
4. **Environment Variables** (Production):

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com` |

5. Deploy.

6. Copy your Vercel URL (e.g. `https://diagnostic-lab-client.vercel.app`).

---

## Step 5 — Link frontend and API

On **Render**, update:

```
CLIENT_URL=https://your-vercel-app.vercel.app
```

Redeploy the API so CORS allows your Vercel domain.

---

## Step 6 — Verify production

| Check | URL / action |
|-------|----------------|
| API health | `https://YOUR-API.onrender.com/api/health` |
| UI loads | Your Vercel URL |
| Register patient | Registration → select tests → save |
| Approve report | Reports → Enter Results → Approve & Generate PDF |
| PDF preview | Should open in browser |

---

## Environment variables reference

### Backend (Render)

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `CLIENT_URL` | Yes | Vercel URL for CORS |
| `APP_URL` | No | Auto from `RENDER_EXTERNAL_URL` on Render |
| `LAB_*` | No | Branding for PDF reports |

### Frontend (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_URL` | Yes | Render API URL (no trailing slash) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Set `CLIENT_URL` on Render to exact Vercel URL, redeploy API |
| `MONGO_URI is missing` | Add Atlas URI in Render env vars |
| PDF fails / Chrome not found | Upgrade Render plan; rebuild so `browsers:install` runs |
| Blank page on Vercel | Check `VITE_API_URL` is set at **build** time; redeploy after changing it |
| Render cold start (slow first load) | Normal on free/starter — first request wakes the service |
| Old data / empty lists | Run `npm run db:seed` against production Atlas (once) |

---

## Custom domain (optional)

- **Vercel**: Project → Settings → Domains → add e.g. `lab.tyagipathology.com`
- **Render**: Service → Settings → Custom Domain → add e.g. `api.tyagipathology.com`
- Update `VITE_API_URL` and `CLIENT_URL` to match, then redeploy both.

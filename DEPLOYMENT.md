# 🚀 PitchPlay — Production Deployment Guide

This guide provides step-by-step instructions to deploy the **PitchPlay Fantasy Cricket Platform** to any server or cloud platform (Docker, VPS, Render, Railway, Vercel, Netlify, DigitalOcean, AWS, GCP).

---

## 🏗️ Architecture Overview

| Component | Technology | Default Port | Production Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Lucide/Phosphor Icons | `3000` / `80` | Player & Admin Mobile-Responsive Web Application |
| **Backend** | Python 3.11+, FastAPI, Motor, Uvicorn | `8000` | REST API, Auth, Payment Gateways, Contest Engine |
| **Database** | MongoDB 6.0+ | `27017` | Persistent Database (Users, Contests, Entries, Logs) |
| **Payments** | Razorpay Live Gateway & UPI Intent | — | Real-time Card/UPI deposits & 1-Tap UPI payouts |

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A **MongoDB Database**:
   - Either hosted on **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** (Free Tier recommended)
   - Or running locally via Docker / system service.
2. **Razorpay API Credentials** (Optional, can also be configured via Admin UI):
   - **Key ID**: `rzp_live_...` or `rzp_test_...`
   - **Key Secret**: `...`
3. A Git repository hosting this code (GitHub, GitLab, or Bitbucket).

---

## 🌐 Option 1: 1-Click Docker Compose (Any VPS / DigitalOcean / AWS / GCP)

This is the fastest and most complete deployment method. It runs MongoDB, Backend, and Frontend in unified Docker containers with automatic restart and persistent volumes.

### 1. Clone your repository on your server
```bash
git clone <your-git-repo-url> pitchplay
cd pitchplay
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env   # Or edit with any text editor
```

Update your `.env` variables:
```env
MONGO_URL=mongodb://mongo:27017
DB_NAME=pitchplay
JWT_SECRET=use_a_strong_random_secret_key_here
ADMIN_MOBILE=9602341799
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_UPI_ID=yourname@upi
CORS_ORIGINS=*
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Build & Run
```bash
docker compose up -d --build
```

### 4. Check Status
```bash
docker compose ps
docker compose logs -f
```
Your application will be live at:
- Frontend: `http://<your-server-ip>`
- Backend API: `http://<your-server-ip>:8000/api`
- Admin App: `http://<your-server-ip>/admin`

---

## ☁️ Option 2: Render.com (Full-Stack Blueprint)

Render allows you to deploy both frontend and backend using the included [`render.yaml`](render.yaml) blueprint.

1. Push your repository to **GitHub**.
2. Log into **[render.com](https://render.com)**.
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect [`render.yaml`](render.yaml) and configure:
   - `pitchplay-backend` (FastAPI Web Service)
   - `pitchplay-frontend` (React Static Site with client-side SPA routing)
6. Under Environment Variables:
   - Provide your **MongoDB Atlas connection string** for `MONGO_URL`.
   - Provide your `ADMIN_MOBILE`, `ADMIN_PASSWORD`, and Razorpay keys.
7. Click **Apply** to deploy!

---

## ⚡ Option 3: Split Deploy (Frontend on Vercel + Backend on Railway/Render)

This is the recommended modern architecture for high-performance global CDN edge distribution.

### Step A: Deploy Backend (Railway / Render / Fly.io)
1. **Create MongoDB on MongoDB Atlas**:
   - Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Add a database user (e.g. `pitchplay_admin`).
   - Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere).
   - Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`
2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**.
   - Select the repository.
   - In Settings, set **Root Directory** to `backend`.
   - In Variables, add:
     - `MONGO_URL` = `mongodb+srv://...`
     - `DB_NAME` = `pitchplay`
     - `JWT_SECRET` = `super_secure_random_key`
     - `ADMIN_MOBILE` = `9602341799`
     - `ADMIN_PASSWORD` = `admin123`
     - `ADMIN_UPI_ID` = `9602341799@upi`
     - `CORS_ORIGINS` = `*`
   - Railway will provide a public URL: `https://pitchplay-backend.up.railway.app`

### Step B: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Create React App`
4. Add Environment Variable:
   - `REACT_APP_BACKEND_URL` = `https://pitchplay-backend.up.railway.app` (your backend URL from Step A)
5. Click **Deploy**! Vercel will build and serve your app globally on HTTPS with custom domain support.

---

## 🔒 Post-Deployment Admin Setup

1. Open your live frontend URL and navigate to `/admin` (e.g. `https://your-domain.com/admin`).
2. Log in with your admin mobile and password (default `9602341799` / `admin123`).
3. Immediately go to **Settings**:
   - Change your default admin password.
   - Configure your **Receiving UPI ID** (e.g. `yourname@okaxis` or PhonePe/GPay QR).
   - Enter your **Razorpay Key ID** and **Key Secret**.
   - Click **⚡ Test Razorpay Connection** to verify connection to live servers.
   - Click **Save Razorpay Configuration**.
4. Go to **Contests** and create your fantasy matches!

---

## 🛡️ Production Checklist

- [ ] `JWT_SECRET` changed from default to a strong 64+ char random string.
- [ ] MongoDB Atlas has authentication enabled and whitelisted IPs.
- [ ] Razorpay webhook URL configured (optional for real-time order verification).
- [ ] SSL / HTTPS enabled on domain (automatic on Vercel, Netlify, Render, and Railway).
- [ ] Admin password changed from `admin123`.

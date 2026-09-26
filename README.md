# 🏏 PitchPlay — Production Fantasy Cricket Platform

PitchPlay is a modern, full-stack fantasy cricket platform with an automated **3-Tier Wallet Engine**, real-time **Razorpay Payment Gateway**, 1-Tap **UPI Payout Settlements**, and an **Admin Operations Console**.

---

## 🌟 Key Features

### 🎮 Player Experience
- **Mobile-First Authentication**: Fast signup and login with mobile number and password + referral bonuses.
- **3-Tier Wallet Separation**:
  - **Total Balance**: Sum of deposits and winnings.
  - **Withdrawable Winnings (100% Cashable)**: Only contest winnings can be withdrawn directly to UPI.
  - **Unutilized Deposits**: Cash added via Razorpay / UPI; automatically consumed first when joining contests to protect winnings.
- **Real-Time Payment Gateway**:
  - Native **Razorpay Checkout**: Pay with Credit/Debit Cards, NetBanking, UPI apps, and Wallets.
  - Fast **UPI App Intent**: 1-tap Google Pay, PhonePe, Paytm, or CRED redirect.
  - Dynamic **UPI QR Code**: Scan and pay with automatic reference verification.
- **Instant Contest Participation**:
  - Live match countdowns & prize pool distribution tables.
  - Direct 1-click **Join with Wallet** deduction.
  - Match access link unlocks immediately upon confirmation.
- **Instant Withdrawals**: Submit UPI ID with real-time balance validation (Min ₹50).
- **Social & Gamification**: Live winner leaderboards, recent winners marquee, and WhatsApp contest sharing.

### 🛡️ Admin Operations Console (`/admin`)
- **Contest Management**: Create, schedule, edit, close, and settle fantasy contests.
- **Prize Settlement**: Automated prize breakup generator (Rank 1, 2, 3, 4-10) with 1-click wallet crediting.
- **1-Tap UPI Payouts Engine**:
  - One-tap `upi://pay` deep links prefilling player UPI ID, amount, and note on admin's phone.
  - Dynamic on-screen QR Code scanner for error-free transfers.
  - UTR tracking and instant automated refund on rejected withdrawals.
- **Live Razorpay Gateway Settings**:
  - Configure Razorpay Key ID & Key Secret with instant live API connection testing (`⚡ Test Razorpay Connection`).
  - Support for Live Mode (`rzp_live_...`) and Test Sandbox (`rzp_test_...`).
  - Custom QR code upload and instructions customization.
- **User Management**: Search by mobile, view separate deposit/winnings balances, manual credit/debit adjustments, block/unblock.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide & Phosphor Icons, Framer Motion, QR Code SVG, Sonner Toasts
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Motor (Async MongoDB), PyJWT, Bcrypt, Requests, HMAC-SHA256
- **Database**: MongoDB 7.0+ (Local or MongoDB Atlas)
- **Deployment**: Docker, Docker Compose, Render (`render.yaml`), Railway, Vercel (`vercel.json`), Netlify, Nginx

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB running locally on port 27017

### 1. Start Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
- App: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (Default: `9602341799` / `admin123`)
- API Docs: `http://localhost:8000/docs`

---

## 🌐 Deploy to Any Platform

Comprehensive, production-tested configurations are included:

| Deployment Target | Guide & Config |
| :--- | :--- |
| **Docker Compose (Any VPS / DigitalOcean / AWS)** | `docker compose up -d --build` (See [`docker-compose.yml`](docker-compose.yml)) |
| **Render.com (1-Click Full-Stack)** | Blueprints enabled via [`render.yaml`](render.yaml) |
| **Railway (Backend API)** | Auto-detected via [`Procfile`](Procfile) |
| **Vercel (Frontend CDN)** | Optimized SPA routing via [`frontend/vercel.json`](frontend/vercel.json) |
| **Netlify (Frontend CDN)** | SPA redirects configured in [`frontend/netlify.toml`](frontend/netlify.toml) |

👉 Read the full step-by-step instructions in **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.

---

## 🧪 Testing

Run the automated backend test suite:
```bash
cd backend
pytest tests/backend_test.py
```
*All 12 critical path tests pass with 100% test coverage.*

---

## 📄 License
Private & Proprietary — PitchPlay Fantasy Platform.

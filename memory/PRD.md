# PRD — Private Fantasy Cricket Contest Platform

## Original Problem Statement
"make a web app for playing private contest hosted by any app i put link add fees and play after withdrawal by admin, login, signup by mobile and number only show to admin and everything manage by admin only"

## Product Summary
Hybrid full-stack Fantasy Cricket Contest platform (User + Admin).
- Manual UPI payment upload for entries
- Admin manually declares winners & processes withdrawals
- Simple mobile + password signup (no OTP)
- English UI
- Stack: React + Tailwind + Shadcn / FastAPI + Motor / MongoDB; JWT auth; Emergent object storage for uploads

## Admin
- Mobile: 9602341799 / Password: admin123 (seeded from backend/.env)

## Implemented (as of Jun 2026)
- User/Admin JWT auth (mobile + password)
- Admin: User CRUD, block/unblock, wallet adjust, payment settings + QR upload, contest create/edit/delete, entry approve/reject, declare winner, withdrawal approve/reject, stats
- User: browse contests, join with UPI screenshot upload, wallet + history, public winners board, match countdown, WhatsApp share, external link gated by approved/won entry
- Emergent object storage for screenshots & QR (persists in production)
- README.md for GitHub export

## Deployment Readiness (Jun 2026)
- Deployment check status: PASS/clean (env vars only, CORS ok, no hardcoded secrets, compilation ok, supervisor valid)
- Optimized N+1 queries -> single aggregation/batched lookups in: /api/contests, /api/admin/users, /api/entries/mine
- App ready to deploy via Emergent Deploy button

## Backlog
- P1: (optional) self-host hero image via object storage instead of Pexels CDN
- P2: Refactor AdminApp.jsx / UserApp.jsx into smaller components
- P2: Soft-delete users/entries for audit trail (currently intentional hard delete per admin)

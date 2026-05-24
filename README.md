# Allo Inventory System

A multi-warehouse inventory reservation system built with Next.js, PostgreSQL, and Redis.

**Live URL:** https://allo-inv-one.vercel.app

## What it does

When a customer clicks Reserve, the system holds the units for 10 minutes while they complete payment. If two customers try to reserve the last unit at the same time, exactly one succeeds and the other sees a clear error message.

## How to run locally

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your values
4. Run migrations: `npx prisma migrate dev`
5. Seed database: `npx prisma db seed`
6. Start server: `npm run dev`

## How the race condition is solved

Two requests arriving simultaneously for the last unit is the core problem.

**Layer 1 — Redis distributed lock:**
When a reservation request arrives, it tries to acquire a Redis lock using `SET NX` (set if not exists). Only one request wins the lock. The other returns a 409 immediately without touching the database. The lock lasts 5 seconds — just enough to cover the database transaction.

**Layer 2 — Prisma transaction:**
Inside the lock, we check available stock and increment reserved count in a single database transaction. This is a second line of defence if Redis is unavailable.

## How expiry works

Reservations expire after 10 minutes. Three mechanisms release expired reservations:

1. **Lazy cleanup** — every time the products page loads, expired reservations are released in the background
2. **Eager check on confirm** — if a user tries to confirm an expired reservation, it returns 410 immediately
3. **Cron job** — runs hourly to clean up any remaining expired reservations

## Trade-offs made

- No user authentication — reservations are identified by ID in the URL
- Quantity is fixed at 1 per reservation in the UI (API supports any quantity)
- Stock counts on product page don't auto-refresh after reserving

## Stack

- **Next.js 14** — App Router, API routes
- **PostgreSQL** (Supabase) — main database
- **Redis** (Upstash) — distributed locking
- **Prisma** — ORM
- **Tailwind CSS** — styling
- **Zod** — input validation
- **Vercel** — deployment
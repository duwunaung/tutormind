# TutorMind

An AI-powered tutoring assistant built with Next.js, Prisma (Neon), and NextAuth.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth v5 (Credentials provider)
- **Database:** PostgreSQL via Neon + Prisma ORM
- **AI:** Google Gemini + Groq
- **Storage:** Vercel Blob

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in values
2. Run `npx prisma migrate dev` to apply migrations
3. Run `npm run dev` to start the dev server

## Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `GEMINI_API_KEY` | Google Generative AI key |
| `GROQ_API_KEY` | Groq API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
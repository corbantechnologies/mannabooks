# MannaBooks (web app)

Next.js 16 frontend and backend-for-frontend (BFF) for MannaBooks. All business data lives in the FastAPI
service (`mannabooksapi`); this app renders the UI, holds the session cookies, sends email (Resend), stores
uploads (MinIO), and receives webhooks (M-Pesa subscription billing, Resend) and Vercel crons.

## Local development

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill it in. Use `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally, and the
same `INTERNAL_API_KEY` as the API. Start the API first (see `../mannabooksapi/README.md`), then:

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run lint` (must report 0 errors), `npx tsc --noEmit`.

## How it talks to the API
- **Browser → API:** `src/lib/api/axios.ts` calls `/api/v1/*`, which `next.config.ts` rewrites to the API's `/v1/*`.
  The HttpOnly session cookie goes along automatically; JavaScript never sees a token. Writes send
  `X-Requested-With` (the API's CSRF check).
- **Server → API:** `src/lib/api/client.ts` (Server Components, Route Handlers, Server Actions) adds
  `X-Internal-Key` and the user's token from the cookie. Use `{ anonymous: true }` for public calls.
- **Sessions:** `access_token` (15-minute JWT) + `mb_refresh` (rotating refresh token), both HttpOnly.
  `src/proxy.ts` silently refreshes an expiring access token on page loads and API calls. Sessions last up to
  30 days and end after 12 hours of inactivity. Login, registration and logout are Server Actions in `src/lib/actions/`.

## Route handlers (`src/app/api`)
| Route | Purpose | Protection |
|---|---|---|
| `billing/*` | Subscription upgrades via M-Pesa STK Push (MannaBooks' own paybill) | Session; callback needs `MPESA_CALLBACK_SECRET` |
| `payments/c2b-callback` | Disabled (410): workspaces have no M-Pesa collection yet | — |
| `documents/email`, `catalog/send-email` | Email documents / catalog links | Session + workspace membership |
| `catalog/[slug]/quote` | Public "request a quote" | Honeypot + API rate limits |
| `auth/forgot-password`, `contact` | Password reset email, contact form | Generic responses, API rate limits |
| `upload/minio` | Attachments | Session + membership, type sniffing |
| `cron/*` | Vercel crons | `Authorization: Bearer $CRON_SECRET` |
| `webhooks/resend` | Email delivery events | Svix signature (`RESEND_WEBHOOK_SECRET`) |

## Deployment (Vercel)
Environment variables are listed in `.env.example` and `../ENVIRONMENT_VARIABLES.md`. Deploy the API first when
both change. Crons are defined in `vercel.json` (they run on Production deployments only).

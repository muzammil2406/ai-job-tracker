# AI Job Application Assistant

Full-stack AI-powered resume analysis and cold email generation tool. Upload a resume PDF, paste a job description, and get instant ATS match scoring, skill gap analysis, and AI-generated cold outreach emails.

## Live URLs

| Service | URL |
|---|---|
| **Frontend** | https://frontend-xi-ochre-68.vercel.app |
| **Backend API** | https://ai-job-tracker-backend-beige.vercel.app |
| **Swagger Docs** | https://ai-job-tracker-backend-beige.vercel.app/api |

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS, Prisma ORM, PostgreSQL (Neon.tech)
- **AI:** Groq API (llama-3.3-70b-versatile via OpenAI SDK)
- **Auth:** JWT (bcrypt + passport)
- **Hosting:** Frontend on Vercel, Backend on Vercel (serverless function)

## Features

- User registration & JWT-based authentication
- PDF resume upload & text extraction (pdf-parse)
- AI-powered resume-JD match scoring (0-100)
- Matched/missing skills identification
- Bullet-point resume improvement suggestions
- Cold email generation per role/JD
- Analysis history page
- Swagger API documentation

## Project Structure

```
├── backend/                # NestJS API
│   ├── api/index.js        # Vercel serverless entry point
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── analyze/        # Resume analysis + cold email
│   │   ├── auth/           # Register/login (JWT)
│   │   ├── resume/         # Resume CRUD
│   │   └── prisma/         # Database service
│   └── vercel.json
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── analyze/
│   │   └── history/
│   └── lib/api.ts          # API client
└── vercel.json             # Monorepo root config
```

## Environment Variables

### Backend
- `DATABASE_URL` — PostgreSQL connection string (Neon.tech)
- `GROQ_API_KEY` — Groq API key
- `JWT_SECRET` — Secret for signing JWTs
- `FRONTEND_URL` — Allowed CORS origin
- `NODE_ENV` — `production`

### Frontend
- `NEXT_PUBLIC_API_URL` — Backend API base URL

## Local Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login |
| POST | /analyze/resume | JWT | Upload PDF + job description for analysis |
| POST | /analyze/cold-email | JWT | Generate cold email |
| GET | /resume | JWT | List saved resumes |
| POST | /resume | JWT | Save a resume version |
| DELETE | /resume/:id | JWT | Delete a resume |
| GET | /api | No | Swagger UI |

## Deployment

The backend deploys to Vercel as a serverless function. The build pipeline:
1. `npm install --include=dev` installs all deps
2. `npx prisma generate` generates Prisma client
3. `npm run build` (`nest build`) compiles TypeScript
4. Vercel bundles `api/index.js` with the compiled dist

```bash
# Deploy backend
cd backend
vercel deploy --prod

# Deploy frontend
cd frontend
vercel deploy --prod
```

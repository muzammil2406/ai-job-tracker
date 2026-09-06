# AI Job Application Assistant

Full-stack AI-powered resume analysis and cold email generation tool. Upload a resume PDF, paste a job description, and get instant ATS match scoring, skill gap analysis, and AI-generated cold outreach emails.

## Live URLs

| Service | URL |
|---|---|
| **Frontend** | [https://frontend-xi-ochre-68.vercel.app](https://frontend-xi-ochre-68.vercel.app) |
| **Backend REST API** | https://ai-job-tracker-backend-beige.vercel.app |
| **GraphQL API** | https://ai-job-tracker-backend-beige.vercel.app/graphql |
| **Swagger Docs** | https://ai-job-tracker-backend-beige.vercel.app/api |

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Apollo Client (GraphQL + REST)
- **Backend:** NestJS, GraphQL (Apollo Server, code-first), Prisma ORM, PostgreSQL (Neon.tech)
- **AI:** Groq API (llama-3.3-70b-versatile via OpenAI SDK)
- **Auth:** JWT (bcrypt + passport-jwt)
- **Hosting:** Vercel (serverless functions)

## Features

- User registration & JWT-based authentication
- PDF resume upload & text extraction (pdf-parse)
- AI-powered resume-JD match scoring (0-100)
- Matched/missing skills identification
- Bullet-point resume improvement suggestions
- Cold email generation per role/JD
- Analysis history page (GraphQL-powered, paginated)
- Swagger API documentation
- Archive report tool for stale resumes (Knex + CSV export)

## Architecture

```
┌──────────────┐    REST + GraphQL     ┌──────────────────────────┐
│   Frontend   │ ──────────────────►   │   NestJS Backend         │
│   Next.js    │   Apollo Client       │   ├─ REST controllers    │
│   + Apollo   │                       │   ├─ GraphQL resolvers   │
└──────────────┘                       │   ├─ Auth (JWT)          │
                                       │   ├─ Analyze (Groq AI)   │
                                       │   └─ Prisma ORM          │
                                       └──────────┬───────────────┘
                                                  │
                                       ┌──────────▼───────────────┐
                                       │  PostgreSQL (Neon.tech)  │
                                       │  Resume, Analysis, User  │
                                       └──────────────────────────┘

                                       ┌──────────────────────────┐
                                       │  database-tools/         │
                                       │  Knex migration + CSV    │
                                       │  archive report          │
                                       └──────────────────────────┘
```

## Project Structure

```
├── backend/                # NestJS API
│   ├── api/index.js        # Vercel serverless entry point
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── analyze/        # Resume analysis + cold email
│   │   ├── auth/           # Register/login (JWT)
│   │   ├── resume/         # Resume CRUD
│   │   ├── graphql/        # GraphQL resolvers, types, guards
│   │   └── prisma/         # Database service
│   └── vercel.json
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── analyze/
│   │   └── history/
│   ├── components/
│   │   └── ApolloProvider.tsx
│   └── lib/api.ts          # API client
├── database-tools/         # Standalone data tooling
│   ├── src/archive-report.ts
│   ├── migrations/
│   ├── knexfile.js
│   └── package.json
└── README.md
```

## API

### REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login |
| POST | /analyze/resume | JWT | Upload PDF + job description for analysis |
| POST | /analyze/cold-email | JWT | Generate cold email |
| GET | /resume/history | JWT | List resume history |
| POST | /resume/save | JWT | Save a resume version |
| DELETE | /resume/:id | JWT | Delete a resume |

### GraphQL

```graphql
type Query {
  resumeHistory(page: Int!, pageSize: Int!): ResumeHistoryPage!
  jobMatch(resumeId: ID!, jobDescription: String!): JobAnalysis!
}

type Mutation {
  analyzeResume(input: AnalyzeResumeInput!): MatchHistory!
}
```

GraphQL Playground is available in development at `/graphql`.

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon.tech) |
| `GROQ_API_KEY` | Groq API key for AI analysis |
| `JWT_SECRET` | Secret for signing JWTs |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `https://frontend-xi-ochre-68.vercel.app`) |
| `NODE_ENV` | `production` |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

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

The frontend runs on http://localhost:3000, the backend on http://localhost:3001.

### Database Tools

```bash
cd database-tools
cp .env.example .env    # Fill in DATABASE_URL
npm install
npx ts-node src/archive-report.ts
```

Exports stale resumes (no analysis in 90+ days) to `reports/stale-resumes.csv`.

## Deployment

The backend deploys to Vercel as a serverless function. The build pipeline:

1. `npm install --include=dev` installs all deps
2. `npx prisma generate` generates Prisma client
3. `npx prisma db push` syncs schema to database
4. `npm run build` (`nest build`) compiles TypeScript
5. Vercel bundles `api/index.js` with the compiled dist + Prisma client

```bash
# Deploy backend
cd backend
vercel deploy --prod

# Deploy frontend
cd frontend
vercel deploy --prod
```

Both projects are linked to Vercel. The Prisma client is generated at build time and bundled via `includeFiles` in `vercel.json` to work in the read-only serverless filesystem.

## License

MIT

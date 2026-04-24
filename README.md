`1# SmartSeason - Field Operations Monitor

SmartSeason is a full-stack web application for coordinating field visits, crop progress, and harvest readiness across multiple farms during a growing season.

It is built with:

- Node.js + Express
- React + Vite
- PostgreSQL + Prisma
- JWT authentication

What makes this version different from a generic CRUD dashboard is the decision-support layer. Every field now returns an explainable operations insight with:

- crop-aware monitoring thresholds
- risk reasons
- recommended next action
- priority score
- priority bucket for the dashboard queue

## Why This Project Stands Out

Most assessment apps stop at "field is at risk." SmartSeason goes one step further and answers:

- Why is it at risk?
- How urgent is it?
- What should the team do next?

That logic is visible in both the API payload and the interface.

### Example insight payload

```json
{
  "status": "AT_RISK",
  "insight": {
    "summary": "Maize has been sitting at ready stage for 12 days, which is 2 days beyond the recommended harvest window.",
    "nextAction": "Escalate harvest logistics for maize within 24 hours and confirm labor, transport, and storage.",
    "priorityScore": 87,
    "priorityBucket": "IMMEDIATE",
    "reasons": [
      {
        "code": "READY_OVERDUE",
        "severity": "critical",
        "title": "Harvest window is slipping",
        "detail": "Maize has been sitting at ready stage for 12 days, which is 2 days beyond the recommended harvest window."
      }
    ],
    "cropProfile": {
      "name": "Maize",
      "staleAfterDays": 6,
      "readyAfterDays": 10,
      "maxGrowingDays": 120
    }
  }
}
```

## Features

- Role-based views for coordinators and field agents
- Field creation, editing, assignment, and deletion
- Field update timeline with stage changes and notes
- Crop-aware risk detection for maize, wheat, beans, sorghum, cassava, and sunflower
- Dashboard priority queue ranked by urgency
- Explainable field detail screen with reasons, next action, and crop benchmark thresholds
- Realistic seeded demo data for Kenyan field operations

## Quick Start

### Prerequisites

- Node.js 18 or newer
- PostgreSQL running locally or remotely

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Create `backend/.env` from `backend/.env.example` and update:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/smartseason"
JWT_SECRET="change-this-to-a-long-random-secret"
PORT=5000
```

### 3. Generate schema and seed demo data

```bash
npm run db:setup
```

### 4. Start the app

In two terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

## Demo Credentials

- Coordinator: `admin@smartseason.com` / `admin123`
- Agent James: `james@smartseason.com` / `agent123`
- Agent Aisha: `aisha@smartseason.com` / `agent123`
- Agent Peter: `peter@smartseason.com` / `agent123`

## Demo Story Built Into The Seed Data

The seeded records are designed to give you a strong live demo:

- `Mwea Block 7A` is a ready maize field whose harvest window is slipping.
- `Nyeri Highlands Block B` is a sunflower field that is ready but overdue for action.
- `Kisumu Lowland Cassava` is stale and also beyond its expected crop cycle.
- `Naivasha Trial Bed` is planted but unassigned, which creates an operational accountability risk.
- Other fields remain healthy so the dashboard shows contrast, not just failure states.

## Architecture Notes

- Controllers own business logic while routes stay thin.
- Status is computed dynamically rather than stored.
- Crop-specific heuristics live in `backend/src/middleware/fieldStatus.js`.
- Frontend screens consume the backend insight object instead of duplicating business rules in React.

## API Surface

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/agents`

### Fields

- `GET /api/fields`
- `GET /api/fields/:id`
- `POST /api/fields`
- `PUT /api/fields/:id`
- `DELETE /api/fields/:id`
- `GET /api/fields/stats/summary`
- `POST /api/fields/:id/updates`

### Updates

- `GET /api/updates/recent`

## Presentation Help

Use [PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md) for:

- a 4-minute live demo flow
- the story to tell recruiters
- a strong answer if they ask whether you used AI

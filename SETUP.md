# Flash Cards App - Setup and Run Guide

## Prerequisites
- Node.js (v18 or higher)
- npm
- PostgreSQL (for native dev) or Docker (for containerized deployment)

## Option A: Docker Deployment (Recommended for production)

### 1. Configure Environment

Copy the example env file and adjust if needed:
```bash
cp .env.example .env
```

### 2. Start Everything

```bash
docker compose up --build
```

This starts PostgreSQL and the app. The database schema is automatically created on first run.

The app will be available at `http://localhost:3001`

## Option B: Native Development

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Set Up PostgreSQL

Make sure PostgreSQL is running locally. Create a database:

```bash
createdb flashcards
```

### 3. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env if your PostgreSQL connection differs from the defaults
```

### 4. Run Migrations and Seed

```bash
cd server
npm run db:migrate
npm run db:seed
cd ..
```

### 5. Run the Application

You need to run both the frontend and backend servers simultaneously.

**Terminal 1: Start Backend (Node.js)**
```bash
cd server
npm run dev
```

The API will be available at `http://localhost:3001`

**Terminal 2: Start Frontend (Vite)**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Using the Application

1. Open your browser to `http://localhost:3000` (dev) or `http://localhost:3001` (Docker)
2. Register an account or log in
3. Create a deck or use the seeded "Spanish Basics" deck
4. Click on a deck to select it
5. Choose your practice direction:
   - Spanish -> English (see Spanish word, reveal English translation)
   - English -> Spanish (see English word, reveal Spanish translation)
6. Click "Start Practice"
7. Click on the card to flip and reveal the answer
8. Self-assess by clicking "Got It" or "Missed It"
9. Complete the session to see your results

## Project Structure

```
my-flash-cards/
├── src/                    # Frontend source code
│   ├── components/        # Reusable Vue components
│   ├── views/            # Page-level components
│   ├── store/            # Pinia stores
│   ├── router/           # Vue Router setup
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript types
│   └── main.ts           # App entry point
├── server/               # Backend source code
│   ├── src/
│   │   ├── index.ts      # Hono API server
│   │   ├── schema.ts     # Drizzle ORM schema (PostgreSQL)
│   │   ├── db.ts         # Database connection
│   │   ├── auth.ts       # Authentication utilities
│   │   ├── spacedRepetition.ts  # SM-2 algorithm
│   │   └── types.ts      # TypeScript types
│   └── migrations/       # Database migrations
│       ├── 001_initial_schema.sql  # Full schema
│       └── seed.sql      # Seed data
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # PostgreSQL + app services
└── package.json          # Frontend dependencies
```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/decks` - Get all decks for current user
- `POST /api/decks` - Create a new deck
- `PUT /api/decks/:deckId` - Update a deck
- `DELETE /api/decks/:deckId` - Delete a deck
- `GET /api/decks/:deckId/cards` - Get all cards in a deck
- `POST /api/decks/:deckId/cards` - Create a card
- `PUT /api/cards/:cardId` - Update a card
- `DELETE /api/cards/:cardId` - Delete a card
- `POST /api/attempts` - Record a practice attempt
- `GET /api/decks/:deckId/due-cards` - Get cards due for review
- `GET /api/decks/:deckId/stats` - Get deck statistics
- `GET /api/decks/:deckId/export` - Export a deck as JSON
- `POST /api/decks/import` - Import a deck from JSON

## Troubleshooting

### Database connection errors
Make sure PostgreSQL is running and the `DATABASE_URL` in your `.env` file is correct.

### Port already in use
If port 3000 or 3001 is already in use:
- Frontend: Edit `vite.config.ts` and change the `server.port` value
- Backend: Set the `PORT` env variable in `server/.env`

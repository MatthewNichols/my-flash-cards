# Flash Cards App - Setup and Run Guide

## Prerequisites
- Node.js (v18 or higher)
- npm

## Initial Setup

### 1. Install Dependencies

Frontend dependencies are already installed. Backend dependencies are already installed.

If you need to reinstall:
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Set Up Database

Create and seed the local D1 database:

```bash
cd server

# Create local D1 database
npx wrangler d1 create flash-cards-db --local

# Run migrations to create tables
npm run db:migrate

# Seed the database with Spanish vocabulary
npm run db:seed

cd ..
```

## Running the Application

You need to run both the frontend and backend servers simultaneously.

### Terminal 1: Start Backend (Cloudflare Workers)
```bash
cd server
npm run dev
```

The API will be available at `http://localhost:8787`

### Terminal 2: Start Frontend (Vite)
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Using the Application

1. Open your browser to `http://localhost:3000`
2. You should see the "Spanish Basics" deck
3. Click on the deck to select it
4. Choose your practice direction:
   - Spanish → English (see Spanish word, reveal English translation)
   - English → Spanish (see English word, reveal Spanish translation)
5. Click "Start Practice"
6. Click on the card to flip and reveal the answer
7. Self-assess by clicking "Got It" or "Missed It"
8. Complete the session to see your results

## Project Structure

```
my-flash-cards/
├── src/                    # Frontend source code
│   ├── components/        # Reusable Vue components
│   ├── views/            # Page-level components
│   │   ├── DeckList.vue
│   │   ├── PracticeSession.vue
│   │   └── SessionResults.vue
│   ├── store/            # Pinia stores
│   │   └── session.ts
│   ├── router/           # Vue Router setup
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript types
│   └── main.ts           # App entry point
├── server/               # Backend source code
│   ├── src/
│   │   ├── index.ts      # Hono API worker
│   │   ├── schema.ts     # Drizzle ORM schema
│   │   └── types.ts      # TypeScript types
│   └── migrations/       # Database migrations
│       ├── schema.sql    # Database schema
│       └── seed.sql      # Seed data
└── package.json          # Frontend dependencies
```

## API Endpoints

- `GET /api/decks` - Get all available decks
- `GET /api/decks/:deckId/cards` - Get all cards for a specific deck

## Troubleshooting

### Database not created
If you see errors about the database not existing, make sure you ran:
```bash
cd server
npx wrangler d1 create flash-cards-db --local
npm run db:migrate
npm run db:seed
```

### Port already in use
If port 3000 or 8787 is already in use, you can change them:
- Frontend: Edit `vite.config.ts` and change the `server.port` value
- Backend: Wrangler will prompt you to use a different port

### CORS errors
The backend is configured with CORS enabled for local development. If you see CORS errors, verify both servers are running.

## Next Steps (Future Phases)

- Phase 2: Card creation UI, authentication, progress tracking
- Phase 3: Spaced repetition algorithm, multiple decks
- Phase 4: Images on cards, quick quiz mode, random direction mode

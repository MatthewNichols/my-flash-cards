# Claude Context

## Project Overview
- This is a bespoke flash cards application primarily designed for learning Spanish. I want to be able to easily create, review, and manage flash cards to aid in language acquisition. 
- Target audience: myself, but potentially others interested in language learning.
- Main features: creating flash cards, spaced repetition review system, categorization of cards by topics, tracking progress and success rate.
- UI should be usable in desktop, tablet, and mobile viewports.

## Tech Stack
- Languages used (Typescript everywhere, SASS/SCSS)
- Frontend framework (Vue 3 (Composition API, setup script) with Vite, Pinia for state management, Vue Router for routing, Vanilla CSS (via SASS/SCSS))
  - UI breakpoints: mobile (up to 600px), tablet (601px to 900px), desktop (901px and above)
- Backend 
  - Cloudflare Workers with D1 storage accessed via Drizzle ORM
  - Image storage (Cloudflare R2)
  - Authentication (Cloudflare Access)
- Build tools (Vite)
- Testing frameworks (Vitest for unit tests, Cypress for end-to-end tests) 

## Project Structure
- Project root should be kept clean with separate folders for frontend (src/) and backend (server/)
- Frontend structure
  - src/
    - components/ (reusable Vue components)
    - views/ (page-level components)
    - store/ (Pinia stores)
    - router/ (Vue Router setup)
    - assets/ (static assets like images, fonts)
    - styles/ (global styles, variables, mixins)
    - utils/ (utility functions)
- Backend structure
  - server/
    - routes/ (API route handlers)
    - models/ (database models using Drizzle ORM)
    - controllers/ (business logic)
    - utils/ (helper functions)
## Development Guidelines
### Code Style
- In Vue components, use the Composition API with setup script syntax. Always define props and emits using defineProps and defineEmits at the top of the script section.
- Use single-file components (.vue files) for all Vue components.
- Use SCSS for styling, scoped styles in Vue components where appropriate.
- In VUE components, always order sections as: script, template, style.
- Use Typescript for all code.
- Absolutely no implicit `any`. Avoid `any` type unless absolutely necessary; prefer strict typing.
- Follow consistent naming conventions (e.g., camelCase for variables and functions, PascalCase for component names).
- DO NOT use Prettier or any auto-formatting tools; formatting should be done manually to my preferences.
- Comment block on all functions and complex logic.

### Testing Strategy
- All tests occur in local development environment; no CI/CD integration for tests.
- Unit test approach: Vitest with component testing for Vue components
- Integration test approach: End to end using ephemeral local Cloudflare Workers environment
- Where tests live:
  - Unit tests alongside components in __tests__ folders
  - E2E tests in a separate e2e/ folder at project root

### Git Workflow
- Branch naming convention example: jan-04-feature-description
- Frequent commits with clear messages
- Long commit messages are fine
- dev branch for ongoing development, main branch for stable releases
- Pull requests for all changes to dev branch, self-review before merging. Merge to main via PR only from dev after testing.

## Architecture Decisions
-  Using Cloudflare Workers for backend to leverage serverless architecture and global distribution.
-  Using D1 with Drizzle ORM for lightweight, SQL-based storage that fits the app's needs.
-  Vue 3 with Composition API for modern, flexible frontend development.

## Project Phases

### Phase 1: Core Flashcard Practice MVP ✅
**Goal:** Working end-to-end flashcard practice experience

**Core User Flow:**
1. View available deck(s) of Spanish flashcards
2. Start a practice session and choose direction (Spanish → English OR English → Spanish)
3. See front of card → click to reveal back → self-assess as "Got it" or "Missed it"
4. Complete session and see basic results (X correct, Y missed)

**What's Included:**
- Backend:
  - Database schema: `decks` table (id, name) and `cards` table (id, front_text, back_text, deck_id)
  - API endpoint: `GET /api/decks/:deckId/cards`
  - Seed script with one Spanish deck containing 10-20 cards
  - No authentication (defer to Phase 2)
- Frontend:
  - DeckList view (shows available decks)
  - PracticeSession view (card flip, direction selection, self-assessment)
  - SessionResults view (session summary with correct/missed counts)
  - Vue Router setup
  - Pinia store for session state
  - Responsive CSS (mobile/tablet/desktop breakpoints)

**Explicitly Deferred to Future Phases:**
- Creating/editing cards via UI (using seed data only)
- Spaced repetition algorithm (sequential or random card order for now)
- Progress tracking over time (session-level only)
- Authentication (Cloudflare Access)
- Images on cards (R2 storage)
- Multiple deck management
- "Quick quiz" mode (1-5 cards)
- Random direction mode (currently user chooses direction per session)

**Acceptance Criteria:**
- Can open app and see Spanish deck
- Can start practice session and select direction
- Can work through all cards with flip and self-assessment
- Can see session results
- Works on mobile, tablet, and desktop viewports

### Phase 2: Card and Deck Management ✅
**Goal:** Enable creating and managing flashcards and decks through the UI

**Core User Flow:**
1. Create new decks with custom names
2. Add new cards to existing decks (Spanish word + English translation)
3. Edit existing cards
4. Delete cards
5. View all cards in a deck (browse mode)

**What's Included:**
- Backend:
  - API endpoints:
    - `POST /api/decks` - Create new deck
    - `POST /api/decks/:deckId/cards` - Create new card
    - `PUT /api/cards/:cardId` - Update existing card
    - `DELETE /api/cards/:cardId` - Delete card
    - `GET /api/decks` - Update to include card count
- Frontend:
  - DeckManagement view (create/edit/delete decks)
  - CardEditor component (form for adding/editing cards)
  - CardBrowser view (view and manage all cards in a deck)
  - Navigation updates (add management section)
  - Form validation for card creation

**Explicitly Deferred to Future Phases:**
- Authentication (still deferred - Phase 4)
- Progress tracking over time (Phase 3)
- Spaced repetition algorithm (Phase 3)
- Images on cards (Phase 4)
- "Quick quiz" mode (Phase 4)
- Random direction mode (Phase 4)
- Bulk card import/export

**Acceptance Criteria:**
- Can create a new deck with a custom name
- Can add new Spanish-English card pairs to any deck
- Can edit existing cards
- Can delete cards
- Can browse all cards in a deck
- Form validation prevents empty cards
- All CRUD operations persist to database

### Phase 3: Progress Tracking and Spaced Repetition ✅
**Goal:** Track learning progress over time and implement intelligent card scheduling

**Core User Flow:**
1. System tracks each card attempt (correct/incorrect, timestamp)
2. Cards are scheduled based on spaced repetition algorithm
3. View historical performance stats per deck
4. See which cards need review

**What's Included:**
- Backend:
  - New table: `card_attempts` (card_id, correct, timestamp)
  - New table: `card_schedule` (card_id, next_review_date, interval, ease_factor)
  - Spaced repetition algorithm implementation (SM-2 or similar)
  - API endpoints for progress data
- Frontend:
  - Progress dashboard view (stats over time)
  - Scheduled review mode (practice only due cards)
  - Performance indicators per card
  - Study streak tracking

**Explicitly Deferred:**
- Authentication (Phase 4)
- Images on cards (Phase 4)
- "Quick quiz" mode (Phase 4)
- Random direction mode (Phase 4)

### Phase 4: Polish and Advanced Features
**Goal:** Add authentication and additional practice modes

**What's Included:**
- ✅ Quick quiz mode (1-5 card rapid practice)
- ✅ Random direction mode (system chooses Spanish→English or English→Spanish per card)
- ✅ Card tags/categories for filtering
- Export/import deck functionality
- Authentication via Cloudflare Access (deferred)
- Basic User Profile page (name, email, preferences - foundation for future features) (deferred)

## Backlog
Features planned for future development:

### Image Support
- R2 storage for card images
- Upload images during card creation/editing
- Display images on cards during practice
- Image management (delete, replace)

## Common Tasks
- How to add a new flash card deck & cards
- quick quiz: 1 - 5 card quiz from a selected deck
- practice session: longer session with spaced repetition algorithm
- viewing progress stats

## Known Issues & Limitations
- TBD

## Context for AI Assistance
- This project is a personal hobby project with a focus on learning and experimentation, particularly with AI-generated code. Claude can do as much of the coding as possible. I will take more the role of product owner and reviewer than traditional developer.
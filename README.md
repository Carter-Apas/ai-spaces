# Prompt Canvas

A real-time collaborative AI canvas application where users can generate content using natural language prompts. Multiple canvases can be created, and changes are synchronized in real-time across all connected users.

## Features

- **Multi-Canvas Support**: Create and manage multiple canvases on a single page
- **AI-Powered Generation**: Generate HTML/CSS/JS content or images from natural language prompts
- **Real-Time Sync**: All changes are instantly synchronized across users via Supabase Realtime
- **Fullscreen Mode**: Expand any canvas to fullscreen for detailed viewing
- **Content Classification**: Automatically determines whether to generate HTML content or images based on prompt analysis

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│    Supabase     │
│    (React)      │     │    (Express)    │     │    (Postgres)   │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ├──▶ Claude API (HTML generation)
        │                       │
        │                       └──▶ OpenAI API (Image generation)
        │
        └──▶ Supabase Realtime (live updates)
```

### How It Works

1. User clicks on a canvas and enters a prompt
2. Frontend sends the prompt to the backend API
3. Backend classifies the prompt (HTML vs Image)
4. For HTML: Claude generates interactive HTML/CSS/JS content
5. For Images: DALL-E generates an image, uploaded to Supabase Storage
6. Content is saved to Supabase Postgres database
7. Supabase Realtime broadcasts the change to all connected clients
8. All users see the updated canvas in real-time

## Tech Stack

### Frontend
- React 18
- Vite
- Supabase JS Client (real-time subscriptions)

### Backend
- Express.js
- TypeScript
- Anthropic Claude API (content generation)
- OpenAI API (image generation)
- DOMPurify (HTML sanitization)
- Pino (logging)

### Infrastructure
- Supabase (PostgreSQL + Realtime + Storage)
- Docker (containerization)
- GitHub Actions (CI/CD)
- GitHub Container Registry (image hosting)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account
- Anthropic API key
- OpenAI API key

### Environment Setup

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

### Database Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL editor to create the required tables.

### Running Locally

```bash
# Install dependencies
npm install --workspaces

# Run backend (terminal 1)
npm run dev:backend

# Run frontend (terminal 2)
npm run dev:frontend
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:3001`.

## Docker

### Building Images

```bash
# Build frontend
docker build -t prompt-canvas-frontend ./frontend

# Build backend
docker build -t prompt-canvas-backend ./backend
```

### Running with Docker

```bash
# Run backend
docker run -p 3001:3001 --env-file ./backend/.env prompt-canvas-backend

# Run frontend (same Docker network as backend)
docker run -p 80:80 prompt-canvas-frontend

# Run frontend (pointing to external backend)
docker run -p 80:80 -e BACKEND_URL=https://api.example.com prompt-canvas-frontend
```

The frontend uses `BACKEND_URL` environment variable to configure the API proxy. Default is `http://backend:3001` for Docker Compose setups.

### Docker Compose (example)

```yaml
version: '3.8'
services:
  frontend:
    image: ghcr.io/your-username/your-repo/frontend:latest
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    image: ghcr.io/your-username/your-repo/backend:latest
    ports:
      - "3001:3001"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## Releases

This project uses [Release Please](https://github.com/googleapis/release-please) for automated releases.

### Conventional Commits

Use conventional commit messages to trigger releases:

```bash
# Features (minor version bump)
git commit -m "feat(frontend): add dark mode support"
git commit -m "feat(backend): add rate limiting"

# Bug fixes (patch version bump)
git commit -m "fix(frontend): resolve canvas rendering issue"
git commit -m "fix(backend): handle empty prompts"

# Breaking changes (major version bump)
git commit -m "feat(backend)!: change API response format"
```

### Release Flow

Frontend and backend have **separate release PRs** and are versioned independently:

1. Push commits to `master` with conventional commit messages
2. Release Please creates/updates separate PRs for frontend and backend
3. Merge a Release PR to create a GitHub release for that package
4. Docker image is automatically built and pushed to ghcr.io for the released package

### Docker Images

Released images are available at:
- `ghcr.io/<owner>/<repo>/frontend:<version>`
- `ghcr.io/<owner>/<repo>/backend:<version>`

## Project Structure

```
.
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.jsx          # Main app with multi-canvas logic
│   │   ├── components/
│   │   │   ├── DynamicContent.jsx   # Canvas content renderer
│   │   │   └── PromptModal.jsx      # Prompt input modal
│   │   └── lib/
│   │       └── supabase.js          # Supabase client
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── app.ts           # Express app setup
│   │   ├── routes/
│   │   │   └── generate.ts  # POST /api/generate endpoint
│   │   ├── services/
│   │   │   ├── anthropic.ts # Claude API integration
│   │   │   ├── openai.ts    # DALL-E integration
│   │   │   ├── supabase.ts  # Database operations
│   │   │   └── sanitizer.ts # HTML sanitization
│   │   └── prompts/
│   │       ├── classifier.ts    # Content type classifier
│   │       └── generator.ts     # HTML generator prompt
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       └── release-please.yml   # CI/CD workflow
│
├── supabase-schema.sql      # Database schema
├── release-please-config.json
└── .release-please-manifest.json
```

## API Reference

### POST /api/generate

Generate content for a canvas.

**Request:**
```json
{
  "prompt": "Create a landing page for a coffee shop",
  "slug": "canvas-1"
}
```

**Response:**
```json
{
  "page": {
    "id": "uuid",
    "slug": "canvas-1",
    "content": "<div>...</div>",
    "content_type": "html",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## License

MIT

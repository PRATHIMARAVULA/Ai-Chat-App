# AI Chat App (React frontend + Node backend)

This is a minimal AI chat example where chat history is saved on the backend.

## How to run

### Backend
1. Open a terminal:
```
cd backend
npm install
cp .env.example .env
# edit .env and add your OPENAI_API_KEY
npm run start
```

### Frontend
1. Open another terminal:
```
cd frontend
npm install
npm run dev
```

By default, backend runs at http://localhost:4000 and frontend at http://localhost:5173.

Files included:
- backend/: Express server using lowdb (db.json) and OpenAI Chat API (if OPENAI_API_KEY is set)
- frontend/: Vite + React app that fetches /history and posts /message

Do NOT commit your .env with real API keys.

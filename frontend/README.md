# Synapse Instructor Frontend

This SPA is designed for the instructor persona and communicates with the Django core via REST APIs (JWT). It uses Vite + React + TypeScript + Tailwind CSS.

## Setup

```bash
# from workspace root
cd frontend
npm install
```

## Development

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## Build / Preview

```bash
npm run build
npm run preview
```

## Environment

The frontend assumes the backend API is reachable at `http://localhost:8000/api/v1`. If your Django stack runs elsewhere, update `src/api/authClient.ts` accordingly (the `baseURL`).

## Notes

- Authentication: the login form exchanges credentials for JWT via `/api/v1/auth/token/`, then stores the `access` token in component state.
- Dashboard: fetches `/api/v1/cognition/sessions/` and renders session cards with status/time.
- Future work: add session details, course management screens, and offline caching.

# Job Finder

Full stack job search app. You type a role and a location, it pulls live listings from Google Jobs and keeps them in MongoDB.

## What it does

- Search jobs by title and location, results come from the SerpApi Google Jobs engine
- Every result is saved to MongoDB with an upsert on title + company + location, so repeated searches do not create duplicates
- Browse everything already stored with the `/all-jobs` endpoint
- Runs as four containers behind nginx: mongo, backend, frontend, nginx
- Push to main builds both images and pushes them to Docker Hub through GitHub Actions

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19, Vite, ESLint |
| Backend | Node, Express 5, Mongoose 9, node-fetch |
| Database | MongoDB 7 |
| Jobs data | SerpApi (Google Jobs engine) |
| Infra | Docker, docker-compose, nginx, GitHub Actions |

## API

| Method | Route | What it does |
|---|---|---|
| GET | `/jobs?query=React+Developer&location=Austin,+Texas` | Fetches live jobs, saves them, returns them |
| GET | `/all-jobs` | Returns every job stored in the database |

## Run it locally

```bash
git clone https://github.com/issa-bourasse/jobs-finder.git
cd jobs-finder
cp .env.example .env
# open .env and add your own SERPAPI_KEY
npm install --prefix backend
npm install --prefix frontend
```

Backend needs MongoDB running:

```bash
cd backend && node server.js     # http://localhost:3000
cd frontend && npm run dev       # Vite dev server
```

## Run it with Docker

```bash
cp .env.example .env
# set DOCKER_HUB_USERNAME and SERPAPI_KEY in .env
docker compose up -d
```

That brings up mongo, the backend, the frontend and nginx on ports 80 and 443.

## Environment

| Variable | Used by | Notes |
|---|---|---|
| `SERPAPI_KEY` | backend | Get one free at serpapi.com, required for job search |
| `MONGO_URI` | backend | Defaults to `mongodb://localhost:27017/jobsearch` |
| `DOCKER_HUB_USERNAME` | compose | Your Docker Hub user |
| `IMAGE_TAG` | compose | Defaults to `latest` |

## CI/CD

`.github/workflows/deploy.yml` runs on every push to main. It logs into Docker Hub, builds both images with Buildx and pushes `nex-backend` and `nex-frontend` tagged with the commit sha and `latest`. Secrets needed: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_TOKEN`.

There is a longer write up of the pipeline in `docker-cicd-guide/GUIDE.md`.

## Layout

```
backend/    Express API, mongoose models, jobs route
frontend/   React + Vite app
nginx/      reverse proxy config
docker-cicd-guide/  CI/CD walkthrough
```

## License

MIT

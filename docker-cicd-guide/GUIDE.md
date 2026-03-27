# Docker & CI/CD Pipeline — Complete Student Guide

> **Project used as example:** Nex App — a full-stack app with a **React (Vite)** frontend, **Node.js/Express** backend, and **MongoDB** database.

---

## Table of Contents

1. [What is Docker?](#1-what-is-docker)
2. [Key Docker Concepts](#2-key-docker-concepts)
3. [Project Structure Overview](#3-project-structure-overview)
4. [Step 1 — Write a Dockerfile for the Backend](#step-1--write-a-dockerfile-for-the-backend)
5. [Step 2 — Write a Dockerfile for the Frontend](#step-2--write-a-dockerfile-for-the-frontend)
6. [Step 3 — Create .dockerignore Files](#step-3--create-dockerignore-files)
7. [Step 4 — Docker Compose (Run Everything Together)](#step-4--docker-compose-run-everything-together)
8. [Step 5 — Nginx as a Reverse Proxy](#step-5--nginx-as-a-reverse-proxy)
9. [Step 6 — What is CI/CD?](#step-6--what-is-cicd)
10. [Step 7 — Set Up the VPS Server](#step-7--set-up-the-vps-server)
11. [Step 8 — SSH Keys (Passwordless Login)](#step-8--ssh-keys-passwordless-login)
12. [Step 9 — Docker Hub (Image Registry)](#step-9--docker-hub-image-registry)
13. [Step 10 — GitHub Actions Workflow](#step-10--github-actions-workflow)
14. [Step 11 — GitHub Secrets](#step-11--github-secrets)
15. [Step 12 — Full Deployment Flow (End to End)](#step-12--full-deployment-flow-end-to-end)
16. [Troubleshooting Cheat Sheet](#troubleshooting-cheat-sheet)

---

## 1. What is Docker?

Docker is a tool that **packages your application and everything it needs** (code, runtime, libraries, config) into a single unit called a **container**.

### The problem Docker solves

Without Docker, when a developer says *"it works on my machine"*, it might not work on the server because:
- Different Node.js version
- Different OS libraries
- Missing environment variables

With Docker, your app runs **identically** on any machine — your laptop, a teammate's computer, or a cloud server.

### VM vs Container

| Virtual Machine | Docker Container |
|---|---|
| Includes full OS | Shares host OS kernel |
| Several GB in size | Megabytes in size |
| Slow to start (minutes) | Starts in seconds |
| Heavy on resources | Lightweight |

---

## 2. Key Docker Concepts

| Term | What it means |
|---|---|
| **Image** | A blueprint/snapshot of your app. Like a class in OOP. |
| **Container** | A running instance of an image. Like an object created from a class. |
| **Dockerfile** | A recipe file that tells Docker how to build your image. |
| **Docker Hub** | A public registry (like GitHub, but for Docker images). |
| **Docker Compose** | A tool to run multiple containers together with one command. |
| **Volume** | Persistent storage that survives container restarts. |
| **Network** | A private connection between containers so they can talk to each other. |

### Useful Docker commands

```bash
# Build an image from a Dockerfile
docker build -t my-app:latest .

# Run a container from an image
docker run -p 3000:3000 my-app:latest

# List running containers
docker ps

# List all images
docker images

# Stop a container
docker stop <container-id>

# View container logs
docker logs <container-id>

# Remove all stopped containers
docker container prune

# Remove dangling images
docker image prune
```

---

## 3. Project Structure Overview

```
nex-app/
├── backend/                   ← Node.js/Express API
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile             ← ✅ You will create this
│   └── .dockerignore          ← ✅ You will create this
│
├── frontend/                  ← React (Vite) app
│   ├── src/
│   ├── package.json
│   ├── Dockerfile             ← ✅ You will create this (multi-stage)
│   └── .dockerignore          ← ✅ You will create this
│
├── nginx/
│   └── nginx.conf             ← ✅ You will create this (reverse proxy)
│
├── docker-compose.yml         ← ✅ You will create this (runs everything)
│
└── .github/
    └── workflows/
        └── deploy.yml         ← ✅ You will create this (CI/CD pipeline)
```

---

## Step 1 — Write a Dockerfile for the Backend

A **Dockerfile** is a text file with instructions for building a Docker image. Each line creates a **layer** in the image.

### File: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Line-by-line explanation

| Instruction | What it does |
|---|---|
| `FROM node:20-alpine` | Start FROM an official Node.js 20 image. `alpine` = tiny Linux (~5MB). |
| `WORKDIR /app` | Set the working directory inside the container to `/app`. |
| `COPY package*.json ./` | Copy ONLY the package files first (smart caching trick — see below). |
| `RUN npm install --omit=dev` | Install production dependencies. `--omit=dev` skips devDependencies. |
| `COPY . .` | Copy the rest of your source code into the container. |
| `EXPOSE 3000` | Document that your app listens on port 3000 (does not actually open the port). |
| `CMD ["node", "server.js"]` | The command to run when the container starts. |

### Why copy package.json BEFORE the source code?

Docker **caches each layer**. If you copy everything at once and one `.js` file changes, Docker re-runs `npm install` from scratch.

By copying `package.json` first, `npm install` only re-runs when **dependencies change**, not when you change your code. This makes builds much faster. 🚀

---

## Step 2 — Write a Dockerfile for the Frontend

The frontend uses a **multi-stage build** — one of Docker's most powerful features.

### Why multi-stage?

The final production frontend is just **static HTML/CSS/JS files**. We don't need Node.js in production — just a lightweight web server (nginx) to serve the files.

Multi-stage builds let us:
1. Use Node.js to compile/build the app
2. Then throw away Node.js and only keep the compiled files in the final image

### File: `frontend/Dockerfile`

```dockerfile
# ──── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
# After this stage, /app/dist contains the compiled React app

# ──── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    location /jobs { proxy_pass http://backend:3000; proxy_http_version 1.1; } \
    location /all-jobs { proxy_pass http://backend:3000; proxy_http_version 1.1; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### What happens in each stage

**Stage 1 (`AS builder`)**
- Uses Node.js to install dependencies and run `npm run build`
- Vite compiles React → static files in `/app/dist`

**Stage 2 (final image)**
- Starts fresh from `nginx:alpine` (just a web server, ~8MB)
- Copies only `/app/dist` from Stage 1 using `--from=builder`
- Node.js is NOT included — the final image is tiny!

> **Result:** The frontend image is ~25MB instead of ~300MB+

---

## Step 3 — Create .dockerignore Files

A `.dockerignore` file tells Docker which files to **skip** when copying your project into the image — similar to `.gitignore`.

### `backend/.dockerignore`

```
node_modules
npm-debug.log*
.env
.env.*
```

### `frontend/.dockerignore`

```
node_modules
npm-debug.log*
dist
.env
.env.*
```

### Why is this important?

- `node_modules` can contain **thousands of files** (hundreds of MB). You don't need them because you run `npm install` inside the container.
- `.env` files contain **secrets** — never copy these into an image!
- Without `.dockerignore`, your build would be slow and your image would be huge.

---

## Step 4 — Docker Compose (Run Everything Together)

Your app has 4 services that all need to run and communicate:

| Service | What it is |
|---|---|
| `mongo` | MongoDB database |
| `backend` | Node.js API |
| `frontend` | React app (served by nginx) |
| `nginx` | Reverse proxy (the public entry point) |

Docker Compose lets you define and start **all of them with one command**.

### File: `docker-compose.yml`

```yaml
version: "3.9"

services:
  mongo:
    image: mongo:7                   # Use official MongoDB 7 image from Docker Hub
    container_name: nex-mongo
    restart: unless-stopped          # Auto-restart if it crashes
    volumes:
      - mongo_data:/data/db          # Persist database data in a named volume
    networks:
      - nex-net

  backend:
    image: ${DOCKER_HUB_USERNAME}/nex-backend:${IMAGE_TAG:-latest}
    container_name: nex-backend
    restart: unless-stopped
    env_file: .env
    environment:
      - MONGO_URI=mongodb://mongo:27017/jobsearch  # "mongo" = container name = hostname
    depends_on:
      - mongo                        # Don't start until mongo is running
    networks:
      - nex-net

  frontend:
    image: ${DOCKER_HUB_USERNAME}/nex-frontend:${IMAGE_TAG:-latest}
    container_name: nex-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - nex-net

  nginx:
    image: nginx:alpine
    container_name: nex-nginx
    restart: unless-stopped
    ports:
      - "80:80"                      # Map host port 80 → container port 80
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro  # Mount config file
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - backend
    networks:
      - nex-net

volumes:
  mongo_data:                        # Named volume — data persists between restarts

networks:
  nex-net:
    driver: bridge                   # All containers share this private network
```

### Key concepts explained

**`restart: unless-stopped`**
If a container crashes, Docker will automatically restart it — except if you manually stopped it.

**`volumes: - mongo_data:/data/db`**
MongoDB stores data in `/data/db` inside the container. Without a volume, all data disappears when the container is removed. The named volume `mongo_data` keeps data permanently.

**`networks: - nex-net`**
All services on the same Docker network can reach each other **by container name**. That's why the backend can connect to MongoDB using the hostname `mongo` — not `localhost`.

**`depends_on`**
Controls startup order. `backend` waits for `mongo` to start before it starts.

### Docker Compose commands

```bash
# Start all services in the background
docker compose up -d

# Stop all services
docker compose down

# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Rebuild images and restart
docker compose up -d --build

# Pull latest images from registry, then restart
docker compose pull
docker compose up -d --remove-orphans
```

---

## Step 5 — Nginx as a Reverse Proxy

Nginx is a high-performance web server. In this setup it acts as a **reverse proxy** — the single entry point that receives all incoming requests and forwards them to the right container.

```
Internet → :80 → nginx → /jobs, /all-jobs → backend:3000
                       → everything else → frontend:80
```

### File: `nginx/nginx.conf`

```nginx
upstream frontend {
    server frontend:80;    # "frontend" = Docker container name
}

upstream backend {
    server backend:3000;   # "backend" = Docker container name
}

server {
    listen 80;
    server_name _;         # Accept any domain name

    # API routes → Node.js backend
    location /jobs {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /all-jobs {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Everything else → React SPA
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Why use a reverse proxy?

- Only **one port (80)** is exposed to the internet
- nginx decides where to **route each request**
- Handles **SSL/TLS termination** (HTTPS) in one place
- Can do **load balancing** if you scale to multiple containers later

---

## Step 6 — What is CI/CD?

**CI (Continuous Integration)** = Every time you push code, it is automatically built and tested.

**CD (Continuous Delivery/Deployment)** = After a successful build, the new version is automatically deployed to the server.

### The flow we're building

```
You push code to GitHub (main branch)
        ↓
GitHub Actions runner (a GitHub-hosted virtual machine) starts
        ↓
Job 1 — Build & Push:
  1. Check out your code
  2. Log in to Docker Hub
  3. Build backend Docker image
  4. Push image to Docker Hub  (tagged with the git commit SHA)
  5. Build frontend Docker image
  6. Push image to Docker Hub
        ↓
Job 2 — Deploy (only runs if Job 1 succeeded):
  1. SSH into your VPS server
  2. Pull the new Docker images
  3. Restart the containers with zero downtime
  4. Clean up old images
```

This entire process takes ~2-3 minutes and happens **automatically** on every push to `main`.

---

## Step 7 — Set Up the VPS Server

Before CI/CD can deploy, your server needs to be ready.

### Server requirements

```bash
# Update packages
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | bash

# Or the manual way:
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

# Verify
docker --version           # Docker version 29.x
docker compose version     # Docker Compose version v2.x
```

### Configure the firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH — ALWAYS allow this first or you'll lock yourself out!
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Create the app directory on the server

```bash
mkdir -p /opt/nex-app/nginx/certs
```

---

## Step 8 — SSH Keys (Passwordless Login)

GitHub Actions needs to SSH into your server to deploy. **Passwords are not safe to use in automation** — you use SSH keys instead.

### How SSH keys work

SSH keys come in pairs:
- **Private key** — stays secret. You never share this. GitHub stores it.
- **Public key** — like a lock. You put this on your server.

When GitHub Actions SSHes into your server, it proves it has the private key — and the server unlocks the door using the matching public key.

### Generate the key pair on the server

```bash
# Run this on your VPS
ssh-keygen -t ed25519 -f /root/.ssh/github_actions -N "" -C "github-actions-deploy"
```

This creates:
- `/root/.ssh/github_actions` — the **private key** (goes into GitHub secret)
- `/root/.ssh/github_actions.pub` — the **public key** (stays on server)

### Add the public key to authorized_keys

```bash
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

### Get the private key (copy this for GitHub)

```bash
cat /root/.ssh/github_actions
```

Copy the entire output — from `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END OPENSSH PRIVATE KEY-----`.

---

## Step 9 — Docker Hub (Image Registry)

Docker Hub is the public registry where you push your Docker images so the server can pull them.

### Set up Docker Hub

1. Create a free account at [hub.docker.com](https://hub.docker.com)
2. Create an **Access Token** (don't use your password):
   - Go to Account Settings → Security → New Access Token
   - Name it `github-actions`
   - Copy the token — you only see it once!

### Your images will be named like:

```
yourusername/nex-backend:latest
yourusername/nex-backend:abc1234def5   ← tagged with git commit SHA
yourusername/nex-frontend:latest
yourusername/nex-frontend:abc1234def5
```

---

## Step 10 — GitHub Actions Workflow

GitHub Actions is GitHub's built-in CI/CD system. Workflows are defined in YAML files inside `.github/workflows/`.

### File: `.github/workflows/deploy.yml`

```yaml
name: CI/CD – Build, Push & Deploy

on:
  push:
    branches: [main]   # Only trigger on pushes to the main branch

env:
  DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}
  IMAGE_TAG: ${{ github.sha }}   # Use git commit hash as image tag

jobs:
  # ─── Job 1: Build & Push to Docker Hub ───────────────────────────────────────
  build-and-push:
    name: Build Docker images & push to Docker Hub
    runs-on: ubuntu-latest   # GitHub provides a fresh Ubuntu VM for each run

    steps:
      - name: Checkout code
        uses: actions/checkout@v4   # Download your repo code onto the runner

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3   # Enables advanced build features (caching)

      - name: Build & push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend         # Dockerfile is in the backend/ folder
          push: true
          tags: |
            ${{ secrets.DOCKER_HUB_USERNAME }}/nex-backend:${{ github.sha }}
            ${{ secrets.DOCKER_HUB_USERNAME }}/nex-backend:latest
          cache-from: type=gha       # Use GitHub Actions cache to speed up builds
          cache-to: type=gha,mode=max

      - name: Build & push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_HUB_USERNAME }}/nex-frontend:${{ github.sha }}
            ${{ secrets.DOCKER_HUB_USERNAME }}/nex-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ─── Job 2: Deploy to VPS ────────────────────────────────────────────────────
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: build-and-push   # Only runs if Job 1 succeeded

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Copy compose files to server
        uses: appleboy/scp-action@v0.1.7   # Secure copy files via SSH
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}   # The private key you generated
          source: "docker-compose.yml,nginx/"
          target: "/opt/nex-app"

      - name: SSH into server & deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e          # Exit immediately if any command fails
            cd /opt/nex-app

            # Write .env file with current image tag
            cat > .env <<EOF
            DOCKER_HUB_USERNAME=${{ secrets.DOCKER_HUB_USERNAME }}
            IMAGE_TAG=${{ github.sha }}
            EOF

            # Pull the new images from Docker Hub
            docker compose pull

            # Restart containers (only changed ones restart)
            docker compose up -d --remove-orphans

            # Delete old unused images to free disk space
            docker image prune -f
```

### Workflow concepts explained

**`on: push: branches: [main]`**
The pipeline only runs when code is pushed to the `main` branch. Pushes to feature branches do nothing.

**`runs-on: ubuntu-latest`**
GitHub spins up a temporary Ubuntu virtual machine to run your job. It's completely clean every time.

**`uses: actions/checkout@v4`**
Downloads your repository code onto the runner VM so it can be built.

**`needs: build-and-push`**
The deploy job only starts if the build-and-push job **passed**. Prevents deploying broken code.

**`${{ github.sha }}`**
The unique 40-character git commit hash (e.g., `a3f8c2d...`). Used to tag images so every deploy is traceable to a specific commit.

**`${{ secrets.VPS_SSH_KEY }}`**
GitHub Actions replaces this with the secret value at runtime. The secret is **never visible in logs**.

---

## Step 11 — GitHub Secrets

Secrets are encrypted values stored in your GitHub repository — they are **never visible** in logs or to other people.

### How to add secrets

1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required secrets for this project

| Secret name | Where to get the value |
|---|---|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username (e.g., `johndoe`) |
| `DOCKER_HUB_TOKEN` | The access token you created in Docker Hub |
| `VPS_HOST` | Your server IP address (e.g., `5.189.168.98`) |
| `VPS_USER` | The SSH user on the server (usually `root`) |
| `VPS_SSH_KEY` | The **private key** content from `/root/.ssh/github_actions` |

### For `VPS_SSH_KEY`, paste the entire private key including headers:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (many lines) ...
-----END OPENSSH PRIVATE KEY-----
```

---

## Step 12 — Full Deployment Flow (End to End)

### Your first deployment

```
1. Create a GitHub repo and push your code to the main branch

2. Add all 5 secrets in GitHub Settings

3. The push to main automatically triggers the workflow

4. Watch it run:
   GitHub repo → Actions tab → your workflow run

5. After ~2-3 minutes, your app is live at http://your-server-ip
```

### Every subsequent deployment

```bash
# Make a code change
git add .
git commit -m "fix: update job search results"
git push origin main
```

That's it. The pipeline runs automatically:

```
push to main
  → GitHub Actions starts
  → Builds new Docker images (uses cache — fast!)
  → Pushes to Docker Hub
  → SSHs into server
  → docker compose pull  (downloads new images)
  → docker compose up -d (replaces old containers with new ones)
  → Old images cleaned up
  → Live in ~2 minutes ✅
```

---

## Troubleshooting Cheat Sheet

### Docker issues

```bash
# Container won't start — view its logs
docker logs nex-backend

# Get a shell inside a running container
docker exec -it nex-backend sh

# Check all containers (including stopped ones)
docker ps -a

# Container keeps restarting — check exit code
docker inspect nex-backend | grep -A5 '"State"'

# MongoDB data still there after `docker compose down`?
# YES — because of the named volume. To delete data:
docker compose down -v   # WARNING: destroys mongo_data volume
```

### SSH issues

```bash
# Permission denied (publickey)
# → Check authorized_keys file
cat /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
chmod 700 /root/.ssh

# Test SSH manually
ssh -i ~/.ssh/vps_nex_deploy -v root@5.189.168.98
# The -v flag shows detailed connection logs
```

### GitHub Actions issues

- **Build fails** → Check the error in the Actions tab. Click on the failed step to expand logs.
- **Push to Docker Hub fails** → Verify `DOCKER_HUB_USERNAME` and `DOCKER_HUB_TOKEN` secrets are correct.
- **Deploy SSH fails** → Verify `VPS_SSH_KEY` contains the full private key including the header/footer lines.
- **Container starts but app errors** → `docker logs nex-backend` on the server to see runtime errors.

### Check everything is running on the server

```bash
# On your server
docker ps                              # All 4 containers should be "Up"
docker compose -f /opt/nex-app/docker-compose.yml logs -f   # Live logs
curl http://localhost/jobs             # Test backend through nginx
```

---

## Example Files (in this guide's `/examples` folder)

| File | Description |
|---|---|
| `examples/backend/Dockerfile` | Backend Node.js Dockerfile |
| `examples/backend/.dockerignore` | Backend dockerignore |
| `examples/frontend/Dockerfile` | Frontend multi-stage Dockerfile |
| `examples/frontend/.dockerignore` | Frontend dockerignore |
| `examples/docker-compose.yml` | Full Docker Compose config |
| `examples/nginx/nginx.conf` | Nginx reverse proxy config |
| `examples/.github/workflows/deploy.yml` | GitHub Actions CI/CD workflow |

---

*Guide written for the Nex App project — Node.js + React + MongoDB + Docker + GitHub Actions + VPS*

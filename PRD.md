# PRD: Toyota VMO Demo Application

## Introduction

A Toyota-branded demo web application that showcases Spectro Cloud Palette's VMO capabilities for a Toyota audience. The application demonstrates a real-world hybrid architecture: a containerized frontend (Helm-deployed on Kubernetes) connected to a PostgreSQL database running on a VM. The demo highlights warm migration from VMware to VMO by upgrading the app from v1 (pointing to the VLAN 30 VM IP) to v2 (pointing to the Kubernetes-internal service DNS post-migration).

## Goals

1. **Demonstrate hybrid architecture** — Containerized frontend + VM-based backend database, a pattern Toyota runs in production
2. **Showcase warm migration** — v1 connects to PostgreSQL on VMware (static IP on VLAN 30), v2 connects via internal K8s service DNS (post-migration to VMO)
3. **Showcase Helm-based app lifecycle** — Deploy v1, then upgrade to v2 with a single `helm upgrade`, demonstrating zero-downtime config changes
4. **Look like Toyota** — Use Toyota's brand colors (#EB0A1E red, black, white, #58595B gray), Montserrat font, and clean layout patterns so it feels authentic
5. **Make the database connection obvious** — The UI must prominently display database connectivity status, query results, and connection method (direct IP vs. K8s service DNS)

## Environment Context

### Network Access
- **VPN**: Laptop is VPN'd into the VLAN 30 network — direct access to VM at 10.30.0.27
- **Node IP**: `10.30.0.37` (K8s node on VLAN 30)

### PostgreSQL VM
- **IP**: `10.30.0.27` (static, VLAN 30)
- **SSH**: `ubuntu@10.30.0.27` (password: `ubuntu`)
- **PostgreSQL version**: 14
- **DB superuser**: `postgres` / `postgres`
- **VM name**: `ubuntu-22-postgres` (migrated from VMware, running in VMO)

### GitHub
- **Account**: `nctiggy` (authenticated via `gh` CLI)
- **New repo**: Create `nctiggy/toyota-demo-app` for the application source
- **GitHub Actions**: Build and push multi-arch container images to Docker Hub

### Docker Hub
- **Account**: `nctiggy`
- **Image**: `nctiggy/toyota-demo-app`
- **PAT for CI**: 1Password item `docker(PAT)` (vault: k8s, username: nctiggy, field: password)
- **GitHub Actions secrets**: Set `DOCKERHUB_USERNAME=nctiggy` and `DOCKERHUB_TOKEN` from `docker(PAT)` password

### Credential Access
```bash
source .env  # Sets OP_SERVICE_ACCOUNT_TOKEN
# Docker Hub PAT (for GitHub Actions):
op item get "docker(PAT)" --vault k8s --fields password --reveal
# GitHub token:
op item get "Github Token" --vault k8s --fields password --reveal
```

## User Stories

### US-001: PostgreSQL Database Setup on VM

**As a** developer, **I need** PostgreSQL configured on the VM to accept remote connections and seeded with demo data **so that** the app can connect from anywhere on VLAN 30.

**Priority**: 1 (must be done first — app development depends on having a reachable database)

**Acceptance Criteria:**
- SSH into the VM: `ssh ubuntu@10.30.0.27` (password: `ubuntu`)
- Configure PostgreSQL to listen on all interfaces: `listen_addresses = '*'` in `postgresql.conf`
- Allow remote connections: add `host all all 0.0.0.0/0 md5` to `pg_hba.conf`
- Create database `toyota`: `sudo -u postgres createdb toyota`
- Set postgres user password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"`
- Create `vehicles` table and seed 10 Toyota vehicles:
  ```sql
  CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    last_service TIMESTAMP DEFAULT NOW(),
    mileage INTEGER DEFAULT 0
  );

  INSERT INTO vehicles (vin, model, year, status, mileage) VALUES
    ('1HGCG5655WA041187', 'Camry', 2024, 'active', 12450),
    ('2T1BURHE0JC034295', 'RAV4', 2024, 'active', 8320),
    ('3TMCZ5AN4LM307832', 'Tacoma', 2023, 'active', 28900),
    ('5YFBURHE7LP012345', 'Corolla', 2024, 'active', 5100),
    ('5TDZA23C16S123456', 'Highlander', 2023, 'active', 31200),
    ('5TFDY5F18LX987654', 'Tundra', 2024, 'active', 15800),
    ('JTEBU5JR4L5234567', '4Runner', 2023, 'active', 22100),
    ('JTDKN3DU5A0345678', 'Prius', 2024, 'active', 3200),
    ('WZ1DB4C04MW456789', 'Supra', 2024, 'active', 7600),
    ('JF1ZNAA12L8567890', 'GR86', 2024, 'active', 9400);
  ```
- Restart PostgreSQL: `sudo systemctl restart postgresql`
- Verify remote connectivity from laptop: `psql -h 10.30.0.27 -U postgres -d toyota -c 'SELECT count(*) FROM vehicles;'` returns 10
- If `psql` not on laptop, use: `ssh ubuntu@10.30.0.27 "sudo -u postgres psql -d toyota -c 'SELECT count(*) FROM vehicles;'"`

### US-002: Complete Application — Express + Toyota UI + DB Integration

**As a** developer, **I need** the complete Toyota-branded application built **so that** it connects to PostgreSQL and displays vehicle data with proper styling and v1/v2 differentiation.

**Priority**: 2

**Acceptance Criteria:**

#### Project Structure
- Create a NEW directory for the app repo (separate from the toyota infra repo): `~/code/toyota-demo-app/`
- `package.json` (Node.js 20, Express, `pg` package)
- `server.js` — single file serves HTML + API (no build tools, no React, no TypeScript)
- `.dockerignore` — exclude node_modules, .git, etc.
- `.gitignore` — node_modules, .env
- Express server starts on port `3000` (configurable via `PORT` env var)

#### API Endpoints
- `GET /` — Serves the Toyota-branded HTML page with embedded CSS and client-side JS
- `GET /healthz` — Returns `200 OK` (K8s probe endpoint)
- `GET /api/vehicles` — Returns JSON array of all vehicles from PostgreSQL
- `GET /api/status` — Returns JSON:
  ```json
  {
    "connected": true,
    "host": "10.30.0.27",
    "responseTimeMs": 12,
    "version": "PostgreSQL 14.20",
    "connectionMethod": "Direct IP (VLAN 30)",
    "appVersion": "1.0.0"
  }
  ```

#### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Express listen port |
| `DB_HOST` | 10.30.0.27 | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | toyota | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `APP_VERSION` | 1.0.0 | Displayed version |
| `CONNECTION_METHOD` | direct | "direct" or "overlay" |

#### Toyota-Branded Frontend (embedded in server.js as template string)
- **Toyota color scheme**: `#EB0A1E` (red), `#000000` (black), `#FFFFFF` (white), `#58595B` (gray), `#F7F7F7` (light bg)
- **Font**: Montserrat from Google Fonts
- **Header**: White background, "TOYOTA" text logo (bold, letter-spaced) left side, "Fleet Database Portal" center, version badge
- **Hero section**: Subtle red accent bar with subtitle showing connection mode
- **Connection status card**: Prominent banner showing:
  - Green/red dot indicator for connection status
  - "Connected via: 10.30.0.27 (VLAN 30)" or "Connected via: postgresql.virtual-machines.svc.cluster.local (Overlay Network)"
  - Host, latency, PostgreSQL version
- **Vehicle table**: Clean card with all vehicles in a styled HTML table
- **Connection flow visualization**: Simple horizontal flow: `App → Network → Database` with network type labeled between arrows
- **Footer**: Dark background (#000000), copyright text
- **Responsive**: Works on 1440px desktop and 768px tablet
- **No right-aligned text** (Toyota brand guideline)

#### Version Differentiation (v1 vs v2 — same codebase, env-driven)

**v1 UI** (CONNECTION_METHOD=direct):
- Version badge: "v1.0.0"
- Connection banner: "Direct IP — VLAN 30" with network icon (SVG or Unicode)
- Subtitle: "Pre-Migration — Database on VMware"
- Banner accent: Toyota gray (#58595B)

**v2 UI** (CONNECTION_METHOD=overlay):
- Version badge: "v2.0.0"
- Connection banner: "Kubernetes Service DNS — Overlay Network" with cloud icon
- Subtitle: "Post-Migration — Database on VMO"
- Banner accent: Toyota red (#EB0A1E)
- Additional "Migration Complete" success card with checkmark
- "Migration Stats" card: type=warm, downtime=zero, source=VMware, destination=VMO/KubeVirt

#### Error Handling
- If DB unreachable: show red status dot with error message, app does NOT crash
- `/healthz` always returns 200 (app health, not DB health)
- Connection pool with retry — use `pg.Pool` with reasonable timeouts

#### Local Validation
- `cd ~/code/toyota-demo-app && npm install && DB_HOST=10.30.0.27 node server.js` starts and connects to PG
- `curl http://localhost:3000/healthz` returns 200
- `curl http://localhost:3000/api/status` returns JSON with `connected: true`
- `curl http://localhost:3000/api/vehicles` returns 10 vehicles
- `curl http://localhost:3000/` returns Toyota-branded HTML

### US-003: Dockerfile and Multi-Arch Build

**As a** developer, **I need** a Dockerfile that builds multi-arch images **so that** the app runs on both amd64 and arm64 nodes.

**Priority**: 3

**Acceptance Criteria:**
- Multi-stage Dockerfile in repo root:
  ```dockerfile
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production

  FROM node:20-alpine
  WORKDIR /app
  COPY --from=build /app/node_modules ./node_modules
  COPY server.js ./
  ENV PORT=3000
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```
- `node:20-alpine` supports both amd64 and arm64 natively
- No architecture-specific dependencies (pure JS app)
- Image size < 100MB
- Local build test: `docker build -t toyota-demo-app:test .` succeeds
- Local run test: `docker run -e DB_HOST=10.30.0.27 -p 3000:3000 toyota-demo-app:test` serves the app

### US-004: GitHub Repo and GitHub Actions CI

**As a** developer, **I need** the source pushed to GitHub with CI that builds and pushes multi-arch Docker images to Docker Hub **so that** the images are publicly available.

**Priority**: 4

**Acceptance Criteria:**

#### GitHub Repo
- Create repo `nctiggy/toyota-demo-app` via `gh repo create nctiggy/toyota-demo-app --public --source=. --push`
- Repo contains: `server.js`, `package.json`, `package-lock.json`, `Dockerfile`, `.dockerignore`, `.gitignore`, `.github/workflows/docker.yml`

#### GitHub Actions Workflow (`.github/workflows/docker.yml`)
```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: nctiggy/toyota-demo-app
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### GitHub Secrets
Set via `gh` CLI:
```bash
# Get Docker Hub PAT from 1Password
source .env
DOCKER_PAT=$(op item get "docker(PAT)" --vault k8s --fields password --reveal)
gh secret set DOCKERHUB_USERNAME --repo nctiggy/toyota-demo-app --body "nctiggy"
gh secret set DOCKERHUB_TOKEN --repo nctiggy/toyota-demo-app --body "$DOCKER_PAT"
```

#### Trigger and Verify
- Push initial code with tag `v1.0.0`: `git tag v1.0.0 && git push origin v1.0.0`
- GitHub Actions workflow runs successfully
- Docker Hub has `nctiggy/toyota-demo-app:1.0.0` with both amd64 and arm64 manifests
- Verify: `docker manifest inspect nctiggy/toyota-demo-app:1.0.0` shows both platforms

### US-005: Helm Chart (v1 and v2)

**As a** platform engineer, **I need** a Helm chart with v1 and v2 value files **so that** the app can be deployed and upgraded with `helm install`/`helm upgrade`.

**Priority**: 5

**Acceptance Criteria:**

#### Chart Structure (in the app repo)
```
charts/toyota-demo/
  Chart.yaml
  values.yaml          # Defaults (v1 config)
  values-v1.yaml       # Explicit v1 values
  values-v2.yaml       # Explicit v2 values
  templates/
    deployment.yaml
    service.yaml
    configmap.yaml
    secret.yaml
    NOTES.txt
    _helpers.tpl
```

#### Chart.yaml
```yaml
apiVersion: v2
name: toyota-demo
description: Toyota Fleet Database Portal — VMO Demo Application
type: application
version: 1.0.0
appVersion: "1.0.0"
```

#### values.yaml (defaults = v1)
```yaml
replicaCount: 1

image:
  repository: nctiggy/toyota-demo-app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: NodePort
  port: 3000
  nodePort: 30080

database:
  host: "10.30.0.27"
  port: 5432
  name: "toyota"
  user: "postgres"
  password: "postgres"

app:
  version: "1.0.0"
  connectionMethod: "direct"
```

#### values-v2.yaml (overrides for post-migration)
```yaml
image:
  tag: "2.0.0"

database:
  host: "postgresql.virtual-machines.svc.cluster.local"

app:
  version: "2.0.0"
  connectionMethod: "overlay"
```

#### Templates
- **deployment.yaml**: Single replica, env vars from ConfigMap and Secret, liveness/readiness probes on `/healthz`
- **service.yaml**: NodePort on 30080
- **configmap.yaml**: DB_HOST, DB_PORT, DB_NAME, DB_USER, APP_VERSION, CONNECTION_METHOD
- **secret.yaml**: DB_PASSWORD (base64)
- **_helpers.tpl**: Standard name/fullname/labels helpers
- **NOTES.txt**: Prints access URL and version info

#### Validation
- `helm lint charts/toyota-demo` passes
- `helm lint charts/toyota-demo -f charts/toyota-demo/values-v1.yaml` passes
- `helm lint charts/toyota-demo -f charts/toyota-demo/values-v2.yaml` passes
- `helm template toyota-demo charts/toyota-demo` renders valid YAML
- `helm template toyota-demo charts/toyota-demo -f charts/toyota-demo/values-v2.yaml` renders v2 config

### US-006: Tag v2 and Push

**As a** developer, **I need** a v2 tag pushed **so that** Docker Hub has both v1 and v2 images available.

**Priority**: 6

**Acceptance Criteria:**
- Tag: `git tag v2.0.0 && git push origin v2.0.0`
- GitHub Actions builds and pushes `nctiggy/toyota-demo-app:2.0.0` (multi-arch)
- Docker Hub has both `1.0.0` and `2.0.0` tags
- Both tags have amd64 and arm64 manifests

**Note:** v1 and v2 are the same application code. The version differentiation is entirely driven by environment variables (`APP_VERSION`, `CONNECTION_METHOD`). The separate tags exist so the Helm chart can reference different image tags for the upgrade demo, but functionally the images are identical.

## Non-Goals

- **Deploying to K8s** — This PRD builds the app, images, and charts only. Deployment is done separately during the demo.
- **Authentication/authorization** — Demo app, no login
- **Production-grade PostgreSQL** — Single instance, no HA
- **TLS/HTTPS** — NodePort with HTTP for demo
- **TypeScript** — Plain JavaScript, no build step
- **External CSS frameworks** — Embedded CSS only
- **Mobile-first** — Desktop/tablet for conference room

## Design Considerations

### Toyota Brand Compliance
- Colors: `#EB0A1E` (red), `#000000` (black), `#FFFFFF` (white), `#58595B` (gray), `#F7F7F7` (light bg)
- Font: Montserrat (closest free match to Toyota Type)
- No right-aligned text, no drop shadows on text
- Generous whitespace, clean grid layout
- Red used as accent only, not as dominant background

### Architecture Diagram (displayed in the UI)
```
v1: [Browser] → [NodePort:30080] → [Express Pod] → [10.30.0.27:5432 (VMware VM)]
v2: [Browser] → [NodePort:30080] → [Express Pod] → [postgresql.virtual-machines.svc:5432 (VMO VM)]
```

## Technical Stack

- **Runtime**: Node.js 20 + Express
- **Database client**: `pg` npm package
- **Styling**: Embedded CSS (template string in server.js)
- **Container**: Multi-stage Dockerfile, `node:20-alpine`, multi-arch (amd64 + arm64)
- **CI**: GitHub Actions with `docker/build-push-action` + QEMU for cross-compilation
- **Registry**: Docker Hub `nctiggy/toyota-demo-app`
- **Helm**: Standalone chart in `charts/toyota-demo/`

## Success Metrics

1. App connects to PostgreSQL and displays 10 vehicles with Toyota branding
2. v1 and v2 are visually distinct (gray vs red accent, different banners)
3. Docker Hub has multi-arch images for both v1 and v2
4. `helm lint` passes for both value files
5. GitHub Actions CI builds successfully on tag push
6. The app "looks like Toyota" — clean, professional, branded

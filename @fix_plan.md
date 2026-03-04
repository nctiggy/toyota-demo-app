# Toyota Demo App — Execution Plan

Read the full PRD at `PRD.md` for complete acceptance criteria.

## Credentials
```bash
source .env  # Sets OP_SERVICE_ACCOUNT_TOKEN for non-interactive op access
```

## Stories

- [x] **US-001**: PostgreSQL Database Setup — SSH to 10.30.0.27 (ubuntu/ubuntu), configure PG for remote access (listen_addresses='*', pg_hba.conf), create `toyota` DB, set postgres password to `postgres`, seed 10 vehicles. Verify: `ssh ubuntu@10.30.0.27 "sudo -u postgres psql -d toyota -c 'SELECT count(*) FROM vehicles;'"` returns 10.
- [x] **US-002**: Complete Application — Build `server.js` (Express + embedded Toyota-branded HTML/CSS + PG integration + v1/v2 env-driven differentiation), `package.json`, `.gitignore`, `.dockerignore`. Validate: `npm install && DB_HOST=10.30.0.27 node server.js`, then curl healthz/status/vehicles endpoints and verify Toyota styling in HTML response.
- [x] **US-003**: Dockerfile — Multi-stage `node:20-alpine` Dockerfile. Local build: `docker build -t toyota-demo-app:test .` must produce image < 100MB. Local run: `docker run -e DB_HOST=10.30.0.27 -p 3000:3000 toyota-demo-app:test` serves the app.
- [ ] **US-004**: GitHub Repo + CI — Init git, `gh repo create nctiggy/toyota-demo-app --public --source=. --push`. Set DOCKERHUB_USERNAME and DOCKERHUB_TOKEN secrets from 1Password (`docker(PAT)` item). Create `.github/workflows/docker.yml` for multi-arch (amd64+arm64) build+push to Docker Hub on tag push. Push code + tag v1.0.0. Verify: Actions passes, `docker manifest inspect nctiggy/toyota-demo-app:1.0.0` shows both platforms.
- [ ] **US-005**: Helm Chart — Create `charts/toyota-demo/` with Chart.yaml, deployment, service, configmap, secret templates, _helpers.tpl, NOTES.txt. `values.yaml` (v1 defaults), `values-v1.yaml`, `values-v2.yaml`. Validate: `helm lint` and `helm template` pass for both value files. Push to GitHub.
- [ ] **US-006**: Tag v2 — Push `v2.0.0` tag. Verify: GitHub Actions passes, Docker Hub has `nctiggy/toyota-demo-app:2.0.0` with both amd64 and arm64 platforms.

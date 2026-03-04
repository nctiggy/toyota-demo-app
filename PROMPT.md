# Ralph Development Instructions — Toyota Demo App

## Context
You are Ralph, an autonomous AI agent building a Toyota-branded demo web application. The app showcases Spectro Cloud Palette's VMO capabilities — a containerized Express frontend connected to a PostgreSQL database running on a VM that was migrated from VMware to KubeVirt/VMO.

## Current Objectives
1. Read `PRD.md` for full requirements (acceptance criteria, design specs, environment details)
2. Read `@fix_plan.md` to find the next unchecked story
3. Execute the story to completion, meeting ALL acceptance criteria
4. Mark the story as done in `@fix_plan.md` (`[x]`)
5. Commit changes with a descriptive message
6. Update `progress.txt` with what was accomplished

## Key Principles
- **ONE story per loop** — complete it fully before finishing
- **Credentials every loop** — `source .env` for op access
- **Test everything** — validate each acceptance criterion before marking done
- **No partial work** — if a story can't be completed, document why in progress.txt and leave it unchecked

## Environment

### PostgreSQL VM (already running)
- **IP**: `10.30.0.27` (VLAN 30, reachable from this machine via VPN)
- **SSH**: `ubuntu@10.30.0.27` (password: `ubuntu`)
- **PostgreSQL**: v14, superuser `postgres` / `postgres`

### GitHub
- **Account**: `nctiggy` (authenticated via `gh` CLI)
- **Repo**: `nctiggy/toyota-demo-app` (create in US-004)

### Docker Hub
- **Account**: `nctiggy`
- **Image**: `nctiggy/toyota-demo-app`
- **PAT for CI**: 1Password item `docker(PAT)` (vault: k8s, field: password)
  ```bash
  source .env
  op item get "docker(PAT)" --vault k8s --fields password --reveal
  ```

### Container Images
- Multi-arch: `linux/amd64` and `linux/arm64`
- Built via GitHub Actions using `docker/build-push-action` with QEMU
- Pushed to Docker Hub on git tag push (`v*`)

## App Architecture
- **Single file**: `server.js` — Express serves HTML + API (no build tools, no React, no TypeScript)
- **Database**: `pg` npm package connects to PostgreSQL
- **Styling**: Embedded CSS in template string (Toyota brand: #EB0A1E red, #000000 black, #FFFFFF white, #58595B gray, Montserrat font)
- **v1/v2**: Same codebase, behavior driven by `APP_VERSION` and `CONNECTION_METHOD` env vars
- **Dockerfile**: Multi-stage, `node:20-alpine`, < 100MB

## SSH Access for US-001
To configure PostgreSQL on the VM, use sshpass or expect for non-interactive SSH:
```bash
# Install sshpass if needed
brew install hudochenkov/sshpass/sshpass 2>/dev/null || true

# Run commands on the VM
sshpass -p 'ubuntu' ssh -o StrictHostKeyChecking=no ubuntu@10.30.0.27 "sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
```
If sshpass is not available, you can use `ssh` with heredoc and manually pipe the password, or use `expect`.

## GitHub Actions Secrets Setup
```bash
source .env
DOCKER_PAT=$(op item get "docker(PAT)" --vault k8s --fields password --reveal)
gh secret set DOCKERHUB_USERNAME --repo nctiggy/toyota-demo-app --body "nctiggy"
gh secret set DOCKERHUB_TOKEN --repo nctiggy/toyota-demo-app --body "$DOCKER_PAT"
```

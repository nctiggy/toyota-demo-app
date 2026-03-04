# Agent Build & Test Instructions

## Build
```bash
cd ~/code/toyota-demo-app
npm install
docker build -t toyota-demo-app:test .
```

## Test
```bash
# Local app test (requires PG at 10.30.0.27)
DB_HOST=10.30.0.27 node server.js &
curl -s http://localhost:3000/healthz
curl -s http://localhost:3000/api/status | python3 -m json.tool
curl -s http://localhost:3000/api/vehicles | python3 -m json.tool
kill %1

# Docker test
docker run --rm -e DB_HOST=10.30.0.27 -p 3000:3000 toyota-demo-app:test &
curl -s http://localhost:3000/api/status | python3 -m json.tool
docker stop $(docker ps -q --filter ancestor=toyota-demo-app:test)

# Helm lint
helm lint charts/toyota-demo
helm lint charts/toyota-demo -f charts/toyota-demo/values-v2.yaml
helm template toyota-demo charts/toyota-demo
```

## Validate
```bash
# Image size
docker images toyota-demo-app:test --format '{{.Size}}'

# Multi-arch on Docker Hub (after CI push)
docker manifest inspect nctiggy/toyota-demo-app:1.0.0

# DB connectivity
ssh ubuntu@10.30.0.27 "sudo -u postgres psql -d toyota -c 'SELECT count(*) FROM vehicles;'"
```

# API Sentinel — Production Deployment & Docker Guide

## 1. Docker Compose Orchestration

API Sentinel provides a turnkey, multi-container production orchestration file (`docker-compose.yml`) containing all 6 microservices:

1. `postgres`: PostgreSQL 17 Alpine database
2. `ml-service`: FastAPI ML intelligence engine
3. `backend`: Spring Boot 3.3.4 (Java 21 JRE Alpine)
4. `demo-api`: Mock upstream e-commerce API
5. `gateway`: Node.js reverse proxy gateway
6. `frontend`: React 18 SPA served via Nginx Alpine

### Launching the Complete Platform
```bash
docker compose up --build -d
```

### Checking Cluster Status
```bash
docker compose ps
docker compose logs -f backend
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in root:

```ini
# Database Settings
DB_HOST=postgres
DB_PORT=5432
DB_NAME=api_sentinel
DB_USERNAME=sentinel_user
DB_PASSWORD=sentinel_secure_pass_2026

# Backend Settings
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=postgres
JWT_SECRET=4c9a8f2e7b1d6c0a5e3f8b2d1a9c7e4f0a2b5d8e1c6f3a7b9d2e4f8a0c5b7e1d4c9a8f2e7b1d6c0a5e3f8b2d1a9c7e4f0a2b5d8e1c6f3a7b9d2e4f8a0c5b7e1d
JWT_EXPIRATION_MS=86400000

# ML Inference Service
ML_SERVICE_URL=http://ml-service:8000

# Gateway Settings
GATEWAY_PORT=8081
TARGET_API_URL=http://demo-api:5000
API_SENTINEL_KEY=sentinel_live_e8a93bf409c7429d8a113200ff921bb4
```

---

## 3. High-Availability & Kubernetes Readiness

For production Kubernetes deployments:
- **Stateless Gateway**: Deploy as an Ingress Controller or Envoy filter with horizontal pod autoscaling (HPA).
- **Backend Replicas**: Connect multiple Spring Boot backend pods to a shared PostgreSQL primary/replica cluster.
- **ML Inference Worker Pool**: Run multiple Gunicorn / Uvicorn worker replicas behind an internal ClusterIP service.

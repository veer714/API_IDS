# API Sentinel — Developer Onboarding Guide

## 1. Prerequisites
- **Java**: JDK 21+
- **Node.js**: v20+ and `npm`
- **Python**: 3.12+ (with active virtual environment)
- **Maven**: Embedded `mvnw.cmd` (Windows) or `./mvnw` (Linux/macOS)
- **Docker**: Optional (required for multi-container orchestration)

---

## 2. Local Development Setup (Step-by-Step)

### Step 1: Start ML Microservice
The machine learning service provides inference for payload inspection and behavioral anomalies.
```powershell
cd ml-service
# Activate virtual environment
.\.venv\Scripts\activate
# Start FastAPI service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Verify health: `curl http://localhost:8000/health` (Returns `{"status": "healthy"}`).

---

### Step 2: Start Spring Boot Backend
The backend runs by default in `dev` profile using in-memory H2 (PostgreSQL dialect) with zero configuration required.
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Backend will start on `http://localhost:8080`.
Default credentials seeded on startup:
- **Admin**: `admin` / `SentinelAdmin2026!`
- **Developer**: `developer` / `SentinelDev2026!`
- **Demo API Key**: `sentinel_live_e8a93bf409c7429d8a113200ff921bb4`

---

### Step 3: Start Demo Target API
The demo target API acts as an upstream e-commerce server.
```powershell
cd demo-api
npm install
node server.js
```
Runs on `http://localhost:5000`.

---

### Step 4: Start API Sentinel Gateway
The reverse proxy gateway intercepts traffic and calls the backend evaluation engine.
```powershell
cd gateway
npm install
node server.js
```
Runs on `http://localhost:8081`.

---

### Step 5: Start Frontend SOC Console
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000` or `http://localhost:5173`.

# API Sentinel - Backend Service

Backend service for **API Sentinel**, an API Intrusion Detection System (API-IDS) designed to ingest API traffic, detect anomalous and malicious behaviors, manage security alerts and incidents, and enforce security policies.

---

## Technology Stack

- **Language:** Java 21 (LTS)
- **Framework:** Spring Boot 3.3.4
- **Build Tool:** Apache Maven 3.9.6 (with Maven Wrapper `mvnw` / `mvnw.cmd`)
- **Database:** PostgreSQL 17
- **Security:** Spring Security 6
- **Data Persistence:** Spring Data JPA / Hibernate ORM
- **API Documentation:** Springdoc OpenAPI (Swagger UI) 2.6.0
- **Utilities & Telemetry:** Project Lombok, Spring Boot Actuator, Spring WebSocket

---

## Prerequisites & Installed Versions

| Tool | Configured Version | Location |
| :--- | :--- | :--- |
| **Java** | Eclipse Adoptium Temurin 21.0.12.1 LTS | `~/.jdks/jdk-21.0.12.1+1` |
| **Maven** | Apache Maven 3.9.6 | `~/.local/share/apache-maven-3.9.6` |
| **Git** | 2.55.0 | `/usr/bin/git` |
| **PostgreSQL** | PostgreSQL 17.11 | `/usr/pgsql-17/bin/postgres` |
| **VS Code** | 1.138.0 | `/usr/bin/code` |

---

## PostgreSQL Setup

The backend connects to a dedicated PostgreSQL database and user running directly on the local machine (no Docker).

### Database Credentials

- **Host:** `localhost`
- **Port:** `5432`
- **Database Name:** `api_sentinel`
- **User:** `sentinel_user`
- **Password:** `sentinel_dev_pass` (or as set in your local environment)

### Setup Commands (Admin Reference)

```sql
-- Role creation
CREATE ROLE sentinel_user WITH LOGIN PASSWORD 'sentinel_dev_pass';

-- Database creation
CREATE DATABASE api_sentinel OWNER sentinel_user;

-- Privileges
GRANT ALL PRIVILEGES ON DATABASE api_sentinel TO sentinel_user;
\c api_sentinel
GRANT ALL ON SCHEMA public TO sentinel_user;
```

---

## Environment Variables

All database credentials and environment-specific variables are parameterized via `application.yml` and `application-dev.yml`.

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

### Configurable Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `api_sentinel` | PostgreSQL database name |
| `DB_USERNAME` | `sentinel_user` | Dedicated PostgreSQL username |
| `DB_PASSWORD` | `sentinel_dev_pass` | PostgreSQL user password |
| `SERVER_PORT` | `8080` | Spring Boot HTTP listening port |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile |

> **Note:** Do NOT commit your `.env` file containing sensitive credentials to version control.

---

## How to Run Locally

### 1. Set Java 21 in Shell (if not default)

```bash
export JAVA_HOME="$HOME/.jdks/jdk-21.0.12.1+1"
export PATH="$JAVA_HOME/bin:$PATH"
```

### 2. Run with Maven Wrapper

#### Linux / macOS:
```bash
cd backend
./mvnw spring-boot:run
```

#### Windows:
```cmd
cd backend
mvnw.cmd spring-boot:run
```

#### Run Tests:
```bash
./mvnw clean test
```

---

## Key Endpoints

Once the application starts, it listens on `http://localhost:8080`.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `http://localhost:8080/api/v1/health` | `GET` | Service Health check endpoint |
| `http://localhost:8080/swagger-ui.html` | `GET` | Interactive Swagger UI API documentation |
| `http://localhost:8080/v3/api-docs` | `GET` | OpenAPI 3.0 JSON specification |
| `http://localhost:8080/actuator/health` | `GET` | Spring Boot Actuator health endpoint |

### Health Check Sample Response

```bash
curl http://localhost:8080/api/v1/health
```

```json
{
  "status": "ok",
  "service": "api-sentinel-backend"
}
```

---

## Project Package Structure

```text
backend/
├── .mvn/
│   └── wrapper/
│       ├── maven-wrapper.jar
│       └── maven-wrapper.properties
├── mvnw
├── mvnw.cmd
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/apisentinel/
    │   │       ├── ApiSentinelApplication.java
    │   │       ├── config/
    │   │       │   ├── OpenApiConfig.java
    │   │       │   └── SecurityConfig.java
    │   │       ├── controller/
    │   │       │   └── HealthController.java
    │   │       ├── dto/
    │   │       │   └── HealthResponse.java
    │   │       ├── entity/
    │   │       ├── exception/
    │   │       ├── mapper/
    │   │       ├── repository/
    │   │       ├── security/
    │   │       ├── service/
    │   │       └── util/
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/
    │           └── migration/
    └── test/
        └── java/
            └── com/apisentinel/
                └── ApiSentinelApplicationTests.java
```

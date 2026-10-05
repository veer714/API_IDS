# Stage 1: Build JAR using Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy pom.xml and download dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create unprivileged user for security
RUN addgroup -S sentinel && adduser -S sentinel -G sentinel

COPY --from=builder /build/target/*.jar app.jar
RUN chown -R sentinel:sentinel /app

USER sentinel

ENV SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=postgres

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

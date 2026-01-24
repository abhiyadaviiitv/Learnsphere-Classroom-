# Multi-stage build for Analytics Service
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# First, build and install the common module (dependency)
COPY common/pom.xml ./common/
COPY common/src ./common/src
WORKDIR /app/common
RUN mvn clean install -DskipTests

# Now build the analytics-service
WORKDIR /app/analytics-service
COPY analytics-service/pom.xml .
COPY analytics-service/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/analytics-service/target/*.jar app.jar

# Expose Analytics Service port
EXPOSE 8085

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]


# Multi-stage build for Notification Service
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .
# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose Notification Service port
EXPOSE 8086

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]


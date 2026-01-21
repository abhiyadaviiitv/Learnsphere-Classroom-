FROM openjdk:21-jdk-slim

WORKDIR /app

COPY target/ai-assistant-service-1.0.0.jar app.jar

EXPOSE 8088

ENTRYPOINT ["java", "-jar", "app.jar"]


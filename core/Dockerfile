# Multi-stage build using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn package -DskipTests -Djooq.codegen.skip=true -B

# Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/core-*.jar app.jar

USER appuser
EXPOSE 8081 9090

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

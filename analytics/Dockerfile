# Multi-stage build using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
COPY target/generated-sources ./target/generated-sources
RUN mvn package -DskipTests -Djooq.codegen.skip=true -B

# Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/analytics-*.jar app.jar

USER appuser
EXPOSE 8083 9091

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

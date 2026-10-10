# Multi-stage build using Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code (including src/main/proto) and build
COPY src ./src
RUN mvn package -DskipTests -B

# Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/redirect-*.jar app.jar

USER appuser
EXPOSE 8082

ENV JAVA_OPTS="-XX:+UseG1GC -Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]


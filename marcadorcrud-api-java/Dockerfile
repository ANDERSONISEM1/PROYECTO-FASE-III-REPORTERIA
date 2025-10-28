# =============================
# STAGE 1: BUILD CON MAVEN
# =============================
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copiamos POM y descargamos dependencias
COPY pom.xml .
RUN mvn -q dependency:go-offline

# Copiamos el código fuente y compilamos
COPY src ./src
RUN mvn -q package -DskipTests

# =============================
# STAGE 2: RUNTIME (LIVIANO)
# =============================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copiamos solo el JAR generado del stage anterior
COPY --from=builder /app/target/*.jar app.jar

# Configuración del puerto de escucha
EXPOSE 5081

# Variables de entorno (opcionalmente sobreescribibles)
ENV SPRING_DATASOURCE_URL="jdbc:sqlserver://sqlserver:1433;databaseName=MarcadorBasket;encrypt=false;trustServerCertificate=true"
ENV SPRING_DATASOURCE_USERNAME=sa
ENV SPRING_DATASOURCE_PASSWORD="C*123.a+"
ENV SERVER_PORT=5081

# Ejecuta la aplicación
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

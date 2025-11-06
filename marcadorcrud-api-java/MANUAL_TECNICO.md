# Manual Técnico - Marcador CRUD API

## Descripción General

API REST desarrollada en Java 21 con Spring Boot para gestionar un sistema de marcadores de baloncesto. Implementa operaciones CRUD para equipos y jugadores, con persistencia en SQL Server.

## Arquitectura del Proyecto

El proyecto sigue el patrón **MVC (Model-View-Controller)** con arquitectura en capas:

```
┌─────────────────┐
│   Controllers   │  ← Endpoints REST (API)
├─────────────────┤
│    Services     │  ← Lógica de negocio
├─────────────────┤
│  Repositories   │  ← Acceso a datos (JPA)
├─────────────────┤
│    Entities     │  ← Modelos de base de datos
└─────────────────┘
```

### Componentes Principales

- **Controllers** (`controller/`): Exponen endpoints REST y manejan peticiones HTTP
- **Services** (`service/`): Contienen la lógica de negocio y validaciones
- **Repositories** (`repository/`): Interfaces JPA para operaciones de base de datos
- **Entities** (`entity/`): Modelos JPA mapeados a tablas de SQL Server
- **DTOs** (`dto/`): Objetos de transferencia de datos para requests/responses

## Dependencias Principales

| Dependencia           | Versión | Descripción                                |
| --------------------- | ------- | ------------------------------------------ |
| **Spring Boot**       | 3.3.4   | Framework principal para aplicaciones Java |
| **Spring Web**        | -       | Desarrollo de APIs REST y controladores    |
| **Spring Data JPA**   | -       | ORM para persistencia con Hibernate        |
| **Spring Validation** | -       | Validación de datos con anotaciones        |
| **Lombok**            | -       | Reduce boilerplate code (getters/setters)  |
| **SQL Server JDBC**   | 12.6.1  | Driver para conectar con SQL Server        |
| **Java**              | 21      | Versión del lenguaje                       |

## Instalación y Ejecución

### Requisitos Previos

- Java 21 (JDK)
- Maven 3.6+
- SQL Server 2022 (o contenedor Docker)
- Base de datos `MarcadorBasket` creada

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/ANDERSONISEM1/PROYECTO-FASE-FINAL/tree/main/marcadorcrud-api-java
cd marcadorcrud-api-java
```

### Paso 2: Configurar Base de Datos

Editar `src/main/resources/application.yml` con tus credenciales:

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=MarcadorBasket
    username: sa
    password: TU_PASSWORD
```

### Paso 3: Compilar el Proyecto

```bash
mvn clean install
```

### Paso 4: Ejecutar la Aplicación

```bash
mvn spring-boot:run
```

O ejecutar el JAR generado:

```bash
java -jar target/marcadorcrud-api-java-0.0.1-SNAPSHOT.jar
```

La API estará disponible en: `http://localhost:5081`

### Ejecución con Docker

```bash
docker build -t marcador-api .
docker run -p 5081:5081 marcador-api
```

## Configuración Básica

Archivo: `src/main/resources/application.yml`

```yaml
server:
  port: 5081 # Puerto del servidor

spring:
  datasource:
    url: jdbc:sqlserver://... # URL de conexión SQL Server
    username: sa # Usuario de base de datos
    password: C*123.a+ # Contraseña
  jpa:
    hibernate:
      ddl-auto: none # No auto-crear/modificar esquema
    show-sql: true # Mostrar queries SQL en consola
```

## Estructura de Carpetas

```
marcadorcrud-api-java/
├── src/main/java/com/marcador/crud/
│   ├── controller/             # Controladores REST
│   │   ├── EquiposController.java
│   │   ├── JugadoresController.java
│   │   └── TestController.java
│   ├── service/                # Lógica de negocio
│   │   ├── EquipoService.java
│   │   └── JugadorService.java
│   ├── repository/             # Acceso a datos (JPA)
│   │   ├── EquipoRepository.java
│   │   └── JugadorRepository.java
│   ├── entity/                 # Entidades JPA
│   │   ├── Equipo.java
│   │   └── Jugador.java
│   ├── dto/                    # Data Transfer Objects
│   │   ├── CreateEquipoRequest.java
│   │   ├── CreateJugadorRequest.java
│   │   ├── EquipoDto.java
│   │   └── JugadorDto.java
│   └── MarcadorcrudApiJavaApplication.java  # Clase principal
├── src/main/resources/
│   └── application.yml         # Configuración de la aplicación
├── pom.xml                     # Dependencias Maven
└── Dockerfile                  # Configuración Docker
```

## Endpoints del API

### Equipos (`/api/equipos`)

| Método   | Ruta                                  | Descripción                                                |
| -------- | ------------------------------------- | ---------------------------------------------------------- |
| `GET`    | `/api/equipos`                        | Listar todos los equipos (param: `soloActivos=true/false`) |
| `GET`    | `/api/equipos/{id}`                   | Obtener equipo por ID                                      |
| `GET`    | `/api/equipos/buscar?nombre={nombre}` | Buscar equipo por nombre                                   |
| `GET`    | `/api/equipos/existe?nombre={nombre}` | Verificar si existe un equipo                              |
| `POST`   | `/api/equipos`                        | Crear nuevo equipo                                         |
| `PUT`    | `/api/equipos/{id}`                   | Actualizar equipo                                          |
| `PUT`    | `/api/equipos/{id}/toggle-active`     | Activar/Desactivar equipo                                  |
| `DELETE` | `/api/equipos/{id}`                   | Eliminar equipo                                            |

### Jugadores (`/api/jugadores`)

| Método   | Ruta                                            | Descripción                                   |
| -------- | ----------------------------------------------- | --------------------------------------------- |
| `GET`    | `/api/jugadores`                                | Listar jugadores (param opcional: `equipoId`) |
| `GET`    | `/api/jugadores/{id}`                           | Obtener jugador por ID                        |
| `GET`    | `/api/jugadores/{partidoId}/partido`            | Jugadores por partido                         |
| `GET`    | `/api/jugadores/{partidoId}/partido/{equipoId}` | Jugadores por partido y equipo                |
| `POST`   | `/api/jugadores`                                | Crear nuevo jugador                           |
| `PUT`    | `/api/jugadores/{id}`                           | Actualizar jugador                            |
| `PUT`    | `/api/jugadores/{id}/toggle-active`             | Activar/Desactivar jugador                    |
| `DELETE` | `/api/jugadores/{id}`                           | Eliminar jugador                              |

### Ejemplo de Request Body

**Crear Equipo:**

```json
{
  "nombre": "Lakers",
  "ciudad": "Los Angeles"
}
```

**Crear Jugador:**

```json
{
  "nombre": "LeBron James",
  "numeroCamiseta": 23,
  "posicion": "Alero",
  "equipoId": 1
}
```

## Notas Técnicas

- CORS habilitado para `origins = "*"` (configurar para producción)
- Base de datos: SQL Server con dialecto Hibernate
- Puerto por defecto: `5081`
- Validaciones con `@Valid` en DTOs
- Respuestas de error con clase `ErrorResponse`

---

**Versión:** 0.0.1-SNAPSHOT  
**Última actualización:** Noviembre 2025

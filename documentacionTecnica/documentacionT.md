## Aplicacion web Tablero Basketball 

Se realizó una refactorización  de la arquitectura, separando la aplicación en distintos servicios para mejorar la escalabilidad y el mantenimiento. Además se incorporaron nuevos módulos de reportería y autenticación.*

La autenticación, que anteriormente se desarrollo en .Net 8, fue migrada a Node.js, adoptando un enfoque de microservicio independiente.*

El sistema continúa gestionando la información relacionada con equipos, jugadores y partidos, pero ahora cuenta con una estructura más modular.*

### Diagrama Arquitectura

![Arquitectura](Diagrama-Arquitectura.drawio.png)

### Microservicios y Lenguajes

**Microservicio Api** 


Desarrollado en C# y .net 8. Este servicio gestiona la lógica central del tablero de básquetbol, incluyendo la gestion de equipos, jugadores y partidos, utiliza SQL Server como base de datos.*

**Microservicio Api-auth**

Desarrollado en Node.js, servicio encargado de la autenticacion y autorización de los roles del usuario, este modulo implementa JWT para la seguridad, utiliza como base de datos MongoDb.*

**Microservicio Reporteria**

Desarrollado en Php y Laravel, servicio que se encarga de gestionar y generar reporter en pdf, teniendo en cuenta la informacion proveniendo de los demas servicios como el de api, utiliza como base de datos MySql.*

### Levantar sistema localmente (Docker, comandos, puertos)

Requisitos tener docker Desktop, docker compose y de igual manera tener libres los puertos descritos a continuacion.

#### puertos

 - SqlServer localhost:1433
 - MySql localhost: 3306/7
 - MongoDB localhost: 27018
 - node.js localhost: 3000
 - php(laravel) localhost: 8000
 - C#(.net 8) localhost5080
 - angular localhost: 4200

 ### Comando para levantar Sistema

 docker compose up -d --build
 
   - El siguiente comando lee el docker-compose.yml que contiene todos los servicios (SqlServer, front, api, etc).

   - Construye las imagenes 

   - Crea los contenedores ( apartir de las imagenes)

   - Crea los volumenes (bases de datos persistencia)

   - Levanta todos los servicios 

   - Conecta todos los contenedores en la red interna app-network

   Si todo corre como se espera deberias ver todos los contendores creados correctamente.

   ![Contenedores levantados correctamente](Contenedores.jpeg)

   ### Endpoints De los nuevos Microservicios(Reporteria, Autenticacion con Node.js)

   #### **php/laravel**

   Equipos

| Método HTTP | Endpoint | Descripcion  |
|--------------|-----------|-------------------|
| **GET** | /api/report/equipos        | Vista previa paginada de equipos                |
| **GET** | /api/report/lookup/equipos | Lista simple de equipos (solo id y nombre)      |
| **GET** | /api/report/equipos/pdf    | Genera y descarga el PDF del reporte de equipos |



Jugadores 

| Método HTTP | Endpoint                     | Descripcion                                                      |
|--------------|------------------------------|------------------------------------------------------------------|
| **GET**          | /api/report/jugadores        | Vista paginada de jugadores con filtros opcionales               |
| **GET**          | /api/report/jugadores/pdf    | Genera y descarga el PDF del reporte de jugadores                |



Partidos
   

| Método HTTP | Endpoint                      | Descripcion                                            |
|--------------|-------------------------------|------------------------------------------------------------------|
| **GET**          | /api/report/partidos          | Vista paginada de partidos con filtros por fecha                 |
| **GET**          | /api/report/partidos/pdf      | Genera y descarga el PDF del reporte de partidos                 |

 


Roster

| Método HTTP | Endpoint                 | Descripcion                                                       |
|--------------|--------------------------|------------------------------------------------------------------|
| **GET**          | /api/report/roster       | Vista paginada del roster por partido, con filtros por fecha o ID |
| **GET**         | /api/report/roster/pdf   | Genera y descarga el PDF del reporte de roster por partido        |


#### **Node.js**

| Método | Endpoint         | Descripción                    |
| ------ | ---------------- | ------------------------------ |
| **POST** | /auth/register | Registro de nuevo usuario      |
| **POST** | /auth/login    | Autenticación con JWT |



---
## Librerías y dependencias utilizadas por microservicio
###  API Principal (.NET 8)

Archivo: `api/api.csproj`  
Lenguaje: C# (.NET 8)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **Dapper** | 2.1.66 | ORM ligero para acceso a datos SQL Server |
| **Konscious.Security.Cryptography.Argon2** | 1.3.1 | Hashing seguro de contraseñas (Argon2id) |
| **Microsoft.AspNetCore.Authentication.JwtBearer** | 8.0.18 | Validación de tokens JWT |
| **Microsoft.AspNetCore.OpenApi** | 8.0.18 | Integración con OpenAPI/Swagger |
| **Microsoft.Data.SqlClient** | 6.1.1 | Conector oficial de SQL Server |
| **Swashbuckle.AspNetCore** | 6.6.2 | Documentación Swagger UI |
| **System.IdentityModel.Tokens.Jwt** | 8.14.0 | Manejo y firma de tokens JWT |

**Uso principal**
- Generación, validación y consumo de tokens JWT.
- Exposición de endpoints REST (`/api/equipos`, `/api/jugadores`, `/api/partidos`).
- Acceso directo a base de datos SQL Server mediante Dapper.
- Publicación y documentación vía Swagger.

---

### Microservicio de Reportería (Laravel 12)

Archivo: `reporteria/composer.json`  
Lenguaje: PHP 8.2 (Framework Laravel 12)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **laravel/framework** | ^12.0 | Framework base MVC |
| **barryvdh/laravel-dompdf** | ^3.1 | Generación de reportes PDF |
| **laravel/tinker** | ^2.10 | Consola interactiva para pruebas |
| **fakerphp/faker** | ^1.23 | Generación de datos de prueba |
| **phpunit/phpunit** | ^11.5.3 | Framework de pruebas unitarias |
| **nunomaduro/collision** | ^8.6 | Mejor manejo de excepciones en CLI |
| **laravel/sail** | ^1.41 | Entorno de desarrollo con Docker |
| **laravel/pint** | ^1.24 | Estilo y formateo de código PHP |

**Uso principal**
- Generación de vistas PDF (`/api/report/.../pdf`).
- Validación y transformación de datos desde MySQL/MariaDB.
- Comunicación con Angular mediante endpoints REST (`/api/report/*`).
- Uso de **DOMPDF** para exportación de reportes.

---

### Frontend Web (Angular 18)

Archivo: `web/package.json`  
Lenguaje: TypeScript (Angular 18)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **@angular/core**, **@angular/router**, **@angular/forms** | ^18.2.0 | Estructura base del framework Angular |
| **@microsoft/signalr** | ^9.0.6 | Comunicación en tiempo real (marcador) |
| **rxjs** | ~7.8.0 | Programación reactiva |
| **zone.js** | ~0.14.10 | Detección de cambios en Angular |
| **tailwindcss** (añadida manualmente) | ^3.x | Estilos CSS utilitarios |
| **typescript** | ~5.5.2 | Transpilador de TypeScript |

**Uso principal**
- Interfaz principal del sistema.
- Comunicación con los microservicios vía HTTP (`fetch` y `HttpClient`).
- Renderizado de tablas, filtros y visualización de reportes.
- Envío de parámetros (`equipo_id`, `desde`, `hasta`) al backend Laravel.
- Integración en tiempo real con SignalR.

---

### Microservicio API-Auth (NodeJS)

Archivo: `api-auth/package.json`  
Lenguaje: JavaScript (NodeJS + Express)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **express** | ^5.1.0 | Framework HTTP base |
| **mongoose** | ^8.19.1 | ORM para MongoDB |
| **mongodb** | ^6.20.0 | Driver nativo MongoDB |
| **bcryptjs** | ^3.0.2 | Hash seguro de contraseñas |
| **jsonwebtoken** | ^9.0.2 | Generación y validación de tokens JWT |
| **helmet** | ^8.1.0 | Seguridad HTTP headers |
| **cors** | ^2.8.5 | Control de orígenes (CORS) |
| **morgan** | ^1.10.1 | Logging de peticiones |
| **express-rate-limit** | ^8.1.0 | Límite de solicitudes (protección DDoS) |
| **zod** | ^4.1.12 | Validación de datos |
| **nodemon** *(dev)* | ^3.1.10 | Recarga automática en desarrollo |

**Uso principal**
- Registro e inicio de sesión de usuarios (`/auth/register`, `/auth/login`).
- Emisión de tokens JWT y validación centralizada.
- Conexión persistente con MongoDB.
- Seguridad y control de peticiones HTTP.

---


---
## Librerías y dependencias utilizadas por microservicio
###  API Principal (.NET 8)

Archivo: `api/api.csproj`  
Lenguaje: C# (.NET 8)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **Dapper** | 2.1.66 | ORM ligero para acceso a datos SQL Server |
| **Konscious.Security.Cryptography.Argon2** | 1.3.1 | Hashing seguro de contraseñas (Argon2id) |
| **Microsoft.AspNetCore.Authentication.JwtBearer** | 8.0.18 | Validación de tokens JWT |
| **Microsoft.AspNetCore.OpenApi** | 8.0.18 | Integración con OpenAPI/Swagger |
| **Microsoft.Data.SqlClient** | 6.1.1 | Conector oficial de SQL Server |
| **Swashbuckle.AspNetCore** | 6.6.2 | Documentación Swagger UI |
| **System.IdentityModel.Tokens.Jwt** | 8.14.0 | Manejo y firma de tokens JWT |

**Uso principal**
- Generación, validación y consumo de tokens JWT.
- Exposición de endpoints REST (`/api/equipos`, `/api/jugadores`, `/api/partidos`).
- Acceso directo a base de datos SQL Server mediante Dapper.
- Publicación y documentación vía Swagger.

---

### Microservicio de Reportería (Laravel 12)

Archivo: `reporteria/composer.json`  
Lenguaje: PHP 8.2 (Framework Laravel 12)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **laravel/framework** | ^12.0 | Framework base MVC |
| **barryvdh/laravel-dompdf** | ^3.1 | Generación de reportes PDF |
| **laravel/tinker** | ^2.10 | Consola interactiva para pruebas |
| **fakerphp/faker** | ^1.23 | Generación de datos de prueba |
| **phpunit/phpunit** | ^11.5.3 | Framework de pruebas unitarias |
| **nunomaduro/collision** | ^8.6 | Mejor manejo de excepciones en CLI |
| **laravel/sail** | ^1.41 | Entorno de desarrollo con Docker |
| **laravel/pint** | ^1.24 | Estilo y formateo de código PHP |

**Uso principal**
- Generación de vistas PDF (`/api/report/.../pdf`).
- Validación y transformación de datos desde MySQL/MariaDB.
- Comunicación con Angular mediante endpoints REST (`/api/report/*`).
- Uso de **DOMPDF** para exportación de reportes.

---

### Frontend Web (Angular 18)

Archivo: `web/package.json`  
Lenguaje: TypeScript (Angular 18)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **@angular/core**, **@angular/router**, **@angular/forms** | ^18.2.0 | Estructura base del framework Angular |
| **@microsoft/signalr** | ^9.0.6 | Comunicación en tiempo real (marcador) |
| **rxjs** | ~7.8.0 | Programación reactiva |
| **zone.js** | ~0.14.10 | Detección de cambios en Angular |
| **tailwindcss** (añadida manualmente) | ^3.x | Estilos CSS utilitarios |
| **typescript** | ~5.5.2 | Transpilador de TypeScript |

**Uso principal**
- Interfaz principal del sistema.
- Comunicación con los microservicios vía HTTP (`fetch` y `HttpClient`).
- Renderizado de tablas, filtros y visualización de reportes.
- Envío de parámetros (`equipo_id`, `desde`, `hasta`) al backend Laravel.
- Integración en tiempo real con SignalR.

---

### Microservicio API-Auth (NodeJS)

Archivo: `api-auth/package.json`  
Lenguaje: JavaScript (NodeJS + Express)

| Librería | Versión | Propósito |
|-----------|----------|-----------|
| **express** | ^5.1.0 | Framework HTTP base |
| **mongoose** | ^8.19.1 | ORM para MongoDB |
| **mongodb** | ^6.20.0 | Driver nativo MongoDB |
| **bcryptjs** | ^3.0.2 | Hash seguro de contraseñas |
| **jsonwebtoken** | ^9.0.2 | Generación y validación de tokens JWT |
| **helmet** | ^8.1.0 | Seguridad HTTP headers |
| **cors** | ^2.8.5 | Control de orígenes (CORS) |
| **morgan** | ^1.10.1 | Logging de peticiones |
| **express-rate-limit** | ^8.1.0 | Límite de solicitudes (protección DDoS) |
| **zod** | ^4.1.12 | Validación de datos |
| **nodemon** *(dev)* | ^3.1.10 | Recarga automática en desarrollo |

**Uso principal**
- Registro e inicio de sesión de usuarios (`/auth/register`, `/auth/login`).
- Emisión de tokens JWT y validación centralizada.
- Conexión persistente con MongoDB.
- Seguridad y control de peticiones HTTP.

---









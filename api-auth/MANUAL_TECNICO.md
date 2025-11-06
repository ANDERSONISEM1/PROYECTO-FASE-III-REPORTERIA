# Manual Técnico - API de Autenticación

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura y Componentes Principales](#arquitectura-y-componentes-principales)
3. [Requerimientos](#requerimientos)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Documentación de la API](#documentación-de-la-api)
8. [Seguridad](#seguridad)
9. [Mantenimiento](#mantenimiento)
10. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)

---

## Descripción General

**api-auth** es una API RESTful de autenticación y autorización desarrollada con Node.js y Express. Proporciona servicios de registro e inicio de sesión con autenticación tradicional (email/password) y OAuth 2.0 (GitHub y Google). Utiliza JWT para la gestión de sesiones y MongoDB como base de datos.

### Características Principales

- ✅ Autenticación tradicional (email/password)
- ✅ OAuth 2.0 con GitHub y Google
- ✅ Sistema de roles (ADMINISTRADOR, USUARIO, VISOR)
- ✅ Protección con Cloudflare Turnstile
- ✅ Rate limiting para prevenir ataques
- ✅ Tokens JWT con expiración
- ✅ Dockerizado con Traefik como reverse proxy
- ✅ HTTPS con certificados Let's Encrypt

---

## Arquitectura y Componentes Principales

### Arquitectura General

```
┌─────────────┐
│   Cliente   │ (Frontend Angular)
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Traefik   │ (Reverse Proxy + SSL)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Auth   │ (Express.js + Node.js)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MongoDB   │ (Base de Datos)
└─────────────┘
```

### Stack Tecnológico

- **Runtime**: Node.js 20
- **Framework**: Express.js 5.x
- **Base de Datos**: MongoDB 6.x con Mongoose 8.x
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: Helmet, bcryptjs, CORS
- **Rate Limiting**: express-rate-limit
- **Validación**: Zod
- **Containerización**: Docker + Docker Compose
- **Reverse Proxy**: Traefik 3.1
- **SSL**: Let's Encrypt (vía Cloudflare DNS Challenge)

### Componentes Clave

#### 1. **Servidor (server.js)**

Punto de entrada de la aplicación. Configura middlewares, rutas y conexión a la base de datos.

#### 2. **Base de Datos (db.js)**

Gestiona la conexión a MongoDB usando Mongoose.

#### 3. **Modelos (models/)**

- `user.js`: Define el esquema de usuarios con soporte para autenticación tradicional y OAuth.

#### 4. **Controladores (controllers/)**

- `auth.controller.js`: Maneja registro y login tradicional
- `github.controller.js`: Gestiona el flujo OAuth de GitHub
- `google.controller.js`: Gestiona el flujo OAuth de Google

#### 5. **Servicios (services/)**

- `auth.service.js`: Lógica de negocio para autenticación
- `github.service.js`: Integración con API de GitHub
- `google.service.js`: Integración con API de Google

#### 6. **Middleware (middleware/)**

- `auth.js`: Verificación de tokens JWT
- `authorize.js`: Control de acceso basado en roles
- `rateLimit.js`: Limitación de peticiones
- `turnstile.js`: Validación de Cloudflare Turnstile
- `asyncHandler.js`: Manejo de errores asíncronos

#### 7. **Rutas (routes/)**

Define todos los endpoints de la API.

#### 8. **Utilidades (utils/)**

- `appJwt.js`: Firma de tokens JWT
- `config.js`: Validación de variables de entorno
- `oauthState.js`: Gestión de estado OAuth

---

## Requerimientos

### Software

#### Desarrollo Local

- **Node.js**: 20.x o superior
- **npm**: 10.x o superior
- **MongoDB**: 6.x o superior (local o remoto)

#### Producción (Docker)

- **Docker**: 24.x o superior
- **Docker Compose**: 2.x o superior

### Hardware Recomendado

#### Desarrollo

- CPU: 2 cores
- RAM: 4 GB
- Disco: 10 GB libres

#### Producción

- CPU: 2-4 cores
- RAM: 2-4 GB
- Disco: 20 GB libres
- Red: Conexión estable a internet

### Servicios Externos Requeridos

1. **MongoDB**: Base de datos (local o MongoDB Atlas)
2. **GitHub OAuth App**: Para autenticación con GitHub
3. **Google Cloud Console**: Para autenticación con Google
4. **Cloudflare Turnstile**: Para protección anti-bot
5. **Cloudflare DNS** (producción): Para certificados SSL

---

## Instalación

### Opción 1: Desarrollo Local

#### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA.git
cd PROYECTO-FASE-III-REPORTERIA/api-auth
```

#### Paso 2: Instalar dependencias

```bash
npm install
```

#### Paso 3: Configurar variables de entorno

Crear archivo `.env` (ver sección [Configuración](#configuración))

#### Paso 4: Iniciar MongoDB

Si usas MongoDB local:

```bash
# Windows
mongod --dbpath=C:\data\db

# Linux/Mac
mongod --dbpath=/data/db
```

O usar MongoDB Atlas (cloud).

#### Paso 5: Iniciar servidor de desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`

---

### Opción 2: Producción con Docker

#### Paso 1: Clonar repositorio

```bash
git clone https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA.git
cd PROYECTO-FASE-III-REPORTERIA/api-auth
```

#### Paso 2: Configurar variables de entorno

Crear archivo `.env` (ver sección [Configuración](#configuración))

#### Paso 3: Construir imagen Docker

```bash
docker build -t api-auth:1.0 .
```

#### Paso 4: Iniciar servicios con Docker Compose

```bash
docker-compose up -d
```

#### Paso 5: Verificar servicios

```bash
# Ver logs
docker-compose logs -f auth

# Verificar estado
docker-compose ps

# Probar health endpoint
curl https://apilogin.mundoalonzo.com/health
```

---

## Configuración

### Variables de Entorno (.env)

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ==========================================
# SERVIDOR
# ==========================================
PORT=3000
NODE_ENV=production

# ==========================================
# BASE DE DATOS
# ==========================================
# MongoDB local
MONGO_URL=mongodb://localhost:27017/auth_db

# O MongoDB Atlas (cloud)
# MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/auth_db?retryWrites=true&w=majority

# ==========================================
# JWT (JSON WEB TOKENS)
# ==========================================
# Secreto para firmar tokens (usar string aleatorio de 64+ caracteres)
JWT_SECRET=tu_secreto_super_seguro_y_largo_minimo_64_caracteres_aleatorios

# Emisor del token (URL de tu API)
JWT_ISSUER=https://apilogin.mundoalonzo.com

# Audiencia del token (URL de tu frontend)
JWT_AUDIENCE=https://tu-frontend.com

# ==========================================
# OAUTH - GITHUB
# ==========================================
# Crear OAuth App en: https://github.com/settings/developers
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret
GITHUB_CALLBACK_URL=https://tu-frontend.com/auth/callback/github

# ==========================================
# OAUTH - GOOGLE
# ==========================================
# Crear OAuth Client en: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://tu-frontend.com/auth/callback/google

# ==========================================
# OAUTH STATE SECRET
# ==========================================
# Secreto para firmar el state de OAuth (previene CSRF)
OAUTH_STATE_SECRET=otro_secreto_aleatorio_de_64_caracteres

# ==========================================
# CLOUDFLARE TURNSTILE
# ==========================================
# Clave secreta de Turnstile (en src/middleware/turnstile.js)
# Nota: Por seguridad, mover a variable de entorno
TURNSTILE_SECRET_KEY=0x4AAAAAAB9_1zbO63CuvaKiSUqhpPrWzWI

# ==========================================
# CORS - FRONTEND URLS
# ==========================================
# URLs permitidas para CORS (separadas por comas)
FRONTEND_URLS=http://localhost:4200,https://tu-frontend.com

# ==========================================
# TRAEFIK / ACME (SOLO PRODUCCIÓN)
# ==========================================
# Email para certificados Let's Encrypt
ACME_EMAIL=tu-email@ejemplo.com

# Token API de Cloudflare (para DNS Challenge)
CF_DNS_API_TOKEN=tu_token_cloudflare
```

### Configuración de Servicios OAuth

#### GitHub OAuth App

1. Ir a: https://github.com/settings/developers
2. Click en "New OAuth App"
3. Completar:
   - **Application name**: API Auth
   - **Homepage URL**: https://tu-frontend.com
   - **Authorization callback URL**: https://tu-frontend.com/auth/callback/github
4. Copiar `Client ID` y `Client Secret` al `.env`

#### Google OAuth Client

1. Ir a: https://console.cloud.google.com/apis/credentials
2. Crear nuevo proyecto (si no existe)
3. Habilitar "Google+ API"
4. Crear credenciales OAuth 2.0:
   - **Tipo**: Aplicación web
   - **URIs de redireccionamiento**: https://tu-frontend.com/auth/callback/google
5. Copiar `Client ID` y `Client Secret` al `.env`

#### Cloudflare Turnstile

1. Ir a: https://dash.cloudflare.com/
2. Seleccionar "Turnstile"
3. Crear nuevo sitio
4. Copiar `Site Key` (para el frontend) y `Secret Key` (para el backend)
5. **Importante**: Mover el `Secret Key` a variable de entorno en `.env`

---

## Estructura del Proyecto

```
api-auth/
│
├── src/
│   ├── constants/
│   │   └── roles.js              # Definición de roles del sistema
│   │
│   ├── controllers/
│   │   ├── auth.controller.js     # Controlador de registro/login
│   │   ├── github.controller.js   # Controlador OAuth GitHub
│   │   ├── google.controller.js   # Controlador OAuth Google
│   │   └── user.controller.js     # Controlador de usuarios (futuro)
│   │
│   ├── middleware/
│   │   ├── asyncHandler.js        # Wrapper para errores asíncronos
│   │   ├── auth.js                # Verificación de JWT
│   │   ├── authorize.js           # Control de acceso por roles
│   │   ├── rateLimit.js           # Limitación de peticiones
│   │   └── tunstile.js            # Validación Cloudflare Turnstile
│   │
│   ├── models/
│   │   └── user.js                # Modelo de usuario (Mongoose)
│   │
│   ├── routes/
│   │   ├── auth.github.js         # Rutas OAuth GitHub
│   │   ├── auth.google.js         # Rutas OAuth Google
│   │   ├── auth.login.js          # Ruta de login
│   │   ├── auth.register.js       # Ruta de registro
│   │   ├── health.js              # Ruta de health check
│   │   └── user.me.js             # Ruta de perfil de usuario
│   │
│   ├── services/
│   │   ├── auth.service.js        # Lógica de autenticación
│   │   ├── github.service.js      # Integración con GitHub API
│   │   └── google.service.js      # Integración con Google API
│   │
│   ├── utils/
│   │   ├── appJwt.js              # Firma de tokens JWT
│   │   ├── config.js              # Validación de configuración
│   │   └── oauthState.js          # Gestión de state OAuth
│   │
│   ├── db.js                      # Conexión a MongoDB
│   └── server.js                  # Punto de entrada de la app
│
├── .env                           # Variables de entorno (NO SUBIR A GIT)
├── .gitignore                     # Archivos ignorados por Git
├── docker-compose.yml             # Orquestación de contenedores
├── Dockerfile                     # Imagen Docker de la aplicación
├── package.json                   # Dependencias y scripts
└── MANUAL_TECNICO.md              # Este documento
```

### Descripción de Carpetas

#### `/src/constants`

Contiene valores constantes usados en toda la aplicación.

- `roles.js`: Define los roles del sistema (ADMINISTRADOR, USUARIO, VISOR)

#### `/src/controllers`

Contienen la lógica de manejo de peticiones HTTP.

- Validan datos de entrada
- Llaman a servicios
- Devuelven respuestas HTTP

#### `/src/middleware`

Funciones que se ejecutan antes de los controladores.

- `auth.js`: Valida tokens JWT
- `authorize.js`: Verifica permisos por rol
- `rateLimit.js`: Limita peticiones por IP
- `turnstile.js`: Verifica captcha de Cloudflare

#### `/src/models`

Esquemas de Mongoose para MongoDB.

- `user.js`: Define estructura de usuarios

#### `/src/routes`

Define endpoints y asocia con controladores.

#### `/src/services`

Contiene la lógica de negocio.

- Interactúan con la base de datos
- Llaman APIs externas
- Procesan datos

#### `/src/utils`

Funciones auxiliares reutilizables.

---

## Documentación de la API

### Base URL

**Desarrollo**: `http://localhost:3000`  
**Producción**: `https://apilogin.mundoalonzo.com`

---

### Endpoints Públicos

#### 1. Health Check

**GET** `/health`

Verifica el estado del servidor y la conexión a la base de datos.

**Respuesta (200 OK):**

```json
{
  "status": "ok",
  "uptime": 12345.67,
  "db": "conectado",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

---

### Autenticación Tradicional

#### 2. Registro de Usuario

**POST** `/auth/register`

Crea una nueva cuenta de usuario.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "contraseña_segura",
  "direccion": "Calle 123, Ciudad",
  "role": "USUARIO",
  "cf-turnstile-response": "token_turnstile_del_frontend"
}
```

**Validaciones:**

- `nombre`: Mínimo 2 caracteres
- `email`: Formato válido de email
- `password`: Mínimo 8 caracteres
- `role`: Opcional (ADMINISTRADOR, USUARIO, VISOR). Por defecto: USUARIO
- `direccion`: Opcional
- `cf-turnstile-response`: Requerido (token de Cloudflare Turnstile)

**Rate Limit:** 10 intentos por hora por IP

**Respuesta (201 Created):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "direccion": "Calle 123, Ciudad",
  "role": "USUARIO"
}
```

**Errores:**

- **400**: Datos inválidos
- **403**: Turnstile inválido
- **409**: Email ya registrado
- **429**: Demasiados intentos
- **500**: Error del servidor

---

#### 3. Inicio de Sesión

**POST** `/auth/login`

Inicia sesión con email y contraseña.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "juan@ejemplo.com",
  "password": "contraseña_segura",
  "cf-turnstile-response": "token_turnstile_del_frontend"
}
```

**Rate Limit:** 20 intentos cada 5 minutos por IP

**Respuesta (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAtUtc": "2025-11-06T10:30:00.000Z",
  "username": "juan@ejemplo.com",
  "roles": ["USUARIO"]
}
```

**Errores:**

- **400**: Datos inválidos
- **401**: Credenciales incorrectas
- **403**: Turnstile inválido
- **429**: Demasiados intentos
- **500**: Error del servidor

---

### Autenticación OAuth - GitHub

#### 4. Obtener URL de Autorización de GitHub

**GET** `/auth/github/url`

Genera la URL para redirigir al usuario a GitHub.

**Rate Limit:** 40 intentos por minuto por IP

**Respuesta (200 OK):**

```json
{
  "authorizeUrl": "https://github.com/login/oauth/authorize?client_id=...&state=...",
  "state": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Flujo:**

1. Frontend llama a este endpoint
2. Frontend guarda el `state` en localStorage
3. Frontend redirige al usuario a `authorizeUrl`
4. Usuario autoriza en GitHub
5. GitHub redirige a tu frontend con `code` y `state`
6. Frontend llama al endpoint de exchange

---

#### 5. Intercambiar Código de GitHub

**POST** `/auth/github/exchange`

Intercambia el código de GitHub por un token JWT de tu aplicación.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "code": "codigo_de_github",
  "state": "state_guardado_anteriormente"
}
```

**Rate Limit:** 40 intentos por minuto por IP

**Respuesta (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAtUtc": "2025-11-06T10:30:00.000Z",
  "username": "usuario@email.com",
  "roles": ["USUARIO"]
}
```

**Errores:**

- **400**: Falta code o state / State inválido
- **429**: Demasiados intentos
- **500**: Error intercambiando con GitHub

---

### Autenticación OAuth - Google

#### 6. Obtener URL de Autorización de Google

**GET** `/auth/google/url`

Genera la URL para redirigir al usuario a Google.

**Rate Limit:** 40 intentos por minuto por IP

**Respuesta (200 OK):**

```json
{
  "authorizeUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&state=...",
  "state": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 7. Intercambiar Código de Google

**POST** `/auth/google/exchange`

Intercambia el código de Google por un token JWT de tu aplicación.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "code": "codigo_de_google",
  "state": "state_guardado_anteriormente"
}
```

**Rate Limit:** 40 intentos por minuto por IP

**Respuesta (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAtUtc": "2025-11-06T10:30:00.000Z",
  "username": "usuario@gmail.com",
  "roles": ["ADMINISTRADOR"]
}
```

**Nota:** Los usuarios de Google se crean con rol ADMINISTRADOR por defecto (ver `google.service.js`).

**Errores:**

- **400**: Falta code o state / State inválido
- **429**: Demasiados intentos
- **500**: Error intercambiando con Google

---

### Endpoints Protegidos

Para acceder a estos endpoints, debes incluir el token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 8. Obtener Perfil del Usuario Actual

**GET** `/user/me`

Obtiene información del usuario autenticado.

**Headers:**

```
Authorization: Bearer <token>
```

**Respuesta (200 OK):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "direccion": "Calle 123, Ciudad",
  "role": "USUARIO",
  "avatarUrl": "https://avatars.githubusercontent.com/u/123456",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-05T10:30:00.000Z"
}
```

**Errores:**

- **401**: Token faltante o inválido
- **404**: Usuario no encontrado
- **500**: Error del servidor

---

### Formato de JWT

Los tokens JWT emitidos por la API contienen:

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "role": ["USUARIO"],
  "iss": "https://apilogin.mundoalonzo.com",
  "aud": "https://tu-frontend.com",
  "iat": 1699185000,
  "exp": 1699271400
}
```

**Campos:**

- `sub`: ID del usuario en MongoDB
- `name`: Nombre del usuario
- `email`: Email del usuario
- `role`: Array de roles
- `iss`: Emisor del token (tu API)
- `aud`: Audiencia (tu frontend)
- `iat`: Timestamp de emisión
- `exp`: Timestamp de expiración (24h después)

---

### Códigos de Estado HTTP

| Código | Significado           | Descripción                         |
| ------ | --------------------- | ----------------------------------- |
| 200    | OK                    | Petición exitosa                    |
| 201    | Created               | Recurso creado exitosamente         |
| 400    | Bad Request           | Datos inválidos                     |
| 401    | Unauthorized          | Token faltante o inválido           |
| 403    | Forbidden             | Sin permisos / Turnstile inválido   |
| 404    | Not Found             | Recurso no encontrado               |
| 409    | Conflict              | Recurso duplicado (email ya existe) |
| 429    | Too Many Requests     | Rate limit excedido                 |
| 500    | Internal Server Error | Error del servidor                  |

---

## Seguridad

### Medidas Implementadas

#### 1. **Helmet**

Configura headers HTTP seguros:

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

#### 2. **CORS**

- Lista blanca de orígenes permitidos
- Configurado en `FRONTEND_URLS` del `.env`
- Bloquea peticiones de dominios no autorizados

#### 3. **Rate Limiting**

Previene ataques de fuerza bruta:

- **Login**: 20 intentos cada 5 minutos
- **Registro**: 10 intentos por hora
- **OAuth**: 40 intentos por minuto

#### 4. **Cloudflare Turnstile**

- Protección anti-bot en registro y login
- Valida que las peticiones provengan de humanos

#### 5. **Bcrypt**

- Passwords hasheados con 12 rondas de salt
- Nunca se almacenan passwords en texto plano

#### 6. **JWT**

- Tokens firmados con HS256
- Expiración de 24 horas
- Secreto de 64+ caracteres aleatorios
- Validación de issuer y audience

#### 7. **OAuth State**

- Token firmado para prevenir CSRF
- Expiración de 5 minutos
- Validación en el callback

#### 8. **HTTPS**

- Certificados Let's Encrypt
- Redirección automática de HTTP a HTTPS
- Configurado en Traefik

#### 9. **Mongoose**

- Validación de esquemas
- Prevención de inyección NoSQL
- Índices para optimización

---

### Mejores Prácticas

#### Desarrollo

- ✅ Nunca subir `.env` a Git
- ✅ Usar secrets diferentes para cada entorno
- ✅ Rotar secrets regularmente
- ✅ Validar todas las entradas
- ✅ Logs sin información sensible

#### Producción

- ✅ Usar HTTPS siempre
- ✅ Configurar firewalls
- ✅ Monitorear logs de acceso
- ✅ Backups regulares de MongoDB
- ✅ Mantener dependencias actualizadas

---

## Mantenimiento

### Actualizar Dependencias

```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar todas a versiones compatibles
npm update

# Actualizar una dependencia específica
npm install express@latest

# Auditoría de seguridad
npm audit

# Reparar vulnerabilidades automáticamente
npm audit fix
```

### Logs

#### Desarrollo Local

```bash
# Los logs aparecen en la consola directamente
npm run dev
```

#### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f auth

# Ver últimas 100 líneas
docker-compose logs --tail=100 auth

# Logs con timestamps
docker-compose logs -t auth
```

### Backup de MongoDB

#### MongoDB Local

```bash
# Crear backup
mongodump --db=auth_db --out=/backup/$(date +%Y%m%d)

# Restaurar backup
mongorestore --db=auth_db /backup/20251105/auth_db
```

#### MongoDB Atlas

- Backups automáticos configurables desde el panel
- Snapshots bajo demanda
- Point-in-time recovery

### Monitoreo

#### Health Check

```bash
# Verificar estado del servicio
curl https://apilogin.mundoalonzo.com/health

# O con formato
curl -s https://apilogin.mundoalonzo.com/health | jq
```

**Respuesta esperada:**

```json
{
  "status": "ok",
  "uptime": 123456.78,
  "db": "conectado",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

#### Docker Healthcheck

```bash
# Ver estado de salud del contenedor
docker inspect --format='{{.State.Health.Status}}' api-auth

# Ver últimos healthchecks
docker inspect --format='{{json .State.Health}}' api-auth | jq
```

### Reiniciar Servicios

#### Docker

```bash
# Reiniciar un servicio
docker-compose restart auth

# Reiniciar todos los servicios
docker-compose restart

# Reconstruir imagen y reiniciar
docker-compose up -d --build auth
```

#### Actualizar Código en Producción

```bash
# 1. Hacer pull del código actualizado
git pull origin main

# 2. Reconstruir imagen
docker build -t api-auth:1.0 .

# 3. Reiniciar servicio
docker-compose up -d --force-recreate auth

# 4. Verificar logs
docker-compose logs -f auth
```

### Rotación de Secrets

Cuando necesites cambiar secrets (JWT_SECRET, OAuth credentials, etc.):

```bash
# 1. Actualizar .env con nuevos valores
nano .env

# 2. Reiniciar servicio
docker-compose restart auth

# 3. Verificar que funciona
curl https://apilogin.mundoalonzo.com/health

# Nota: Los tokens JWT antiguos quedarán inválidos inmediatamente
```

---

## Errores Comunes y Soluciones

### 1. Error: "Falta MONGO_URL en .env"

**Causa:** No se configuró la variable de entorno `MONGO_URL`

**Solución:**

```bash
# Agregar a .env
MONGO_URL=mongodb://localhost:27017/auth_db
```

---

### 2. Error: "ECONNREFUSED 127.0.0.1:27017"

**Causa:** MongoDB no está corriendo o no es accesible

**Solución:**

**Windows:**

```powershell
# Iniciar MongoDB como servicio
net start MongoDB

# O manualmente
mongod --dbpath=C:\data\db
```

**Linux/Mac:**

```bash
sudo systemctl start mongod
# o
brew services start mongodb-community
```

**Docker:**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:6
```

---

### 3. Error: "Email ya registrado" (409)

**Causa:** El email ya existe en la base de datos

**Solución:**

- Usar otro email
- O eliminar el usuario existente si es de prueba:

```javascript
// En Mongo Shell o MongoDB Compass
db.users.deleteOne({ email: "test@ejemplo.com" });
```

---

### 4. Error: "Token inválido o expirado" (401)

**Causa:** El JWT expiró (24h) o el `JWT_SECRET` cambió

**Solución:**

- Hacer login nuevamente para obtener un nuevo token
- Verificar que el `JWT_SECRET` no haya cambiado
- Verificar que `iss` y `aud` coincidan con la configuración

---

### 5. Error: "CORS no permitido para el origen"

**Causa:** El frontend está en un dominio no autorizado

**Solución:**

```bash
# Agregar dominio a FRONTEND_URLS en .env
FRONTEND_URLS=http://localhost:4200,https://nuevo-dominio.com

# Reiniciar servidor
npm run dev  # o docker-compose restart auth
```

---

### 6. Error: "No se recibió access_token de GitHub/Google"

**Causa:** Credenciales OAuth incorrectas o mal configuradas

**Solución GitHub:**

1. Verificar `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`
2. Verificar que `GITHUB_CALLBACK_URL` coincida con la configuración en GitHub
3. Asegurarse de que la OAuth App esté activa

**Solución Google:**

1. Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
2. Verificar que `GOOGLE_CALLBACK_URL` esté en la lista de URIs autorizadas
3. Verificar que Google+ API esté habilitada

---

### 7. Error: "Rate limit excedido" (429)

**Causa:** Se superó el límite de peticiones por IP

**Solución:**

- Esperar el tiempo indicado (5 min para login, 1 hora para registro)
- Si es desarrollo, aumentar límites en `src/middleware/rateLimit.js`:

```javascript
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100, // Aumentar de 20 a 100
  // ...
});
```

---

### 8. Error: "Verificación Turnstile inválida" (403)

**Causa:** Token de Turnstile inválido o secreto incorrecto

**Solución:**

1. Verificar que el frontend envíe `cf-turnstile-response`
2. Verificar que `TURNSTILE_SECRET_KEY` sea correcto
3. En desarrollo, comentar temporalmente el middleware:

```javascript
// src/routes/auth.login.js
router.post("/login", loginLimiter, /* verifyTurnstile, */ login);
```

---

### 9. Error: Docker no puede construir la imagen

**Causa:** Falta Node modules o errores en Dockerfile

**Solución:**

```bash
# Limpiar cachés
docker system prune -a

# Reconstruir sin caché
docker build --no-cache -t api-auth:1.0 .

# Verificar que package.json existe
ls -la package.json
```

---

### 10. Error: Traefik no genera certificados SSL

**Causa:** Configuración incorrecta de Cloudflare o DNS

**Solución:**

1. Verificar `CF_DNS_API_TOKEN` en docker-compose.yml
2. Verificar que el token tenga permisos de edición de DNS
3. Verificar que el dominio apunte a tu servidor
4. Ver logs de Traefik:

```bash
docker-compose logs -f traefik
```

5. Verificar archivo acme.json:

```bash
docker exec traefik ls -la /letsencrypt/acme.json
```

---

### 11. Error: "MongooseServerSelectionError"

**Causa:** MongoDB no es accesible o las credenciales son incorrectas

**Solución:**

```bash
# Verificar conectividad
mongosh "mongodb://localhost:27017/auth_db"

# O con MongoDB Atlas
mongosh "mongodb+srv://usuario:password@cluster.mongodb.net/"

# Verificar que MONGO_URL tenga el formato correcto
# Local: mongodb://localhost:27017/auth_db
# Atlas: mongodb+srv://usuario:password@cluster.mongodb.net/auth_db
```

---

### 12. Error: "Falta variable de entorno X"

**Causa:** No se configuraron todas las variables requeridas

**Solución:**
Verificar que el `.env` contenga todas las variables listadas en `src/utils/config.js`:

```javascript
const required = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "JWT_SECRET",
  "JWT_ISSUER",
  "JWT_AUDIENCE",
  "OAUTH_STATE_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];
```

---

### Debugging

#### Habilitar logs detallados

```javascript
// src/server.js
// Cambiar morgan a 'combined' para más detalle
app.use(morgan("combined"));
```

#### Ver variables de entorno en Docker

```bash
docker exec api-auth env
```

#### Conectarse al contenedor

```bash
docker exec -it api-auth sh

# Dentro del contenedor
ls -la
cat .env
node -v
npm list
```

#### Probar endpoints con curl

```bash
# Health check
curl https://apilogin.mundoalonzo.com/health

# Registro
curl -X POST https://apilogin.mundoalonzo.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@test.com",
    "password": "password123",
    "cf-turnstile-response": "fake_token_for_testing"
  }'

# Login
curl -X POST https://apilogin.mundoalonzo.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "cf-turnstile-response": "fake_token_for_testing"
  }'
```

---

## Contacto y Soporte

Para más información sobre este proyecto:

- **Repositorio**: https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA
- **Autor**: ANDERSONISEM1

---

## Licencia

Este proyecto es privado y fue desarrollado con fines educativos para la Universidad.

---

## Changelog

### v1.0.0 (2025-11-05)

- ✅ Autenticación tradicional (email/password)
- ✅ OAuth con GitHub y Google
- ✅ Sistema de roles
- ✅ Protección con Turnstile
- ✅ Rate limiting
- ✅ Dockerizado con Traefik
- ✅ HTTPS con Let's Encrypt

---

**Fecha de última actualización**: Noviembre 5, 2025

# Manual Técnico - Sistema de Gestión Deportiva

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requerimientos](#requerimientos)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Componentes Principales](#componentes-principales)
8. [Servicios y APIs](#servicios-y-apis)
9. [Autenticación y Seguridad](#autenticación-y-seguridad)
10. [Despliegue](#despliegue)

---

## Descripción General

Sistema web de gestión deportiva para administración de equipos, jugadores, partidos e historial. El frontend está desarrollado en **Angular 18** con arquitectura standalone components, conectándose a múltiples microservicios backend.

### Características Principales

- 🔐 Autenticación multi-proveedor (OAuth GitHub, OAuth Google, credenciales locales)
- 👥 Gestión de usuarios con roles (ADMINISTRADOR, USUARIO)
- 🏀 CRUD de equipos, jugadores y partidos
- 📊 Dashboard con KPIs en tiempo real
- 📈 Sistema de reportería con exportación a PDF
- ⚡ Actualizaciones en tiempo real con SignalR
- 🎯 Control de partidos en vivo
- 📱 Interfaz responsive

---

## Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 18)                │
│                   Puerto: 4200 (dev)                    │
│                   Puerto: 80 (prod)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬─────────────┐
        │                     │              │             │
        ▼                     ▼              ▼             ▼
┌──────────────┐    ┌──────────────┐  ┌──────────┐  ┌──────────┐
│   API Auth   │    │   API Java   │  │API Python│  │API .NET  │
│   (Login)    │    │  (CRUD Base) │  │(Partidos)│  │  (KPIs)  │
│  Cloudflare  │    │ Puerto: 5081 │  │Puerto:   │  │Puerto:   │
└──────────────┘    └──────────────┘  │  5082    │  │  5080    │
                                       └──────────┘  └──────────┘
                                              │
                                              ▼
                                       ┌──────────┐
                                       │ Laravel  │
                                       │(Reports) │
                                       │Puerto:   │
                                       │  8000    │
                                       └──────────┘
```

### Capas de la Aplicación

#### 1. **Capa de Presentación**

- Componentes standalone de Angular
- Gestión de estado local con RxJS
- Routing modular con lazy loading
- Guards para control de acceso

#### 2. **Capa de Servicios**

- HTTP interceptors para autenticación
- Servicios especializados por dominio
- Manejo centralizado de errores
- Cache y optimización de peticiones

#### 3. **Capa de Seguridad**

- JWT Bearer Tokens
- Auth Guards y Role Guards
- Interceptor de autenticación
- Token storage persistente

#### 4. **Integración Backend**

- **API Login** (Cloudflare): Autenticación OAuth y credenciales
- **API Java** (5081): CRUD de Equipos y Jugadores
- **API Python** (5082): Gestión de Partidos, Historial y KPIs
- **API .NET** (5080): KPIs y Dashboard (legacy)
- **API Laravel** (8000): Sistema de reportería con PDF

---

## Requerimientos

### Software Requerido

#### Desarrollo

| Software    | Versión Mínima | Versión Recomendada | Propósito                  |
| ----------- | -------------- | ------------------- | -------------------------- |
| Node.js     | 18.x           | 20.x                | Runtime de JavaScript      |
| npm         | 9.x            | 10.x                | Gestor de paquetes         |
| Angular CLI | 18.2.0         | 18.2.20             | Herramientas de desarrollo |
| TypeScript  | 5.5.0          | 5.5.2               | Lenguaje de programación   |
| Git         | 2.30+          | Latest              | Control de versiones       |

#### Producción

| Software | Versión        | Propósito              |
| -------- | -------------- | ---------------------- |
| Docker   | 20.10+         | Contenedorización      |
| Nginx    | 1.25+ (Alpine) | Servidor web           |
| Node.js  | 20.x (Alpine)  | Build de la aplicación |

### Hardware Recomendado

#### Entorno de Desarrollo

- **CPU**: 2 cores mínimo, 4+ recomendado
- **RAM**: 4 GB mínimo, 8 GB+ recomendado
- **Disco**: 2 GB para proyecto + 5 GB para node_modules
- **Sistema Operativo**: Windows 10/11, macOS 11+, Linux (Ubuntu 20.04+)

#### Entorno de Producción

- **CPU**: 1 core (contenedor puede escalar)
- **RAM**: 512 MB - 1 GB
- **Disco**: 500 MB (imagen del contenedor)
- **Red**: Conexión estable a Internet (para APIs externas)

### Dependencias del Proyecto

#### Dependencias de Producción

```json
{
  "@angular/animations": "^18.2.0",
  "@angular/common": "^18.2.0",
  "@angular/compiler": "^18.2.0",
  "@angular/core": "^18.2.0",
  "@angular/forms": "^18.2.0",
  "@angular/platform-browser": "^18.2.0",
  "@angular/platform-browser-dynamic": "^18.2.0",
  "@angular/router": "^18.2.0",
  "@microsoft/signalr": "^9.0.6",
  "rxjs": "~7.8.0",
  "tslib": "^2.3.0",
  "zone.js": "~0.14.10"
}
```

#### Dependencias de Desarrollo

```json
{
  "@angular-devkit/build-angular": "^18.2.20",
  "@angular/cli": "^18.2.20",
  "@angular/compiler-cli": "^18.2.0",
  "@types/jasmine": "~5.1.0",
  "jasmine-core": "~5.2.0",
  "karma": "~6.4.0",
  "karma-chrome-launcher": "~3.2.0",
  "karma-coverage": "~2.2.0",
  "karma-jasmine": "~5.1.0",
  "karma-jasmine-html-reporter": "~2.1.0",
  "typescript": "~5.5.2"
}
```

---

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA.git
cd PROYECTO-FASE-III-REPORTERIA/web
```

### 2. Instalar Dependencias

#### Opción A: Instalación Normal

```bash
npm install
```

#### Opción B: Instalación Limpia (Recomendada)

```bash
# Limpiar cache de npm
npm cache clean --force

# Instalar dependencias
npm ci
```

### 3. Verificar Instalación

```bash
# Verificar versión de Angular CLI
ng version

# Verificar que Node.js esté correctamente instalado
node --version

# Verificar npm
npm --version
```

**Salida esperada:**

```
Angular CLI: 18.2.20
Node: 20.x.x
Package Manager: npm 10.x.x
```

### 4. Configurar Variables de Entorno

Editar el archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false, // Cambiar a true en producción
  apiBaseLogin: "https://apilogin.mundoalonzo.com",
  apiJava: "http://localhost:5081",
  apiPython: "http://localhost:5082",
  apiDotNet: "http://localhost:5080",
  apiBase: "http://localhost:5080", // Deprecated
};
```

### 5. Iniciar Servidor de Desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

---

## Configuración

### Archivo: `environment.ts`

Este archivo centraliza todas las URLs de los microservicios:

```typescript
export const environment = {
  production: true, // false para desarrollo

  // API de Autenticación (Cloudflare)
  apiBaseLogin: "https://apilogin.mundoalonzo.com",

  // API Java - Equipos y Jugadores (CRUD)
  apiJava: "http://localhost:5081",

  // API Python - Partidos, Historial y KPIs
  apiPython: "http://localhost:5082",

  // API .NET - KPIs y Dashboard (legacy)
  apiDotNet: "http://localhost:5080",

  // Compatibilidad (deprecated)
  apiBase: "http://localhost:5080",
};
```

### Archivo: `proxy.conf.json`

Configuración del proxy para desarrollo (evita problemas de CORS):

```json
{
  "/api": {
    "target": "http://127.0.0.1:8000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "info"
  }
}
```

**Uso:** El proxy redirige las peticiones de `/api/report/*` hacia Laravel en el puerto 8000.

### Archivo: `angular.json`

Configuraciones clave:

- **Puerto de desarrollo**: 4200 (por defecto)
- **Proxy config**: `proxy.conf.json`
- **Estilos**: `styles.scss`, `styles-faseII.scss`
- **Build output**: `dist/web`
- **Configuraciones de build**:
  - `development`: Sin optimización, con source maps
  - `production`: Optimizado, con hashing
  - `production-docker`: Límites de tamaño más altos

---

## Estructura del Proyecto

```
web/
│
├── angular.json              # Configuración de Angular CLI
├── package.json              # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
├── Dockerfile               # Imagen Docker multi-stage
├── nginx.conf               # Configuración Nginx
├── proxy.conf.json          # Proxy para desarrollo
│
├── public/                  # Assets estáticos públicos
│
└── src/
    ├── index.html           # Plantilla HTML principal
    ├── main.ts              # Bootstrap de la aplicación
    ├── styles.scss          # Estilos globales
    ├── styles-faseII.scss   # Estilos adicionales
    │
    ├── environments/        # Variables de entorno
    │   └── environment.ts
    │
    └── app/
        ├── app.component.*       # Componente raíz
        ├── app.config.ts         # Configuración de la app
        ├── app.routes.ts         # Definición de rutas
        │
        ├── admin/                # Layout administrativo
        │   └── admin-layout.component.ts
        │
        ├── Auth/                 # Sistema de autenticación
        │   ├── auth.service.ts
        │   ├── auth.guard.ts
        │   ├── auth.interceptor.ts
        │   ├── role.guard.ts
        │   ├── token-storage.service.ts
        │   ├── login.component.*
        │   ├── oauth-github.component.ts
        │   ├── oauth-google.component.ts
        │   └── edge-check.component.ts
        │
        ├── core/                 # Servicios core
        │   ├── api.service.ts
        │   ├── nav.model.ts
        │   └── nav.service.ts
        │
        ├── pages/                # Páginas funcionales
        │   ├── inicio/           # Dashboard principal
        │   │   ├── inicio.component.ts
        │   │   └── inicio.service.ts
        │   │
        │   ├── equipos/          # Gestión de equipos
        │   │   ├── equipos.component.*
        │   │   ├── equipos.model.ts
        │   │   └── equipos.service.ts
        │   │
        │   ├── jugadores/        # Gestión de jugadores
        │   │   ├── jugadores.component.ts
        │   │   ├── jugadores.model.ts
        │   │   └── jugadores.service.ts
        │   │
        │   ├── partidos/         # Gestión de partidos
        │   │   ├── partidos.component.ts
        │   │   ├── partidos.model.ts
        │   │   └── partidos.service.ts
        │   │
        │   ├── historial/        # Historial de partidos
        │   │   ├── historial.component.ts
        │   │   └── historial.service.ts
        │   │
        │   ├── control/          # Control de partido en vivo
        │   │   └── control.component.ts
        │   │
        │   ├── visor/            # Visualización pública
        │   │   └── visor.component.ts
        │   │
        │   ├── Reporteria/       # Sistema de reportes
        │   │   ├── reporteria.component.ts
        │   │   └── reporteria.service.ts
        │   │
        │   └── ajustes/          # Configuración del sistema
        │       ├── ajustes.component.ts
        │       ├── ajustes-api.service.ts
        │       └── ajustes-backend.adapter.ts
        │
        └── shared/               # Componentes compartidos
            └── api.ts
```

### Descripción de Carpetas Clave

#### `/Auth`

Contiene todo el sistema de autenticación:

- **Guards**: Protección de rutas (`authGuard`, `roleGuard`)
- **Interceptor**: Inyección automática de tokens JWT
- **Services**: Lógica de login/logout, OAuth
- **Components**: UI de login y callbacks OAuth

#### `/core`

Servicios y modelos centrales del sistema:

- Servicios base para comunicación con APIs
- Modelos de navegación
- Utilidades compartidas

#### `/pages`

Módulos funcionales de la aplicación, cada uno con:

- Component: Lógica de presentación
- Service: Comunicación con backend
- Model: Definiciones de tipos

#### `/shared`

Componentes, directivas y pipes reutilizables

---

## Componentes Principales

### 1. **Login Component**

**Ruta**: `/login`  
**Archivo**: `src/app/Auth/login.component.ts`

**Funcionalidad**:

- Login con credenciales (email/password)
- Login con OAuth GitHub
- Login con OAuth Google
- Validación de formularios
- Redirección post-login según rol

**Métodos principales**:

```typescript
onSubmit(): void                    // Login con credenciales
onGithub(): void                    // Redirige a OAuth GitHub
onGoogle(): void                    // Redirige a OAuth Google
```

### 2. **Inicio Component (Dashboard)**

**Ruta**: `/inicio`  
**Archivo**: `src/app/pages/inicio/inicio.component.ts`

**Funcionalidad**:

- Muestra KPIs del sistema (equipos, jugadores, partidos pendientes)
- Lista de equipos activos
- Próximo partido programado
- Navegación rápida

**Servicios consumidos**:

- `InicioService.getKpis()`: KPIs desde API Python
- `InicioService.getEquipos()`: Equipos desde API Java
- `InicioService.getProximo()`: Próximo partido desde API Python

### 3. **Equipos Component**

**Ruta**: `/admin/equipos`  
**Archivo**: `src/app/pages/equipos/equipos.component.ts`

**Funcionalidad**:

- CRUD completo de equipos
- Subida de logos
- Validación de eliminación (verifica dependencias)
- Filtrado y búsqueda

**Modelo**:

```typescript
interface Team {
  id: number;
  nombre: string;
  ciudad: string;
  abreviatura: string;
  activo: boolean;
  fecha_creacion: string;
  logo: string; // URL
}
```

### 4. **Jugadores Component**

**Ruta**: `/admin/jugadores`  
**Archivo**: `src/app/pages/jugadores/jugadores.component.ts`

**Funcionalidad**:

- CRUD de jugadores
- Asignación a equipos
- Gestión de dorsales
- Subida de fotos

**Modelo**:

```typescript
interface Jugador {
  id: number;
  nombres: string;
  apellidos: string;
  dorsal?: number;
  posicion?: string;
  equipo_id: number;
  activo: boolean;
  foto?: string;
}
```

### 5. **Partidos Component**

**Ruta**: `/admin/partidos`  
**Archivo**: `src/app/pages/partidos/partidos.component.ts`

**Funcionalidad**:

- CRUD de partidos
- Gestión de roster (alineaciones)
- Control de estados (programado, en curso, finalizado, etc.)
- Configuración de reglas del partido

**Estados de partido**:

- `programado`: Partido agendado
- `en_curso`: Partido en vivo
- `finalizado`: Partido terminado
- `cancelado`: Partido cancelado
- `suspendido`: Partido suspendido

### 6. **Control Component**

**Ruta**: `/control`  
**Archivo**: `src/app/pages/control/control.component.ts`

**Funcionalidad**:

- Control de partido en tiempo real
- Actualización de marcador
- Gestión de faltas
- Integración con SignalR para sincronización

### 7. **Visor Component**

**Ruta**: `/visor`  
**Archivo**: `src/app/pages/visor/visor.component.ts`

**Funcionalidad**:

- Visualización pública del partido
- Actualización en tiempo real vía SignalR
- Sin permisos de edición

### 8. **Reportería Component**

**Ruta**: `/admin/reporteria`  
**Archivo**: `src/app/pages/Reporteria/reporteria.component.ts`

**Funcionalidad**:

- Generación de reportes de jugadores, equipos, partidos
- Filtrado por fechas y criterios
- Exportación a PDF
- Paginación de resultados

**Tipos de reportes**:

- Jugadores (filtrado por equipo y fechas)
- Equipos (filtrado por fechas)
- Partidos (filtrado por fechas)
- Roster (filtrado por partido)

### 9. **Admin Layout Component**

**Archivo**: `src/app/admin/admin-layout.component.ts`

**Funcionalidad**:

- Layout con navegación lateral
- Header con información de usuario
- Logout
- Menú dinámico según rol

---

## Servicios y APIs

### AuthService

**Archivo**: `src/app/Auth/auth.service.ts`

**Endpoints**:

```typescript
// Login con credenciales
POST ${apiBaseLogin}/auth/login
Body: { email: string, password: string }
Response: LoginResponse

// Obtener usuario actual
GET ${apiBaseLogin}/api/auth/me
Response: { username: string, roles: string[] }

// OAuth GitHub
GET ${apiBaseLogin}/auth/github/url
Response: { authorizeUrl: string, state: string }

POST ${apiBaseLogin}/auth/github/exchange
Body: { code: string, state: string }
Response: LoginResponse

// OAuth Google
GET ${apiBaseLogin}/auth/google/url
Response: { authorizeUrl: string, state: string }

POST ${apiBaseLogin}/auth/google/exchange
Body: { code: string, state: string }
Response: LoginResponse
```

**Modelo LoginResponse**:

```typescript
interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  roles: string[];
}
```

### EquiposService

**Archivo**: `src/app/pages/equipos/equipos.service.ts`  
**Base URL**: `${environment.apiJava}/api/equipos`

**Endpoints**:

```typescript
// Listar equipos
GET /api/equipos
Response: Team[]

// Crear equipo
POST /api/equipos
Body: { nombre, ciudad, abreviatura, activo }
Response: Team

// Actualizar equipo
PUT /api/equipos/:id
Body: { nombre, ciudad, abreviatura, activo }
Response: void

// Eliminar equipo
DELETE /api/equipos/:id
Response: void

// Obtener logo
GET /api/equipos/:id/logo
Response: Blob (imagen)
```

### PartidosService

**Archivo**: `src/app/pages/partidos/partidos.service.ts`  
**Base URL**: `http://localhost:5082/api/admin/partidos`

**Endpoints**:

```typescript
// Listar partidos
GET /api/admin/partidos
Response: PartidoDto[]

// Crear partido
POST /api/admin/partidos
Body: CreatePartidoRequest
Response: PartidoDto

// Actualizar partido
PUT /api/admin/partidos/:id
Body: CreatePartidoRequest
Response: void

// Eliminar partido
DELETE /api/admin/partidos/:id
Response: void

// Actualizar estado
PATCH /api/admin/partidos/:id/estado
Body: { estado: string }
Response: void

// Obtener roster
GET /api/admin/partidos/:id/roster
Response: RosterEntry[]

// Guardar roster
PUT /api/admin/partidos/:id/roster
Body: SaveRosterRequest
Response: void
```

### InicioService

**Archivo**: `src/app/pages/inicio/inicio.service.ts`

**Endpoints**:

```typescript
// KPIs (Python API)
GET ${apiPython}/api/admin/inicio/kpis
Response: { totalEquipos, totalJugadores, partidosPendientes }

// Próximo partido (Python API)
GET ${apiPython}/api/admin/inicio/proximo
Response: ProximoPartido | 204 No Content

// Equipos (Java API)
GET ${apiJava}/api/equipos?soloActivos=true
Response: Equipo[]
```

### ReporteriaService

**Archivo**: `src/app/pages/Reporteria/reporteria.service.ts`  
**Base URL**: `/api/report` (proxy a Laravel)

**Endpoints de Datos**:

```typescript
// Reporte de jugadores
GET /api/report/jugadores?page=1&pageSize=10&equipo_id=X&desde=Y&hasta=Z
Response: ApiPage

// Reporte de equipos
GET /api/report/equipos?page=1&pageSize=10&desde=Y&hasta=Z
Response: ApiPage

// Reporte de partidos
GET /api/report/partidos?page=1&pageSize=10&desde=Y&hasta=Z
Response: ApiPage

// Reporte de roster
GET /api/report/roster?page=1&pageSize=10&partido_id=X
Response: ApiPage
```

**Endpoints de PDF**:

```typescript
// PDF de jugadores
GET /api/report/jugadores/pdf?all=1 o ?page=1&pageSize=10

// PDF de equipos
GET /api/report/equipos/pdf?all=1 o ?page=1&pageSize=10

// PDF de partidos
GET /api/report/partidos/pdf?all=1 o ?page=1&pageSize=10

// PDF de roster
GET /api/report/roster/pdf?partido_id=X&all=1
```

**Lookups**:

```typescript
GET /api/report/lookup/equipos
Response: {id: string, nombre: string}[]

GET /api/report/lookup/partidos
Response: Array de partidos
```

---

## Autenticación y Seguridad

### Flujo de Autenticación

#### 1. Login con Credenciales

```
Usuario ingresa email/password
    ↓
AuthService.login()
    ↓
POST /auth/login
    ↓
Recibe { accessToken, expiresAtUtc, username, roles }
    ↓
TokenStorage guarda token y datos en localStorage
    ↓
Redirige según rol → /inicio o /admin
```

#### 2. Login con OAuth (GitHub/Google)

```
Usuario hace clic en "Login con GitHub/Google"
    ↓
AuthService.loginGithub() / loginGoogle()
    ↓
Obtiene authorizeUrl del backend
    ↓
Redirige a /edge-check (Cloudflare challenge)
    ↓
Redirige a authorizeUrl (GitHub/Google)
    ↓
Usuario autoriza la app
    ↓
Redirige a /oauth/github o /oauth/google con code
    ↓
AuthService.exchangeGithubCode() / exchangeGoogleCode()
    ↓
POST /auth/github/exchange con { code, state }
    ↓
Recibe LoginResponse
    ↓
Guarda token y redirige
```

### Guards

#### AuthGuard

**Archivo**: `src/app/Auth/auth.guard.ts`

Verifica si el usuario tiene un token válido:

```typescript
export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStorage);
  const router = inject(Router);
  if (store.isLogged()) return true;
  router.navigate(["/login"]);
  return false;
};
```

**Uso**: Protege todas las rutas que requieren autenticación.

#### RoleGuard

**Archivo**: `src/app/Auth/role.guard.ts`

Verifica si el usuario tiene uno de los roles permitidos:

```typescript
export const roleGuard = (allowedRoles: string[]) => { ... };
```

**Uso**:

```typescript
{
  path: 'admin/equipos',
  canMatch: [roleGuard(['ADMINISTRADOR'])],
  component: EquiposComponent
}
```

### Interceptor

#### AuthInterceptor

**Archivo**: `src/app/Auth/auth.interceptor.ts`

Inyecta automáticamente el token JWT en todas las peticiones HTTP:

```typescript
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = this.store.accessToken;
  if (!token || req.url.includes('/api/auth/login')) {
    return next.handle(req);
  }
  return next.handle(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
}
```

### Token Storage

**Archivo**: `src/app/Auth/token-storage.service.ts`

Gestiona el almacenamiento persistente de tokens:

```typescript
class TokenStorage {
  save(token: string, expiresAt: string, username: string, roles: string[]): void;
  clear(): void;
  isLogged(): boolean;
  get accessToken(): string | null;
  get username(): string | null;
  get roles(): string[];
}
```

**Almacenamiento**: localStorage del navegador

---

## Despliegue

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# La app estará en http://localhost:4200/
```

### Build de Producción

```bash
# Build optimizado
npm run build

# Los archivos se generan en dist/web/browser/
```

### Docker

#### Build de la imagen

```bash
# Desde la carpeta web/
docker build -t sistema-deportivo-frontend:latest .
```

#### Ejecutar contenedor

```bash
docker run -d \
  --name frontend \
  -p 80:80 \
  sistema-deportivo-frontend:latest
```

#### Docker Compose (ejemplo)

```yaml
version: "3.8"
services:
  frontend:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - mb_laravel_app
    networks:
      - app-network

  mb_laravel_app:
    image: laravel-reportes:latest
    ports:
      - "8000:8000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Dockerfile (Multi-stage)

**Etapa 1: Build**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production-docker
```

**Etapa 2: Producción**

```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist/web/browser/. /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

El archivo `nginx.conf` está configurado para:

- Servir la SPA (Single Page Application)
- Cache agresivo de assets estáticos
- Proxy reverso a Laravel (reportería)
- Compresión Gzip
- Headers de seguridad

**Punto clave**: `try_files $uri $uri/ /index.html;` permite que Angular maneje las rutas en el cliente.

### Variables de Entorno en Producción

Actualizar `src/environments/environment.ts` con las URLs de producción:

```typescript
export const environment = {
  production: true,
  apiBaseLogin: "https://apilogin.mundoalonzo.com",
  apiJava: "https://api.ejemplo.com:5081",
  apiPython: "https://api.ejemplo.com:5082",
  apiDotNet: "https://api.ejemplo.com:5080",
  apiBase: "https://api.ejemplo.com:5080",
};
```

### Logs y Debugging

#### Ver logs en desarrollo

```bash
# Logs de Angular CLI
ng serve --verbose

# Abrir DevTools en el navegador (F12)
# Tab Console para errores JavaScript
# Tab Network para peticiones HTTP
```

## Contacto y Soporte

- **Repository**: [PROYECTO-FASE-III-REPORTERIA](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA)
- **Branch**: main

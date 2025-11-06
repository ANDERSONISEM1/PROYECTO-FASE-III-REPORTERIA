# Manual Técnico - Sistema de Reportes en PDF

## Descripción General

Sistema de reportes en PDF desarrollado en Laravel 12 que genera documentos para entidades deportivas: **Equipos**, **Jugadores**, **Partidos** y **Roster**. Utiliza arquitectura API REST para consulta de datos y generación de PDFs con filtros por fecha y paginación.

### Funcionalidades principales:

-   Generación de reportes en formato PDF
-   API REST con paginación para previsualización de datos
-   Sincronización de datos con fuentes externas
-   Filtrado por rangos de fechas
-   Lookups para selección de entidades relacionadas

---

## Arquitectura

### Controllers

Ubicación: `app/Http/Controllers/`

-   **EquipoController.php**: Maneja reportes de equipos (vista previa, PDF, lookups)
-   **JugadoresController.php**: Gestiona reportes de jugadores
-   **PartidosController.php**: Administra reportes de partidos
-   **RosterController.php**: Controla reportes de roster (plantillas)
-   **ReportLookupController.php**: Provee datos para dropdowns/selects
-   **[Entidad]SyncController.php**: Controladores de sincronización manual

### Services

Ubicación: `app/Services/`

-   **EquipoSyncService.php**: Lógica de sincronización de equipos
-   **JugadoresSyncService.php**: Sincronización de jugadores
-   **PartidosSyncService.php**: Sincronización de partidos
-   **RosterSyncService.php**: Sincronización de roster

### Views (Blade Templates)

Ubicación: `resources/views/pdf/`

-   **equipo.blade.php**: Template PDF para equipos
-   **jugadores.blade.php**: Template PDF para jugadores
-   **partidos.blade.php**: Template PDF para partidos
-   **roster.blade.php**: Template PDF para roster

### Routes

-   **routes/api.php**: Define endpoints REST (`/api/report/*`, `/api/admin/sync/*`)
-   **routes/web.php**: Rutas web (página de bienvenida)

### Librería PDF

**barryvdh/laravel-dompdf v3.1**

-   Wrapper de DOMPDF para Laravel
-   Configuración en `config/dompdf.php`
-   Conversión de HTML (Blade) a PDF
-   Personalización: tamaño papel (A4), orientación (portrait), DPI (96)

---

## Instalación

### Requisitos previos

-   PHP 8.2 o superior
-   Composer
-   MySQL/MariaDB
-   Node.js y npm (para assets frontend si aplica)

### Pasos de instalación

1. **Clonar el repositorio**

```bash
cd d:\Universidad\DesarrolloWeb\PROYECTO-FASE-III-REPORTERIA\reporteria
```

2. **Instalar dependencias de Composer**

```bash
composer install
```

3. **Copiar archivo de configuración**

```bash
copy .env.example .env
```

4. **Generar clave de aplicación**

```bash
php artisan key:generate
```

5. **Ejecutar migraciones**

```bash
php artisan migrate
```

6. **Iniciar servidor de desarrollo**

```bash
php artisan serve
```

El servidor se ejecutará en `http://localhost:8000`

---

## Configuración Esencial

### Archivo .env

```env
# Aplicación
APP_NAME="Sistema de Reportes"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

# Base de datos MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nombre_base_datos
DB_USERNAME=usuario
DB_PASSWORD=contraseña

# Configuración adicional (opcional)
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

### Configuraciones importantes

-   **APP_URL**: Debe coincidir con la URL donde se accede al sistema
-   **DB_CONNECTION**: Define el driver de base de datos (mysql)
-   **DB_DATABASE**: Nombre de la base de datos con las tablas/vistas de reportería
-   Asegurar que la conexión MySQL tenga acceso a las vistas: `vw_report_equipos`, `vw_report_jugadores`, etc.

---

## Estructura de Carpetas

```
reporteria/
├── app/
│   ├── Http/
│   │   └── Controllers/        # Controladores API y PDF
│   ├── Services/               # Lógica de negocio y sincronización
│   └── Models/                 # Modelos Eloquent
│
├── config/
│   ├── database.php            # Configuración de conexiones DB
│   └── dompdf.php              # Configuración de generación PDF
│
├── database/
│   ├── migrations/             # Esquema de base de datos
│   └── seeders/                # Datos de prueba
│
├── resources/
│   └── views/
│       └── pdf/                # Templates Blade para PDFs
│
├── routes/
│   ├── api.php                 # Endpoints REST
│   └── web.php                 # Rutas web
│
├── storage/
│   ├── app/                    # Archivos generados
│   ├── logs/                   # Logs de aplicación
│   └── framework/              # Cache y sesiones
│
├── public/                     # Punto de entrada (index.php)
├── composer.json               # Dependencias PHP
└── .env                        # Variables de entorno
```

### Roles de carpetas principales

-   **app/Http/Controllers**: Lógica de endpoints API y generación de PDFs
-   **app/Services**: Servicios de sincronización y operaciones complejas
-   **resources/views/pdf**: Templates HTML que se convierten a PDF
-   **routes/api.php**: Define todos los endpoints REST del sistema
-   **config/dompdf.php**: Configuración de papel, fuentes y opciones de PDF
-   **storage/logs**: Registros de errores y eventos del sistema

---

## Endpoints API Principales

### Reportes (vista previa con paginación)

-   `GET /api/report/equipos` - Lista equipos con filtros
-   `GET /api/report/jugadores` - Lista jugadores
-   `GET /api/report/partidos` - Lista partidos
-   `GET /api/report/roster` - Lista roster

### Generación de PDFs

-   `GET /api/report/equipos/pdf` - Descarga PDF de equipos
-   `GET /api/report/jugadores/pdf` - Descarga PDF de jugadores
-   `GET /api/report/partidos/pdf` - Descarga PDF de partidos
-   `GET /api/report/roster/pdf` - Descarga PDF de roster

### Lookups

-   `GET /api/report/lookup/equipos` - Obtiene lista de equipos para selects
-   `GET /api/report/lookup/partidos` - Obtiene lista de partidos para selects

### Sincronización

-   `POST /api/admin/sync/equipos` - Sincroniza equipos
-   `POST /api/admin/sync/jugadores` - Sincroniza jugadores
-   `POST /api/admin/sync/partidos` - Sincroniza partidos
-   `POST /api/admin/sync/roster` - Sincroniza roster

**Parámetros comunes**:

-   `desde` y `hasta`: Filtro por rango de fechas (formato: YYYY-MM-DD)
-   `page`: Número de página (default: 1)
-   `pageSize`: Registros por página (default: 10, max: 100)
-   `all=1`: En PDFs, descarga todos los registros sin paginar

---

## Mantenimiento

### Logs

Los logs se almacenan en `storage/logs/laravel.log`. Monitorear errores de sincronización y generación de PDFs.

### Limpieza de cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Actualizar dependencias

```bash
composer update
```

---

**Generado**: Noviembre 2025  
**Versión Laravel**: 12.0  
**Versión PHP**: 8.2+

# Marcador Basketball - Python API

API de Python desarrollada con FastAPI para el sistema de marcador de basketball.

## Características

- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para manejo de base de datos
- **JWT Authentication** - Autenticación segura con tokens
- **WebSocket Support** - Actualizaciones en tiempo real para partidos
- **SQL Server & MySQL** - Soporte para ambas bases de datos
- **Docker Ready** - Configuración completa para contenedores
- **Auto Documentation** - Documentación automática con Swagger/OpenAPI

## Estructura del Proyecto

```
python-api/
├── app/
│   ├── routers/
│   │   ├── auth.py      # Autenticación y registro
│   │   ├── users.py     # Gestión de usuarios
│   │   ├── teams.py     # Gestión de equipos
│   │   └── games.py     # Gestión de partidos y eventos
│   ├── models.py        # Modelos de base de datos
│   ├── schemas.py       # Esquemas Pydantic
│   ├── database.py     # Configuración de base de datos
│   ├── auth.py         # Utilidades de autenticación
│   └── config.py       # Configuración de la aplicación
├── main.py             # Punto de entrada de la aplicación
├── requirements.txt    # Dependencias de Python
├── Dockerfile         # Configuración de Docker
└── .env              # Variables de entorno
```

## Instalación y Ejecución

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar variables de entorno:**
   Editar el archivo `.env` con las credenciales correctas.

3. **Ejecutar la aplicación:**
   ```bash
   uvicorn main:app --reload --port 5082
   ```

### Con Docker

```bash
docker build -t marcador-python-api .
docker run -p 5082:5082 --env-file .env marcador-python-api
```

### Con Docker Compose

La API se puede integrar fácilmente al `docker-compose.yml` existente.

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener perfil actual
- `POST /api/auth/refresh` - Renovar token

### Usuarios
- `GET /api/users/` - Listar usuarios (admin)
- `GET /api/users/{id}` - Obtener usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario (admin)

### Equipos
- `GET /api/teams/` - Listar equipos
- `POST /api/teams/` - Crear equipo (admin)
- `GET /api/teams/{id}` - Obtener equipo
- `PUT /api/teams/{id}` - Actualizar equipo (admin)
- `DELETE /api/teams/{id}` - Desactivar equipo (admin)

### Partidos
- `GET /api/games/` - Listar partidos
- `POST /api/games/` - Crear partido (admin)
- `GET /api/games/{id}` - Obtener partido
- `PUT /api/games/{id}` - Actualizar partido
- `POST /api/games/{id}/start` - Iniciar partido (admin)
- `POST /api/games/{id}/finish` - Finalizar partido (admin)
- `WebSocket /api/games/{id}/live` - Actualizaciones en tiempo real

## Documentación

Una vez ejecutada la aplicación, la documentación interactiva estará disponible en:
- **Swagger UI:** http://localhost:5082/docs
- **ReDoc:** http://localhost:5082/redoc

## Configuración de Base de Datos

La API soporta conexiones a:
- **SQL Server** (base de datos principal)
- **MySQL** (base de datos de reportes)

Las configuraciones se pueden ajustar en `app/config.py` y mediante variables de entorno.

## Seguridad

- Autenticación JWT con tokens de acceso
- Hashing seguro de contraseñas con bcrypt
- Validación de permisos por roles (admin/usuario)
- Validación de entrada con Pydantic

## WebSocket para Tiempo Real

Los partidos en vivo soportan actualizaciones en tiempo real mediante WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:5082/api/games/1/live');
ws.onmessage = function(event) {
    console.log('Update:', event.data);
};
```

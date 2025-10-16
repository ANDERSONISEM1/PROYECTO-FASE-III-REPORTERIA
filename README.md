# PROYECTO-FASE-III-REPORTERIA DESARROLLO WEB

Monorepositorio que agrupa los servicios y aplicaciones de la **Fase III de Reportería**, incluyendo backend, autenticación, módulo de reportes y frontend web.

## 📦 Subproyectos

| Carpeta | Descripción |
|----------|--------------|
| [`api-auth/`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/tree/main/api-auth) | Servicio de autenticación y autorización (tokens, roles, sesiones). |
| [`api/`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/tree/main/api) | API principal de negocio y orquestación de datos. |
| [`reporteria/`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/tree/main/reporteria) | Servicio de reportería: generación, procesamiento y exportación de reportes. |
| [`web/`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/tree/main/web) | Aplicación web (frontend) para visualización y gestión de reportes. |
| [`documentacionTecnica/`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/blob/main/documentacionTecnica/documentacionT.md) | Documentación técnica del sistema (arquitectura, componentes, endpoints, diagramas). |
| [`docs/manual-usuario.md`](https://github.com/ANDERSONISEM1/PROYECTO-FASE-III-REPORTERIA/blob/main/docs/manual-usuario.md) | Manual de usuario: guía práctica para el uso de la aplicación. |

> Cada subproyecto puede tener su propio **README.md** con instrucciones específicas de instalación y ejecución.

---
## ⚙️ Requisitos

Asegúrate de tener instalados los siguientes componentes y tecnologías, según el subproyecto:

- **Node.js** ≥ 18.x — utilizado en el servicio de **autenticación (`api-auth`)**.  
- **MongoDB Atlas (MongoCloud)** — base de datos principal para el servicio de autenticación.  
- **PHP** ≥ 8.x y **Laravel** ≥ 10.x — framework backend para el módulo de **reportería (`reporteria`)**.  
- **SQL Server** — base de datos utilizada por la **API principal (`api`)** desarrollada en **C# (.NET 6 o superior)**.  
- **Angular** ≥ 17 — framework frontend para la aplicación web (`web`).  
- **Docker** — utilizado para el despliegue de todos los servicios.  

> 🔹 Se agregó un archivo `docker-compose.yml` como referencia para la creación y orquestación de los contenedores de cada servicio.

---

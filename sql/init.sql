/* =========================================================
   MarcadorBasket - INIT DB (alineado a tus tablas)
   ========================================================= */
IF DB_ID(N'MarcadorBasket') IS NULL
    CREATE DATABASE [MarcadorBasket];
GO
USE [MarcadorBasket];
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================================================
   EQUIPO
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Equipo','U') IS NULL
CREATE TABLE dbo.Equipo(
  equipo_id        INT IDENTITY(1,1) PRIMARY KEY,
  nombre           NVARCHAR(100) NOT NULL,
  ciudad           NVARCHAR(80)  NULL,
  abreviatura      NVARCHAR(10) NULL,
    logo             VARBINARY(MAX) NULL,   -- imagen (PNG/JPG/WebP, etc.)
  activo           BIT NOT NULL DEFAULT 1,
  fecha_creacion   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* =========================================================
   JUGADOR
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Jugador','U') IS NULL
CREATE TABLE dbo.Jugador(
  jugador_id   INT IDENTITY(1,1) PRIMARY KEY,
  equipo_id    INT NOT NULL,
  nombres      NVARCHAR(80) NOT NULL,
  apellidos    NVARCHAR(80) NOT NULL,
  dorsal       TINYINT NULL,
  posicion     NVARCHAR(20) NULL,
  estatura_cm    SMALLINT NULL,         -- ej. 180 = 1.80 m
  edad           TINYINT NULL,          -- ej. 18-60
  nacionalidad   NVARCHAR(60) NULL,     -- ej. 'Guatemalteca'
  activo       BIT NOT NULL DEFAULT 1,
  CONSTRAINT FK_Jugador_Equipo
    FOREIGN KEY (equipo_id) REFERENCES dbo.Equipo(equipo_id)
      ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO
-- dorsal único por equipo (si se define)
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UQ_Jugador_Equipo_Dorsal'
    AND object_id = OBJECT_ID('dbo.Jugador')
)
CREATE UNIQUE NONCLUSTERED INDEX UQ_Jugador_Equipo_Dorsal
  ON dbo.Jugador(equipo_id, dorsal)
  WHERE dorsal IS NOT NULL;
GO

/* =========================================================
   PARTIDO (sin 'sede' ni 'observaciones')
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Partido','U') IS NULL
CREATE TABLE dbo.Partido(
  partido_id                INT IDENTITY(1,1) PRIMARY KEY,
  equipo_local_id           INT NOT NULL,
  equipo_visitante_id       INT NOT NULL,
  fecha_hora_inicio         DATETIME2 NULL,
  estado                    NVARCHAR(20) NOT NULL
    CONSTRAINT CK_Partido_Estado CHECK (estado IN (N'programado',N'en_curso',N'finalizado',N'cancelado',N'suspendido')),
  minutos_por_cuarto        INT NOT NULL DEFAULT 10
    CONSTRAINT CK_Partido_MinXCuarto CHECK (minutos_por_cuarto BETWEEN 1 AND 15),
  cuartos_totales           INT NOT NULL DEFAULT 4
    CONSTRAINT CK_Partido_Cuartos CHECK (cuartos_totales >= 4),
  faltas_por_equipo_limite  TINYINT NOT NULL DEFAULT 5,
  faltas_por_jugador_limite TINYINT NOT NULL DEFAULT 5,
    sede                      NVARCHAR(100) NULL,  -- ← NUEVO CAMPO AÑADIDO
  fecha_creacion            DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Partido_EquipoLocal
    FOREIGN KEY (equipo_local_id) REFERENCES dbo.Equipo(equipo_id),
  CONSTRAINT FK_Partido_EquipoVisitante
    FOREIGN KEY (equipo_visitante_id) REFERENCES dbo.Equipo(equipo_id),
  CONSTRAINT CK_Partido_EquiposDistintos
    CHECK (equipo_local_id <> equipo_visitante_id)
);
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Partido_Equipos'
    AND object_id = OBJECT_ID('dbo.Partido')
)
CREATE INDEX IX_Partido_Equipos ON dbo.Partido(equipo_local_id, equipo_visitante_id);
GO

/* =========================================================
   CUARTO
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Cuarto','U') IS NULL
CREATE TABLE dbo.Cuarto(
  cuarto_id          INT IDENTITY(1,1) PRIMARY KEY,
  partido_id         INT NOT NULL,
  numero             INT NOT NULL CONSTRAINT CK_Cuarto_Num CHECK (numero >= 1),
  es_prorroga        BIT NOT NULL DEFAULT 0,
  duracion_segundos  INT NOT NULL,
  segundos_restantes INT NOT NULL,
  estado             NVARCHAR(20) NOT NULL DEFAULT N'pendiente'
    CONSTRAINT CK_Cuarto_Estado CHECK (estado IN (N'pendiente',N'en_curso',N'finalizado')),
  hora_inicio        DATETIME2 NULL,
  hora_fin           DATETIME2 NULL,
  CONSTRAINT FK_Cuarto_Partido
    FOREIGN KEY (partido_id) REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  CONSTRAINT UQ_Cuarto_Partido_Num UNIQUE (partido_id, numero)
);
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Cuarto_Partido'
    AND object_id = OBJECT_ID('dbo.Cuarto')
)
CREATE INDEX IX_Cuarto_Partido ON dbo.Cuarto(partido_id);
GO

/* =========================================================
   TIPO FALTA (catálogo)
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.TipoFalta','U') IS NULL
CREATE TABLE dbo.TipoFalta(
  tipo_falta_id  TINYINT IDENTITY(1,1) PRIMARY KEY,
  nombre         NVARCHAR(40) NOT NULL UNIQUE
);
GO
IF NOT EXISTS(SELECT 1 FROM dbo.TipoFalta)
BEGIN
  INSERT INTO dbo.TipoFalta(nombre)
  VALUES (N'personal'),(N'técnica'),(N'antideportiva'),(N'descalificante');
END
GO

/* =========================================================
   ANOTACION (solo: anotacion_id, partido_id, cuarto_id, equipo_id, puntos)
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Anotacion','U') IS NULL
CREATE TABLE dbo.Anotacion(
  anotacion_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  partido_id   INT NOT NULL,
  cuarto_id    INT NULL,
  equipo_id    INT NOT NULL,
  puntos       SMALLINT NOT NULL
    CONSTRAINT CK_Anotacion_Puntos CHECK (puntos IN (-3,-2,-1,1,2,3)),
  CONSTRAINT FK_Anotacion_Partido FOREIGN KEY (partido_id)
    REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  -- NO CASCADE vs Cuarto (evitar multiple cascade paths)
  CONSTRAINT FK_Anotacion_Cuarto FOREIGN KEY (cuarto_id)
    REFERENCES dbo.Cuarto(cuarto_id)
);
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Anotacion_Partido_Cuarto'
    AND object_id = OBJECT_ID('dbo.Anotacion')
)
CREATE INDEX IX_Anotacion_Partido_Cuarto ON dbo.Anotacion(partido_id, cuarto_id);
GO

/* =========================================================
   FALTA (sin libre_convertido ni comentarios)
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.Falta','U') IS NULL
CREATE TABLE dbo.Falta(
  falta_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
  partido_id     INT NOT NULL,
  cuarto_id      INT NULL,
  equipo_id      INT NOT NULL,
  jugador_id     INT NULL,
  tipo_falta_id  TINYINT NOT NULL,
  es_de_tiro     BIT NOT NULL DEFAULT 0,
  creada_en      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Falta_Partido FOREIGN KEY (partido_id)
    REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  -- NO CASCADE vs Cuarto (evitar multiple cascade paths)
  CONSTRAINT FK_Falta_Cuarto FOREIGN KEY (cuarto_id)
    REFERENCES dbo.Cuarto(cuarto_id),
  CONSTRAINT FK_Falta_Equipo FOREIGN KEY (equipo_id)
    REFERENCES dbo.Equipo(equipo_id),
  CONSTRAINT FK_Falta_Jugador FOREIGN KEY (jugador_id)
    REFERENCES dbo.Jugador(jugador_id),
  CONSTRAINT FK_Falta_Tipo FOREIGN KEY (tipo_falta_id)
    REFERENCES dbo.TipoFalta(tipo_falta_id)
);
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = 'IX_Falta_Partido_Cuarto'
    AND object_id = OBJECT_ID('dbo.Falta')
)
CREATE INDEX IX_Falta_Partido_Cuarto ON dbo.Falta(partido_id, cuarto_id);
GO

/* =========================================================
   TIEMPO MUERTO
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.TiempoMuerto','U') IS NULL
CREATE TABLE dbo.TiempoMuerto(
  tiempo_muerto_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  partido_id       INT NOT NULL,
  cuarto_id        INT NULL,
  equipo_id        INT NOT NULL,
  tipo             NVARCHAR(10) NOT NULL
    CONSTRAINT CK_TM_Tipo CHECK (tipo IN (N'corto',N'largo')),
  creado_en        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_TM_Partido FOREIGN KEY (partido_id)
    REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  -- NO CASCADE vs Cuarto
  CONSTRAINT FK_TM_Cuarto FOREIGN KEY (cuarto_id)
    REFERENCES dbo.Cuarto(cuarto_id),
  CONSTRAINT FK_TM_Equipo FOREIGN KEY (equipo_id)
    REFERENCES dbo.Equipo(equipo_id)
);
GO

/* =========================================================
   CRONOMETRO EVENTO (auditoría)
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.CronometroEvento','U') IS NULL
CREATE TABLE dbo.CronometroEvento(
  evento_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
  partido_id         INT NOT NULL,
  cuarto_id          INT NOT NULL,
  tipo               NVARCHAR(15) NOT NULL,
  segundos_restantes INT NULL,
  creado_en          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Crono_Partido FOREIGN KEY (partido_id)
    REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  -- NO CASCADE vs Cuarto
  CONSTRAINT FK_Crono_Cuarto FOREIGN KEY (cuarto_id)
    REFERENCES dbo.Cuarto(cuarto_id)
);
GO
-- CHECK de tipo (incluye todos los del controlador)
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Crono_Tipo')
  ALTER TABLE dbo.CronometroEvento DROP CONSTRAINT CK_Crono_Tipo;
ALTER TABLE dbo.CronometroEvento ADD CONSTRAINT CK_Crono_Tipo
  CHECK (tipo IN (N'inicio',N'pausa',N'reanudar',N'fin',N'prorroga',N'descanso',N'medio',N'reiniciar'));
GO

/* =========================================================
   ROSTER POR PARTIDO (convocados)
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.RosterPartido','U') IS NULL
CREATE TABLE dbo.RosterPartido(
  roster_id   INT IDENTITY(1,1) PRIMARY KEY,
  partido_id  INT NOT NULL,
  equipo_id   INT NOT NULL,
  jugador_id  INT NOT NULL,
  es_titular  BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_Roster_Partido FOREIGN KEY (partido_id)
    REFERENCES dbo.Partido(partido_id) ON DELETE CASCADE,
  CONSTRAINT FK_Roster_Equipo FOREIGN KEY (equipo_id)
    REFERENCES dbo.Equipo(equipo_id),
  CONSTRAINT FK_Roster_Jugador FOREIGN KEY (jugador_id)
    REFERENCES dbo.Jugador(jugador_id),
  CONSTRAINT UQ_Roster_Partido_Jugador UNIQUE (partido_id, jugador_id)
);
GO

/* =========================================================
   TRIGGERS DE CONSISTENCIA
   --------------------------------------------------------- */
-- 1) Anotación: el equipo debe pertenecer al partido
IF OBJECT_ID('dbo.trg_Anotacion_Valida','TR') IS NOT NULL
  DROP TRIGGER dbo.trg_Anotacion_Valida;
GO
CREATE TRIGGER dbo.trg_Anotacion_Valida
ON dbo.Anotacion
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN dbo.Partido p ON p.partido_id = i.partido_id
    WHERE i.equipo_id NOT IN (p.equipo_local_id, p.equipo_visitante_id)
  )
  BEGIN
    RAISERROR (N'Equipo no pertenece al partido (Anotación).', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
  END
END;
GO

-- 2) Falta: equipo del partido y (si hay jugador) que sea del mismo equipo
IF OBJECT_ID('dbo.trg_Falta_Valida','TR') IS NOT NULL
  DROP TRIGGER dbo.trg_Falta_Valida;
GO
CREATE TRIGGER dbo.trg_Falta_Valida
ON dbo.Falta
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN dbo.Partido p ON p.partido_id = i.partido_id
    LEFT JOIN dbo.Jugador j ON j.jugador_id = i.jugador_id
    WHERE
      i.equipo_id NOT IN (p.equipo_local_id, p.equipo_visitante_id)
      OR (i.jugador_id IS NOT NULL AND j.equipo_id <> i.equipo_id)
  )
  BEGIN
    RAISERROR (N'Equipo/Jugador no pertenece al partido (Falta).', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
  END
END;
GO

/* =========================================================
   VISTA DE MARCADOR
   --------------------------------------------------------- */
IF OBJECT_ID('dbo.vw_MarcadorPartido','V') IS NOT NULL
  DROP VIEW dbo.vw_MarcadorPartido;
GO
CREATE VIEW dbo.vw_MarcadorPartido AS
SELECT
  p.partido_id,
  p.equipo_local_id,
  p.equipo_visitante_id,
  SUM(CASE WHEN a.equipo_id = p.equipo_local_id THEN a.puntos ELSE 0 END) AS puntos_local,
  SUM(CASE WHEN a.equipo_id = p.equipo_visitante_id THEN a.puntos ELSE 0 END) AS puntos_visitante
FROM dbo.Partido p
LEFT JOIN dbo.Anotacion a ON a.partido_id = p.partido_id
GROUP BY p.partido_id, p.equipo_local_id, p.equipo_visitante_id;
GO



--ESTO ES LO QUE ESTOY AGREGANDO ADICIONALMENTE

/* =========================================================
   =======  AUTENTICACIÓN / SESIONES (LOGIN SPRINT)  =======
   --------------------------------------------------------- */

-- 1) USUARIOS
IF OBJECT_ID('dbo.usuarios','U') IS NULL
CREATE TABLE dbo.usuarios (
  id               BIGINT IDENTITY(1,1) CONSTRAINT PK_usuarios PRIMARY KEY,
  usuario          NVARCHAR(50)   NOT NULL CONSTRAINT UQ_usuarios_usuario UNIQUE,
  primer_nombre    VARCHAR(60)    NOT NULL,
  segundo_nombre   VARCHAR(60)    NULL,
  primer_apellido  VARCHAR(60)    NOT NULL,
  segundo_apellido VARCHAR(60)    NULL,
  correo           NVARCHAR(120)  NULL     CONSTRAINT UQ_usuarios_correo  UNIQUE,
  contrasenia_hash VARBINARY(256) NOT NULL,  -- hash binario (NUNCA texto plano)
  algoritmo_hash   NVARCHAR(100)  NOT NULL,  -- p.ej. 'argon2id(v=19,m=65536,t=3,p=1)'
  activo           BIT            NOT NULL CONSTRAINT DF_usuarios_activo DEFAULT (1),
  ultimo_login     DATETIME2(0)   NULL,
  creado_en        DATETIME2(0)   NOT NULL CONSTRAINT DF_usuarios_creado DEFAULT (SYSUTCDATETIME()),
  actualizado_en   DATETIME2(0)   NOT NULL CONSTRAINT DF_usuarios_actual DEFAULT (SYSUTCDATETIME())
);
GO
CREATE INDEX IX_usuarios_activo ON dbo.usuarios(activo);
GO

-- Trigger para mantener actualizado 'actualizado_en'
IF OBJECT_ID('dbo.trg_usuarios_updated','TR') IS NOT NULL
  DROP TRIGGER dbo.trg_usuarios_updated;
GO
CREATE TRIGGER dbo.trg_usuarios_updated
ON dbo.usuarios
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE u
    SET actualizado_en = SYSUTCDATETIME()
  FROM dbo.usuarios u
  INNER JOIN inserted i ON i.id = u.id;
END;
GO
-- 2) ROLES
IF OBJECT_ID('dbo.roles','U') IS NULL
CREATE TABLE dbo.roles (
  id          INT IDENTITY(1,1) CONSTRAINT PK_roles PRIMARY KEY,
  nombre      NVARCHAR(40)  NOT NULL CONSTRAINT UQ_roles_nombre UNIQUE,  

);
GO

-- 3) USUARIOS_ROLES (N:M)
IF OBJECT_ID('dbo.usuarios_roles','U') IS NULL
CREATE TABLE dbo.usuarios_roles (
  usuario_id BIGINT NOT NULL,
  rol_id     INT    NOT NULL,
  CONSTRAINT PK_usuarios_roles PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT FK_usuarios_roles_usuario FOREIGN KEY (usuario_id)
      REFERENCES dbo.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT FK_usuarios_roles_rol FOREIGN KEY (rol_id)
      REFERENCES dbo.roles(id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_usuarios_roles_rol ON dbo.usuarios_roles(rol_id);
GO

-- 4) TOKENS DE REFRESCO (rotación segura de sesión)
IF OBJECT_ID('dbo.tokens_refresco','U') IS NULL
CREATE TABLE dbo.tokens_refresco (
  id                     BIGINT IDENTITY(1,1) CONSTRAINT PK_tokens_refresco PRIMARY KEY,
  usuario_id             BIGINT NOT NULL,
  token_hash             VARBINARY(256) NOT NULL,   -- guardar SOLO hash
  emitido_en             DATETIME2(0)   NOT NULL CONSTRAINT DF_tokens_refresco_emit DEFAULT (SYSUTCDATETIME()),
  expira_en              DATETIME2(0)   NOT NULL,
  revocado_en            DATETIME2(0)   NULL,
  reemplazado_por        VARBINARY(256) NULL,       -- hash del nuevo (rotación)
  ip_origen              NVARCHAR(64)   NULL,
  agente_usuario         NVARCHAR(256)  NULL,
  CONSTRAINT FK_tokens_refresco_usuario FOREIGN KEY (usuario_id)
      REFERENCES dbo.usuarios(id) ON DELETE CASCADE
);
GO
CREATE UNIQUE INDEX UX_tokens_refresco_token_hash ON dbo.tokens_refresco(token_hash);
CREATE INDEX IX_tokens_refresco_usuario ON dbo.tokens_refresco(usuario_id);
CREATE INDEX IX_tokens_refresco_validos ON dbo.tokens_refresco(usuario_id, expira_en)
  WHERE revocado_en IS NULL;
GO

/* =========================================================
   =======            FIN DEL SCRIPT COMPLETO           =====
   ========================================================= */


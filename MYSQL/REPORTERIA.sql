-- =========================================================
-- MarcadorBasket - Data Mart de Reportería (MySQL 8)
-- SOLO columnas exactas para las VISTAS de la UI
--   Jugadores:  nombres, apellidos, dorsal, posicion, estatura_cm, edad, nacionalidad, activo,
--               + equipo_id, equipo, fecha_creacion (para filtros)
--   Equipos:    equipo_id, nombre, ciudad, abreviatura, logo, activo, fecha_creacion
--   Partidos:   equipo_local, equipo_visitante, fecha, hora, marcador_final
--   Roster:     equipo, jugador, dorsal, posicion, tipo
-- =========================================================

CREATE DATABASE IF NOT EXISTS mb_report
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE mb_report;

-- ============== DIMENSIONES y HECHOS (tablas base) ==============

DROP TABLE IF EXISTS dim_equipo;
CREATE TABLE dim_equipo (
  equipo_id      INT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  ciudad         VARCHAR(80)  NULL,
  abreviatura    VARCHAR(10)  NULL,
  -- IMPORTANTE: en reportería guardaremos RUTA/URL, NO BLOB
  logo_path      VARCHAR(255) NULL,
  activo         TINYINT(1)   NOT NULL,
  fecha_creacion DATETIME     NOT NULL,
  KEY ix_equipo_activo (activo),
  KEY ix_equipo_fecha (fecha_creacion)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS dim_jugador;
CREATE TABLE dim_jugador (
  jugador_id   INT PRIMARY KEY,
  equipo_id    INT NOT NULL,
  nombres      VARCHAR(80)  NOT NULL,
  apellidos    VARCHAR(80)  NOT NULL,
  dorsal       TINYINT NULL,
  posicion     VARCHAR(20) NULL,
  estatura_cm  SMALLINT NULL,
  edad         TINYINT  NULL,
  nacionalidad VARCHAR(60) NULL,
  activo       TINYINT(1) NOT NULL,
  fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_jugador_equipo (equipo_id),
  KEY ix_jugador_nombre (apellidos, nombres),
  KEY ix_jugador_fecha (fecha_creacion),
  UNIQUE KEY uq_equipo_dorsal (equipo_id, dorsal)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS dim_partido;
CREATE TABLE dim_partido (
  partido_id          INT PRIMARY KEY,
  equipo_local_id     INT NOT NULL,
  equipo_visitante_id INT NOT NULL,
  fecha_hora_inicio   DATETIME NULL,
  estado              VARCHAR(20) NOT NULL,
  minutos_por_cuarto  INT NOT NULL,
  cuartos_totales     INT NOT NULL,
  faltas_equipo_lim   TINYINT NOT NULL,
  faltas_jugador_lim  TINYINT NOT NULL,
  sede                VARCHAR(100) NULL,
  fecha_creacion      DATETIME NOT NULL,
  KEY ix_partido_fecha (fecha_hora_inicio),
  KEY ix_partido_estado (estado),
  KEY ix_partido_equipos (equipo_local_id, equipo_visitante_id),
  KEY ix_partido_fecha2 (fecha_hora_inicio, partido_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS bridge_roster_partido;
CREATE TABLE bridge_roster_partido (
  roster_id  INT PRIMARY KEY,
  partido_id INT NOT NULL,
  equipo_id  INT NOT NULL,
  jugador_id INT NOT NULL,
  es_titular TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_partido_jugador (partido_id, jugador_id),
  KEY ix_roster_partido (partido_id),
  KEY ix_roster_equipo (equipo_id),
  KEY ix_roster_jugador (jugador_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS fact_anotacion;
CREATE TABLE fact_anotacion (
  anotacion_id BIGINT PRIMARY KEY,
  partido_id   INT NOT NULL,
  cuarto_id    INT NULL,
  equipo_id    INT NOT NULL,
  puntos       SMALLINT NOT NULL,
  KEY ix_anot_part_cuarto (partido_id, cuarto_id),
  KEY ix_anot_equipo (equipo_id),
  KEY ix_anot_puntos (puntos)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS sync_state;
CREATE TABLE sync_state (
  entity   VARCHAR(64) PRIMARY KEY,
  last_id  BIGINT NULL,
  last_ts  DATETIME NULL
) ENGINE=InnoDB;

-- =========================================================
-- =======================  VISTAS  ========================
-- =========================================================

/* ---------- EQUIPOS (para combo y grilla) ---------- */
DROP VIEW IF EXISTS vw_report_equipos;
CREATE VIEW vw_report_equipos AS
SELECT
  e.equipo_id,               -- necesario para value del combo
  e.nombre,
  e.ciudad,
  e.abreviatura,
  e.logo_path AS logo,
  e.activo,
  e.fecha_creacion
FROM dim_equipo AS e;

-- Vista ligera solo para el dropdown (opcional)
DROP VIEW IF EXISTS vw_equipos_combo;
CREATE VIEW vw_equipos_combo AS
SELECT
  e.equipo_id,
  e.nombre,
  e.abreviatura
FROM dim_equipo e
WHERE e.activo = 1
ORDER BY e.nombre;

/* ---------- JUGADORES (con columnas de filtro) ---------- */
DROP VIEW IF EXISTS vw_report_jugadores;
CREATE VIEW vw_report_jugadores AS
SELECT
  j.jugador_id,
  j.equipo_id,               -- filtro por equipo
  e.nombre AS equipo,        -- mostrar y/o filtrar por equipo
  j.nombres,
  j.apellidos,
  j.dorsal,
  j.posicion,
  j.estatura_cm,
  j.edad,
  j.nacionalidad,
  j.activo,
  j.fecha_creacion           -- filtro por fecha (rango)
FROM dim_jugador AS j
JOIN dim_equipo  AS e ON e.equipo_id = j.equipo_id;

/* ---------- PARTIDOS (exacto a UI) ---------- */
DROP VIEW IF EXISTS vw_report_partidos;
CREATE VIEW vw_report_partidos AS
SELECT
  el.nombre AS equipo_local,
  ev.nombre AS equipo_visitante,
  DATE(p.fecha_hora_inicio)                 AS fecha,
  DATE_FORMAT(p.fecha_hora_inicio, '%H:%i') AS hora,
  CONCAT(
    COALESCE(SUM(CASE WHEN a.equipo_id = p.equipo_local_id     THEN a.puntos END),0),
    '-',
    COALESCE(SUM(CASE WHEN a.equipo_id = p.equipo_visitante_id THEN a.puntos END),0)
  ) AS marcador_final
FROM dim_partido AS p
LEFT JOIN dim_equipo AS el ON el.equipo_id = p.equipo_local_id
LEFT JOIN dim_equipo AS ev ON ev.equipo_id = p.equipo_visitante_id
LEFT JOIN fact_anotacion AS a ON a.partido_id = p.partido_id
GROUP BY
  p.partido_id,
  el.nombre,
  ev.nombre,
  DATE(p.fecha_hora_inicio),
  DATE_FORMAT(p.fecha_hora_inicio, '%H:%i');

-- =========================================================
-- [2025-10-12] PARTIDOS para dropdown (incluye partido_id)
-- =========================================================
DROP VIEW IF EXISTS vw_partidos_combo;                             -- [2025-10-12]
CREATE VIEW vw_partidos_combo AS                                   -- [2025-10-12]
SELECT
  p.partido_id,                                                    -- [2025-10-12] necesario para filtrar roster
  CONCAT(el.nombre, ' vs ', ev.nombre, ' — ',
         DATE_FORMAT(p.fecha_hora_inicio, '%Y-%m-%d %H:%i')) 
         AS etiqueta,                                              -- [2025-10-12] texto para el select
  el.nombre  AS equipo_local,                                      -- opcional
  ev.nombre  AS equipo_visitante,                                  -- opcional
  DATE(p.fecha_hora_inicio)                 AS fecha,              -- opcional
  DATE_FORMAT(p.fecha_hora_inicio, '%H:%i') AS hora                -- opcional
FROM dim_partido p
JOIN dim_equipo el ON el.equipo_id = p.equipo_local_id
JOIN dim_equipo ev ON ev.equipo_id = p.equipo_visitante_id
ORDER BY p.fecha_hora_inicio DESC;                                 -- [2025-10-12]

/* ---------- ROSTER (mejorado) ---------- */
-- (reemplaza la vista previa para permitir filtrar por partido y devolver alias exactos)
DROP VIEW IF EXISTS vw_report_roster;
CREATE VIEW vw_report_roster AS
SELECT
  rp.partido_id,                                                   -- ✅ para WHERE partido_id = ?
  e.nombre                           AS equipo,
  CONCAT(j.nombres, ' ', j.apellidos) AS jugador,
  j.dorsal,
  j.posicion,
  CASE 
    WHEN e.equipo_id = p.equipo_local_id     THEN 'Local'
    WHEN e.equipo_id = p.equipo_visitante_id THEN 'Visitante'
    ELSE 'Otro'
  END AS tipo                                                      -- [2025-10-12] alias esperado por la UI
FROM bridge_roster_partido AS rp
JOIN dim_jugador AS j ON j.jugador_id = rp.jugador_id
JOIN dim_equipo  AS e ON e.equipo_id  = rp.equipo_id
JOIN dim_partido AS p ON p.partido_id = rp.partido_id
WHERE j.activo = 1 AND e.activo = 1;                               -- solo activos

-- =========================================================
-- [2025-10-12] ROSTER (todo completo) para el toggle
-- =========================================================
DROP VIEW IF EXISTS vw_report_roster_all;                           -- [2025-10-12]
CREATE VIEW vw_report_roster_all AS                                 -- [2025-10-12]
SELECT
  rp.partido_id,
  e.nombre                           AS equipo,
  CONCAT(j.nombres, ' ', j.apellidos) AS jugador,
  j.dorsal,
  j.posicion,
  CASE 
    WHEN e.equipo_id = p.equipo_local_id     THEN 'Local'
    WHEN e.equipo_id = p.equipo_visitante_id THEN 'Visitante'
    ELSE 'Otro'
  END AS tipo
FROM bridge_roster_partido rp
JOIN dim_jugador j ON j.jugador_id = rp.jugador_id
JOIN dim_equipo  e ON e.equipo_id  = rp.equipo_id
JOIN dim_partido p ON p.partido_id = rp.partido_id;

-- =========================================================
-- Notas de performance
--  - Asegúrate de mantener:
--      KEY ix_roster_partido (partido_id)                en bridge_roster_partido
--      KEY ix_partido_fecha2 (fecha_hora_inicio, partido_id) en dim_partido
--  - Para llenar el select:  SELECT partido_id, etiqueta FROM vw_partidos_combo;
--  - Para filtrar roster:    SELECT equipo, jugador, dorsal, posicion, tipo
--                             FROM vw_report_roster[ _all ]
--                             WHERE partido_id = ? ORDER BY tipo, equipo, dorsal;
-- =========================================================


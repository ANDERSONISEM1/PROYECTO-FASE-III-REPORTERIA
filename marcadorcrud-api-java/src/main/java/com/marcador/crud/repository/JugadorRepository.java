package com.marcador.crud.repository;

import com.marcador.crud.entity.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {
    
    /**
     * Buscar jugadores por equipo y activos, ordenados por apellidos y nombres
     */
    List<Jugador> findByEquipoIdAndActivoTrueOrderByApellidosAscNombresAsc(Long equipoId);
    
    /**
     * Buscar todos los jugadores de un equipo (activos e inactivos)
     */
    List<Jugador> findByEquipoIdOrderByApellidosAscNombresAsc(Long equipoId);
    
    /**
     * Buscar jugador por equipo y dorsal
     */
    @Query("SELECT j FROM Jugador j WHERE j.equipoId = :equipoId AND j.dorsal = :dorsal")
    Optional<Jugador> findByEquipoIdAndDorsal(@Param("equipoId") Long equipoId, @Param("dorsal") Byte dorsal);
    
    /**
     * Verificar si existe un jugador con el dorsal dado en un equipo (excluyendo un ID específico)
     */
    @Query("SELECT COUNT(j) > 0 FROM Jugador j WHERE j.equipoId = :equipoId AND j.dorsal = :dorsal AND j.id != :excludeId")
    boolean existsByEquipoIdAndDorsalAndIdNot(@Param("equipoId") Long equipoId, @Param("dorsal") Byte dorsal, @Param("excludeId") Long excludeId);
    
    /**
     * Verificar si existe un jugador con el dorsal dado en un equipo
     */
    boolean existsByEquipoIdAndDorsal(Long equipoId, Byte dorsal);
    
    /**
     * Contar jugadores activos por equipo
     */
    long countByEquipoIdAndActivoTrue(Long equipoId);
    
    /**
     * Buscar jugadores por posición
     */
    List<Jugador> findByPosicionIgnoreCaseAndActivoTrueOrderByApellidosAscNombresAsc(String posicion);
    
    /**
     * Buscar jugadores por partido (usando consulta nativa para PartidoJugador)
     */
    @Query(value = "SELECT j.jugador_id as id, j.nombres, j.apellidos, j.dorsal, " +
                   "j.posicion, pj.es_titular as esTitular, j.activo " +
                   "FROM Jugador j " +
                   "INNER JOIN PartidoJugador pj ON j.jugador_id = pj.jugador_id " +
                   "WHERE pj.partido_id = :partidoId " +
                   "ORDER BY j.apellidos, j.nombres", nativeQuery = true)
    List<JugadorMiniProjection> findJugadoresByPartido(@Param("partidoId") Long partidoId);
    
    /**
     * Buscar jugadores por partido y equipo
     */
    @Query(value = "SELECT j.jugador_id as id, j.nombres, j.apellidos, j.dorsal, " +
                   "j.posicion, pj.es_titular as esTitular, j.activo " +
                   "FROM Jugador j " +
                   "INNER JOIN PartidoJugador pj ON j.jugador_id = pj.jugador_id " +
                   "WHERE pj.partido_id = :partidoId AND j.equipo_id = :equipoId " +
                   "ORDER BY j.apellidos, j.nombres", nativeQuery = true)
    List<JugadorMiniProjection> findJugadoresByPartidoAndEquipo(@Param("partidoId") Long partidoId, @Param("equipoId") Long equipoId);
    
    /**
     * Verificar si un jugador está involucrado en partidos o faltas
     */
    @Query(value = "SELECT CASE " +
                   "WHEN EXISTS(SELECT 1 FROM PartidoJugador pj WHERE pj.jugador_id = :jugadorId) THEN 1 " +
                   "WHEN EXISTS(SELECT 1 FROM Falta f WHERE f.jugador_id = :jugadorId) THEN 1 " +
                   "ELSE 0 END", nativeQuery = true)
    int isJugadorInvolucrado(@Param("jugadorId") Long jugadorId);
    
    /**
     * Projection interface para JugadorMini
     */
    interface JugadorMiniProjection {
        Long getId();
        String getNombres();
        String getApellidos();
        Byte getDorsal();
        String getPosicion();
        Boolean getEsTitular();
        Boolean getActivo();
    }
}

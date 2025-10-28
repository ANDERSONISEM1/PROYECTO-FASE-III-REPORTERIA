package com.marcador.crud.repository;

import com.marcador.crud.entity.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {
    
    /**
     * Buscar equipos activos ordenados por nombre
     */
    List<Equipo> findByActivoTrueOrderByNombre();
    
    /**
     * Buscar equipo por nombre (case insensitive)
     */
    Optional<Equipo> findByNombreIgnoreCase(String nombre);
    
    /**
     * Verificar si existe un equipo con el nombre dado (excluyendo un ID específico)
     */
    @Query("SELECT COUNT(e) > 0 FROM Equipo e WHERE UPPER(TRIM(e.nombre)) = UPPER(TRIM(:nombre)) AND e.id != :excludeId")
    boolean existsByNombreIgnoreCaseAndIdNot(@Param("nombre") String nombre, @Param("excludeId") Long excludeId);
    
    /**
     * Verificar si existe un equipo con el nombre dado
     */
    @Query("SELECT COUNT(e) > 0 FROM Equipo e WHERE UPPER(TRIM(e.nombre)) = UPPER(TRIM(:nombre))")
    boolean existsByNombreIgnoreCase(@Param("nombre") String nombre);
    
    /**
     * Buscar todos los equipos activos
     */
    @Query("SELECT e FROM Equipo e WHERE e.activo = true ORDER BY e.nombre")
    List<Equipo> findActiveEquipos();
    
    /**
     * Buscar equipos por ciudad
     */
    List<Equipo> findByCiudadIgnoreCaseAndActivoTrue(String ciudad);
    
    /**
     * Contar equipos activos
     */
    long countByActivoTrue();
    
    /**
     * Buscar por abreviatura
     */
    Optional<Equipo> findByAbreviaturaIgnoreCase(String abreviatura);
}

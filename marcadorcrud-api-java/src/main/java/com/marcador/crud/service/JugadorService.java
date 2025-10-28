package com.marcador.crud.service;

import com.marcador.crud.dto.CreateJugadorRequest;
import com.marcador.crud.dto.JugadorDto;
import com.marcador.crud.entity.Jugador;
import com.marcador.crud.repository.JugadorRepository;
import com.marcador.crud.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class JugadorService {
    
    @Autowired
    private JugadorRepository jugadorRepository;
    
    @Autowired
    private EquipoRepository equipoRepository;
    
    /**
     * Obtener todos los jugadores (con filtro opcional por equipo)
     */
    @Transactional(readOnly = true)
    public List<JugadorDto> getAllJugadores(Long equipoId) {
        List<Jugador> jugadores;
        if (equipoId != null) {
            jugadores = jugadorRepository.findByEquipoIdAndActivoTrueOrderByApellidosAscNombresAsc(equipoId);
        } else {
            jugadores = jugadorRepository.findAll();
        }
        return jugadores.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtener jugador por ID
     */
    @Transactional(readOnly = true)
    public Optional<JugadorDto> getJugadorById(Long id) {
        return jugadorRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Crear nuevo jugador
     */
    public JugadorDto createJugador(CreateJugadorRequest request) {
        // Validar que el equipo existe
        if (!equipoRepository.existsById(request.getEquipoId())) {
            throw new IllegalArgumentException("El equipo con ID " + request.getEquipoId() + " no existe");
        }
        
        // Validar dorsal único por equipo
        if (request.getDorsal() != null && 
            jugadorRepository.existsByEquipoIdAndDorsal(request.getEquipoId(), request.getDorsal())) {
            throw new IllegalArgumentException("Ya existe un jugador con el dorsal " + request.getDorsal() + " en este equipo");
        }
        
        Jugador jugador = new Jugador();
        jugador.setEquipoId(request.getEquipoId());
        jugador.setNombres(request.getNombres().trim());
        jugador.setApellidos(request.getApellidos().trim());
        jugador.setDorsal(request.getDorsal());
        jugador.setPosicion(request.getPosicion());
        jugador.setEstaturaCm(request.getEstaturaCm());
        jugador.setEdad(request.getEdad());
        jugador.setNacionalidad(request.getNacionalidad());
        jugador.setActivo(request.getActivo());
        
        Jugador savedJugador = jugadorRepository.save(jugador);
        return convertToDto(savedJugador);
    }
    
    /**
     * Actualizar jugador
     */
    public JugadorDto updateJugador(Long id, CreateJugadorRequest request) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Jugador no encontrado con ID: " + id));
        
        // Validar que el equipo existe
        if (!equipoRepository.existsById(request.getEquipoId())) {
            throw new IllegalArgumentException("El equipo con ID " + request.getEquipoId() + " no existe");
        }
        
        // Validar dorsal único por equipo (excluyendo el jugador actual)
        if (request.getDorsal() != null && 
            jugadorRepository.existsByEquipoIdAndDorsalAndIdNot(request.getEquipoId(), request.getDorsal(), id)) {
            throw new IllegalArgumentException("Ya existe otro jugador con el dorsal " + request.getDorsal() + " en este equipo");
        }
        
        jugador.setEquipoId(request.getEquipoId());
        jugador.setNombres(request.getNombres().trim());
        jugador.setApellidos(request.getApellidos().trim());
        jugador.setDorsal(request.getDorsal());
        jugador.setPosicion(request.getPosicion());
        jugador.setEstaturaCm(request.getEstaturaCm());
        jugador.setEdad(request.getEdad());
        jugador.setNacionalidad(request.getNacionalidad());
        jugador.setActivo(request.getActivo());
        
        Jugador updatedJugador = jugadorRepository.save(jugador);
        return convertToDto(updatedJugador);
    }
    
    /**
     * Eliminar jugador (eliminación forzada)
     */
    public void deleteJugador(Long id) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Jugador no encontrado con ID: " + id));
        
        // ELIMINACIÓN FORZADA: Eliminar sin verificar restricciones
        System.out.println("Eliminando jugador " + id + " (" + jugador.getNombres() + " " + jugador.getApellidos() + ")");
        
        // Nota: Si hay restricciones FK con partidos/faltas, se manejará a nivel de base de datos
        // pero intentamos eliminar directamente
        try {
            jugadorRepository.delete(jugador);
        } catch (Exception e) {
            // Si falla por FK, intentamos eliminar registros relacionados primero
            System.out.println("Error FK detectado, eliminando registros relacionados...");
            // Aquí podrías agregar lógica para eliminar de PartidoJugador y Falta si es necesario
            throw new IllegalStateException("No se puede eliminar el jugador debido a restricciones de base de datos");
        }
    }
    
    /**
     * Activar/Desactivar jugador
     */
    public JugadorDto toggleActiveJugador(Long id) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Jugador no encontrado con ID: " + id));
        
        jugador.setActivo(!jugador.getActivo());
        Jugador updatedJugador = jugadorRepository.save(jugador);
        return convertToDto(updatedJugador);
    }
    
    /**
     * Obtener jugadores por partido
     */
    @Transactional(readOnly = true)
    public List<JugadorRepository.JugadorMiniProjection> getJugadoresByPartido(Long partidoId) {
        return jugadorRepository.findJugadoresByPartido(partidoId);
    }
    
    /**
     * Obtener jugadores por partido y equipo
     */
    @Transactional(readOnly = true)
    public List<JugadorRepository.JugadorMiniProjection> getJugadoresByPartidoAndEquipo(Long partidoId, Long equipoId) {
        return jugadorRepository.findJugadoresByPartidoAndEquipo(partidoId, equipoId);
    }
    
    /**
     * Convertir entidad a DTO
     */
    private JugadorDto convertToDto(Jugador jugador) {
        return new JugadorDto(
                jugador.getId(),
                jugador.getEquipoId(),
                jugador.getNombres(),
                jugador.getApellidos(),
                jugador.getDorsal(),
                jugador.getPosicion(),
                jugador.getEstaturaCm(),
                jugador.getEdad(),
                jugador.getNacionalidad(),
                jugador.getActivo()
        );
    }
}

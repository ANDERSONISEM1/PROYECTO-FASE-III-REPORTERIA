package com.marcador.crud.service;

import com.marcador.crud.dto.CreateEquipoRequest;
import com.marcador.crud.dto.EquipoDto;
import com.marcador.crud.entity.Equipo;
import com.marcador.crud.repository.EquipoRepository;
import com.marcador.crud.repository.JugadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EquipoService {
    
    @Autowired
    private EquipoRepository equipoRepository;
    
    @Autowired
    private JugadorRepository jugadorRepository;
    
    /**
     * Obtener todos los equipos activos
     */
    @Transactional(readOnly = true)
    public List<EquipoDto> getAllActiveEquipos() {
        return equipoRepository.findActiveEquipos()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtener todos los equipos
     */
    @Transactional(readOnly = true)
    public List<EquipoDto> getAllEquipos() {
        return equipoRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtener equipo por ID
     */
    @Transactional(readOnly = true)
    public Optional<EquipoDto> getEquipoById(Long id) {
        return equipoRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Crear nuevo equipo
     */
    public EquipoDto createEquipo(CreateEquipoRequest request) {
        // Validar nombre único
        if (equipoRepository.existsByNombreIgnoreCase(request.getNombre())) {
            throw new IllegalArgumentException("Ya existe un equipo con el nombre: " + request.getNombre());
        }
        
        Equipo equipo = new Equipo();
        equipo.setNombre(request.getNombre().trim());
        equipo.setCiudad(request.getCiudad() != null ? request.getCiudad().trim() : null);
        equipo.setAbreviatura(request.getAbreviatura() != null ? request.getAbreviatura().trim() : null);
        equipo.setActivo(request.getActivo());
        equipo.setFechaCreacion(LocalDateTime.now());
        
        Equipo savedEquipo = equipoRepository.save(equipo);
        return convertToDto(savedEquipo);
    }
    
    /**
     * Actualizar equipo
     */
    public EquipoDto updateEquipo(Long id, CreateEquipoRequest request) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado con ID: " + id));
        
        // Validar nombre único (excluyendo el equipo actual)
        if (equipoRepository.existsByNombreIgnoreCaseAndIdNot(request.getNombre(), id)) {
            throw new IllegalArgumentException("Ya existe otro equipo con el nombre: " + request.getNombre());
        }
        
        equipo.setNombre(request.getNombre().trim());
        equipo.setCiudad(request.getCiudad() != null ? request.getCiudad().trim() : null);
        equipo.setAbreviatura(request.getAbreviatura() != null ? request.getAbreviatura().trim() : null);
        equipo.setActivo(request.getActivo());
        
        Equipo updatedEquipo = equipoRepository.save(equipo);
        return convertToDto(updatedEquipo);
    }
    
    /**
     * Eliminar equipo (eliminación en cascada automática)
     */
    public void deleteEquipo(Long id) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado con ID: " + id));
        
        // ELIMINACIÓN EN CASCADA: Eliminar TODOS los jugadores del equipo primero
        List<com.marcador.crud.entity.Jugador> jugadores = jugadorRepository.findByEquipoIdOrderByApellidosAscNombresAsc(id);
        if (!jugadores.isEmpty()) {
            System.out.println("Eliminando " + jugadores.size() + " jugadores del equipo " + id);
            jugadorRepository.deleteAll(jugadores);
        }
        
        // Ahora eliminar el equipo
        System.out.println("Eliminando equipo " + id);
        equipoRepository.delete(equipo);
    }
    
    /**
     * Activar/Desactivar equipo
     */
    public EquipoDto toggleActiveEquipo(Long id) {
        Equipo equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Equipo no encontrado con ID: " + id));
        
        equipo.setActivo(!equipo.getActivo());
        Equipo updatedEquipo = equipoRepository.save(equipo);
        return convertToDto(updatedEquipo);
    }
    
    /**
     * Buscar equipo por nombre
     */
    @Transactional(readOnly = true)
    public Optional<EquipoDto> findByNombre(String nombre) {
        return equipoRepository.findByNombreIgnoreCase(nombre)
                .map(this::convertToDto);
    }
    
    /**
     * Verificar si existe equipo por nombre
     */
    @Transactional(readOnly = true)
    public boolean existsByNombre(String nombre) {
        return equipoRepository.existsByNombreIgnoreCase(nombre);
    }
    
    /**
     * Convertir entidad a DTO
     */
    private EquipoDto convertToDto(Equipo equipo) {
        return new EquipoDto(
                equipo.getId(),
                equipo.getNombre(),
                equipo.getCiudad(),
                equipo.getAbreviatura(),
                equipo.getActivo(),
                equipo.getFechaCreacion()
        );
    }
}

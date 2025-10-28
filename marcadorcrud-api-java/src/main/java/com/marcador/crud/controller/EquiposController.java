package com.marcador.crud.controller;

import com.marcador.crud.dto.CreateEquipoRequest;
import com.marcador.crud.dto.EquipoDto;
import com.marcador.crud.service.EquipoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/equipos")
@CrossOrigin(origins = "*")
public class EquiposController {
    
    @Autowired
    private EquipoService equipoService;
    
    /**
     * Listar todos los equipos activos
     */
    @GetMapping
    public ResponseEntity<List<EquipoDto>> getAllEquipos(@RequestParam(defaultValue = "true") boolean soloActivos) {
        try {
            List<EquipoDto> equipos = soloActivos ? 
                    equipoService.getAllActiveEquipos() : 
                    equipoService.getAllEquipos();
            return ResponseEntity.ok(equipos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
    
    /**
     * Obtener equipo por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EquipoDto> getEquipoById(@PathVariable Long id) {
        Optional<EquipoDto> equipo = equipoService.getEquipoById(id);
        return equipo.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Crear nuevo equipo
     */
    @PostMapping
    public ResponseEntity<?> createEquipo(@Valid @RequestBody CreateEquipoRequest request) {
        try {
            EquipoDto createdEquipo = equipoService.createEquipo(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdEquipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Actualizar equipo
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEquipo(@PathVariable Long id, @Valid @RequestBody CreateEquipoRequest request) {
        try {
            EquipoDto updatedEquipo = equipoService.updateEquipo(id, request);
            return ResponseEntity.ok(updatedEquipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Eliminar equipo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEquipo(@PathVariable Long id) {
        try {
            equipoService.deleteEquipo(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Activar/Desactivar equipo
     */
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActiveEquipo(@PathVariable Long id) {
        try {
            EquipoDto updatedEquipo = equipoService.toggleActiveEquipo(id);
            return ResponseEntity.ok(updatedEquipo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Buscar equipo por nombre
     */
    @GetMapping("/buscar")
    public ResponseEntity<EquipoDto> findByNombre(@RequestParam String nombre) {
        Optional<EquipoDto> equipo = equipoService.findByNombre(nombre);
        return equipo.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Verificar si existe equipo por nombre
     */
    @GetMapping("/existe")
    public ResponseEntity<Boolean> existsByNombre(@RequestParam String nombre) {
        boolean exists = equipoService.existsByNombre(nombre);
        return ResponseEntity.ok(exists);
    }
    
    /**
     * Clase para respuestas de error
     */
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}

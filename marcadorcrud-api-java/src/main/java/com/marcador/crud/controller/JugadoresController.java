package com.marcador.crud.controller;

import com.marcador.crud.dto.CreateJugadorRequest;
import com.marcador.crud.dto.JugadorDto;
import com.marcador.crud.repository.JugadorRepository;
import com.marcador.crud.service.JugadorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jugadores")
@CrossOrigin(origins = "*")
public class JugadoresController {
    
    @Autowired
    private JugadorService jugadorService;
    
    /**
     * Listar jugadores (con filtro opcional por equipo)
     */
    @GetMapping
    public ResponseEntity<List<JugadorDto>> getAllJugadores(@RequestParam(required = false) Long equipoId) {
        try {
            List<JugadorDto> jugadores = jugadorService.getAllJugadores(equipoId);
            return ResponseEntity.ok(jugadores);
        } catch (Exception e) {
            e.printStackTrace();
            // Retornar lista vacía en caso de error para evitar 500
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }
    
    /**
     * Obtener jugador por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<JugadorDto> getJugadorById(@PathVariable Long id) {
        Optional<JugadorDto> jugador = jugadorService.getJugadorById(id);
        return jugador.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Crear nuevo jugador
     */
    @PostMapping
    public ResponseEntity<?> createJugador(@Valid @RequestBody CreateJugadorRequest request) {
        try {
            JugadorDto createdJugador = jugadorService.createJugador(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdJugador);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Actualizar jugador
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateJugador(@PathVariable Long id, @Valid @RequestBody CreateJugadorRequest request) {
        try {
            JugadorDto updatedJugador = jugadorService.updateJugador(id, request);
            return ResponseEntity.ok(updatedJugador);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Eliminar jugador
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJugador(@PathVariable Long id) {
        try {
            jugadorService.deleteJugador(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Activar/Desactivar jugador
     */
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActiveJugador(@PathVariable Long id) {
        try {
            JugadorDto updatedJugador = jugadorService.toggleActiveJugador(id);
            return ResponseEntity.ok(updatedJugador);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener jugadores por partido
     */
    @GetMapping("/{partidoId}/partido")
    public ResponseEntity<List<JugadorRepository.JugadorMiniProjection>> getJugadoresByPartido(@PathVariable Long partidoId) {
        List<JugadorRepository.JugadorMiniProjection> jugadores = jugadorService.getJugadoresByPartido(partidoId);
        return ResponseEntity.ok(jugadores);
    }
    
    /**
     * Obtener jugadores por partido y equipo
     */
    @GetMapping("/{partidoId}/partido/{equipoId}")
    public ResponseEntity<List<JugadorRepository.JugadorMiniProjection>> getJugadoresByPartidoAndEquipo(
            @PathVariable Long partidoId, 
            @PathVariable Long equipoId) {
        List<JugadorRepository.JugadorMiniProjection> jugadores = 
                jugadorService.getJugadoresByPartidoAndEquipo(partidoId, equipoId);
        return ResponseEntity.ok(jugadores);
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

package com.marcador.crud.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {
    
    @GetMapping("/equipos")
    public ResponseEntity<List<Map<String, Object>>> testEquipos() {
        List<Map<String, Object>> equipos = new ArrayList<>();
        
        Map<String, Object> equipo1 = new HashMap<>();
        equipo1.put("id", 1L);
        equipo1.put("nombre", "Lakers");
        equipo1.put("ciudad", "Los Angeles");
        equipo1.put("activo", true);
        equipos.add(equipo1);
        
        Map<String, Object> equipo2 = new HashMap<>();
        equipo2.put("id", 2L);
        equipo2.put("nombre", "Warriors");
        equipo2.put("ciudad", "San Francisco");
        equipo2.put("activo", true);
        equipos.add(equipo2);
        
        return ResponseEntity.ok(equipos);
    }
    
    @GetMapping("/jugadores")
    public ResponseEntity<List<Map<String, Object>>> testJugadores() {
        List<Map<String, Object>> jugadores = new ArrayList<>();
        
        Map<String, Object> jugador1 = new HashMap<>();
        jugador1.put("id", 1L);
        jugador1.put("equipoId", 1L);
        jugador1.put("nombres", "LeBron");
        jugador1.put("apellidos", "James");
        jugador1.put("dorsal", 23);
        jugador1.put("activo", true);
        jugadores.add(jugador1);
        
        return ResponseEntity.ok(jugadores);
    }
    
    @PostMapping("/jugadores")
    public ResponseEntity<Map<String, Object>> createTestJugador(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", 999L);
        response.put("equipoId", request.get("equipoId"));
        response.put("nombres", request.get("nombres"));
        response.put("apellidos", request.get("apellidos"));
        response.put("dorsal", request.get("dorsal"));
        response.put("activo", true);
        response.put("message", "Jugador creado exitosamente (TEST)");
        
        return ResponseEntity.ok(response);
    }
}

package com.marcador.crud.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Jugador")
public class Jugador {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "jugador_id")
    private Long id;
    
    @Column(name = "equipo_id", nullable = false)
    private Long equipoId;
    
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;
    
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;
    
    @Column(name = "dorsal")
    private Byte dorsal;
    
    @Column(name = "posicion", length = 50)
    private String posicion;
    
    @Column(name = "estatura_cm")
    private Short estaturaCm;
    
    @Column(name = "edad")
    private Byte edad;
    
    @Column(name = "nacionalidad", length = 50)
    private String nacionalidad;
    
    @Column(name = "activo")
    private Boolean activo = true;
    
    // Constructors
    public Jugador() {}
    
    public Jugador(Long equipoId, String nombres, String apellidos) {
        this.equipoId = equipoId;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.activo = true;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getEquipoId() {
        return equipoId;
    }
    
    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
    }
    
    public String getNombres() {
        return nombres;
    }
    
    public void setNombres(String nombres) {
        this.nombres = nombres;
    }
    
    public String getApellidos() {
        return apellidos;
    }
    
    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }
    
    public Byte getDorsal() {
        return dorsal;
    }
    
    public void setDorsal(Byte dorsal) {
        this.dorsal = dorsal;
    }
    
    public String getPosicion() {
        return posicion;
    }
    
    public void setPosicion(String posicion) {
        this.posicion = posicion;
    }
    
    public Short getEstaturaCm() {
        return estaturaCm;
    }
    
    public void setEstaturaCm(Short estaturaCm) {
        this.estaturaCm = estaturaCm;
    }
    
    public Byte getEdad() {
        return edad;
    }
    
    public void setEdad(Byte edad) {
        this.edad = edad;
    }
    
    public String getNacionalidad() {
        return nacionalidad;
    }
    
    public void setNacionalidad(String nacionalidad) {
        this.nacionalidad = nacionalidad;
    }
    
    public Boolean getActivo() {
        return activo;
    }
    
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
    
    @PrePersist
    protected void onCreate() {
        if (activo == null) {
            activo = true;
        }
    }
    
    // Método de conveniencia para nombre completo
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }
}

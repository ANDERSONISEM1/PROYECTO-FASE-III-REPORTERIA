package com.marcador.crud.dto;

import java.time.LocalDateTime;

public class JugadorDto {
    private Long id;
    private Long equipoId;
    private String nombres;
    private String apellidos;
    private Byte dorsal;
    private String posicion;
    private Short estaturaCm;
    private Byte edad;
    private String nacionalidad;
    private Boolean activo;
    
    // Constructors
    public JugadorDto() {}
    
    public JugadorDto(Long id, Long equipoId, String nombres, String apellidos, Byte dorsal, 
                     String posicion, Short estaturaCm, Byte edad, String nacionalidad, 
                     Boolean activo) {
        this.id = id;
        this.equipoId = equipoId;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dorsal = dorsal;
        this.posicion = posicion;
        this.estaturaCm = estaturaCm;
        this.edad = edad;
        this.nacionalidad = nacionalidad;
        this.activo = activo;
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
    
    
    // Método de conveniencia
    public String getNombreCompleto() {
        return nombres + " " + apellidos;
    }
}

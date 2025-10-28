package com.marcador.crud.dto;

import java.time.LocalDateTime;

public class EquipoDto {
    private Long id;
    private String nombre;
    private String ciudad;
    private String abreviatura;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
    
    // Constructors
    public EquipoDto() {}
    
    public EquipoDto(Long id, String nombre, String ciudad, String abreviatura, Boolean activo, LocalDateTime fechaCreacion) {
        this.id = id;
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.abreviatura = abreviatura;
        this.activo = activo;
        this.fechaCreacion = fechaCreacion;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    public String getCiudad() {
        return ciudad;
    }
    
    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }
    
    public String getAbreviatura() {
        return abreviatura;
    }
    
    public void setAbreviatura(String abreviatura) {
        this.abreviatura = abreviatura;
    }
    
    public Boolean getActivo() {
        return activo;
    }
    
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}

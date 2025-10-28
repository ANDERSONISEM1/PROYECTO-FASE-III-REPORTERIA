package com.marcador.crud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class CreateJugadorRequest {
    
    @NotNull(message = "El ID del equipo es obligatorio")
    @Min(value = 1, message = "El ID del equipo debe ser mayor a 0")
    private Long equipoId;
    
    @NotBlank(message = "Los nombres son obligatorios")
    @Size(min = 2, max = 100, message = "Los nombres deben tener entre 2 y 100 caracteres")
    private String nombres;
    
    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(min = 2, max = 100, message = "Los apellidos deben tener entre 2 y 100 caracteres")
    private String apellidos;
    
    @Min(value = 0, message = "El dorsal debe ser mayor o igual a 0")
    @Max(value = 99, message = "El dorsal debe ser menor o igual a 99")
    private Byte dorsal;
    
    @Size(max = 50, message = "La posición no puede exceder 50 caracteres")
    private String posicion;
    
    @Min(value = 50, message = "La estatura debe ser mayor a 50 cm")
    @Max(value = 250, message = "La estatura debe ser menor a 250 cm")
    private Short estaturaCm;
    
    @Min(value = 15, message = "La edad debe ser mayor a 15 años")
    @Max(value = 50, message = "La edad debe ser menor a 50 años")
    private Byte edad;
    
    @Size(max = 50, message = "La nacionalidad no puede exceder 50 caracteres")
    private String nacionalidad;
    
    private Boolean activo = true;
    
    // Constructors
    public CreateJugadorRequest() {}
    
    public CreateJugadorRequest(Long equipoId, String nombres, String apellidos) {
        this.equipoId = equipoId;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.activo = true;
    }
    
    // Getters and Setters
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
}

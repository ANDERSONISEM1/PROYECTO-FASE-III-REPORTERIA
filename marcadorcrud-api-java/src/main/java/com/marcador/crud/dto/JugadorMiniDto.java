package com.marcador.crud.dto;

public class JugadorMiniDto {
    private Long id;
    private String nombres;
    private String apellidos;
    private Byte dorsal;
    private String posicion;
    private Boolean esTitular;
    private Boolean activo;
    
    // Constructors
    public JugadorMiniDto() {}
    
    public JugadorMiniDto(Long id, String nombres, String apellidos, Byte dorsal, 
                         String posicion, Boolean esTitular, Boolean activo) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dorsal = dorsal;
        this.posicion = posicion;
        this.esTitular = esTitular;
        this.activo = activo;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public Boolean getEsTitular() {
        return esTitular;
    }
    
    public void setEsTitular(Boolean esTitular) {
        this.esTitular = esTitular;
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

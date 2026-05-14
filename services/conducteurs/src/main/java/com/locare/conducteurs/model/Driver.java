package com.locare.conducteurs.model;

import jakarta.persistence.*;

@Entity
@Table(name = "drivers")
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String permis;
    private String expiration;
    @Column(unique = true)
    private Long assignedVehicleId;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPermis() { return permis; }
    public void setPermis(String permis) { this.permis = permis; }
    public String getExpiration() { return expiration; }
    public void setExpiration(String expiration) { this.expiration = expiration; }
    public Long getAssignedVehicleId() { return assignedVehicleId; }
    public void setAssignedVehicleId(Long assignedVehicleId) { this.assignedVehicleId = assignedVehicleId; }
}

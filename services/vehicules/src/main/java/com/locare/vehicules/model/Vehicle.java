package com.locare.vehicules.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String marque;
    private String modele;
    private String immatriculation;
    private String statut; // e.g., AVAILABLE, IN_USE, MAINTENANCE
    @Column(unique = true)
    private Long driverId; // Can be null if no driver is assigned

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }
    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }
    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
}

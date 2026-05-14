package com.locare.maintenance.controller;

import com.locare.maintenance.model.Maintenance;
import com.locare.maintenance.service.MaintenanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService service;

    public MaintenanceController(MaintenanceService service) {
        this.service = service;
    }

    @GetMapping
    public List<Maintenance> getAll() {
        return service.getAllMaintenances();
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<Maintenance> getByVehicle(@PathVariable Long vehicleId) {
        return service.getMaintenancesByVehicle(vehicleId);
    }

    @PostMapping
    public Maintenance create(@RequestBody Maintenance maintenance) {
        return service.createMaintenance(maintenance);
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<Maintenance> close(@PathVariable Long id) {
        return service.closeMaintenance(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

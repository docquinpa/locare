package com.locare.conducteurs.controller;

import com.locare.conducteurs.model.Driver;
import com.locare.conducteurs.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conducteurs")
public class DriverController {

    private final DriverService service;

    public DriverController(DriverService service) {
        this.service = service;
    }

    @GetMapping
    public List<Driver> getAllDrivers() {
        return service.getAllDrivers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriver(@PathVariable Long id) {
        return service.getDriver(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Driver createDriver(@RequestBody Driver driver) {
        return service.createDriver(driver);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        try {
            return ResponseEntity.ok(service.updateDriver(id, driver));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        service.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }
}

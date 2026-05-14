package com.locare.conducteurs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locare.conducteurs.model.Driver;
import com.locare.conducteurs.repository.DriverRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DriverService {

    private final DriverRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public DriverService(DriverRepository repository) {
        this.repository = repository;
    }

    public List<Driver> getAllDrivers() {
        return repository.findAll();
    }

    public Optional<Driver> getDriver(Long id) {
        return repository.findById(id);
    }

    public Driver createDriver(Driver driver) {
        return repository.save(driver);
    }

    public Driver updateDriver(Long id, Driver driverDetails) {
        return repository.findById(id).map(driver -> {
            driver.setNom(driverDetails.getNom());
            driver.setPermis(driverDetails.getPermis());
            driver.setExpiration(driverDetails.getExpiration());
            driver.setAssignedVehicleId(driverDetails.getAssignedVehicleId());
            return repository.save(driver);
        }).orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    public void deleteDriver(Long id) {
        repository.deleteById(id);
    }

    @KafkaListener(topics = "locare-vehicules", groupId = "conducteurs-group")
    public void consumeVehicleEvent(String message) {
        try {
            JsonNode event = mapper.readTree(message);
            String eventType = event.get("eventType").asText();
            
            if ("DRIVER_ASSIGNED".equals(eventType) || "VEHICLE_UPDATED".equals(eventType) || "VEHICLE_CREATED".equals(eventType)) {
                JsonNode driverIdNode = event.get("driverId");
                if (driverIdNode != null && !driverIdNode.isNull()) {
                    Long driverId = driverIdNode.asLong();
                    Long vehicleId = event.get("vehicleId").asLong();
                    
                    repository.findById(driverId).ifPresent(driver -> {
                        driver.setAssignedVehicleId(vehicleId);
                        repository.save(driver);
                        System.out.println("Assigned vehicle " + vehicleId + " to driver " + driverId);
                    });
                }
            } else if ("VEHICLE_DELETED".equals(eventType)) {
                 Long vehicleId = event.get("vehicleId").asLong();
                 // Optionally unassign vehicle from all drivers having this vehicleId
                 List<Driver> allDrivers = repository.findAll();
                 allDrivers.forEach(d -> {
                     if (vehicleId.equals(d.getAssignedVehicleId())) {
                         d.setAssignedVehicleId(null);
                         repository.save(d);
                     }
                 });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

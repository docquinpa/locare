package com.locare.vehicules.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.locare.vehicules.model.Vehicle;
import com.locare.vehicules.repository.VehicleRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class VehicleService {

    private final VehicleRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper mapper = new ObjectMapper();
    private static final String TOPIC = "locare-vehicules";

    public VehicleService(VehicleRepository repository, KafkaTemplate<String, String> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    public List<Vehicle> getAllVehicles() {
        return repository.findAll();
    }

    public Optional<Vehicle> getVehicle(Long id) {
        return repository.findById(id);
    }

    public Vehicle createVehicle(Vehicle vehicle) {
        Vehicle saved = repository.save(vehicle);
        sendEvent("VEHICLE_CREATED", saved);
        return saved;
    }

    public Vehicle updateVehicle(Long id, Vehicle vehicleDetails) {
        return repository.findById(id).map(vehicle -> {
            vehicle.setMarque(vehicleDetails.getMarque());
            vehicle.setModele(vehicleDetails.getModele());
            vehicle.setImmatriculation(vehicleDetails.getImmatriculation());
            vehicle.setStatut(vehicleDetails.getStatut());
            
            // Check if driver changed
            boolean driverChanged = (vehicle.getDriverId() == null && vehicleDetails.getDriverId() != null) ||
                                    (vehicle.getDriverId() != null && !vehicle.getDriverId().equals(vehicleDetails.getDriverId()));
            
            vehicle.setDriverId(vehicleDetails.getDriverId());
            Vehicle updated = repository.save(vehicle);
            
            sendEvent("VEHICLE_UPDATED", updated);
            if (driverChanged) {
                sendEvent("DRIVER_ASSIGNED", updated);
            }
            
            return updated;
        }).orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }

    public void deleteVehicle(Long id) {
        repository.findById(id).ifPresent(vehicle -> {
            repository.delete(vehicle);
            sendEvent("VEHICLE_DELETED", vehicle);
        });
    }

    private void sendEvent(String eventType, Vehicle vehicle) {
        try {
            ObjectNode node = mapper.createObjectNode();
            node.put("eventType", eventType);
            node.put("vehicleId", vehicle.getId());
            if (vehicle.getDriverId() != null) {
                node.put("driverId", vehicle.getDriverId());
            } else {
                node.putNull("driverId");
            }
            node.put("timestamp", Instant.now().toString());
            
            kafkaTemplate.send(TOPIC, String.valueOf(vehicle.getId()), node.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

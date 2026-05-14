package com.locare.vehicules.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locare.vehicules.model.Vehicle;
import com.locare.vehicules.repository.VehicleRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class MaintenanceEventListener {

    private final VehicleRepository repository;
    private final ObjectMapper mapper = new ObjectMapper();

    public MaintenanceEventListener(VehicleRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "maintenance-events", groupId = "vehicules-group")
    public void handleMaintenanceEvent(String message) {
        try {
            JsonNode event = mapper.readTree(message);
            String eventType = event.get("eventType").asText();
            Long vehicleId = event.get("vehicleId").asLong();

            repository.findById(vehicleId).ifPresent(vehicle -> {
                if ("MAINTENANCE_STARTED".equals(eventType)) {
                    vehicle.setStatut("MAINTENANCE");
                    System.out.println("🚗 Vehicle " + vehicleId + " status updated to MAINTENANCE");
                } else if ("MAINTENANCE_FINISHED".equals(eventType)) {
                    vehicle.setStatut("AVAILABLE");
                    System.out.println("🚗 Vehicle " + vehicleId + " status updated to AVAILABLE");
                }
                repository.save(vehicle);
            });
        } catch (Exception e) {
            System.err.println("❌ Error processing maintenance event: " + e.getMessage());
        }
    }
}

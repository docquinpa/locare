package com.locare.maintenance.service;

import com.locare.maintenance.model.Maintenance;
import com.locare.maintenance.repository.MaintenanceRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceService {

    private final MaintenanceRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public MaintenanceService(MaintenanceRepository repository, KafkaTemplate<String, String> kafkaTemplate, MeterRegistry registry) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;

        // Register custom gauge for vehicles in revision
        Gauge.builder("locare_maintenance_vehicles_in_revision", this, 
            service -> service.repository.countByStatus("EN_COURS"))
            .description("Nombre de véhicules actuellement en maintenance")
            .register(registry);
    }

    public List<Maintenance> getAllMaintenances() {
        return repository.findAll();
    }

    public List<Maintenance> getMaintenancesByVehicle(Long vehicleId) {
        return repository.findByVehicleId(vehicleId);
    }

    public Maintenance createMaintenance(Maintenance maintenance) {
        maintenance.setStatus("EN_COURS");
        Maintenance saved = repository.save(maintenance);
        sendEvent("MAINTENANCE_STARTED", saved);
        return saved;
    }

    public Optional<Maintenance> closeMaintenance(Long id) {
        return repository.findById(id).map(m -> {
            m.setStatus("TERMINE");
            Maintenance updated = repository.save(m);
            sendEvent("MAINTENANCE_FINISHED", updated);
            return updated;
        });
    }

    private void sendEvent(String eventType, Maintenance maintenance) {
        String payload = String.format("{\"eventType\":\"%s\", \"maintenanceId\":%d, \"vehicleId\":%d, \"status\":\"%s\"}",
                eventType, maintenance.getId(), maintenance.getVehicleId(), maintenance.getStatus());
        kafkaTemplate.send("maintenance-events", payload);
    }
}

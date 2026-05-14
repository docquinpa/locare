package com.locare.vehicules.service;

import com.locare.vehicules.model.Vehicle;
import com.locare.vehicules.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VehicleServiceTest {

    @Mock
    private VehicleRepository repository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private VehicleService vehicleService;

    @Test
    void testCreateVehicle() {
        Vehicle v = new Vehicle();
        v.setMarque("Renault");
        v.setModele("Zoe");

        when(repository.save(any(Vehicle.class))).thenReturn(v);

        Vehicle created = vehicleService.createVehicle(v);

        assertNotNull(created);
        assertEquals("Renault", created.getMarque());
        verify(repository, times(1)).save(v);
        // Verify kafka was called
        verify(kafkaTemplate, times(1)).send(anyString(), anyString(), anyString());
    }

    @Test
    void testUpdateVehicleStatus() {
        Vehicle v = new Vehicle();
        v.setId(1L);
        v.setStatut("AVAILABLE");

        when(repository.findById(1L)).thenReturn(Optional.of(v));
        when(repository.save(any(Vehicle.class))).thenReturn(v);

        Vehicle updated = vehicleService.updateVehicle(1L, v);

        assertEquals("AVAILABLE", updated.getStatut());
        verify(repository, times(1)).save(any(Vehicle.class));
    }
}

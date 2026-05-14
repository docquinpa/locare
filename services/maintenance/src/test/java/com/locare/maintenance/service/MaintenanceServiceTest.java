package com.locare.maintenance.service;

import com.locare.maintenance.model.Maintenance;
import com.locare.maintenance.repository.MaintenanceRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MaintenanceServiceTest {

    @Mock
    private MaintenanceRepository repository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @Mock
    private MeterRegistry meterRegistry;

    private MaintenanceService maintenanceService;

    @BeforeEach
    void setUp() {
        // Fix ambiguous gauge mock
        maintenanceService = new MaintenanceService(repository, kafkaTemplate, meterRegistry);
    }

    @Test
    void testCreateMaintenance() {
        Maintenance m = new Maintenance();
        m.setVehicleId(1L);
        m.setType("REVISION");

        when(repository.save(any(Maintenance.class))).thenReturn(m);

        Maintenance created = maintenanceService.createMaintenance(m);

        assertEquals("EN_COURS", created.getStatus());
        verify(repository, times(1)).save(m);
        verify(kafkaTemplate, times(1)).send(eq("maintenance-events"), anyString());
    }
}

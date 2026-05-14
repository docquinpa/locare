// Basic logic test for Alertes service
const processEvent = (event) => {
    const vid = event.vehicleId || event.id;
    if (!vid) return null;
    return vid;
};

test('should extract vehicleId from event', () => {
    const event = { eventType: 'VEHICLE_CREATED', vehicleId: 123 };
    expect(processEvent(event)).toBe(123);
});

test('should extract id if vehicleId is missing', () => {
    const event = { eventType: 'OLD_EVENT', id: 456 };
    expect(processEvent(event)).toBe(456);
});

test('should return null if no id found', () => {
    const event = { eventType: 'BROKEN' };
    expect(processEvent(event)).toBeNull();
});

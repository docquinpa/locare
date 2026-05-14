const express = require('express');
const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

const app = express();
const port = 8083;

// PostgreSQL setup
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'alertes_db'
});

// Initialize DB
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            vehicle_id BIGINT,
            type VARCHAR(255),
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("📦 Alertes DB initialized.");
}
initDB().catch(console.error);

// Kafka setup
const kafka = new Kafka({
    clientId: 'alertes-service',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'alertes-group' });

async function startKafka() {
    await consumer.connect();
    await consumer.subscribe({ topics: ['locare-vehicules', 'maintenance-events'], fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const event = JSON.parse(message.value.toString());
            console.log(`📥 Event received on topic ${topic}:`, event);

            let alertType = '';
            let alertMsg = '';

            if (topic === 'locare-vehicules' && event.eventType === 'VEHICLE_CREATED') {
                alertType = 'INFO';
                alertMsg = `Nouveau véhicule créé : ${event.vehicleId}. Pensez à planifier une maintenance initiale.`;
            } else if (topic === 'maintenance-events') {
                if (event.eventType === 'MAINTENANCE_STARTED') {
                    alertType = 'MAINTENANCE';
                    alertMsg = `Maintenance démarrée pour le véhicule ${event.vehicleId}.`;
                } else if (event.eventType === 'MAINTENANCE_FINISHED') {
                    alertType = 'MAINTENANCE';
                    alertMsg = `Maintenance terminée pour le véhicule ${event.vehicleId}.`;
                }
            }

            if (alertType) {
                const vid = event.vehicleId || event.id;
                if (!vid) {
                    console.error("❌ Alert ignored: No vehicleId found in event", event);
                    return;
                }
                await pool.query(
                    'INSERT INTO alerts (vehicle_id, type, message) VALUES ($1, $2, $3)',
                    [vid, alertType, alertMsg]
                );
            }
        }
    });
}
startKafka().catch(console.error);

// REST API
app.get('/api/alertes', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50');
    res.json(rows);
});

app.get('/api/alertes/vehicle/:vehicleId', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM alerts WHERE vehicle_id = $1 ORDER BY timestamp DESC', [req.params.vehicleId]);
    res.json(rows);
});

app.listen(port, () => {
    console.log(`🚀 Alertes service running on port ${port}`);
});

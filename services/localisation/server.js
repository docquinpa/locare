const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');
const path = require('path');

// ----------------------
// 1. Chargement du proto
// ----------------------
const PROTO_PATH = path.join(__dirname, 'location.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

// ----------------------
// 2. Connexion TimescaleDB
// ----------------------
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'timescaledb',
    database: process.env.DB_NAME || 'localisation',
    password: process.env.DB_PASSWORD || 'timescale_password',
    port: process.env.DB_PORT || 5432,
});

// ----------------------
// 3. Initialisation DB
// ----------------------
async function initDB() {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS vehicles (
            id BIGINT PRIMARY KEY
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS vehicle_locations (
            time TIMESTAMPTZ NOT NULL,
            vehicle_id BIGINT NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL
        );
    `);

    await pool.query(`
        SELECT create_hypertable('vehicle_locations', 'time', if_not_exists => TRUE);
    `);

    console.log("📦 Base TimescaleDB initialisée.");
}
initDB().catch(console.error);

// ----------------------
// 4. Kafka Consumer
// ----------------------
const kafka = new Kafka({
    clientId: "localisation-service",
    brokers: ["kafka:9092"]
});

const consumer = kafka.consumer({ groupId: "localisation-group" });

async function startKafka() {
    await consumer.connect();
    await consumer.subscribe({ topic: "locare-vehicules", fromBeginning: false });

    console.log("📡 Kafka connecté, écoute des événements véhicules…");

    await consumer.run({
        eachMessage: async ({ message }) => {
            const event = JSON.parse(message.value.toString());
            console.log("📥 Event reçu:", event);

            if (event.eventType === "VEHICLE_CREATED") {
                await pool.query(
                    `INSERT INTO vehicles (id) VALUES ($1)
                     ON CONFLICT (id) DO NOTHING`,
                    [event.vehicleId]
                );
                console.log(`🚗 Nouveau véhicule ajouté : ${event.vehicleId}`);
            }

            if (event.eventType === "VEHICLE_DELETED") {
                await pool.query(
                    `DELETE FROM vehicles WHERE id = $1`,
                    [event.vehicleId]
                );
                console.log(`🗑️ Véhicule supprimé : ${event.vehicleId}`);
            }
        }
    });
}
startKafka();

// ----------------------
// 5. gRPC : StreamLocation
// ----------------------
function streamLocation(call, callback) {
    let count = 0;

    call.on('data', async (location) => {
        try {
            await pool.query(
                `INSERT INTO vehicle_locations (time, vehicle_id, latitude, longitude)
                 VALUES ($1, $2, $3, $4)`,
                [
                    location.timestamp || new Date().toISOString(),
                    location.vehicleId,
                    location.latitude,
                    location.longitude
                ]
            );
            count++;
            console.log(`📍 Position reçue pour véhicule ${location.vehicleId}`);
        } catch (err) {
            console.error("❌ Erreur insertion position:", err);
        }
    });

    call.on('end', () => {
        callback(null, { success: true, message: `Received ${count} locations` });
    });
}

// ----------------------
// 6. gRPC : ListVehicles
// ----------------------
async function listVehicles(call, callback) {
    console.log("🔍 gRPC ListVehicles appelé");
    try {
        const res = await pool.query(`
            SELECT v.id,
                   COALESCE(l.latitude, 0) AS latitude,
                   COALESCE(l.longitude, 0) AS longitude
            FROM vehicles v
            LEFT JOIN LATERAL (
                SELECT latitude, longitude
                FROM vehicle_locations
                WHERE vehicle_id = v.id
                ORDER BY time DESC
                LIMIT 1
            ) l ON true;
        `);

        const vehicles = res.rows.map(row => ({
            id: row.id,
            latitude: row.latitude,
            longitude: row.longitude
        }));

        callback(null, { vehicles });
    } catch (err) {
        console.error("❌ Erreur ListVehicles:", err);
        callback(err, null);
    }
}

// ----------------------
// 7. gRPC : Historique
// ----------------------
async function getVehicleLocationHistory(call, callback) {
    const vehicleId = call.request.id;

    try {
        const res = await pool.query(
            `SELECT * FROM vehicle_locations
             WHERE vehicle_id = $1
             ORDER BY time DESC
             LIMIT 100`,
            [vehicleId]
        );

        const locations = res.rows.map(row => ({
            vehicleId: row.vehicle_id,
            latitude: row.latitude,
            longitude: row.longitude,
            timestamp: row.time.toISOString()
        }));

        callback(null, { locations });
    } catch (err) {
        callback(err, null);
    }
}

// ----------------------
// 8. Serveur gRPC
// ----------------------
function main() {
    const server = new grpc.Server();

    server.addService(locationProto.LocationService.service, {
        streamLocation,
        listVehicles,
        getVehicleLocationHistory
    });

    const port = process.env.PORT || 50051;

    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
        console.log(`🚀 Localisation gRPC server running on port ${port}`);
    });
}

main();

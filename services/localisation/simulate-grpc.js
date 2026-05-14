const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'location.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

// Client gRPC
const client = new locationProto.LocationService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// Stream pour envoyer les positions
const stream = client.StreamLocation((error, response) => {
    if (error) {
        console.error("Stream error:", error);
    } else {
        console.log("Server response:", response);
    }
});

// Liste dynamique des véhicules
const vehicles = {};

console.log("🚗 Starting dynamic gRPC Simulation. Press Ctrl+C to stop.");


// 🔥 Récupère les véhicules depuis le serveur
function refreshVehicles() {
    client.ListVehicles({}, (err, response) => {
        if (err) {
            console.error("❌ Erreur ListVehicles:", err);
            return;
        }

        for (const v of response.vehicles) {
            if (!vehicles[v.id]) {
                console.log(`🆕 Nouveau véhicule détecté : ${v.id}`);
                vehicles[v.id] = {
                    lat: v.latitude,
                    lng: v.longitude
                };
            }
        }
    });
}


// 🔄 Boucle principale : mise à jour + envoi
setInterval(() => {
    refreshVehicles(); // récupère les nouveaux véhicules

    for (const [id, pos] of Object.entries(vehicles)) {
        // Mouvement aléatoire léger
        pos.lat += (Math.random() - 0.5) * 0.1;
        pos.lng += (Math.random() - 0.5) * 0.1;

        const location = {
            vehicleId: parseInt(id),
            latitude: pos.lat,
            longitude: pos.lng,
            timestamp: new Date().toISOString()
        };

        console.log(`🚚 [Vehicule ${id}] -> Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`);
        stream.write(location);
    }
}, 3000);

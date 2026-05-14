const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fetch = require('node-fetch');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'http://keycloak:8080/realms/locare/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      console.error("JWKS Error:", err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Load Schema
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

// Environment variables
const VEHICLES_SERVICE_URL = process.env.VEHICLES_SERVICE_URL || 'http://localhost:8080/api/vehicules';
const DRIVERS_SERVICE_URL = process.env.DRIVERS_SERVICE_URL || 'http://localhost:8081/api/conducteurs';
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'localhost:50051';

// gRPC Client setup
const PROTO_PATH = path.join(__dirname, 'location.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const locationProto = grpc.loadPackageDefinition(packageDefinition).location;
const locationClient = new locationProto.LocationService(
    LOCATION_SERVICE_URL,
    grpc.credentials.createInsecure()
);

const resolvers = {
    Query: {
        vehicles: async () => {
            const res = await fetch(VEHICLES_SERVICE_URL);
            return res.json();
        },
        vehicle: async (_, { id }) => {
            const res = await fetch(`${VEHICLES_SERVICE_URL}/${id}`);
            return res.json();
        },
        drivers: async () => {
            const res = await fetch(DRIVERS_SERVICE_URL);
            return res.json();
        },
        driver: async (_, { id }) => {
            const res = await fetch(`${DRIVERS_SERVICE_URL}/${id}`);
            return res.json();
        },
        vehicleLocationHistory: async (_, { vehicleId }) => {
            return new Promise((resolve, reject) => {
                locationClient.GetVehicleLocationHistory({ id: vehicleId }, (err, response) => {
                    if (err) return reject(err);
                    resolve(response.locations);
                });
            });
        }
    },
    Mutation: {
        createVehicle: async (_, { input }) => {
            const res = await fetch(VEHICLES_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return res.json();
        },
        createDriver: async (_, { input }) => {
            const res = await fetch(DRIVERS_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return res.json();
        },
        assignDriver: async (_, { vehicleId, driverId }) => {
            // Get current vehicle
            const vRes = await fetch(`${VEHICLES_SERVICE_URL}/${vehicleId}`);
            if (!vRes.ok) throw new Error("Vehicle not found");
            const vehicle = await vRes.json();
            
            // Update vehicle with driverId
            vehicle.driverId = driverId;
            const updateRes = await fetch(`${VEHICLES_SERVICE_URL}/${vehicleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicle)
            });
            return updateRes.json();
        }
    }
};

async function startServer() {
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 },
        context: async ({ req }) => {
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) {
                throw new Error('Not authenticated: No Bearer token provided');
            }
            const token = authHeader.split(' ')[1];
            return new Promise((resolve, reject) => {
                jwt.verify(token, getKey, {}, (err, decoded) => {
                    if (err) {
                        console.error("Token verification failed:", err.message);
                        return reject(new Error('Not authenticated: Invalid token'));
                    }
                    resolve({ user: decoded });
                });
            });
        }
    });
    console.log(`🚀 Gateway ready at ${url}`);
}

startServer().catch(console.error);

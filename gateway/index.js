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
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

const VEHICLES_SERVICE_URL = process.env.VEHICLES_SERVICE_URL || 'http://vehicules:8080/api/vehicules';
const DRIVERS_SERVICE_URL = process.env.DRIVERS_SERVICE_URL || 'http://conducteurs:8081/api/conducteurs';
const LOCATION_SERVICE_URL = process.env.LOCATION_SERVICE_URL || 'localisation:50051';
const MAINTENANCE_SERVICE_URL = process.env.MAINTENANCE_SERVICE_URL || 'http://maintenance:8082/api/maintenance';
const ALERTES_SERVICE_URL = process.env.ALERTES_SERVICE_URL || 'http://alertes:8083/api/alertes';

const PROTO_PATH = path.join(__dirname, 'location.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const locationProto = grpc.loadPackageDefinition(packageDefinition).location;
const locationClient = new locationProto.LocationService(
    LOCATION_SERVICE_URL,
    grpc.credentials.createInsecure()
);

const checkRole = (user, role) => {
    if (!user || !user.realm_access || !user.realm_access.roles) {
        console.log(`Role check FAILED for ${role}: No user or roles in token`);
        return false;
    }
    const hasRole = user.realm_access.roles.includes(role);
    console.log(`Role check for ${role}: ${hasRole} (User roles: ${user.realm_access.roles.join(',')})`);
    return hasRole;
};

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
        },
        maintenance: async (_, { vehicleId }) => {
            const res = await fetch(`${MAINTENANCE_SERVICE_URL}/vehicle/${vehicleId}`);
            return res.json();
        },
        alertes: async (_, { vehicleId }) => {
            const url = vehicleId ? `${ALERTES_SERVICE_URL}/vehicle/${vehicleId}` : ALERTES_SERVICE_URL;
            const res = await fetch(url);
            return res.json();
        }
    },
    Mutation: {
        createVehicle: async (_, { input }, { user }) => {
            if (!checkRole(user, 'admin')) throw new Error('Forbidden: Admin role required');
            const res = await fetch(VEHICLES_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return res.json();
        },
        createDriver: async (_, { input }, { user }) => {
            if (!checkRole(user, 'admin')) throw new Error('Forbidden: Admin role required');
            const res = await fetch(DRIVERS_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return res.json();
        },
        assignDriver: async (_, { vehicleId, driverId }, { user }) => {
            if (!checkRole(user, 'admin')) throw new Error('Forbidden: Admin role required');
            const vRes = await fetch(`${VEHICLES_SERVICE_URL}/${vehicleId}`);
            if (!vRes.ok) throw new Error("Vehicle not found");
            const vehicle = await vRes.json();
            vehicle.driverId = driverId;
            const updateRes = await fetch(`${VEHICLES_SERVICE_URL}/${vehicleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicle)
            });
            return updateRes.json();
        },
        createMaintenance: async (_, { input }, { user }) => {
            if (!checkRole(user, 'admin') && !checkRole(user, 'ingenieur')) {
                throw new Error('Forbidden: Admin or Ingenieur role required');
            }
            const res = await fetch(MAINTENANCE_SERVICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            });
            return res.json();
        },
        closeMaintenance: async (_, { id }, { user }) => {
            if (!checkRole(user, 'admin') && !checkRole(user, 'ingenieur')) {
                throw new Error('Forbidden: Admin or Ingenieur role required');
            }
            const res = await fetch(`${MAINTENANCE_SERVICE_URL}/${id}/close`, {
                method: 'PUT'
            });
            return res.json();
        }
    }
};

async function startServer() {
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 },
        context: async ({ req }) => {
            const authHeader = req.headers.authorization || '';
            if (!authHeader.startsWith('Bearer ')) return { user: null };
            
            const token = authHeader.split(' ')[1];
            try {
                const decoded = await new Promise((resolve, reject) => {
                    jwt.verify(token, getKey, {}, (err, decoded) => {
                        if (err) reject(err);
                        else resolve(decoded);
                    });
                });
                return { user: decoded };
            } catch (err) {
                return { user: null };
            }
        }
    });
    console.log(`🚀 Gateway ready at ${url}`);
}

startServer().catch(console.error);

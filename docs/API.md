# Documentation API Locare

La plateforme expose principalement ses fonctionnalités via la Gateway GraphQL, mais certains services possèdent des endpoints REST pour le monitoring.

## GraphQL Gateway (Port 4000 / `gateway.locare.local`)

### Queries (Lecture)
- `vehicles`: Liste tous les véhicules.
- `drivers`: Liste tous les conducteurs.
- `alertes(vehicleId: ID)`: Récupère les alertes (globales ou pour un véhicule).
- `maintenance(vehicleId: ID)`: Historique des maintenances d'un véhicule.

### Mutations (Écriture)
| Mutation | Role requis | Description |
| :--- | :--- | :--- |
| `createVehicle(input: VehicleInput!)` | `admin` | Ajout d'un nouveau véhicule. |
| `createDriver(input: DriverInput!)` | `admin` | Enregistre un conducteur. |
| `assignDriver(vehicleId: ID!, driverId: ID!)` | `admin` | Affecte un pilote à un véhicule. |
| `createMaintenance(input: MaintInput!)` | `admin`, `ingenieur` | Démarre une intervention technique. |

## Microservices REST (Endpoints internes)

### Service Maintenance (Port 8082)
- `GET /api/maintenance`: Toutes les interventions.
- `GET /actuator/prometheus`: Métriques pour Grafana.

### Service Alertes (Port 8083)
- `GET /api/alertes`: Liste des notifications récentes.

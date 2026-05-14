# TODO — Projet Antigravity (Architecture microservices + Helm + Kafka + OTel)

Objectif : générer un projet minimal, cohérent et directement déployable via Helm.
Pas d’étapes intermédiaires, pas de fichiers inutiles. Chaque service doit être simple,
fonctionnel, instrumenté OpenTelemetry, et packagé pour Kubernetes.

---

# 1. Structure du monorepo

Créer la structure suivante :

/services
  /vehicules
  /conducteurs
  /localisation
/gateway
/infra
  /helm
  /keycloak
  /otel
  /kafka
README.md
TODO.md

Copilot doit vérifier que chaque dossier contient uniquement les fichiers nécessaires.

---

# 2. Service Véhicules (Java — Spring Boot)

Objectif : service REST principal + producteur Kafka.

Tâches :
- Générer un service Spring Boot minimal :
  - CRUD véhicules (id, marque, modèle, immatriculation, statut, driverId)
  - Repository JPA + PostgreSQL
  - Controller REST
  - Service métier
- Ajouter un **producer Kafka** :
  - topic : "vehicules"
  - événements JSON simples (eventType, vehicleId, driverId, timestamp)
- Ajouter auto-instrumentation OpenTelemetry (agent Java)
- Générer Dockerfile compatible OTel
- Générer application.yaml minimal
- Ajouter tests unitaires simples

---

# 3. Service Conducteurs (Java — Spring Boot)

Objectif : service REST + consommateur Kafka.

Tâches :
- Générer un service Spring Boot minimal :
  - CRUD conducteurs (id, nom, permis, expiration, assignedVehicleId)
  - Repository JPA + PostgreSQL
  - Controller REST
- Ajouter un **consumer Kafka** :
  - écoute du topic "vehicules"
  - mise à jour du champ assignedVehicleId si eventType = DRIVER_ASSIGNED
- Ajouter auto-instrumentation OpenTelemetry
- Générer Dockerfile
- Générer application.yaml minimal
- Ajouter tests unitaires simples

---

# 4. Service Localisation (Node.js — gRPC)

Objectif : streaming GPS + stockage TimescaleDB.

Tâches :
- Générer un service gRPC minimal :
  - fichier proto : StreamLocation(stream Location) returns (Ack)
  - serveur gRPC
  - simulation de positions GPS aléatoires
  - stockage dans TimescaleDB
- Ajouter instrumentation OpenTelemetry (Node.js SDK)
- Générer Dockerfile minimal
- Ajouter README clair

---

# 5. API Gateway GraphQL (Node.js)

Objectif : exposer une API unifiée.

Tâches :
- Générer une gateway GraphQL minimaliste :
  - Query vehicles
  - Query drivers
  - Query vehicleLocationHistory(vehicleId)
- Résolveurs :
  - REST → Véhicules
  - REST → Conducteurs
  - gRPC → Localisation
- Ajouter instrumentation OpenTelemetry
- Générer Dockerfile

---

# 6. Kafka (minimal)

Objectif : un seul topic, un seul broker, zéro complexité.

Tâches :
- Déployer Kafka en mode KRaft (sans Zookeeper)
- Créer un topic unique : "vehicules"
- Générer manifest Helm minimal :
  - Deployment
  - Service
  - ConfigMap (si nécessaire)
- Vérifier compatibilité avec producer/consumer Java

---

# 7. OpenTelemetry Collector (complet)

Objectif : traces + métriques + logs.

Tâches :
- Générer configuration complète :
  - receiver OTLP
  - exporters : Jaeger, Prometheus, Loki
  - pipelines traces / metrics / logs
- Générer Deployment + Service Helm
- Vérifier que tous les services envoient bien leurs données

---

# 8. Keycloak (minimal)

Objectif : authentification simple.

Tâches :
- Générer un realm minimal :
  - 1 client (gateway)
  - 2 rôles (admin, user)
- Export JSON du realm
- Ajouter instructions d’import automatique
- Ajouter Deployment Helm minimal

---

# 9. Helm Chart global

Objectif : déploiement complet en un seul `helm install`.

Tâches :
- Générer un chart Helm global :
  - Deployments pour :
    - vehicules
    - conducteurs
    - localisation
    - gateway
    - kafka
    - otel-collector
    - keycloak
  - StatefulSet PostgreSQL + TimescaleDB
  - Services
  - Ingress (Traefik)
  - ConfigMaps
  - Secrets
- Générer values.yaml propre et minimal
- Vérifier cohérence des ports, URLs, variables d’environnement

---

# 10. Documentation

Objectif : présentation claire et professionnelle.

Tâches :
- Générer README principal :
  - architecture
  - services
  - schémas
  - déploiement Helm
  - observabilité
- Générer ADRs pour les choix techniques :
  - Java pour REST
  - gRPC pour Localisation
  - Kafka minimal
  - Helm global
  - OpenTelemetry complet
- Générer OpenAPI pour les services REST

---

# 11. Vérifications finales

Objectif : projet stable, déployable, démontrable.

Tâches :
- Vérifier que chaque service démarre correctement
- Vérifier que Kafka reçoit et diffuse les événements
- Vérifier que la gateway GraphQL interroge correctement les services
- Vérifier que les traces, métriques et logs remontent dans OTel
- Vérifier que Helm déploie tout en un seul run

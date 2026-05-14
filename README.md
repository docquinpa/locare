# 🚗 Locare Fleet Management

Locare est une plateforme moderne de gestion de flotte automobile basée sur une architecture **microservices**, exploitant des technologies de pointe pour le streaming de données, la persistance temporelle et l'observabilité totale.

## 🏗️ Architecture & Stack Technique

- **Frontend** : Application React (Vite) avec cartographie temps réel (Leaflet).
- **API Gateway** : Passerelle GraphQL unifiée.
- **Microservices** :
    - **Véhicules** : Spring Boot + PostgreSQL (Events Kafka). Relation 1-1 stricte avec les conducteurs.
    - **Conducteurs** : Spring Boot + PostgreSQL (Consommateur Kafka).
    - **Localisation** : Node.js + TimescaleDB (Ingestion gRPC).
- **Infrastructure** :
    - **Kafka** : Messaging asynchrone (mode KRaft).
    - **Traefik** : Ingress Controller pour le routage.
    - **Keycloak** : Gestion de l'identité et sécurité OIDC.
- **Observabilité** : Full Stack OTLP (OpenTelemetry, Prometheus, Grafana, Loki, Jaeger).

## 🚀 Installation "One-Click" (Recommandé)

Le projet inclut un script d'automatisation complet pour Minikube. Assurez-vous d'avoir `minikube`, `helm` et `docker` installés.

1.  **Lancez le déploiement** :
    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```
    *Le script va démarrer Minikube, builder les images Docker localement, et déployer toute la stack Helm.*

2.  **Configurez vos DNS locaux** :
    Ajoutez la ligne suivante à votre fichier `/etc/hosts` (remplacez `<MINIKUBE_IP>` par l'IP affichée à la fin du script) :
    ```text
    <MINIKUBE_IP>  frontend.locare.local gateway.locare.local keycloak.locare.local jaeger.locare.local prometheus.locare.local grafana.locare.local loki.locare.local vehicules.locare.local conducteurs.locare.local
    ```

## 🌐 Accès aux Services

> [!IMPORTANT]
> Toutes les adresses doivent être accédées en **HTTPS**. 
> Si vous n'utilisez pas `minikube tunnel`, vous devez impérativement ajouter le port **websecure** de Traefik (ex: `:31652`) à la fin de chaque URL.

| Service | URL | Note |
| :--- | :--- | :--- |
| **🌍 Frontend** | [https://frontend.locare.local:PORT](https://frontend.locare.local:PORT) | Interface utilisateur |
| **🔐 Keycloak** | [https://keycloak.locare.local:PORT](https://keycloak.locare.local:PORT) | IAM (OIDC) |
| **📈 Grafana** | [https://grafana.locare.local:PORT](https://grafana.locare.local:PORT) | Dashboards |
| **🔍 Jaeger** | [https://jaeger.locare.local:PORT](https://jaeger.locare.local:PORT) | Tracing |

## 📊 Observabilité

Le projet est entièrement instrumenté. Pour visualiser les performances :
- Allez sur **Grafana** et consultez les dashboards pré-configurés (Kubernetes / JVM).
- Utilisez **Jaeger** pour voir le cheminement exact d'une requête GraphQL à travers les microservices.
- Les logs centralisés sont disponibles via **Loki** directement dans Grafana.

## 🛠️ Simulation de données
Pour simuler des mouvements de véhicules en temps réel via gRPC :
```bash
cd services/localisation
npm install
kubectl port-forward svc/localisation 50051:50051
node simulate-grpc.js
```

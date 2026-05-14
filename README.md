# Locare - Fleet Management Platform

Locare est une plateforme de gestion de flotte de véhicules moderne, basée sur une architecture microservices distribuée, sécurisée et hautement observable.


## Points Forts
- **Architecture Réactive** : Backbone Kafka pour une communication asynchrone ultra-rapide.
- **Sécurité Enterprise** : Authentification OIDC avec Keycloak et contrôle d'accès RBAC.
- **Full Stack Moderne** : React, Spring Boot, Node.js, GraphQL, gRPC.
- **Observabilité Native** : OpenTelemetry, Prometheus, Grafana, Jaeger.

## Documentation
- [Contexte & Philosophie du Projet](./PROJECT_CONTEXT.md)
- [Guide d'Installation & Setup](./docs/INSTALL.md)
- [Manuel Utilisateur](./docs/USER_GUIDE.md)
- [Documentation API](./docs/API.md)
- [Architecture Technique](./docs/ARCHITECTURE.md)
- [Architectural Decision Records (ADR)](./docs/ADR.md)

## Lancement Rapide

1. **Pré-requis** : Minikube, Docker, Helm, Kubectl.
2. **Setup automatique** :
   ```bash
   ./setup.sh
   ```
3. **Configuration Hosts** :
   Ajoutez à votre `/etc/hosts` l'IP de minikube pour les domaines : `frontend.locare.local`, `gateway.locare.local`, `grafana.locare.local`, `maintenance.locare.local`, `alertes.locare.local`.

## Utilisateurs de Test
- **Admin** : `admin` / `admin` (Tout pouvoir)
- **Ingénieur** : `engineer` / `engineer` (Maintenance & Flotte)
- **Utilisateur** : `user` / `user` (Lecture seule)

## CI/CD
Le projet inclut un workflow GitHub Actions qui valide le build de toutes les images Docker à chaque modification pour garantir la stabilité de la chaîne de production.

---
*Projet réalisé dans le cadre du module Architecture Distribuée.*

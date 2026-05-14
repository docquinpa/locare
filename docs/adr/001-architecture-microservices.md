# ADR 001 : Architecture Microservices

## Contexte
Nous devons concevoir un système de gestion de flotte automobile évolutif et maintenable.

## Décision
Adoption d'une architecture orientée microservices. Chaque domaine (Véhicules, Conducteurs, Localisation) est encapsulé dans son propre service et sa propre base de données.
Les services communiquent de manière asynchrone (Kafka) pour éviter le couplage fort et les requêtes synchrones bloquantes entre domaines, et de manière synchrone (REST/gRPC) via la Gateway.

## Conséquences
- Déploiements indépendants.
- Complexité opérationnelle accrue (mitigée par l'utilisation de Helm et Kubernetes).
- Nécessité d'une Gateway (GraphQL) pour unifier l'accès côté client.

# ADR 002 : Choix de Java et Spring Boot pour les services CRUD

## Contexte
Les services Véhicules et Conducteurs sont principalement orientés CRUD avec des règles métier liées.

## Décision
Utilisation de Java 21 avec Spring Boot 3.

## Conséquences
- Robustesse et écosystème mature.
- Bonne intégration avec Kafka (Spring Kafka) et JPA/Hibernate.
- Instrumentation OTel simplifiée via l'agent Java.

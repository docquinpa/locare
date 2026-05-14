# Architectural Decision Records (ADR) - Locare

Ce document récapitule les choix technologiques majeurs effectués pour la plateforme Locare.

---

## ADR 001: Architecture orientée événements avec Kafka
**État :** Accepté

### Contexte
L'application doit gérer des mises à jour en temps réel (localisation, statut de maintenance) entre plusieurs microservices. Une communication purement REST (synchrone) créerait un couplage fort et des risques de cascades de pannes.

### Décision
Nous utilisons **Apache Kafka** comme colonne vertébrale pour la communication asynchrone entre les services `Vehicules`, `Maintenance` et `Alertes`.

### Conséquences
- **Avantages** : Découplage total, extensibilité facile, résilience (les messages sont persistés).
- **Inconvénients** : Complexité opérationnelle accrue, cohérence à terme (eventual consistency).

---

## ADR 002: Gateway GraphQL et Sécurité Centralisée
**État :** Accepté

### Contexte
Le frontend ne doit pas avoir à connaître les URLs de chaque microservice. La vérification des droits (RBAC) doit être centralisée pour éviter les incohérences.

### Décision
Utilisation d'une **Gateway GraphQL (Apollo)** comme point d'entrée unique. Elle valide les jetons **Keycloak (JWT)** et gère les rôles (`admin`, `ingenieur`).

### Conséquences
- **Avantages** : Un seul endpoint, sécurité unifiée, agrégation de données simplifiée pour le Front.
- **Inconvénients** : Surcharge légère lors de la validation des jetons.

---

## ADR 003: Observabilité Full-Stack
**État :** Accepté

### Contexte
Dans une architecture distribuée, il est difficile de comprendre où une erreur se produit sans outils dédiés.

### Décision
Mise en place de la stack **LGP** (Loki, Grafana, Prometheus) couplée à **OpenTelemetry** pour le tracing distribué avec **Jaeger**.

### Conséquences
- **Avantages** : Visibilité totale sur les performances et les erreurs.
- **Inconvénients** : Augmentation de la consommation de ressources du cluster.

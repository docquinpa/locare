# ADR 004 : Kafka en mode KRaft

## Contexte
Nous avons besoin d'un Message Broker pour la communication asynchrone (Assignation des conducteurs).

## Décision
Utilisation de Kafka en mode KRaft (Kafka Raft), sans Zookeeper, dans une configuration minimale à un seul nœud.

## Conséquences
- Déploiement simplifié et plus léger.
- Une seule image Docker à gérer au lieu de deux.
- Suffisant pour les besoins du projet (pas de haute disponibilité requise).

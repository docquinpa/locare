# Contexte du Projet & Note d'Architecture

## Note Importante sur le Rebasage
Ce projet est le résultat d'un **rebasage complet à 0** de la solution initiale effectué en **globalement une semaine**. La version précédente était devenue une "usine à gaz" complexe, rendant le débogage et l'évolution quasi impossibles dans les délais impartis.

Cette version a été reconstruite avec un objectif unique : **la robustesse et la clarté du code.**

## Réduction de la Portée (Scope)
Pour garantir une application 100% fonctionnelle et "clé en main", certains choix de simplification ont été faits par rapport au cahier des charges initial :

1.  **Infrastructure Simplifiée** : 
    - Abandon de Podman au profit d'un environnement **Minikube/Docker** qu'on connait mieux (Docker)
2.  **Fonctionnalités Prioritaires** :
    - Focus sur la **création** et la **gestion** (Create/Read/Update). 
    - La **suppression** (Delete) n'a pas été implémentée dans le Frontend pour privilégier la stabilité des flux de données Kafka et de l'historique de maintenance.
3.  **Gestion des Identités** :
    - Utilisation de rôles Keycloak essentiels (`admin`, `ingenieur`) plutôt qu'une hiérarchie complexe, afin de garantir un RBAC (Role-Based Access Control) sans faille dans la Gateway.
4.  **Localisation** :
    - Le service de localisation a été réduit à sa forme la plus stable (gRPC) pour éviter les instabilités réseau observées dans la version précédente.

4.  **Stratégie de Tests Ciblée** :
    - Dans le cadre d'un cycle de développement extrêmement court, nous avons fait le choix stratégique de nous concentrer sur un **minimum de tests unitaires** portant uniquement sur le **chemin critique** : la logique des publishers Kafka et le traitement des identifiants dans les services de localisation et d'alerte.

## Résultat
Cette approche "Less is More" a permis d'obtenir une application :
- Entièrement **instrumentée** (OpenTelemetry).
- Facilement **débogable**.
- Déployable en **un seul clic** via `./setup.sh`.
- Dotée d'une **documentation complète** et cohérente.

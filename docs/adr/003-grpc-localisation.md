# ADR 003 : gRPC pour le Service Localisation

## Contexte
Le service de localisation doit ingérer un volume important de positions GPS envoyées de manière continue.

## Décision
Utilisation de gRPC (via Node.js) au lieu de REST.

## Conséquences
- Sérialisation binaire (Protobuf) très légère.
- Streaming bidirectionnel natif, idéal pour envoyer des positions en continu.
- Nécessite la compilation des fichiers `.proto` ou leur chargement dynamique.

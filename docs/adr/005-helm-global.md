# ADR 005 : Déploiement global via un seul Helm Chart

## Contexte
Le projet doit être facilement déployable sans étapes manuelles fastidieuses.

## Décision
Packaging de l'intégralité de l'infrastructure et des microservices dans un seul Helm Chart (`locare-chart`).

## Conséquences
- Une seule commande pour tout déployer : `helm install locare ./locare-chart`.
- Facilité pour partager les variables (noms de services, ports) via le `values.yaml` global.
- Moins flexible si l'on souhaite mettre à jour un service de manière isolée sans toucher aux autres dans un contexte de production réelle, mais parfait pour cet objectif.

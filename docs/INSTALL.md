# Guide d'Installation Locare

Ce guide détaille les étapes pour déployer l'infrastructure complète sur un cluster local (Minikube).

## 📋 Pré-requis
- **Minikube** (avec les addons `ingress`, `dashboard`, `metrics-server` recommandés).
- **Helm** v3+.
- **Docker** local configuré pour minikube (`eval $(minikube docker-env)`).
- **OpenSSL** (pour la génération éventuelle de certificats).

## Étapes de Déploiement

1.  **Préparation du cluster** :
    ```bash
    minikube start --driver=docker --cpus=4 --memory=8192
    minikube addons enable ingress
    ```

2.  **Exécution du script de setup** :
    ```bash
    ./setup.sh
    ```
    Ce script va :
    - Créer les bases de données PostgreSQL.
    - Builder les images Docker dans l'environnement Minikube.
    - Déployer le Helm Chart `locare-chart`.

3.  **Ports & Ingress** :
    Identifiez le port exposé par le service Traefik :
    ```bash
    kubectl get svc locare-traefik
    ```
    Notez le port `443:XXXXX`. Ce port `XXXXX` devra être utilisé dans vos URLs.

4.  **Certificats SSL** :
    Comme nous utilisons des certificats auto-signés via Traefik, votre navigateur affichera un avertissement. Cliquez sur **Avancé -> Accepter les risques** pour chaque domaine (`frontend`, `keycloak`, `gateway`).

## 🧹 Nettoyage
Pour supprimer toute l'installation :
```bash
helm uninstall locare
kubectl delete pvc --all
```

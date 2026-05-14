#!/bin/bash
set -e

echo "🚀 Début du déploiement 'One-Click' de Locare..."

# 1. Vérification de Minikube
if ! minikube status &> /dev/null; then
    echo "▶️ Démarrage de Minikube..."
    minikube start
else
    echo "✅ Minikube est déjà en cours d'exécution."
fi

# 2. Build des images Docker
echo "🏗️  Construction des images Docker..."
eval $(minikube docker-env)

docker build -t locare-vehicules:latest ./services/vehicules
docker build -t locare-conducteurs:latest ./services/conducteurs
docker build -t locare-localisation:v2 ./services/localisation
docker build -t locare-maintenance:latest ./services/maintenance
docker build -t locare-alertes:latest ./services/alertes
docker build -t locare-gateway:latest ./gateway
docker build -t locare-frontend:latest ./frontend

# 3. Déploiement Helm
echo "⛵ Déploiement du Chart Helm..."
helm upgrade --install locare ./infra/helm/locare-chart --wait

# 4. Installation de la Stack d'Observabilité
echo "📊 Déploiement de l'Observabilité (Prometheus, Grafana, Loki)..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts > /dev/null 2>&1
helm repo add grafana https://grafana.github.io/helm-charts > /dev/null 2>&1
helm repo update > /dev/null 2>&1

helm upgrade --install prometheus prometheus-community/prometheus \
  --set server.persistentVolume.enabled=false \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false \
  --wait &

helm upgrade --install grafana grafana/grafana \
  --set persistence.enabled=false \
  --set adminPassword="admin" \
  -f grafana-values.yaml \
  --wait &

helm upgrade --install loki grafana/loki-stack \
  --set loki.persistence.enabled=false \
  --wait &

wait

# 5. Déploiement de l'application principale
echo "🏗️ Déploiement du projet Locare (Kafka, DBs, Microservices)..."
helm upgrade --install locare ./infra/helm/locare-chart

echo ""
echo "======================================================="
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "======================================================="
MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "<MINIKUBE_IP>")
echo ""
echo "📝 ACTION REQUISE SUR LA MACHINE HÔTE :"
echo "Assurez-vous que votre fichier /etc/hosts contient bien la ligne suivante :"
echo -e "\033[1;33m$MINIKUBE_IP  frontend.locare.local gateway.locare.local keycloak.locare.local jaeger.locare.local prometheus.locare.local grafana.locare.local loki.locare.local vehicules.locare.local conducteurs.locare.local\033[0m"
echo ""
echo "🖥️  Accès aux interfaces :"
echo "🌍 Frontend : http://frontend.locare.local"
echo "🔐 Keycloak : http://keycloak.locare.local"
echo "📈 Grafana  : http://grafana.locare.local (admin/admin)"
echo "🔍 Jaeger   : http://jaeger.locare.local"
echo "======================================================="

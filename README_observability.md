# 📊 Stack Observabilité : Guide d'Installation et d'Utilisation

Ce guide explique comment installer Prometheus, Grafana et Loki dans votre cluster Minikube, et comment les utiliser pour monitorer l'application Locare.

---

## 1️⃣ Prérequis : Ajout des noms de domaine

Vous devez d'abord ajouter les noms de domaine dans le fichier `/etc/hosts` de votre machine (le PC hôte).

Ouvrez un terminal et tapez :
```bash
sudo nano /etc/hosts
```

Ajoutez cette ligne (remplacez l'IP par celle de votre Minikube si nécessaire, récupérable via `minikube ip`) :
```text
127.0.0.1  prometheus.locare.local grafana.locare.local loki.locare.local
```
*(Si vous avez déjà ajouté `frontend.locare.local`, vous pouvez simplement les ajouter à la suite sur la même ligne).*

---

## 2️⃣ Installation avec Helm

Lancez ces commandes pour ajouter les dépôts Helm officiels et installer la stack :

```bash
# 1. Ajouter les dépôts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# 2. Installer Prometheus
helm install prometheus prometheus-community/prometheus \
  --set server.persistentVolume.enabled=false \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false

# 3. Installer Grafana
helm install grafana grafana/grafana \
  --set persistence.enabled=false \
  --set adminPassword="admin"

# 4. Installer Loki (via loki-stack)
helm install loki grafana/loki-stack \
  --set loki.persistence.enabled=false
```

> **Note :** La désactivation de la persistance (`persistence.enabled=false`) est optimale pour Minikube. L'arrêt de Minikube réinitialisera les données métriques.
> Promtail est désactivé car c'est l'**OpenTelemetry Collector** qui se charge d'envoyer les logs de vos microservices directement à Loki !

---

## 3️⃣ Accéder aux Dashboards

Vos outils sont désormais exposés via Traefik (sans TLS, sur le port 80 classique du NodePort de Traefik ou via IP).
*(Note: Si Traefik est sur un port spécifique, ajoutez `:PORT` à l'URL).*

### 🔴 Prometheus
- **URL :** `http://prometheus.locare.local`
- **Pour vérifier les données :** 
  Allez dans *Status* > *Targets*. Vous devriez voir `otel-collector` dans la liste (Up), ce qui signifie que Prometheus lit bien les métriques exposées par OpenTelemetry !

### 🟠 Grafana (Votre portail central)
- **URL :** `http://grafana.locare.local`
- **Identifiants :** `admin` / `admin`

#### Configurer les sources de données dans Grafana :
1. Allez dans **Connections** (ou l'icône de rouage) > **Data sources** > **Add data source**.
2. **Pour Prometheus :**
   - Sélectionnez Prometheus.
   - URL : `http://prometheus-server.default.svc.cluster.local:80`
   - Cliquez sur *Save & Test*.
3. **Pour Loki :**
   - Sélectionnez Loki.
   - URL : `http://loki.default.svc.cluster.local:3100`
   - Cliquez sur *Save & Test*.

#### Voir les Logs Locare :
1. Dans Grafana, allez dans l'onglet **Explore** (la boussole).
2. En haut à gauche, sélectionnez `Loki`.
3. Cliquez sur *Label filters* > `job` > `otel-collector` (ou explorez par attributs de logs si configurés dans OTel).
4. Vous verrez apparaître les logs de tous vos microservices Java et Node.js remontés automatiquement !

#### Voir les Traces (Rappel) :
- Jaeger est accessible sur `http://jaeger.locare.local` pour visualiser le cheminement complet d'une requête HTTP d'un service à l'autre.

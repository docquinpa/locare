# 👤 Manuel Utilisateur - Locare Fleet

Bienvenue dans l'interface de gestion Locare. Ce guide vous explique comment réaliser les opérations courantes.

## 1. Connexion
Accédez à `https://frontend.locare.local:PORT`. Vous serez redirigé vers Keycloak.
- Utilisez `admin` / `admin` pour une gestion totale.
- Utilisez `engineer` / `engineer` pour les opérations techniques.

## 2. Gestion de la Flotte (Admin)
Dans l'onglet **Gestion** :
- **Ajouter un véhicule** : Remplissez le formulaire (Marque, Modèle, Immatriculation). Le véhicule apparaîtra instantanément sur la carte.
- **Assigner un pilote** : Sélectionnez un véhicule et un conducteur dans les listes déroulantes, puis cliquez sur "Affecter".

## 3. Maintenance Technique (Ingénieur/Admin)
Dans l'onglet **Maintenance** :
- Pour immobiliser un véhicule : Choisissez-le dans la liste, indiquez le type (Révision, Réparation) et cliquez sur **Démarrer**.
- Le véhicule passera en jaune (Maintenance) sur la carte et sera listé dans la colonne "En cours" à droite.

## 4. Surveillance (Admin)
Dans l'onglet **Alertes** :
- Consultez les notifications automatiques générées par le système (ex: rappel de maintenance après création d'un véhicule).
- Ces alertes sont issues directement du bus de données Kafka.

## 5. Monitoring Expert
Accédez à Grafana (`https://grafana.locare.local`) pour visualiser le tableau de bord des opérations et les performances des services.

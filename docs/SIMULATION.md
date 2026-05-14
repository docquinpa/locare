# Guide de Simulation des Données Locare

La plateforme inclut un simulateur pour générer des données de localisation en temps réel sans nécessiter de matériel physique (boîtiers GPS).

## 1. Prérequis
- **Node.js** installé localement (v16+ recommandé).
- Les dépendances installées (`npm install` dans le dossier `services/localisation`).

## 2. Fonctionnement du Simulateur
Le script de simulation (`services/localisation/simulate-grpc.js`) utilise le protocole gRPC pour envoyer des flux de coordonnées (latitude/longitude) au service de localisation. Ces données sont ensuite stockées dans TimescaleDB pour l'historique et exposées via la Gateway.

## 2. Lancement de la Simulation
Pour démarrer la simulation de mouvement des véhicules :

1. Assurez-vous que le cluster est déployé et accessible.
2. Ouvrez un terminal dans le dossier du projet.
3. Exécutez la commande suivante :
   ```bash
   cd services/localisation
   node simulate-grpc.js
   ```

## 3. Paramètres de Simulation
Le script simule par défaut :
- Plusieurs véhicules identifiés par leurs IDs.
- Un mouvement fluide (incrémentation légère des coordonnées).
- Un envoi toutes les secondes.

## 4. Vérification des Résultats
Une fois la simulation lancée, vous pouvez observer les résultats à trois endroits :

1. **Frontend** : Les marqueurs des véhicules sur la carte se déplacent en temps réel (si le rafraîchissement est activé).
2. **Grafana** : Les graphiques de "Vitesse" ou de "Positions" commencent à afficher des courbes.
3. **Logs** : Dans le terminal du service `localisation`, vous verrez apparaître les logs d'insertion : `📍 Position reçue pour véhicule X`.

## 5. Arrêt de la Simulation
Pour arrêter l'envoi de données, faites simplement un `Ctrl+C` dans le terminal où tourne le script `simulate-grpc.js`.

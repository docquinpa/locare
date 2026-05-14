# Guide Authentification Keycloak & GraphQL

L'authentification OIDC PKCE a été mise en place avec succès sur le Frontend et la Gateway GraphQL !

## Déploiement

Avant de tester, assurez-vous d'avoir bien :
1. Ajouté les hosts dans `/etc/hosts` (`frontend.locare.local`, `keycloak.locare.local`, `gateway.locare.local`).
2. Mis à jour le déploiement Helm : `helm upgrade locare ./infra/helm/locare-chart`.

## Fonctionnement

1. **Page Publique** : L'accès à `http://frontend.locare.local` affiche une page de bienvenue invitant à se connecter.
2. **Connexion (OIDC)** : Cliquez sur "Connexion". Traefik vous redirige vers le serveur Keycloak.
3. **Identifiants de test** :
   - Administrateur : `admin` / `admin` (Accès complet : Map + Formulaires d'ajout).
   - Utilisateur : `user` / `user` (Accès restreint : Map uniquement, les formulaires sont bloqués et remplacés par un message d'interdiction).

## Propagation du Token

Une fois connecté, la librairie `@react-keycloak/web` gère le cycle de vie de votre JWT.
L'instance `ApolloClient` a été configurée avec un `authLink` qui injecte automatiquement ce JWT dans le header `Authorization: Bearer <token>` de **chaque** requête GraphQL envoyée à la Gateway.

### Vérification

1. Ouvrez les **DevTools (F12)** sur le navigateur.
2. Allez dans l'onglet **Network (Réseau)**.
3. Connectez-vous, la page va envoyer une requête HTTP POST vers `graphql`.
4. Inspectez les "Request Headers" de cette requête. Vous y verrez :
   ```http
   Authorization: Bearer eyJhbGciOiJSUzI1NiI...
   ```
5. La Gateway (`gateway.locare.local`) vérifie dynamiquement la signature RSA de ce token en interrogeant l'API `jwks` de Keycloak. Si vous envoyez une requête sans token (ou avec un faux token), la Gateway renverra une erreur HTTP 500/401 avec le message "Not authenticated".

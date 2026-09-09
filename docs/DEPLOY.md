# Déploiement sur VPS

Même pipeline que le backend (`spring-ai-multitenant-rag`), adapté à une image nginx statique :
`deploy.yml` (`workflow_dispatch`, déclenchement manuel) build l'image Docker, la pousse sur
GHCR, puis se connecte en SSH au VPS pour relancer le conteneur via `compose.prod.yaml`.

Ce dépôt est totalement indépendant du backend — repo GitHub séparé, secrets séparés, pipeline
séparé — même s'il peut être déployé sur le même VPS que le backend (voir port ci-dessous).

## 1. Mise en place initiale du VPS (une seule fois)

```bash
# Sur le VPS (Ubuntu) — si déjà fait pour le backend, cette étape est inutile :
curl -fsSL https://get.docker.com | sh
sudo apt-get install -y docker-compose-plugin

sudo mkdir -p /opt/ai-compliance-copilot-frontend
cd /opt/ai-compliance-copilot-frontend
```

Créer un fichier `.env` dans ce répertoire (jamais commité) :

```
# Hôte:port du backend, joignable depuis le conteneur nginx (voir nginx.conf.template).
# Si le backend tourne sur le même VPS et écoute sur 0.0.0.0:8080, l'IP/hostname du VPS
# fonctionne (ex. localhost:8080 si le port du backend est publié sur l'hôte).
BACKEND_HOST=localhost:8080

# Port hôte sur lequel ce frontend est exposé. Par défaut 8081 pour ne pas entrer en
# collision avec le backend (8080) si les deux tournent sur le même VPS.
FRONTEND_PORT=8081
```

`compose.prod.yaml` est copié automatiquement sur le VPS par le pipeline à chaque déploiement.

## 2. Clé SSH dédiée au déploiement

Une clé séparée de celle du backend (même si le même VPS est réutilisé — repos GitHub
indépendants, pas de secrets partagés entre eux) :

```bash
ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy-frontend" -N ""
ssh-copy-id -i deploy_key.pub <user>@<vps-host>
```

## 3. Environnement `production` et secrets GitHub à créer (sur CE dépôt)

`ci.yml` et `deploy.yml` référencent tous les deux un environment GitHub nommé `production`
(`environment: production` sur les jobs) : les secrets ci-dessous doivent être créés **dans cet
environment**, pas au niveau du repo.

Repo GitHub → Settings → Environments → New environment → `production`, puis
Environment secrets → Add secret :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | IP ou nom de domaine du VPS |
| `VPS_USERNAME` | utilisateur SSH sur le VPS |
| `VPS_SSH_KEY` | contenu de `deploy_key` (clé **privée**) |
| `VPS_PORT` | port SSH, optionnel (défaut 22) |
| `VPS_DEPLOY_PATH` | `/opt/ai-compliance-copilot-frontend` |
| `SONAR_TOKEN` | token d'analyse SonarQube |
| `SONAR_HOST_URL` | URL de l'instance SonarQube (ex. `https://sonar.tewendelabs.com`) |

Aucun secret supplémentaire nécessaire pour GHCR : `GITHUB_TOKEN` intégré suffit.

⚠️ Ne pas ajouter de *required reviewers* sur cet environment : `ci.yml` déclenche
`environment: production` aussi sur les pull requests, une review obligatoire bloquerait
alors chaque PR en attente d'approbation.

## 4. Rendre l'image GHCR accessible en pull depuis le VPS

Comme pour le backend : rendre le package public (Package settings → Change visibility →
Public) est le plus simple pour un usage portfolio, sans authentification côté VPS.

## 5. Déclencher un déploiement

GitHub → Actions → **Build and Deploy** → Run workflow (branche `main`).

## 6. Important — CORS côté backend

Une fois ce frontend déployé sur son origine réelle (ex. `https://frontend.example.com`), le
backend doit l'accepter. **Aucune modification de code backend n'est nécessaire** :
`app.cors.allowed-origins` (actuellement codé en dur sur `http://localhost:4200` dans
`application.properties`) est surchargeable par variable d'environnement grâce au binding
relâché de Spring Boot — ajouter dans le `.env` du VPS du **backend** :

```
APP_CORS_ALLOWED_ORIGINS=https://frontend.example.com
```

(Plusieurs origines : séparées par une virgule, format accepté par Spring pour une `List<String>`.)

## Hors périmètre (volontairement, comme pour le backend)

- Pas de reverse proxy/TLS (Nginx + Let's Encrypt) devant CE conteneur — il est déjà lui-même
  un nginx, mais exposé directement sur le port choisi (`FRONTEND_PORT`) sans certificat. Étape
  naturelle suivante si exposé publiquement au-delà d'un usage portfolio.
- Pas de déploiement continu : déclenchement manuel (`workflow_dispatch`).

#!/usr/bin/env bash
#
# Primo avvio di un ambiente (produzione o staging) su un server.
# Idempotente: puoi rilanciarlo per aggiornare senza perdere dati — anche se per
# gli aggiornamenti di tutti i giorni conviene `make deploy-prod` / `make deploy-staging`.
#
#   curl -fsSL https://raw.githubusercontent.com/riccardosensi99/sito-personale/main/scripts/deploy-vps.sh -o deploy.sh
#   chmod +x deploy.sh && ./deploy.sh
#
# Tutto può arrivare dall'ambiente, così lo script gira senza domande:
#   CLOUDFLARE_TUNNEL_TOKEN=eyJ...   token del tunnel (vuoto = niente tunnel)
#   APP_DIR=~/sito-personale-staging directory di destinazione
#   BRANCH=develop                   branch da servire
#   PROJECT=riccardosensi-staging    nome del progetto docker (isola i volumi)
#   SITE_URL=https://staging.riccardosensi.com
#   WEB_PORT=8084                    porta pubblicata sul loopback

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/riccardosensi99/sito-personale.git}"
APP_DIR="${APP_DIR:-$HOME/sito-personale}"
BRANCH="${BRANCH:-main}"
PROJECT="${PROJECT:-riccardosensi}"
SITE_URL="${SITE_URL:-https://riccardosensi.com}"

info()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()   { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ─── Prerequisiti ────────────────────────────────────────────────────────────

command -v git >/dev/null || die "git non installato:  sudo apt install -y git"
command -v docker >/dev/null || die "docker non installato:  curl -fsSL https://get.docker.com | sh"
docker compose version >/dev/null 2>&1 || die "manca il plugin 'docker compose'"
docker info >/dev/null 2>&1 || die "l'utente corrente non può usare docker:  sudo usermod -aG docker \$USER  (poi riapri la sessione)"

# ─── Codice ──────────────────────────────────────────────────────────────────

if [ -d "$APP_DIR/.git" ]; then
  info "Aggiorno il codice in $APP_DIR (branch $BRANCH)"
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  info "Clono il repository in $APP_DIR (branch $BRANCH)"
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ─── Configurazione ──────────────────────────────────────────────────────────

if [ -f .env ]; then
  info "Uso il .env già presente (non lo tocco)"
else
  info "Creo il .env di produzione"

  # Il tunnel è opzionale: senza token l'ambiente resta raggiungibile solo dal
  # server (utile per staging finché non gli dai un hostname pubblico).
  token="${CLOUDFLARE_TUNNEL_TOKEN:-}"
  if [ -z "$token" ] && [ -t 0 ]; then
    read -rp "Token del Cloudflare Tunnel (invio per saltare): " token
  fi
  [ -n "$token" ] || warn "nessun token: niente tunnel, l'ambiente sarà solo locale al server"

  admin_email="${ADMIN_EMAIL:-riccardosensi57@gmail.com}"
  if [ -z "${ADMIN_EMAIL:-}" ] && [ -t 0 ]; then
    read -rp "Email di accesso al backoffice [$admin_email]: " input_email
    admin_email="${input_email:-$admin_email}"
  fi

  # Se ADMIN_PASSWORD arriva dall'ambiente la uso, altrimenti la chiedo (o la genero
  # quando lo script gira senza terminale, es. via ssh non interattiva).
  admin_pass="${ADMIN_PASSWORD:-}"
  if [ -z "$admin_pass" ]; then
    if [ -t 0 ]; then
      while [ ${#admin_pass} -lt 12 ]; do
        read -rsp "Password del backoffice (min 12 caratteri): " admin_pass; echo
        [ ${#admin_pass} -lt 12 ] && warn "troppo corta, riprova"
      done
    else
      admin_pass="$(openssl rand -base64 18)"
      warn "Password generata automaticamente, la trovi nel riepilogo finale."
    fi
  fi

  # Path segreto: se non lo scegli tu ne genero uno impossibile da indovinare.
  admin_path="${VITE_ADMIN_PATH:-}"
  if [ -z "$admin_path" ]; then
    default_path="admin-$(openssl rand -hex 4)"
    if [ -t 0 ]; then
      read -rp "Path del backoffice [$default_path]: " admin_path
    fi
    admin_path="${admin_path:-$default_path}"
  fi

  db_pass="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
  jwt="$(openssl rand -hex 48)"

  # Su un server che ospita già altri siti la 80 può essere presa: cerco la prima libera.
  web_port="${WEB_PORT:-}"
  if [ -z "$web_port" ]; then
    for candidate in 80 8081 8082 8083 8084; do
      if ! ss -ltn 2>/dev/null | grep -qE "[:.]$candidate\$|[:.]$candidate "; then
        web_port="$candidate"
        break
      fi
    done
    web_port="${web_port:-8085}"
    [ "$web_port" = 80 ] || warn "porta 80 occupata, pubblico nginx sulla $web_port (il tunnel non ne risente)"
  fi

  cat > .env <<EOF
# Generato da scripts/deploy-vps.sh il $(date +%F) — branch $BRANCH

COMPOSE_PROJECT_NAME=$PROJECT

POSTGRES_USER=rs
POSTGRES_PASSWORD=$db_pass
POSTGRES_DB=riccardosensi
DATABASE_URL=postgresql://rs:$db_pass@db:5432/riccardosensi?schema=public

NODE_ENV=production
API_PORT=3000
JWT_SECRET=$jwt
COOKIE_DOMAIN=
CORS_ORIGINS=$SITE_URL
UPLOAD_DIR=/data/uploads

ADMIN_EMAIL=$admin_email
ADMIN_PASSWORD=$admin_pass

GITHUB_USERNAME=riccardosensi99
GITHUB_TOKEN=

VITE_API_URL=/api
VITE_ADMIN_PATH=$admin_path
VITE_SITE_URL=$SITE_URL

# nginx solo sul loopback: al mondo esterno ci pensa il tunnel, che raggiunge
# il container sulla rete interna. La porta pubblicata serve solo per i test dal server.
WEB_BIND=${WEB_BIND:-127.0.0.1}
WEB_PORT=$web_port
CLOUDFLARE_TUNNEL_TOKEN=$token
EOF

  chmod 600 .env
fi

# ─── Avvio ───────────────────────────────────────────────────────────────────

# Gli stessi flag che usa il Makefile: project name dal .env, cloudflared solo se
# c'è un token da usare.
project="$(grep -s '^COMPOSE_PROJECT_NAME=' .env | cut -d= -f2-)"
COMPOSE=(docker compose -p "${project:-riccardosensi}" -f docker-compose.yml)
if grep -qE '^CLOUDFLARE_TUNNEL_TOKEN=.+' .env; then
  COMPOSE+=(-f docker-compose.tunnel.yml)
fi

info "Costruisco e avvio i container (la prima volta ci vogliono alcuni minuti)"
"${COMPOSE[@]}" up -d --build

info "Attendo che l'API sia pronta"
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T api node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    break
  fi
  [ "$i" = 30 ] && die "l'API non risponde: guarda i log con  ${COMPOSE[*]} logs api"
  sleep 3
done

# Il seed è idempotente: se l'admin esiste già non tocca password né secret TOTP.
info "Creo utente admin e contenuti di default (se mancano)"
"${COMPOSE[@]}" exec -T api npx tsx prisma/seed.ts

# ─── Riepilogo ───────────────────────────────────────────────────────────────

admin_path="$(grep '^VITE_ADMIN_PATH=' .env | cut -d= -f2-)"
admin_email="$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-)"
site_url="$(grep '^VITE_SITE_URL=' .env | cut -d= -f2-)"
web_port="$(grep '^WEB_PORT=' .env | cut -d= -f2-)"

info "Fatto"
cat <<EOF

  Sito        $site_url   (dal server: http://127.0.0.1:$web_port)
  Backoffice  $site_url/$admin_path
  Accesso     $admin_email  —  password:  grep ADMIN_PASSWORD $APP_DIR/.env

  Stato       cd $APP_DIR && make ps
  Log         cd $APP_DIR && make logs
  Aggiorna    make deploy-prod (o deploy-staging) dal tuo PC

  Se sopra è comparso un QR code, scansionalo ORA con l'app authenticator:
  non verrà mostrato di nuovo.

EOF

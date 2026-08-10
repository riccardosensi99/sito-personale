# riccardosensi.com — comandi di sviluppo e deploy.
#
# Tre ambienti, un file di configurazione ciascuno:
#
#   .env.local     questo PC, working tree corrente     project: riccardosensi
#   .env.staging   server, branch develop               project: riccardosensi-staging
#   .env.prod      server, branch main                  project: riccardosensi
#
# Si sceglie con ENV=  (default: local)
#
#   make up               → ambiente locale
#   make logs ENV=prod    → sul server, nella directory di produzione
#
# La fonte di verità dei file di staging e prod è il server: `make pull-env ENV=prod`
# ne scarica una copia qui, `make push-env ENV=prod` fa il contrario.
#
# local e prod condividono il nome del progetto docker ma vivono su macchine
# diverse, quindi non si toccano; staging, che sta sullo stesso server di prod,
# ha un nome suo — glielo dà COMPOSE_PROJECT_NAME nel suo file.
#
# I target locali agiscono qui; quelli che finiscono in -staging / -prod girano
# sul server via SSH, richiamando questo stesso Makefile nella directory giusta.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ─── Server ──────────────────────────────────────────────────────────────────

REMOTE      ?= king@king-corebook-pro
PROD_DIR    ?= ~/sito-personale
STAGING_DIR ?= ~/sito-personale-staging
PROD_BRANCH    ?= main
STAGING_BRANCH ?= develop
STAGING_URL    ?= https://staging.riccardosensi.com

# ─── Ambiente ────────────────────────────────────────────────────────────────

ENV      ?= local
ENV_FILE := .env.$(ENV)

# Il project name isola container, rete e volumi di un ambiente dagli altri.
# Sbagliarlo significa scrivere sui dati di un altro ambiente.
PROJECT := $(shell grep -s '^COMPOSE_PROJECT_NAME=' $(ENV_FILE) | cut -d= -f2-)
PROJECT := $(if $(PROJECT),$(PROJECT),riccardosensi)

# cloudflared viene incluso solo se c'è un token: in locale non serve.
TUNNEL := $(shell grep -sqE '^CLOUDFLARE_TUNNEL_TOKEN=.+' $(ENV_FILE) && echo yes)
FILES  := -f docker-compose.yml $(if $(TUNNEL),-f docker-compose.tunnel.yml)

DC     := docker compose --env-file $(ENV_FILE) -p $(PROJECT) $(FILES)
DC_DEV := docker compose --env-file $(ENV_FILE) -p $(PROJECT)-dev -f docker-compose.dev.yml

# Esegue un comando con le variabili dell'ambiente caricate (per npm e prisma CLI,
# che non conoscono il concetto di ENV di questo Makefile).
WITH_ENV = set -a; . ./$(ENV_FILE); set +a;

.PHONY: help install dev dev-down dev-logs up down restart build logs ps seed \
        migrate studio typecheck check backup env-check \
        bootstrap-staging deploy-staging deploy-prod logs-staging logs-prod ps-staging ps-prod \
        seed-staging seed-prod backup-prod shell-staging shell-prod \
        down-staging down-prod exec pull-env push-env

# ─── Aiuto ───────────────────────────────────────────────────────────────────

help: ## Mostra questo elenco
	@echo ""
	@echo "  ENV=$(ENV)  →  $(ENV_FILE)  →  project $(PROJECT)$(if $(TUNNEL), (con tunnel))"
	@echo "  Cambia ambiente con ENV=local|staging|prod"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ─── Sviluppo locale ─────────────────────────────────────────────────────────

install: ## Installa le dipendenze npm
	npm install

dev: ## Avvia lo stack di sviluppo con hot reload (db + api + web)
	$(DC_DEV) up

dev-down: ## Ferma lo stack di sviluppo
	$(DC_DEV) down

dev-logs: ## Log dello stack di sviluppo
	$(DC_DEV) logs -f

typecheck: ## Typecheck di api e web
	npm run typecheck

check: typecheck ## Alias di typecheck (aggiungi qui i test quando ci saranno)

migrate: ## Crea e applica una migration (usa NAME=nome_migration)
	@$(WITH_ENV) npm run migrate -- --name $(or $(NAME),update)

studio: ## Apre Prisma Studio sul database dell'ambiente corrente
	@$(WITH_ENV) npm run studio

# ─── Ciclo di vita di un ambiente ────────────────────────────────────────────

env-check: ## Verifica che la configurazione dell'ambiente scelto sia coerente
	@test -f $(ENV_FILE) || { echo "manca $(ENV_FILE): copia .env.example e compilalo"; exit 1; }
	@grep -q '^JWT_SECRET=.\{32,\}' $(ENV_FILE) || { echo "JWT_SECRET assente o troppo corto in $(ENV_FILE)"; exit 1; }
	@echo "file:    $(ENV_FILE)"
	@echo "project: $(PROJECT)"
	@echo "tunnel:  $(if $(TUNNEL),sì,no)"
	@echo "url:     $$(grep '^VITE_SITE_URL=' $(ENV_FILE) | cut -d= -f2-)"
	@echo "admin:   $$(grep '^VITE_ADMIN_PATH=' $(ENV_FILE) | cut -d= -f2-)"

build: env-check ## Ricostruisce le immagini
	$(DC) build

up: env-check ## Avvia (o aggiorna) l'ambiente in background
	$(DC) up -d --build

down: ## Ferma l'ambiente lasciando intatti i dati
	$(DC) down

restart: ## Riavvia i container senza ricostruire
	$(DC) restart

logs: ## Segue i log (usa S=api per un singolo servizio)
	$(DC) logs -f $(S)

ps: ## Stato dei container
	$(DC) ps

exec: ## Apre una shell nel container api
	$(DC) exec api sh

seed: ## Crea admin e contenuti di default (idempotente)
	$(DC) exec -T api npx tsx prisma/seed.ts

backup: ## Dump del database in backup/
	@mkdir -p backup
	@$(DC) exec -T db pg_dump -U $$(grep '^POSTGRES_USER=' $(ENV_FILE) | cut -d= -f2-) \
		$$(grep '^POSTGRES_DB=' $(ENV_FILE) | cut -d= -f2-) > backup/$(PROJECT)-$$(date +%F-%H%M).sql
	@echo "salvato in backup/"

# ─── Sincronizzazione dei file di ambiente ───────────────────────────────────

pull-env: ## Scarica dal server il file dell'ambiente scelto (ENV=staging|prod)
	@test "$(ENV)" != "local" || { echo "l'ambiente local vive solo qui"; exit 1; }
	scp $(REMOTE):$(if $(filter prod,$(ENV)),$(PROD_DIR),$(STAGING_DIR))/.env.$(ENV) $(ENV_FILE)
	@chmod 600 $(ENV_FILE)
	@echo "$(ENV_FILE) aggiornato dal server"

push-env: ## Invia al server il file dell'ambiente scelto (ENV=staging|prod)
	@test "$(ENV)" != "local" || { echo "l'ambiente local vive solo qui"; exit 1; }
	@read -p "Sovrascrivo $(ENV_FILE) sul server. Confermi? [scrivi: si] " ok; \
	[ "$$ok" = "si" ] || { echo "annullato"; exit 1; }
	scp $(ENV_FILE) $(REMOTE):$(if $(filter prod,$(ENV)),$(PROD_DIR),$(STAGING_DIR))/.env.$(ENV)

# ─── Deploy ──────────────────────────────────────────────────────────────────

bootstrap-staging: ## Crea l'ambiente di staging sul server (una volta sola)
	@echo "▸ primo avvio di staging su $(REMOTE)"
	ssh $(REMOTE) -t 'curl -fsSL https://raw.githubusercontent.com/riccardosensi99/sito-personale/$(PROD_BRANCH)/scripts/deploy-vps.sh -o /tmp/bootstrap.sh && \
		chmod +x /tmp/bootstrap.sh && \
		APP_DIR=$(STAGING_DIR) BRANCH=$(STAGING_BRANCH) PROJECT=riccardosensi-staging \
		SITE_URL=$(STAGING_URL) /tmp/bootstrap.sh'

deploy-staging: ## Deploy del branch develop su staging
	@echo "▸ staging ← $(STAGING_BRANCH)"
	@ssh $(REMOTE) 'test -d $(STAGING_DIR)/.git' \
		|| { echo "staging non ancora creato: lancia prima  make bootstrap-staging"; exit 1; }
	ssh $(REMOTE) 'set -e; \
		cd $(STAGING_DIR); \
		git fetch origin $(STAGING_BRANCH); \
		git checkout $(STAGING_BRANCH); \
		git reset --hard origin/$(STAGING_BRANCH); \
		make up ENV=staging'

deploy-prod: ## Deploy del branch main in produzione
	@echo "▸ produzione ← $(PROD_BRANCH)"
	ssh $(REMOTE) 'set -e; \
		cd $(PROD_DIR); \
		git fetch origin $(PROD_BRANCH); \
		git checkout $(PROD_BRANCH); \
		git reset --hard origin/$(PROD_BRANCH); \
		make up ENV=prod'

seed-staging: ## Seed su staging
	ssh $(REMOTE) 'cd $(STAGING_DIR) && make seed ENV=staging'

seed-prod: ## Seed in produzione
	ssh $(REMOTE) 'cd $(PROD_DIR) && make seed ENV=prod'

ps-staging: ## Stato dei container su staging
	@ssh $(REMOTE) 'cd $(STAGING_DIR) && make ps ENV=staging'

ps-prod: ## Stato dei container in produzione
	@ssh $(REMOTE) 'cd $(PROD_DIR) && make ps ENV=prod'

logs-staging: ## Log di staging (usa S=api)
	ssh $(REMOTE) -t 'cd $(STAGING_DIR) && make logs ENV=staging S=$(S)'

logs-prod: ## Log della produzione (usa S=api)
	ssh $(REMOTE) -t 'cd $(PROD_DIR) && make logs ENV=prod S=$(S)'

shell-staging: ## Shell nel container api di staging
	ssh $(REMOTE) -t 'cd $(STAGING_DIR) && make exec ENV=staging'

shell-prod: ## Shell nel container api di produzione
	ssh $(REMOTE) -t 'cd $(PROD_DIR) && make exec ENV=prod'

backup-prod: ## Scarica un dump del database di produzione in backup/
	@mkdir -p backup
	ssh $(REMOTE) 'cd $(PROD_DIR) && make backup ENV=prod >/dev/null && ls -t backup/*.sql | head -1' \
		| xargs -I{} scp $(REMOTE):$(PROD_DIR)/{} backup/
	@echo "scaricato in backup/"

down-staging: ## Ferma staging
	ssh $(REMOTE) 'cd $(STAGING_DIR) && make down ENV=staging'

down-prod: ## Ferma la produzione (attenzione: il sito va offline)
	@read -p "Fermo la produzione, il sito andrà offline. Confermi? [scrivi: si] " ok; \
	[ "$$ok" = "si" ] || { echo "annullato"; exit 1; }
	ssh $(REMOTE) 'cd $(PROD_DIR) && make down ENV=prod'

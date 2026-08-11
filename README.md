# riccardosensi.com

Portfolio personale con backoffice privato: React + Vite davanti, Node/Express + PostgreSQL dietro,
tutto in Docker. I progetti si importano dai repository GitHub e si curano dal backoffice, senza deploy.

```
apps/web    React 19 + Vite + React Router   sito pubblico + area admin (chunk separato)
apps/api    Express 5 + Prisma + PostgreSQL  API pubbliche e admin
docker/     Dockerfile e configurazione nginx
docs/       il mock HTML da cui nasce il design
```

## Avvio rapido

```bash
cp .env.example .env          # poi apri il file e metti i tuoi valori
openssl rand -hex 48          # → JWT_SECRET

docker compose -f docker-compose.dev.yml up      # db + api + web con hot reload
npm run seed                                     # crea l'admin e stampa il QR del TOTP
```

Sito su <http://localhost:5174>, API su <http://localhost:3000>, database sulla porta 5434.

**Il QR del secret TOTP viene mostrato una volta sola.** Scansionalo con Google Authenticator, Aegis
o 1Password prima di chiudere il terminale: senza secondo fattore non si entra nel backoffice.

### Sviluppo senza container

```bash
docker compose -f docker-compose.dev.yml up db   # solo il database
npm run dev:api                                  # in un terminale
npm run dev:web                                  # in un altro
```

## Ambienti

Tre ambienti, ognuno con la propria directory, il proprio `.env` e i propri volumi.
Il project name docker è ciò che li tiene separati: sbagliarlo significa scrivere sui dati di
un altro ambiente.

| | dove | branch | project docker | indirizzo |
|---|---|---|---|---|
| **local** | il tuo PC | working tree | `riccardosensi` | `localhost:8080` |
| **staging** | server, `~/sito-personale-staging` | `develop` | `riccardosensi-staging` | `staging.riccardosensi.com` |
| **prod** | server, `~/sito-personale` | `main` | `riccardosensi` | `riccardosensi.com` |

local e prod condividono il nome del progetto ma stanno su macchine diverse, quindi non si
toccano; staging convive con prod sullo stesso server e ha perciò un nome suo, che gli arriva da
`COMPOSE_PROJECT_NAME` nel suo `.env`.

Il flusso è: lavori in locale → merge su `develop` → `make deploy-staging` → merge su `main` →
`make deploy-prod`.

### I contenuti

Il sito è una pagina sola e non ha niente scritto dentro il codice: i progetti stanno nella loro
tabella, i testi nelle impostazioni. Dal backoffice si cambia tutto senza un deploy.

| dove | cosa |
|---|---|
| *Progetti* | le card della sezione progetti, ordine compreso |
| *Contenuti sito* → **Testi della pagina** (`home`) | titoli, bio, competenze, nastro, numeri, P. IVA |
| *Contenuti sito* → **Recapiti** (`contact`) | mail, GitHub, LinkedIn |
| *Curriculum* | il PDF del pulsante nel footer |

Nei testi lunghi `_così_` diventa corsivo e `*così*` grassetto: è l'unica formattazione che passa,
e serve a non far viaggiare HTML dentro un campo di testo.

Un blocco mai salvato compare comunque nell'editor, col bordo tratteggiato e già pieno dei valori
di partenza scritti nel codice: finché non lo salvi è quello che il sito mostra.

> `.env.local` è anche il file che Vite carica da solo in ogni build eseguito su questa macchina.
> Una `VITE_*` scritta lì dentro vale quindi pure per `npm run dev:web` e `npm run build`, non
> solo per `make up ENV=local`.

## Comandi

`make help` elenca tutto. I più usati:

| Comando | Cosa fa |
|---|---|
| `make dev` | stack locale con hot reload (db + api + web) |
| `make up` | avvia o aggiorna l'ambiente della directory corrente |
| `make logs S=api` | segue i log di un servizio |
| `make seed` | crea admin e contenuti di default (idempotente) |
| `make migrate NAME=aggiunta_campo` | nuova migration Prisma |
| `make typecheck` | typecheck di api e web |
| `make env-check` | verifica che il `.env` corrente sia coerente |
| `make bootstrap-staging` | crea l'ambiente di staging sul server (una volta sola) |
| `make deploy-staging` | porta `develop` su staging |
| `make deploy-prod` | porta `main` in produzione |
| `make backup-prod` | scarica un dump del database di produzione in `backup/` |
| `make ps-prod` / `make logs-prod` | stato e log della produzione, via SSH |

Il server di riferimento è in cima al `Makefile` (`REMOTE`): cambialo lì, o passalo a mano con
`make deploy-prod REMOTE=utente@altro-host`.

## Il backoffice

Vive su `/<VITE_ADMIN_PATH>` (default nell'esempio: `cn-riccardo-2f`). Il path segreto è solo il primo
strato — il vero controllo è l'autenticazione:

1. **Password** con hash argon2id, verificata anche quando l'email non esiste (i tempi di risposta non
   rivelano quali account esistono).
2. **Codice TOTP** a 6 cifre. Il cookie di sessione viene emesso solo dopo il secondo fattore.
3. Cookie **httpOnly, Secure, SameSite=Strict**, valido 8 ore, con `tokenVersion` verificata a ogni
   richiesta: `POST /api/admin/auth/revoke-sessions` invalida in un colpo tutte le sessioni aperte.
4. **Rate limiting**: 5 tentativi di login ogni 15 minuti per IP, poi 429.
5. nginx serve quel path con `X-Robots-Tag: noindex` e `Cache-Control: no-store`; la pagina aggiunge
   un `<meta name="robots">` e non compare in `sitemap.xml`.

Da lì gestisci: progetti (creazione, modifica, ordine con drag & drop, visibilità, upload immagini),
import da GitHub e i contenuti testuali del sito (hero, servizi, esperienza, tech radar, contatti).

### Come funziona l'import GitHub

`Importa da GitHub` elenca i tuoi repository e ne crea una **bozza nascosta**: titolo, descrizione,
topic e linguaggio vengono precompilati dai dati del repo. Da quel momento i campi editoriali sono
tuoi: il pulsante `Refresh` riallinea **solo** stelle, fork, linguaggio, topics e data dell'ultimo
push, senza mai riscrivere il testo che hai curato.

Senza `GITHUB_TOKEN` vede i soli repository pubblici. Con un token (anche senza scope, o con
`public_repo`) alza il rate limit; con `repo` vede anche i privati.

## Variabili d'ambiente

Tutto sta in un unico `.env` alla radice, condiviso da API, frontend e docker. Vedi `.env.example`
per l'elenco completo; le più importanti:

| Variabile | Note |
|---|---|
| `JWT_SECRET` | almeno 32 caratteri, generalo con `openssl rand -hex 48` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | usate **solo dal seed** alla prima creazione dell'utente |
| `VITE_ADMIN_PATH` | path del backoffice: cambiarlo sposta l'area admin (serve una nuova build) |
| `GITHUB_USERNAME` / `GITHUB_TOKEN` | profilo da leggere e token opzionale |
| `CORS_ORIGINS` | origini ammesse, separate da virgola |
| `COOKIE_DOMAIN` | lascialo vuoto se sito e API stanno sullo stesso host |

Le `VITE_*` finiscono dentro il bundle al momento della build: cambiandole va rifatto
`docker compose build web`.

## Deploy sul VPS

```bash
git clone git@github.com:riccardosensi99/sito-personale.git && cd sito-personale
cp .env.example .env    # valori di produzione, JWT_SECRET nuovo, password admin robusta
```

Poi scegli **uno** dei due modi per esporre il sito.

### A. Cloudflare Tunnel (consigliato)

Nessuna porta aperta sul VPS e nessun certificato da gestire: `cloudflared` apre una connessione
in uscita verso Cloudflare e riceve il traffico da lì.

```bash
# nel .env:  CLOUDFLARE_TUNNEL_TOKEN=<token>   e   WEB_BIND=127.0.0.1
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build
```

### B. Porte aperte + certificato di origine

nginx termina il TLS sulla 443 con un *Origin Certificate* Cloudflare, e il DNS punta all'IP del VPS.

```bash
mkdir -p certs   # dentro: origin.pem e origin.key
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d --build
```

### In entrambi i casi

```bash
docker compose exec api npx tsx prisma/seed.ts   # solo la prima volta: crea admin e contenuti
```

Le migration vengono applicate a ogni avvio del container `api`, quindi un `docker compose up -d --build`
dopo un `git pull` è tutto ciò che serve per aggiornare.

Backup del database:

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

Le immagini caricate vivono nel volume `uploads`, il database nel volume `pgdata`: entrambi
sopravvivono a `docker compose down` (ma non a `down -v`).

## Cloudflare

Il dominio `riccardosensi.com` è già su Cloudflare.

**Con il tunnel (opzione A)** non si tocca il DNS a mano: creando il tunnel in
*Zero Trust → Networks → Tunnels* e aggiungendo i public hostname `riccardosensi.com` e
`www.riccardosensi.com` con servizio `HTTP → web:80`, i record `CNAME` li scrive Cloudflare.

**Con le porte aperte (opzione B)** servono due record `A`, per `riccardosensi.com` e per `www`,
verso l'IP del VPS, entrambi con il **proxy attivo** (nuvoletta arancione) e la modalità SSL/TLS
su **Full (strict)**. La modalità Flexible va evitata: lascia il tratto Cloudflare→origine in chiaro.

Valgono per entrambe:

- **Edge Certificates** — attiva `Always Use HTTPS` e `Automatic HTTPS Rewrites`; HSTS quando sei
  sicuro che tutto viaggi su HTTPS.
- **Cache** — una regola che **esclude dalla cache** `/api/*` e il path del backoffice. Il resto può
  essere messo in cache tranquillamente: gli asset hanno l'hash nel nome.
- **Firewall** (opzionale ma consigliato) — una regola che limita l'accesso al path del backoffice ai
  soli IP o Paesi da cui accedi davvero, oppure Cloudflare Access con un secondo login.

L'API legge `X-Forwarded-For` (`trust proxy`), quindi il rate limiting vede l'IP reale del visitatore e
non quello dell'edge Cloudflare.

## Note

- Il design nasce da `docs/preview.html`: il CSS è stato portato in `apps/web/src/styles/global.css`
  mantenendo le stesse classi, così il mock resta il riferimento visivo.
- I contenuti testuali sono in tabella `Setting` come blocchi JSON. Sono **array e non oggetti** dove
  l'ordine conta: `jsonb` di Postgres riordina le chiavi degli oggetti, non gli elementi degli array.
- Il form di contatto è un `mailto:`, non c'è un endpoint server-side.

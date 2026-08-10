#!/bin/sh
# Protegge l'intero sito con autenticazione HTTP, se l'ambiente la richiede.
# Serve a tenere staging fuori dalla portata di chiunque passi di lì: la produzione
# non imposta queste variabili e resta pubblica.
#
#   BASIC_AUTH_USER=staging
#   BASIC_AUTH_PASSWORD=...
#
# nginx:alpine non ha openssl né htpasswd, ma accetta il formato {SHA} — sha1 in
# base64 — che si costruisce con i soli busybox coreutils.

set -e

SNIPPET=/etc/nginx/snippets/auth.conf
HTPASSWD=/etc/nginx/.htpasswd

if [ -z "${BASIC_AUTH_USER:-}" ] || [ -z "${BASIC_AUTH_PASSWORD:-}" ]; then
  : > "$SNIPPET"
  echo "$0: nessuna autenticazione HTTP configurata, il sito resta pubblico"
  exit 0
fi

hash="{SHA}$(printf '%s' "$BASIC_AUTH_PASSWORD" | sha1sum | cut -d' ' -f1 | xxd -r -p | base64)"
printf '%s:%s\n' "$BASIC_AUTH_USER" "$hash" > "$HTPASSWD"

# I worker girano come utente nginx: senza questo il file resta illeggibile e
# ogni richiesta autenticata finisce in 500.
chown root:nginx "$HTPASSWD" 2>/dev/null || true
chmod 640 "$HTPASSWD"

cat > "$SNIPPET" <<EOF
auth_basic "Ambiente riservato";
auth_basic_user_file $HTPASSWD;
EOF

echo "$0: autenticazione HTTP attiva per l'utente '$BASIC_AUTH_USER'"

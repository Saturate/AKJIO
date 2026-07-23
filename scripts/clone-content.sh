#!/usr/bin/env bash
set -euo pipefail

CONTENT_DIR="content"
CONTENT_BRANCH="${CONTENT_BRANCH:-main}"

if [ -d "$CONTENT_DIR/.git" ]; then
  echo "Content already present (local dev), skipping clone."
  exit 0
fi

if [ -d "$CONTENT_DIR" ] && [ "$(ls -A "$CONTENT_DIR" 2>/dev/null)" ]; then
  echo "Content directory exists and is non-empty, skipping clone."
  exit 0
fi

# If CONTENT_TOKEN is already set (e.g. from GitHub Actions), use it directly.
# Otherwise, generate one from the GitHub App credentials.
if [ -z "${CONTENT_TOKEN:-}" ]; then
  if [ -z "${APP_CLIENT_ID:-}" ] || [ -z "${APP_PRIVATE_KEY:-}" ] || [ -z "${CONTENT_REPO_URL:-}" ]; then
    echo "Error: either CONTENT_TOKEN or (APP_CLIENT_ID + APP_PRIVATE_KEY + CONTENT_REPO_URL) are required."
    echo "For local dev, clone the content repo manually into ./content/"
    exit 1
  fi

  b64enc() { openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n'; }

  now=$(date +%s)
  iat=$((now - 60))
  exp=$((now + 600))

  pem_file=$(mktemp)
  printf '%s' "${APP_PRIVATE_KEY}" > "$pem_file"
  trap 'rm -f "$pem_file"' EXIT

  header=$(printf '{"typ":"JWT","alg":"RS256"}' | b64enc)
  payload=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$iat" "$exp" "$APP_CLIENT_ID" | b64enc)
  unsigned="${header}.${payload}"
  signature=$(printf '%s' "$unsigned" | openssl dgst -sha256 -sign "$pem_file" | b64enc)
  jwt="${unsigned}.${signature}"

  rm -f "$pem_file"
  trap - EXIT

  owner_repo=$(echo "$CONTENT_REPO_URL" | sed 's|github.com/||;s|\.git$||')

  echo "Requesting installation token for ${owner_repo}..."

  install_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $jwt" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${owner_repo}/installation")
  install_status=$(echo "$install_response" | tail -1)
  install_body=$(echo "$install_response" | sed '$d')

  if [ "$install_status" != "200" ]; then
    echo "Error: failed to get app installation (HTTP ${install_status})"
    echo "$install_body" | grep -o '"message" *: *"[^"]*"' || true
    exit 1
  fi
  installation_id=$(echo "$install_body" | grep -o '"id" *: *[0-9]*' | head -1 | grep -o '[0-9]*')

  token_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $jwt" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/app/installations/${installation_id}/access_tokens")
  token_status=$(echo "$token_response" | tail -1)
  token_body=$(echo "$token_response" | sed '$d')

  if [ "$token_status" != "201" ]; then
    echo "Error: failed to create installation token (HTTP ${token_status})"
    echo "$token_body" | grep -o '"message" *: *"[^"]*"' || true
    exit 1
  fi
  CONTENT_TOKEN=$(echo "$token_body" | grep -o '"token" *: *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
fi

if [ -z "${CONTENT_REPO_URL:-}" ]; then
  echo "Error: CONTENT_REPO_URL is required."
  exit 1
fi

echo "Cloning content..."
git clone --depth 1 --quiet --branch "$CONTENT_BRANCH" \
  "https://x-access-token:${CONTENT_TOKEN}@${CONTENT_REPO_URL}" "$CONTENT_DIR"

rm -rf "$CONTENT_DIR/.git"
rm -rf "$CONTENT_DIR/.obsidian"

echo "Content ready."

#!/usr/bin/env bash
set -euo pipefail

# Deploy an existing stack from exact release assets. Image preparation happens
# off-server. The installed capacity checker is part of host provisioning.
[[ $# == 6 ]] || { echo 'Expected deployment directory, SHA, digest, expanded bytes, transfer bytes, health URL' >&2; exit 64; }
deploy_dir=$1
revision=$2
image=$3
expanded=$4
compressed=$5
health_url=$6
[[ $revision =~ ^[a-f0-9]{40}$ ]] || exit 64
[[ $image =~ ^[a-zA-Z0-9./_-]+@sha256:[a-f0-9]{64}$ ]] || exit 64
[[ $expanded =~ ^[1-9][0-9]*$ && $compressed =~ ^[1-9][0-9]*$ ]] || exit 64
[[ $health_url == https://* || $health_url == http://127.0.0.1:* ]] || exit 64
assets=$(cd -- "$(dirname -- "$0")/.." && pwd)
deploy_dir=$(cd -- "$deploy_dir" && pwd)
checker=${PRODUCTION_CAPACITY_CHECKER:-/usr/local/lib/production/production_capacity.py}
test -r "$checker"
test -s "$deploy_dir/.env"
test -s "$assets/docker-compose.prod.yml"
exec 9>"${PRODUCTION_DEPLOY_LOCK_FILE:-/var/lock/production-build.lock}"
flock -w 1800 9

project=pricetoken
web=$project-web-1
postgres=$project-postgres-1
old_image=$(docker inspect --format '{{.Image}}' "$web")
[[ $old_image =~ ^sha256:[a-f0-9]{64}$ ]] || exit 1
backup_root="$deploy_dir/.backups"
mkdir -p "$backup_root"
chmod 700 "$backup_root"
database_bytes=$(docker exec "$postgres" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT pg_database_size(current_database())"')
[[ $database_bytes =~ ^[0-9]+$ ]] || exit 1
backup_bytes=$((database_bytes * 2))
((backup_bytes >= 2147483648)) || backup_bytes=2147483648
python3 "$checker" before-import --image-bytes "$expanded" --transfer-bytes "$compressed" \
  --backup-path "$backup_root" --backup-bytes "$backup_bytes"
docker pull "$image"
python3 "$checker" before-switch --backup-path "$backup_root" --backup-bytes "$backup_bytes"
test "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" = "$revision"
test "$(docker image inspect --format '{{.Architecture}}' "$image")" = amd64
new_image=$(docker image inspect --format '{{.Id}}' "$image")

umask 077
state=$(mktemp -d "$backup_root/$revision-XXXXXXXX")
override="$state/image.json"
printf '{"services":{"web":{"image":"%s","pull_policy":"never"}}}\n' "$image" > "$override"
compose=(docker compose -p "$project" --env-file "$deploy_dir/.env" -f "$assets/docker-compose.prod.yml" -f "$override")
docker inspect "$web" > "$state/previous-container.json"
"${compose[@]}" config --format json > "$state/compose.json"
python3 - "$state/previous-container.json" "$state/compose.json" <<'PY'
import json
import sys
with open(sys.argv[1]) as source:
    container = json.load(source)[0]
    previous = dict(value.split('=', 1) for value in container['Config']['Env'])
with open(sys.argv[2]) as source:
    configuration = json.load(source)
    service = configuration['services']['web']
    proposed = service['environment']
if any(previous.get(key) != str(value) for key, value in proposed.items()):
    raise SystemExit('Runtime settings differ from the running container; review configuration separately')
mounts = sorted((mount['Type'], mount.get('Name') if mount['Type'] == 'volume' else mount['Source'], mount['Destination'], mount['RW']) for mount in container['Mounts'])
expected_mounts = []
for mount in service.get('volumes', []):
    source = mount['source']
    if mount['type'] == 'volume':
        source = configuration['volumes'][source]['name']
    expected_mounts.append((mount['type'], source, mount['target'], not mount.get('read_only', False)))
ports = {}
for port in service.get('ports', []):
    key = str(port['target']) + '/' + port.get('protocol', 'tcp')
    ports.setdefault(key, []).append({'HostIp': port.get('host_ip', ''), 'HostPort': str(port['published'])})
if mounts != sorted(expected_mounts) or container['HostConfig']['PortBindings'] != ports:
    raise SystemExit('Runtime mounts or ports differ from the running container; review topology separately')
PY
# Code-only deployments must preserve schema. A schema-changing release needs
# its own reviewed migration procedure before an existing service is touched.
docker exec "$web" cat /app/apps/web/prisma/schema.prisma > "$state/previous.prisma"
docker run --rm --pull never --network none --entrypoint cat "$image" /app/apps/web/prisma/schema.prisma > "$state/candidate.prisma"
cmp "$state/previous.prisma" "$state/candidate.prisma"

retention_dir=${PRODUCTION_IMAGE_RETENTION_DIR:-$HOME/.local/state/production-image-retention}
mkdir -p "$retention_dir"
retention_tmp=$(mktemp "$retention_dir/.pricetoken-XXXXXXXX")
printf '{"protected_images":["%s","%s"]}\n' "$old_image" "$new_image" > "$retention_tmp"
mv "$retention_tmp" "$retention_dir/pricetoken.json"

docker exec "$postgres" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$state/database.dump"
test -s "$state/database.dump"
docker exec -i "$postgres" pg_restore --file=/dev/null < "$state/database.dump" > /dev/null
python3 "$checker" before-switch --backup-path "$backup_root"

switched=false
migration=$project-migration-$revision
healthy() {
  curl --fail --silent --show-error --max-time 10 "$health_url" | \
    python3 -c 'import json,sys; h=json.load(sys.stdin); sys.exit(0 if h.get("status")=="ok" and h.get("database")=="connected" and h.get("redis")=="connected" else 1)'
}
wait_healthy() {
  for attempt in $(seq 1 30); do
    if healthy; then return 0; fi
    ((attempt < 30)) || return 1
    sleep 4
  done
}
finish() {
  result=$?
  trap - EXIT INT TERM
  if ((result != 0)); then
    if docker container inspect "$migration" > /dev/null 2>&1; then
      docker stop --time 45 "$migration" > /dev/null
      docker wait "$migration" > /dev/null
      docker rm "$migration" > /dev/null
    fi
    if [[ $switched == true ]]; then
      printf '{"services":{"web":{"image":"%s","pull_policy":"never"}}}\n' "$old_image" > "$override"
      "${compose[@]}" up -d --no-deps --no-build --pull never --force-recreate web
      if wait_healthy && test "$(docker inspect --format '{{.Image}}' "$web")" = "$old_image"; then
        echo "Deployment failed; previous image verified healthy. Database backup retained at $state" >&2
      else
        echo "Deployment and rollback health verification failed. Database backup retained at $state" >&2
      fi
    fi
  fi
  exit "$result"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

"${compose[@]}" run --rm --name "$migration" --no-deps --pull never web \
  node runtime-tools/node_modules/prisma/build/index.js db push --skip-generate --schema=apps/web/prisma/schema.prisma
switched=true
"${compose[@]}" up -d --no-deps --no-build --pull never --force-recreate web
wait_healthy
test "$(docker inspect --format '{{.Image}}' "$web")" = "$new_image"
"${compose[@]}" exec -T web node runtime-tools/scripts/seed.cjs
python3 "$checker" before-switch --backup-path "$backup_root"
python3 "$assets/scripts/retain-deployments.py" "$deploy_dir" "$state" "$assets" "$revision" "$old_image" "$new_image"
echo "Deployed $revision ($new_image). Backup: $state/database.dump"

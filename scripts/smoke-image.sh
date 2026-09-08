#!/usr/bin/env bash
set -euo pipefail
[[ $# == 1 ]] || exit 64
image=$1
prefix=pricetoken-smoke-$$
network=$prefix
cleanup() {
  result=$?
  trap - EXIT
  docker rm -f "$prefix-web" "$prefix-postgres" "$prefix-redis" > /dev/null 2>&1 || true
  docker network rm "$network" > /dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT
docker network create "$network" > /dev/null
docker run -d --name "$prefix-postgres" --network "$network" --network-alias postgres \
  -e POSTGRES_PASSWORD=smoke -e POSTGRES_USER=smoke -e POSTGRES_DB=smoke postgres:16-alpine > /dev/null
docker run -d --name "$prefix-redis" --network "$network" --network-alias redis redis:7-alpine > /dev/null
for attempt in $(seq 1 60); do
  if docker exec "$prefix-postgres" pg_isready -U smoke -q; then break; fi
  ((attempt < 60)) || exit 1
  sleep 2
done
env_args=(-e DATABASE_URL=postgresql://smoke:smoke@postgres:5432/smoke -e REDIS_URL=redis://redis:6379)
docker run --rm --network "$network" "${env_args[@]}" "$image" \
  node runtime-tools/node_modules/prisma/build/index.js db push --skip-generate --schema=apps/web/prisma/schema.prisma
for seed in seed seed-video seed-avatar seed-tts seed-stt seed-music; do
  docker run --rm --network "$network" "${env_args[@]}" "$image" node "runtime-tools/scripts/$seed.cjs"
done
docker run --rm --network "$network" "${env_args[@]}" --workdir /app/apps/web "$image" node -e '
  const db = new (require("better-sqlite3"))(":memory:");
  if (db.prepare("select 42 as answer").get().answer !== 42) process.exit(1);
  if (!require("geoip-lite").lookup("8.8.8.8")) throw Error("GeoIP data missing");
  (async () => {
    const browser = await require("puppeteer-core").launch({executablePath: process.env.CHROME_PATH, args:["--no-sandbox"]});
    try {
      const page = await browser.newPage();
      await page.setContent("<h1>PriceToken smoke</h1>");
      const pdf = await page.pdf();
      if (Buffer.from(pdf).subarray(0,5).toString() !== "%PDF-") throw Error("PDF generation failed");
    } finally { await browser.close(); }
  })().catch(error => {console.error(error); process.exit(1)});
'
docker run --rm "$image" claude --version
docker run -d --name "$prefix-web" --network "$network" "${env_args[@]}" "$image" > /dev/null
for attempt in $(seq 1 60); do
  if docker exec "$prefix-web" node -e 'fetch("http://127.0.0.1:3001/api/health").then(async r=>{const h=await r.json(); if(!r.ok || h.database!=="connected" || h.redis!=="connected") process.exit(1)}).catch(()=>process.exit(1))'; then
    exit 0
  fi
  if ((attempt == 60)); then docker logs "$prefix-web"; exit 1; fi
  sleep 2
done

# Epson Kore JWT Service

JWT/JWE issuance service for the [Kore Web SDK](https://docs.kore.ai/). A browser
fingerprint is exchanged for a short-lived JWE that the Kore Web SDK can present
to `idproxy.kore.com`. Sessions are bound to fingerprints via Redis.

## Endpoints

| Method | Path                       | Purpose                                                    |
| ------ | -------------------------- | ---------------------------------------------------------- |
| POST   | `/init-session`            | Create a tab session; returns `{ sessionId }`              |
| POST   | `/get-jwt?app=<botCode>`   | Validate identity, refresh TTL, return `{ jwt }` (JWE)     |
| GET    | `/health`                  | Liveness + Redis ping (`200 ok` / `503 degraded`)          |
| GET    | `/`                        | Service info (lists available bot codes)                   |
| POST   | `/api/sts` *(legacy)*      | HS256 JWT signing for older clients — to be removed        |

### `POST /init-session`

Request: `{ "fp": "<64-char lowercase hex>" }`
Responses: `200 { sessionId }`, `400 MISSING_FP | INVALID_FP`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`.

### `POST /get-jwt?app=<botCode>`

`botCode` must be one of the keys defined in [`src/config/bots.ts`](src/config/bots.ts)
(e.g. `EPSON-CF-NORTH-AMERICA-PROD`). The bot's `clientId` / `clientSecret`
are loaded from env at startup; see `.env.example`.

Request: `{ "identity": "<sessionId>:<fp>" }`
Responses: `200 { jwt }`, `400 INVALID_APP | INVALID_IDENTITY`, `401 SESSION_EXPIRED | FP_MISMATCH`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`.

The JWE is `RSA-OAEP` / `A256GCM` over an HS256-signed JWT. Claims include
`sub` (device UUID), `iss`/`appId` (bot `clientId`), `aud`
(`https://idproxy.kore.com/authorize`), `iat`, `exp` (now + 5 min), `jti`,
`isAnonymous: true`, and `sessionId`.

### Rate limits

Per-IP (or per-IP+tabId for `/get-jwt`), `429 RATE_LIMITED` on exceed:
`/init-session` 20/min, `/get-jwt` 40/min.

## Project layout

```text
src/
  server.ts              # entry, listen + graceful shutdown
  app.ts                 # Express app factory
  config/
    config.ts            # env loading + validation
    bots.ts              # per-bot metadata + credential loading
  utils/
    logger.ts            # zero-dep console logger
  store/
    redis.ts             # ioredis client + closeRedis()
    sessionStore.ts      # session:tab:<id> CRUD
  services/
    jwt.ts               # Kore JWE issuance (cached key)
  routes/
    session.ts           # POST /init-session
    jwt.ts               # POST /get-jwt
    legacy.ts            # POST /api/sts, GET /api/health (legacy)
  middleware/
    requestId.ts         # X-Request-Id + req.id
    accessLog.ts         # request log (4xx/5xx only by default)
    corsOptions.ts       # CORS origin rule
    rateLimit.ts         # per-IP rate limits for /init-session, /get-jwt
api/
  index.ts               # Vercel serverless entrypoint (wraps buildApp())
```

## Setup

Requires **Node 18+** and a running **Redis**.

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev                # ts-node-dev, hot reload
```

For production:

```bash
npm run build              # tsc -> dist/
npm start                  # node dist/server.js
```

Type-check only: `npm run typecheck`.

## Environment

| Variable          | Required | Default                    | Notes                                                            |
| ----------------- | -------- | -------------------------- | ---------------------------------------------------------------- |
| `KORE_JWK`        | yes      | —                          | Kore public JWK (single-line JSON, must include `kty` and `kid`) |
| `PORT`            | no       | `3001`                     |                                                                  |
| `REDIS_URL`       | no       | `redis://localhost:6379`   |                                                                  |
| `ALLOWED_ORIGINS` | no       | (empty)                    | Comma-separated. `localhost`/`127.0.0.1` always allowed          |
| `TRUST_PROXY`     | no       | (off)                      | Express `trust proxy`. Hop count (e.g. `1`) or `true`            |
| `LOG_LEVEL`       | no       | `warn`                     | Levels: `debug`, `info`, `warn`, `error`                         |

Per-bot credentials live in env as `EPSON_*_CLIENT_ID` / `EPSON_*_CLIENT_SECRET`
pairs — one per bot defined in [`src/config/bots.ts`](src/config/bots.ts). See
[`.env.example`](.env.example) for the full list. The legacy `/api/sts` route
reads its own `BOT_*_JWT_SECRET` / `_JWT_ISSUER` / `_JWT_AUDIENCE` / `_JWT_EXPIRY`
vars per bot id.

Missing or malformed required vars cause the process to log and exit
immediately at startup.

## Session model

```text
session:tab:<sessionId>  ->  { fpHash, deviceUUID }   (TTL 30d, refreshed per /get-jwt)
```

`sessionId` and `deviceUUID` are independent UUIDv4s. `fpHash` is
`sha256(fp)`; the raw fingerprint is never stored.
